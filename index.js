const redis = require('redis');
const async = require('async');
const config = require("./config");
const db = require("./db");

const osClient = db.osClient;
const enClient = db.enClient;

// show redis errors if they occur
osClient.on('error', (err) => console.log("Error on Redis OS", err));
enClient.on('error', (err) => console.log("Error on Redis Enterprise", err));

// wait for connection to be established
db.ready.then(() => {
    console.log("Connected to Redis Servers");
    start();
});

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
            enClient.zrevrange("numbers", 0, -1, "withscores", callback)
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
