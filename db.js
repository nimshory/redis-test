const redis = require('redis');
const config = require("./config");

const osClient = redis.createClient(config.redisOpenSourceUrl);
const enClient = redis.createClient(config.redisEnterpriseUrl);

const readyOsClient = new Promise((resolve) => {
    osClient.on('connect', resolve);
});

const readyEnterpriseClient = new Promise((resolve) => {
    enClient.on('connect', resolve);
});

module.exports = {
    osClient,
    enClient,
    ready: Promise.all([readyOsClient, readyEnterpriseClient])
};