var redis = require('redis');
var async = require('async');

var osClient = redis.createClient("redis://35.172.181.122:6379");
var enClient = redis.createClient("redis://54.227.174.214:15261");

// show redis errors if they occur
osClient.on('error', (err) => console.log("Error on Redis OS", err));
enClient.on('error', (err) => console.log("Error on Redis Enterprise", err));

// show that connection was established
osClient.on('connect', () => {
    console.log("Connected to Redis OS");
    start();
});

enClient.on('connect', () => console.log("Connected to Redis Enterprise"));


const start = () => {
    async.waterfall([
        function (callback) {
            // user multi to send multiple commands at once
            const multi = osClient.multi();
            for (let i = 0; i < 100; i++) {
                const val = i + 1;
                // queue an insert into sorted set name "numbers"
                // values from 1-100 with score of 1-100
                console.log("Inserting ", val);
                multi.zadd("numbers", val, val.toString());
            }
            // execute the queued commands
            multi.exec(callback);
        },
        function (replies, callback) {
            // retrieve the results from the replica
            // ordered from highest to lowest
            osClient.zrevrange("numbers", 0, -1, "withscores", callback)
        },
        function (members, callback) {
            // parsing the results - getting only the values
            const results = [];
            members.forEach((v, i) => {
                if (i % 2 == 0) {
                    results.push(parseInt(v));
                }
            });
            callback(null, results);
        }
    ], function (err, results) {
        if (err) {
            console.log("Error:", err);
        } else {
            // printing the results => 100 to 1
            results.forEach(r => console.log("Reading ", r));
        }
    });
};
