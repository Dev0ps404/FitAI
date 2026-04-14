const { Router } = require('express')
const requireAuth = require('../middlewares/requireAuth')
const authorizeRoles = require('../middlewares/authorizeRoles')
const validateRequest = require('../middlewares/validateRequest')
const { USER_ROLES } = require('../config/constants')
const {
  createAdminNotificationSchema,
} = require('../validators/admin.validator')
const {
  listMyNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  createAdminNotifications,
} = require('../controllers/notification/notification.controller')

const notificationRouter = Router()

notificationRouter.use(requireAuth)

notificationRouter.get('/', listMyNotifications)
notificationRouter.patch('/read-all', markAllNotificationsAsRead)
notificationRouter.patch('/:notificationId/read', markNotificationAsRead)
notificationRouter.post(
  '/admin/broadcast',
  authorizeRoles(USER_ROLES.ADMIN),
  validateRequest({ body: createAdminNotificationSchema }),
  createAdminNotifications,
)

module.exports = notificationRouter
