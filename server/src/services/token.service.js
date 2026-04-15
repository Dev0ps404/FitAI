const jwt = require('jsonwebtoken')
const { env } = require('../config/env')
const RefreshToken = require('../models/RefreshToken')
const { createTokenHash } = require('../utils/tokenSecurity')

function parseDurationToMs(durationValue, fallbackValue) {
  const normalizedValue = String(durationValue || fallbackValue).trim()
  const durationMatch = normalizedValue.match(/^(\d+)([smhd])$/i)

  if (!durationMatch) {
    return parseDurationToMs(fallbackValue, '7d')
  }

  const amount = Number(durationMatch[1])
  const unit = durationMatch[2].toLowerCase()

  const unitMultiplier = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  }

  return amount * unitMultiplier[unit]
}

function buildAccessTokenPayload(user) {
  return {
    sub: String(user._id),
    role: user.role,
    email: user.email,
  }
}

function signAccessToken(user) {
  return jwt.sign(buildAccessTokenPayload(user), env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
  })
}

function signRefreshToken(user) {
  return jwt.sign(
    {
      sub: String(user._id),
      type: 'refresh',
    },
    env.JWT_REFRESH_SECRET,
    {
      expiresIn: env.JWT_REFRESH_EXPIRES_IN,
    },
  )
}

function verifyAccessToken(token) {
  return jwt.verify(token, env.JWT_ACCESS_SECRET)
}

function verifyRefreshToken(token) {
  return jwt.verify(token, env.JWT_REFRESH_SECRET)
}

function getRefreshTokenTtlMs() {
  return parseDurationToMs(env.JWT_REFRESH_EXPIRES_IN, '7d')
}

async function issueRefreshToken({
  user,
  ipAddress,
  userAgent,
  replacedByTokenHash,
  sessionLabel,
}) {
  const token = signRefreshToken(user)
  const tokenHash = createTokenHash(token)
  const ttlMs = getRefreshTokenTtlMs()
  const expiresAt = new Date(Date.now() + ttlMs)

  const tokenDoc = await RefreshToken.create({
    user: user._id,
    tokenHash,
    expiresAt,
    ipAddress: ipAddress || null,
    userAgent: userAgent || null,
    replacedByTokenHash: replacedByTokenHash || null,
    sessionLabel: sessionLabel || 'web',
  })

  return {
    token,
    tokenHash,
    tokenDoc,
    expiresAt,
    ttlMs,
  }
}

async function getValidRefreshTokenRecord(rawRefreshToken) {
  const tokenRecord = await getRefreshTokenRecord(rawRefreshToken)

  if (!tokenRecord) {
    return null
  }

  if (
    tokenRecord.tokenDoc.isRevoked ||
    tokenRecord.tokenDoc.expiresAt <= new Date()
  ) {
    return null
  }

  return tokenRecord
}

async function getRefreshTokenRecord(rawRefreshToken) {
  try {
    const decoded = verifyRefreshToken(rawRefreshToken)
    const tokenHash = createTokenHash(rawRefreshToken)

    const tokenDoc = await RefreshToken.findOne({
      tokenHash,
      user: decoded.sub,
    })

    if (!tokenDoc) {
      return null
    }

    return {
      decoded,
      tokenHash,
      tokenDoc,
    }
  } catch {
    return null
  }
}

async function revokeRefreshTokenByHash(tokenHash, reason = 'revoked') {
  return RefreshToken.findOneAndUpdate(
    {
      tokenHash,
      isRevoked: false,
    },
    {
      isRevoked: true,
      revokedAt: new Date(),
      revokeReason: reason,
    },
    {
      returnDocument: 'after',
    },
  )
}

async function revokeRefreshToken(rawRefreshToken, reason = 'revoked') {
  const tokenHash = createTokenHash(rawRefreshToken)
  return revokeRefreshTokenByHash(tokenHash, reason)
}

async function revokeAllUserRefreshTokens(userId, reason = 'logout_all') {
  return RefreshToken.updateMany(
    {
      user: userId,
      isRevoked: false,
    },
    {
      isRevoked: true,
      revokedAt: new Date(),
      revokeReason: reason,
    },
  )
}

async function listActiveSessionsForUser(userId) {
  return RefreshToken.find({
    user: userId,
    isRevoked: false,
    expiresAt: {
      $gt: new Date(),
    },
  })
    .sort({ createdAt: -1 })
    .select(
      '_id tokenHash createdAt expiresAt ipAddress userAgent sessionLabel',
    )
}

async function revokeRefreshTokenByIdForUser(
  tokenId,
  userId,
  reason = 'session_revoked',
) {
  return RefreshToken.findOneAndUpdate(
    {
      _id: tokenId,
      user: userId,
      isRevoked: false,
    },
    {
      isRevoked: true,
      revokedAt: new Date(),
      revokeReason: reason,
    },
    {
      returnDocument: 'after',
    },
  )
}

module.exports = {
  signAccessToken,
  verifyAccessToken,
  verifyRefreshToken,
  issueRefreshToken,
  getRefreshTokenTtlMs,
  getRefreshTokenRecord,
  getValidRefreshTokenRecord,
  revokeRefreshToken,
  revokeRefreshTokenByHash,
  revokeAllUserRefreshTokens,
  listActiveSessionsForUser,
  revokeRefreshTokenByIdForUser,
}
