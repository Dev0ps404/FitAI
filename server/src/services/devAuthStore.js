const bcrypt = require('bcryptjs')
const { randomUUID } = require('node:crypto')
const {
  USER_ROLES,
  TRAINER_APPROVAL_STATUS,
} = require('../config/constants')

const usersById = new Map()
const usersByEmail = new Map()

function normalizeRole(role) {
  return role === USER_ROLES.TRAINER ? USER_ROLES.TRAINER : USER_ROLES.USER
}

function createUserShape({ name, email, passwordHash, role }) {
  const normalizedRole = normalizeRole(role)
  const isTrainer = normalizedRole === USER_ROLES.TRAINER
  const now = new Date()

  return {
    _id: randomUUID(),
    name,
    email,
    passwordHash,
    role: normalizedRole,
    isActive: true,
    isEmailVerified: true,
    trainerApprovalStatus: isTrainer
      ? TRAINER_APPROVAL_STATUS.PENDING
      : TRAINER_APPROVAL_STATUS.APPROVED,
    avatarUrl: null,
    fitnessLevel: 'beginner',
    gender: 'prefer_not_to_say',
    age: null,
    heightCm: null,
    currentWeightKg: null,
    goalWeightKg: null,
    streakDays: 0,
    badgePoints: 0,
    preferences: {
      injuryNotes: '',
      dietaryPreferences: [],
      workoutDaysPerWeek: 4,
    },
    createdAt: now,
    updatedAt: now,
    lastLoginAt: null,
  }
}

function getDevUserByEmail(email) {
  return usersByEmail.get(email) || null
}

function getDevUserById(userId) {
  return usersById.get(String(userId)) || null
}

async function createDevUser({ name, email, password, role }) {
  const existingUser = getDevUserByEmail(email)

  if (existingUser) {
    return null
  }

  const passwordHash = await bcrypt.hash(password, 12)
  const user = createUserShape({
    name,
    email,
    passwordHash,
    role,
  })

  usersById.set(String(user._id), user)
  usersByEmail.set(user.email, user)

  return user
}

async function verifyDevUserPassword(user, password) {
  if (!user?.passwordHash) {
    return false
  }

  return bcrypt.compare(password, user.passwordHash)
}

function touchDevUserLogin(user) {
  if (!user) {
    return
  }

  user.lastLoginAt = new Date()
  user.updatedAt = new Date()
}

module.exports = {
  getDevUserByEmail,
  getDevUserById,
  createDevUser,
  verifyDevUserPassword,
  touchDevUserLogin,
}
