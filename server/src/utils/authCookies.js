const { AUTH_COOKIE_PATH } = require('../config/constants')
const { env } = require('../config/env')

function getRefreshCookieOptions(maxAgeMs) {
  return {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: env.COOKIE_SAME_SITE,
    path: AUTH_COOKIE_PATH,
    maxAge: maxAgeMs,
  }
}

function setRefreshTokenCookie(res, refreshToken, maxAgeMs) {
  res.cookie(
    env.REFRESH_COOKIE_NAME,
    refreshToken,
    getRefreshCookieOptions(maxAgeMs),
  )
}

function clearRefreshTokenCookie(res) {
  res.clearCookie(env.REFRESH_COOKIE_NAME, {
    path: AUTH_COOKIE_PATH,
  })
}

module.exports = {
  getRefreshCookieOptions,
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
}
