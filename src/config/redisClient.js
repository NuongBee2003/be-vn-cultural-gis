const { createClient } = require('redis');

const redisClient = createClient({
    url: 'redis://default:v7TMmKaASef0XVLwzQLr0pesMuUDCZKH@redis-19071.crce302.ap-seast-1-3.ec2.cloud.redislabs.com:19071'
});

redisClient.on('error', (err) => console.log('Redis Client Error', err));

// Connect automatically
(async () => {
    try {
        await redisClient.connect();
        console.log('Connected to Redis');
    } catch (err) {
        console.error('Failed to connect to Redis', err);
    }
})();

module.exports = redisClient;
