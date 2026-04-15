const User = require('../../models/User')
const Trainer = require('../../models/Trainer')
const ApiError = require('../../utils/apiError')
const asyncHandler = require('../../utils/asyncHandler')
const sanitizeUser = require('../../utils/sanitizeUser')
const {
  createRandomToken,
  createTokenHash,
} = require('../../utils/tokenSecurity')
const {
  signAccessToken,
  issueRefreshToken,
  getRefreshTokenRecord,
  getValidRefreshTokenRecord,
  revokeRefreshToken,
  revokeRefreshTokenByHash,
  revokeAllUserRefreshTokens,
  listActiveSessionsForUser,
  revokeRefreshTokenByIdForUser,
} = require('../../services/token.service')
const {
  getDevUserByEmail,
  createDevUser,
  verifyDevUserPassword,
  touchDevUserLogin,
} = require('../../services/devAuthStore')
const {
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
} = require('../../utils/authCookies')
const { sendResetPasswordEmail } = require('../../services/email.service')
const { env } = require('../../config/env')
const {
  USER_ROLES,
  TRAINER_APPROVAL_STATUS,
} = require('../../config/constants')

function getRefreshTokenFromRequest(req) {
  return (
    req.cookies?.[env.REFRESH_COOKIE_NAME] ||
    req.validatedBody?.refreshToken ||
    req.body?.refreshToken ||
    null
  )
}

function resolveSessionLabel(req) {
  const explicitLabel = req.headers['x-session-label']

  if (typeof explicitLabel === 'string' && explicitLabel.trim()) {
    return explicitLabel.trim().slice(0, 60)
  }

  const userAgent = req.headers['user-agent']

  if (typeof userAgent === 'string' && userAgent.trim()) {
    return userAgent.trim().slice(0, 60)
  }

  return 'web'
}

async function sendAuthResponse({ req, res, user, statusCode, message }) {
  const accessToken = signAccessToken(user)

  if (env.SKIP_DB_CONNECTION) {
    res.status(statusCode).json({
      success: true,
      message,
      data: {
        accessToken,
        user: sanitizeUser(user),
      },
    })

    return
  }

  const refreshTokenPayload = await issueRefreshToken({
    user,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    sessionLabel: resolveSessionLabel(req),
  })

  setRefreshTokenCookie(
    res,
    refreshTokenPayload.token,
    refreshTokenPayload.ttlMs,
  )

  res.status(statusCode).json({
    success: true,
    message,
    data: {
      accessToken,
      user: sanitizeUser(user),
    },
  })
}

const signup = asyncHandler(async (req, res) => {
  const payload = req.validatedBody || req.body

  if (env.SKIP_DB_CONNECTION) {
    const existingUser = getDevUserByEmail(payload.email)

    if (existingUser) {
      throw new ApiError(409, 'Email is already registered')
    }

    const user = await createDevUser({
      name: payload.name,
      email: payload.email,
      password: payload.password,
      role: payload.role,
    })

    await sendAuthResponse({
      req,
      res,
      user,
      statusCode: 201,
      message: 'Signup successful',
    })

    return
  }

  const existingUser = await User.findOne({ email: payload.email })

  if (existingUser) {
    throw new ApiError(409, 'Email is already registered')
  }

  const passwordHash = await User.hashPassword(payload.password)

  const user = await User.create({
    name: payload.name,
    email: payload.email,
    passwordHash,
    role: payload.role,
    trainerApprovalStatus:
      payload.role === USER_ROLES.TRAINER
        ? TRAINER_APPROVAL_STATUS.PENDING
        : TRAINER_APPROVAL_STATUS.APPROVED,
  })

  if (payload.role === USER_ROLES.TRAINER) {
    await Trainer.create({
      user: user._id,
      status: TRAINER_APPROVAL_STATUS.PENDING,
    })
  }

  await sendAuthResponse({
    req,
    res,
    user,
    statusCode: 201,
    message: 'Signup successful',
  })
})

const login = asyncHandler(async (req, res) => {
  const payload = req.validatedBody || req.body

  if (env.SKIP_DB_CONNECTION) {
    const user = getDevUserByEmail(payload.email)

    if (!user) {
      throw new ApiError(401, 'Invalid email or password')
    }

    const isPasswordValid = await verifyDevUserPassword(user, payload.password)

    if (!isPasswordValid) {
      throw new ApiError(401, 'Invalid email or password')
    }

    if (!user.isActive) {
      throw new ApiError(403, 'Your account is currently disabled')
    }

    touchDevUserLogin(user)

    await sendAuthResponse({
      req,
      res,
      user,
      statusCode: 200,
      message: 'Login successful',
    })

    return
  }

  const user = await User.findOne({ email: payload.email }).select(
    '+passwordHash',
  )

  if (!user || !user.passwordHash) {
    throw new ApiError(401, 'Invalid email or password')
  }

  const isPasswordValid = await user.verifyPassword(payload.password)

  if (!isPasswordValid) {
    throw new ApiError(401, 'Invalid email or password')
  }

  if (!user.isActive) {
    throw new ApiError(403, 'Your account is currently disabled')
  }

  user.lastLoginAt = new Date()
  await user.save({ validateBeforeSave: false })

  const freshUser = await User.findById(user._id)

  await sendAuthResponse({
    req,
    res,
    user: freshUser,
    statusCode: 200,
    message: 'Login successful',
  })
})

const refreshSession = asyncHandler(async (req, res) => {
  if (env.SKIP_DB_CONNECTION) {
    clearRefreshTokenCookie(res)
    throw new ApiError(401, 'Session refresh unavailable in SKIP_DB mode')
  }

  const refreshToken = getRefreshTokenFromRequest(req)

  if (!refreshToken) {
    throw new ApiError(401, 'Refresh token is missing')
  }

  const refreshTokenRecord = await getRefreshTokenRecord(refreshToken)

  if (!refreshTokenRecord) {
    clearRefreshTokenCookie(res)
    throw new ApiError(401, 'Refresh token is invalid or expired')
  }

  if (refreshTokenRecord.tokenDoc.isRevoked) {
    if (refreshTokenRecord.tokenDoc.replacedByTokenHash) {
      await revokeAllUserRefreshTokens(
        refreshTokenRecord.decoded.sub,
        'refresh_token_reuse_detected',
      )
    }

    clearRefreshTokenCookie(res)
    throw new ApiError(401, 'Refresh token has been revoked')
  }

  if (refreshTokenRecord.tokenDoc.expiresAt <= new Date()) {
    clearRefreshTokenCookie(res)
    throw new ApiError(401, 'Refresh token is invalid or expired')
  }

  const validTokenRecord = await getValidRefreshTokenRecord(refreshToken)

  if (!validTokenRecord) {
    clearRefreshTokenCookie(res)
    throw new ApiError(401, 'Refresh token is invalid or expired')
  }

  const user = await User.findById(validTokenRecord.decoded.sub)

  if (!user || !user.isActive) {
    await revokeRefreshTokenByHash(
      validTokenRecord.tokenHash,
      'user_not_active',
    )
    clearRefreshTokenCookie(res)
    throw new ApiError(401, 'Session is no longer active')
  }

  const rotatedTokenPayload = await issueRefreshToken({
    user,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    replacedByTokenHash: validTokenRecord.tokenHash,
    sessionLabel: resolveSessionLabel(req),
  })

  await revokeRefreshTokenByHash(validTokenRecord.tokenHash, 'rotated')
  setRefreshTokenCookie(
    res,
    rotatedTokenPayload.token,
    rotatedTokenPayload.ttlMs,
  )

  res.status(200).json({
    success: true,
    message: 'Session refreshed',
    data: {
      accessToken: signAccessToken(user),
      user: sanitizeUser(user),
    },
  })
})

const logout = asyncHandler(async (req, res) => {
  if (env.SKIP_DB_CONNECTION) {
    clearRefreshTokenCookie(res)

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    })

    return
  }

  const refreshToken = getRefreshTokenFromRequest(req)

  if (refreshToken) {
    await revokeRefreshToken(refreshToken, 'logout')
  }

  clearRefreshTokenCookie(res)

  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  })
})

const logoutAll = asyncHandler(async (req, res) => {
  if (env.SKIP_DB_CONNECTION) {
    clearRefreshTokenCookie(res)

    res.status(200).json({
      success: true,
      message: 'All sessions were logged out',
    })

    return
  }

  await revokeAllUserRefreshTokens(req.user._id, 'logout_all')
  clearRefreshTokenCookie(res)

  res.status(200).json({
    success: true,
    message: 'All sessions were logged out',
  })
})

const listSessions = asyncHandler(async (req, res) => {
  if (env.SKIP_DB_CONNECTION) {
    res.status(200).json({
      success: true,
      data: {
        sessions: [],
      },
    })

    return
  }

  const refreshToken = getRefreshTokenFromRequest(req)
  const currentTokenHash = refreshToken ? createTokenHash(refreshToken) : null

  const activeSessions = await listActiveSessionsForUser(req.user._id)
  const sessions = activeSessions.map((sessionDoc) => ({
    id: sessionDoc._id,
    createdAt: sessionDoc.createdAt,
    expiresAt: sessionDoc.expiresAt,
    ipAddress: sessionDoc.ipAddress,
    userAgent: sessionDoc.userAgent,
    sessionLabel: sessionDoc.sessionLabel || 'web',
    isCurrent:
      Boolean(currentTokenHash) && currentTokenHash === sessionDoc.tokenHash,
  }))

  res.status(200).json({
    success: true,
    data: {
      sessions,
    },
  })
})

const revokeSession = asyncHandler(async (req, res) => {
  if (env.SKIP_DB_CONNECTION) {
    throw new ApiError(400, 'Session revoke unavailable in SKIP_DB mode')
  }

  const { sessionId } = req.validatedParams || req.params
  const revokedSession = await revokeRefreshTokenByIdForUser(
    sessionId,
    req.user._id,
    'session_revoked',
  )

  if (!revokedSession) {
    throw new ApiError(404, 'Session not found or already revoked')
  }

  const refreshToken = getRefreshTokenFromRequest(req)

  if (
    refreshToken &&
    createTokenHash(refreshToken) === revokedSession.tokenHash
  ) {
    clearRefreshTokenCookie(res)
  }

  res.status(200).json({
    success: true,
    message: 'Session revoked successfully',
  })
})

const forgotPassword = asyncHandler(async (req, res) => {
  const payload = req.validatedBody || req.body

  const user = await User.findOne({ email: payload.email })

  if (user) {
    const rawToken = createRandomToken(32)
    user.resetPasswordTokenHash = createTokenHash(rawToken)
    user.resetPasswordExpiresAt = new Date(
      Date.now() + env.PASSWORD_RESET_TOKEN_TTL_MINUTES * 60 * 1000,
    )
    await user.save({ validateBeforeSave: false })

    const resetLink = `${env.PASSWORD_RESET_URL}?token=${encodeURIComponent(rawToken)}`

    await sendResetPasswordEmail({
      recipientEmail: user.email,
      recipientName: user.name,
      resetLink,
    })
  }

  res.status(200).json({
    success: true,
    message:
      'If the email exists in our system, a password reset link has been sent.',
  })
})

const resetPassword = asyncHandler(async (req, res) => {
  const payload = req.validatedBody || req.body

  const tokenHash = createTokenHash(payload.token)

  const user = await User.findOne({
    resetPasswordTokenHash: tokenHash,
    resetPasswordExpiresAt: { $gt: new Date() },
  }).select('+resetPasswordTokenHash +resetPasswordExpiresAt')

  if (!user) {
    throw new ApiError(400, 'Reset token is invalid or expired')
  }

  user.passwordHash = await User.hashPassword(payload.newPassword)
  user.resetPasswordTokenHash = null
  user.resetPasswordExpiresAt = null
  user.isEmailVerified = true
  await user.save()

  await revokeAllUserRefreshTokens(user._id, 'password_reset')

  res.status(200).json({
    success: true,
    message: 'Password has been reset successfully',
  })
})

const getMe = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      user: sanitizeUser(req.user),
    },
  })
})

const handleGoogleOAuthSuccess = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new ApiError(401, 'Google authentication failed')
  }

  const accessToken = signAccessToken(req.user)
  const refreshTokenPayload = await issueRefreshToken({
    user: req.user,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    sessionLabel: resolveSessionLabel(req),
  })

  setRefreshTokenCookie(
    res,
    refreshTokenPayload.token,
    refreshTokenPayload.ttlMs,
  )

  const redirectUrl = new URL(env.OAUTH_SUCCESS_REDIRECT)
  redirectUrl.searchParams.set('accessToken', accessToken)
  redirectUrl.searchParams.set('role', req.user.role)

  res.redirect(redirectUrl.toString())
})

module.exports = {
  signup,
  login,
  refreshSession,
  logout,
  logoutAll,
  listSessions,
  revokeSession,
  forgotPassword,
  resetPassword,
  getMe,
  handleGoogleOAuthSuccess,
}
