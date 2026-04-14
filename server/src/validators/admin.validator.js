const {
  z,
  objectIdSchema,
  paginationQuerySchema,
} = require('./common.validator')

const userIdParamSchema = z.object({
  userId: objectIdSchema,
})

const updateUserRoleSchema = z.object({
  role: z.enum(['user', 'trainer', 'admin']),
})

const adminUserListQuerySchema = paginationQuerySchema.extend({
  role: z.enum(['user', 'trainer', 'admin']).optional(),
  search: z.string().trim().min(1).max(80).optional(),
  isActive: z.coerce.boolean().optional(),
})

const createAdminNotificationSchema = z.object({
  userIds: z.array(objectIdSchema).min(1),
  type: z
    .enum([
      'workout_reminder',
      'water_reminder',
      'goal_alert',
      'booking',
      'diet',
      'ai',
      'system',
    ])
    .default('system'),
  channel: z.enum(['in_app', 'push', 'email']).default('in_app'),
  title: z.string().trim().min(2).max(160),
  message: z.string().trim().min(2).max(500),
})

module.exports = {
  userIdParamSchema,
  updateUserRoleSchema,
  adminUserListQuerySchema,
  createAdminNotificationSchema,
}
