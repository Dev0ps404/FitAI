const { Router } = require('express')
const requireAuth = require('../middlewares/requireAuth')
const authorizeRoles = require('../middlewares/authorizeRoles')
const validateRequest = require('../middlewares/validateRequest')
const { USER_ROLES } = require('../config/constants')
const {
  userIdParamSchema,
  updateUserRoleSchema,
  adminUserListQuerySchema,
} = require('../validators/admin.validator')
const {
  getAdminAnalytics,
  listUsers,
  updateUserRole,
  listTrainerApplications,
  toggleUserActiveStatus,
} = require('../controllers/admin/admin.controller')

const adminRouter = Router()

adminRouter.use(requireAuth)
adminRouter.use(authorizeRoles(USER_ROLES.ADMIN))

adminRouter.get('/analytics', getAdminAnalytics)
adminRouter.get(
  '/users',
  validateRequest({ query: adminUserListQuerySchema }),
  listUsers,
)
adminRouter.patch(
  '/users/:userId/role',
  validateRequest({ params: userIdParamSchema, body: updateUserRoleSchema }),
  updateUserRole,
)
adminRouter.patch(
  '/users/:userId/toggle-active',
  validateRequest({ params: userIdParamSchema }),
  toggleUserActiveStatus,
)
adminRouter.get('/trainer-applications', listTrainerApplications)

module.exports = adminRouter
