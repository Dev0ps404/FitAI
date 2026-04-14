const USER_ROLES = Object.freeze({
  USER: 'user',
  TRAINER: 'trainer',
  ADMIN: 'admin',
})

const TRAINER_APPROVAL_STATUS = Object.freeze({
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
})

const WORKOUT_STATUS = Object.freeze({
  PLANNED: 'planned',
  COMPLETED: 'completed',
  SKIPPED: 'skipped',
})

const BOOKING_STATUS = Object.freeze({
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
})

const AUTH_COOKIE_PATH = '/api/auth'

module.exports = {
  USER_ROLES,
  USER_ROLE_LIST: Object.values(USER_ROLES),
  TRAINER_APPROVAL_STATUS,
  TRAINER_APPROVAL_STATUS_LIST: Object.values(TRAINER_APPROVAL_STATUS),
  WORKOUT_STATUS,
  WORKOUT_STATUS_LIST: Object.values(WORKOUT_STATUS),
  BOOKING_STATUS,
  BOOKING_STATUS_LIST: Object.values(BOOKING_STATUS),
  AUTH_COOKIE_PATH,
}
