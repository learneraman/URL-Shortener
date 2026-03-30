const { createClient } = require("redis");

// Redis client setup with URL from .env
const client = createClient({
  url: process.env.REDIS_URL
});

client.on("error", (err) => console.log("⚠️ Redis Global Error:", err.message));

let isConnected = false;

// Function to connect to Redis explicitly
async function connectRedis() {
  if (!process.env.REDIS_URL) {
    console.log("⚠️ REDIS_URL not found in .env. Redis caching will be SKIPPED (App will run on MongoDB only).");
    return;
  }
  
  try {
    await client.connect();
    isConnected = true;
    console.log("✓ Redis connected successfully");
  } catch (err) {
    console.error("❌ Redis connection failed. Retrying logic / continuing without cache.", err.message);
  }
}

// Helper functions for safe caching
// Yeh functions app ko crash nahi hone denge agar Redis down hua toh
const redisCache = {
  async get(key) {
    if (!isConnected) return null;
    try { return await client.get(key); } catch (e) { return null; }
  },
  
  async setEx(key, expiryInSeconds, value) {
    if (!isConnected) return;
    try { await client.setEx(key, expiryInSeconds, value); } catch (e) {}
  },
  
  async del(key) {
    if (!isConnected) return;
    try { await client.del(key); } catch (e) {}
  }
};

module.exports = { connectRedis, redisCache };
