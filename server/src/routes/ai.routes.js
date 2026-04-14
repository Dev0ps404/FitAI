const { Router } = require('express')
const requireAuth = require('../middlewares/requireAuth')
const validateRequest = require('../middlewares/validateRequest')
const { aiRateLimiter } = require('../middlewares/rateLimiters')
const {
  aiChatRequestSchema,
  aiSessionIdParamSchema,
} = require('../validators/ai.validator')
const {
  sendAiMessage,
  listAiSessions,
  getAiSessionMessages,
  deleteAiSession,
  getAiRecommendations,
} = require('../controllers/ai/ai.controller')

const aiRouter = Router()

aiRouter.use(requireAuth)

aiRouter.post(
  '/chat',
  aiRateLimiter,
  validateRequest({ body: aiChatRequestSchema }),
  sendAiMessage,
)
aiRouter.get('/sessions', listAiSessions)
aiRouter.get(
  '/sessions/:sessionId',
  validateRequest({ params: aiSessionIdParamSchema }),
  getAiSessionMessages,
)
aiRouter.delete(
  '/sessions/:sessionId',
  validateRequest({ params: aiSessionIdParamSchema }),
  deleteAiSession,
)
aiRouter.get('/recommendations', getAiRecommendations)

module.exports = aiRouter
