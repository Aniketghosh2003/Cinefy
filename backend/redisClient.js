const Redis = require("ioredis");

let client = null;
let isConnected = false;

/**
 * Initialize the Redis client.
 * Gracefully degrades — all helpers return null / do nothing if Redis is down.
 */
const initRedis = () => {
  const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

  client = new Redis(redisUrl, {
    maxRetriesPerRequest: 1,
    retryStrategy(times) {
      if (times > 3) return null; // stop retrying after 3 attempts
      return Math.min(times * 500, 2000);
    },
    lazyConnect: false,
  });

  client.on("connect", () => {
    isConnected = true;
    console.log("✅ Redis connected successfully");
  });

  client.on("error", (err) => {
    isConnected = false;
    console.error("❌ Redis error:", err.message);
  });

  client.on("close", () => {
    isConnected = false;
    console.log("⚠️  Redis connection closed");
  });

  return client;
};

/**
 * Get cached data by key.
 * @returns {Object|null} parsed JSON or null on miss / error
 */
const getCache = async (key) => {
  if (!isConnected || !client) return null;
  try {
    const data = await client.get(key);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    console.error(`Redis GET error [${key}]:`, err.message);
    return null;
  }
};

/**
 * Delete old key then set new data (delete-before-set pattern).
 * @param {string} key
 * @param {*} data  — will be JSON.stringify'd
 * @param {number} ttl — seconds
 */
const setCache = async (key, data, ttl = 600) => {
  if (!isConnected || !client) return;
  try {
    await client.del(key); // always delete old data first
    await client.set(key, JSON.stringify(data), "EX", ttl);
  } catch (err) {
    console.error(`Redis SET error [${key}]:`, err.message);
  }
};

/**
 * Explicitly delete a cache key.
 */
const delCache = async (key) => {
  if (!isConnected || !client) return;
  try {
    await client.del(key);
  } catch (err) {
    console.error(`Redis DEL error [${key}]:`, err.message);
  }
};

module.exports = { initRedis, getCache, setCache, delCache };
