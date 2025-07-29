const { createClient } = require('redis');

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  socket: {
    tls: process.env.NODE_ENV === 'production',
    rejectUnauthorized: process.env.NODE_ENV === 'production',
  },
  password: process.env.REDIS_PASSWORD || undefined,
});

redisClient.on('error', (err) => {
  console.error('Redis connection error:', err);
});

redisClient.on('connect', () => {
  console.log('Connected to Redis');
});

redisClient.connect().catch((err) => {
  console.error('Failed to connect to Redis:', err);
});

module.exports = { redisClient };