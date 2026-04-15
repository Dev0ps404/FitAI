const mongoose = require('mongoose')

const refreshTokenSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    isRevoked: {
      type: Boolean,
      default: false,
      index: true,
    },
    revokedAt: {
      type: Date,
      default: null,
    },
    revokeReason: {
      type: String,
      default: null,
    },
    replacedByTokenHash: {
      type: String,
      default: null,
    },
    ipAddress: {
      type: String,
      default: null,
    },
    userAgent: {
      type: String,
      default: null,
    },
    sessionLabel: {
      type: String,
      default: 'default',
    },
  },
  {
    timestamps: true,
  },
)

refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

module.exports =
  mongoose.models.RefreshToken ||
  mongoose.model('RefreshToken', refreshTokenSchema)
