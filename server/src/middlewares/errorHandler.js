const { env } = require('../config/env')

function errorHandler(error, _req, res, _next) {
  const statusCode = error.statusCode || 500
  const message = error.message || 'Internal server error'

  res.status(statusCode).json({
    success: false,
    message,
    stack: env.NODE_ENV === 'development' ? error.stack : undefined,
  })
}

module.exports = {
  errorHandler,
}
