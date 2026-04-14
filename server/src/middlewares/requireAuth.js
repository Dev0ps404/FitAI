const User = require('../models/User')
const { env } = require('../config/env')
const { verifyAccessToken } = require('../services/token.service')
const ApiError = require('../utils/apiError')

function getAccessTokenFromRequest(req) {
  const authHeader = req.headers.authorization

  if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim()
  }

  if (req.cookies?.[env.ACCESS_COOKIE_NAME]) {
    return req.cookies[env.ACCESS_COOKIE_NAME]
  }

  return null
}

async function requireAuth(req, _res, next) {
  try {
    const accessToken = getAccessTokenFromRequest(req)

    if (!accessToken) {
      throw new ApiError(401, 'Authentication required')
    }

    const decoded = verifyAccessToken(accessToken)

    const user = await User.findById(decoded.sub).select('-passwordHash')

    if (!user || !user.isActive) {
      throw new ApiError(401, 'Session is invalid')
    }

    req.user = user
    req.auth = decoded

    next()
  } catch {
    next(new ApiError(401, 'Invalid or expired access token'))
  }
}

module.exports = requireAuth
