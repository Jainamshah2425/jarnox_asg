const NodeCache = require('node-cache');

// Initialize cache with default TTL of 5 minutes and check period of 10 minutes
const cache = new NodeCache({ stdTTL: 300, checkperiod: 600 });

/**
 * Middleware for caching API responses
 * @param {number} ttl - Time to live in seconds
 */
const middleware = (ttl = 300) => {
  return (req, res, next) => {
    // Create a unique key based on the request URL and query parameters
    const key = req.originalUrl || req.url;
    
    // Check if the response is cached
    const cachedResponse = cache.get(key);
    
    if (cachedResponse) {
      // Return cached response
      return res.json(cachedResponse);
    }
    
    // Store the original json method
    const originalJson = res.json;
    
    // Override the json method to cache the response before sending
    res.json = function(data) {
      // Cache the response data with the specified TTL
      cache.set(key, data, ttl);
      
      // Call the original json method
      return originalJson.call(this, data);
    };
    
    next();
  };
};

/**
 * Manually store an item in the cache
 * @param {string} key - Cache key
 * @param {any} value - Value to store
 * @param {number} ttl - Time to live in seconds
 */
const set = (key, value, ttl = 300) => {
  return cache.set(key, value, ttl);
};

/**
 * Retrieve an item from the cache
 * @param {string} key - Cache key
 */
const get = (key) => {
  return cache.get(key);
};

/**
 * Remove an item from the cache
 * @param {string} key - Cache key
 */
const del = (key) => {
  return cache.del(key);
};

/**
 * Clear the entire cache
 */
const flush = () => {
  return cache.flushAll();
};

module.exports = {
  middleware,
  set,
  get,
  del,
  flush
};
