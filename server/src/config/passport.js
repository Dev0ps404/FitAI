const passport = require('passport')
const { Strategy: GoogleStrategy } = require('passport-google-oauth20')
const { env } = require('./env')
const User = require('../models/User')
const { USER_ROLES, TRAINER_APPROVAL_STATUS } = require('./constants')

let isPassportConfigured = false

async function findOrCreateGoogleUser(profile) {
  const email = profile.emails?.[0]?.value?.toLowerCase()

  if (!email) {
    throw new Error('Google account email is required')
  }

  let user = await User.findOne({
    $or: [{ googleId: profile.id }, { email }],
  })

  if (!user) {
    user = await User.create({
      name: profile.displayName || 'FitAI User',
      email,
      googleId: profile.id,
      avatarUrl: profile.photos?.[0]?.value || null,
      role: USER_ROLES.USER,
      isEmailVerified: true,
      trainerApprovalStatus: TRAINER_APPROVAL_STATUS.APPROVED,
      lastLoginAt: new Date(),
    })

    return user
  }

  user.googleId = user.googleId || profile.id
  user.avatarUrl = user.avatarUrl || profile.photos?.[0]?.value || null
  user.isEmailVerified = true
  user.lastLoginAt = new Date()
  await user.save()

  return user
}

function configurePassport() {
  if (isPassportConfigured) {
    return passport
  }

  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    isPassportConfigured = true
    return passport
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        callbackURL: env.GOOGLE_CALLBACK_URL,
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const user = await findOrCreateGoogleUser(profile)
          done(null, user)
        } catch (error) {
          done(error)
        }
      },
    ),
  )

  isPassportConfigured = true
  return passport
}

module.exports = {
  passport,
  configurePassport,
}
