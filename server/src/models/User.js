const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const {
  USER_ROLES,
  USER_ROLE_LIST,
  TRAINER_APPROVAL_STATUS,
  TRAINER_APPROVAL_STATUS_LIST,
} = require('../config/constants')

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 80,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      select: false,
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    avatarUrl: {
      type: String,
      default: null,
    },
    role: {
      type: String,
      enum: USER_ROLE_LIST,
      default: USER_ROLES.USER,
      index: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    trainerApprovalStatus: {
      type: String,
      enum: TRAINER_APPROVAL_STATUS_LIST,
      default: TRAINER_APPROVAL_STATUS.APPROVED,
      index: true,
    },
    fitnessLevel: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner',
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other', 'prefer_not_to_say'],
      default: 'prefer_not_to_say',
    },
    age: {
      type: Number,
      min: 13,
      max: 120,
    },
    heightCm: {
      type: Number,
      min: 90,
      max: 260,
    },
    currentWeightKg: {
      type: Number,
      min: 20,
      max: 500,
    },
    goalWeightKg: {
      type: Number,
      min: 20,
      max: 500,
    },
    streakDays: {
      type: Number,
      default: 0,
      min: 0,
    },
    badgePoints: {
      type: Number,
      default: 0,
      min: 0,
    },
    pushTokens: {
      type: [String],
      default: [],
    },
    preferences: {
      injuryNotes: {
        type: String,
        default: '',
      },
      dietaryPreferences: {
        type: [String],
        default: [],
      },
      workoutDaysPerWeek: {
        type: Number,
        min: 1,
        max: 7,
        default: 4,
      },
    },
    resetPasswordTokenHash: {
      type: String,
      select: false,
    },
    resetPasswordExpiresAt: {
      type: Date,
      select: false,
    },
    lastLoginAt: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  },
)

userSchema.pre('validate', function applyTrainerApprovalDefault() {
  if (this.role === USER_ROLES.TRAINER) {
    this.trainerApprovalStatus =
      this.trainerApprovalStatus || TRAINER_APPROVAL_STATUS.PENDING
  }

  if (this.role !== USER_ROLES.TRAINER) {
    this.trainerApprovalStatus = TRAINER_APPROVAL_STATUS.APPROVED
  }
})

userSchema.methods.verifyPassword = async function verifyPassword(
  candidatePassword,
) {
  if (!this.passwordHash) {
    return false
  }

  return bcrypt.compare(candidatePassword, this.passwordHash)
}

userSchema.statics.hashPassword = async function hashPassword(plainPassword) {
  return bcrypt.hash(plainPassword, 12)
}

module.exports = mongoose.models.User || mongoose.model('User', userSchema)
