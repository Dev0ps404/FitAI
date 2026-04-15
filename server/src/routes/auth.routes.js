const { Router } = require('express')
const validateRequest = require('../middlewares/validateRequest')
const requireAuth = require('../middlewares/requireAuth')
const { authRateLimiter } = require('../middlewares/rateLimiters')
const {
  registerSchema,
  loginSchema,
  refreshSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateProfileSchema,
  changePasswordSchema,
  sessionIdParamSchema,
} = require('../validators/auth.validator')
const {
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
  updateMe,
  changePassword,
  handleGoogleOAuthSuccess,
} = require('../controllers/auth/auth.controller')
const { passport } = require('../config/passport')
const { env } = require('../config/env')

const authRouter = Router()

authRouter.post(
  '/signup',
  authRateLimiter,
  validateRequest({ body: registerSchema }),
  signup,
)
authRouter.post(
  '/login',
  authRateLimiter,
  validateRequest({ body: loginSchema }),
  login,
)
authRouter.post(
  '/refresh',
  validateRequest({ body: refreshSchema }),
  refreshSession,
)
authRouter.post('/logout', logout)
authRouter.post('/logout-all', requireAuth, logoutAll)
authRouter.get('/sessions', requireAuth, listSessions)
authRouter.delete(
  '/sessions/:sessionId',
  requireAuth,
  validateRequest({ params: sessionIdParamSchema }),
  revokeSession,
)
authRouter.post(
  '/forgot-password',
  authRateLimiter,
  validateRequest({ body: forgotPasswordSchema }),
  forgotPassword,
)
authRouter.post(
  '/reset-password',
  authRateLimiter,
  validateRequest({ body: resetPasswordSchema }),
  resetPassword,
)
authRouter.get('/me', requireAuth, getMe)
authRouter.patch(
  '/me',
  requireAuth,
  validateRequest({ body: updateProfileSchema }),
  updateMe,
)
authRouter.patch(
  '/change-password',
  requireAuth,
  validateRequest({ body: changePasswordSchema }),
  changePassword,
)

if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
  authRouter.get(
    '/google',
    passport.authenticate('google', { scope: ['profile', 'email'] }),
  )
  authRouter.get(
    '/google/callback',
    passport.authenticate('google', {
      session: false,
      failureRedirect: env.OAUTH_FAILURE_REDIRECT,
    }),
    handleGoogleOAuthSuccess,
  )
}

module.exports = authRouter
