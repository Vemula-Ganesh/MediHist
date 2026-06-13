const redis = require('redis');

let redisClient = null;
let useLocalFallback = true;

// In-Memory cache fallback for development/local execution
const localMemoryStore = new Map();
const localMemoryTimeouts = new Map();

const memoryCache = {
  connect: async () => {
    console.log('ℹ️ Using in-memory fallback cache.');
    return true;
  },
  get: async (key) => {
    return localMemoryStore.get(key) || null;
  },
  set: async (key, value, options) => {
    localMemoryStore.set(key, value);
    // Handle expiration (EX) if provided in options
    if (options && options.EX) {
      if (localMemoryTimeouts.has(key)) {
        clearTimeout(localMemoryTimeouts.get(key));
      }
      const timeout = setTimeout(() => {
        localMemoryStore.delete(key);
        localMemoryTimeouts.delete(key);
      }, options.EX * 1000);
      localMemoryTimeouts.set(key, timeout);
    }
    return 'OK';
  },
  del: async (key) => {
    localMemoryStore.delete(key);
    if (localMemoryTimeouts.has(key)) {
      clearTimeout(localMemoryTimeouts.get(key));
      localMemoryTimeouts.delete(key);
    }
    return 1;
  },
  quit: async () => {
    localMemoryStore.clear();
    for (const timeout of localMemoryTimeouts.values()) {
      clearTimeout(timeout);
    }
    localMemoryTimeouts.clear();
  }
};

if (process.env.REDIS_URL) {
  try {
    redisClient = redis.createClient({
      url: process.env.REDIS_URL
    });

    redisClient.on('error', (err) => {
      console.warn('⚠️ Redis Error, falling back to in-memory store:', err.message);
      useLocalFallback = true;
    });

    redisClient.on('connect', () => {
      console.log('✅ Connected to Redis successfully.');
      useLocalFallback = false;
    });

    // Attempt connection
    redisClient.connect().catch((err) => {
      console.warn('⚠️ Redis connection failed, using in-memory store.');
      useLocalFallback = true;
    });
  } catch (err) {
    console.warn('⚠️ Failed to initialize Redis client, using in-memory store.');
    useLocalFallback = true;
  }
} else {
  console.log('ℹ️ No REDIS_URL found in env. Using in-memory fallback store.');
}

const getClient = () => {
  if (useLocalFallback || !redisClient) {
    return memoryCache;
  }
  return redisClient;
};

module.exports = {
  getClient,
  isFallback: () => useLocalFallback
};
