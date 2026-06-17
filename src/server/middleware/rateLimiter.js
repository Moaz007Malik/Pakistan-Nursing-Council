const rateLimit = require('express-rate-limit');

const serverlessKeyGenerator = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }
  return req.headers['x-real-ip'] || req.ip || req.socket?.remoteAddress || 'serverless';
};

const rateLimitOptions = {
  windowMs: 15 * 60 * 1000,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { ip: false },
  keyGenerator: serverlessKeyGenerator,
};

const apiLimiter = rateLimit({
  ...rateLimitOptions,
  max: 100,
  message: { success: false, message: 'Too many requests, please try again later' },
});

const authLimiter = rateLimit({
  ...rateLimitOptions,
  max: 10,
  message: { success: false, message: 'Too many login attempts' },
});

const uploadLimiter = rateLimit({
  ...rateLimitOptions,
  windowMs: 60 * 60 * 1000,
  max: 50,
  message: { success: false, message: 'Upload limit exceeded' },
});

module.exports = { apiLimiter, authLimiter, uploadLimiter };
