// Rate limiter middleware using in-memory store
const createRateLimiter = (maxRequests, windowMs) => {
  const store = new Map();

  return (req, res, next) => {
    const key = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const windowStart = now - windowMs;

    // Get or initialize client record
    if (!store.has(key)) {
      store.set(key, []);
    }

    const timestamps = store.get(key);

    // Remove old timestamps outside the window
    const validTimestamps = timestamps.filter((t) => t > windowStart);
    store.set(key, validTimestamps);

    // Check if exceeded limit
    if (validTimestamps.length >= maxRequests) {
      return res.status(429).json({
        status: 'fail',
        message: 'Too many requests, please try again later',
      });
    }

    // Add current request timestamp
    validTimestamps.push(now);
    store.set(key, validTimestamps);

    next();
  };
};

export default createRateLimiter;
