const { rateLimit } = require('express-rate-limit')

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 25,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts. Try again later.',
  },
})

const aiRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  limit: 50,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    success: false,
    message: 'AI request limit reached. Try again in a few minutes.',
  },
})

module.exports = {
  authRateLimiter,
  aiRateLimiter,
}
