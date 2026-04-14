const { z, objectIdSchema } = require('./common.validator')

const aiChatRequestSchema = z.object({
  sessionId: objectIdSchema.optional(),
  message: z.string().trim().min(2).max(2000),
})

const aiSessionIdParamSchema = z.object({
  sessionId: objectIdSchema,
})

module.exports = {
  aiChatRequestSchema,
  aiSessionIdParamSchema,
}
