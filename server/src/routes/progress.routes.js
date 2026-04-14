const { Router } = require('express')
const requireAuth = require('../middlewares/requireAuth')
const validateRequest = require('../middlewares/validateRequest')
const {
  progressEntrySchema,
  progressIdParamSchema,
  progressListQuerySchema,
} = require('../validators/progress.validator')
const {
  createProgressEntry,
  listProgressEntries,
  deleteProgressEntry,
  getProgressAnalytics,
} = require('../controllers/progress/progress.controller')

const progressRouter = Router()

progressRouter.use(requireAuth)

progressRouter.get('/analytics', getProgressAnalytics)
progressRouter.get(
  '/',
  validateRequest({ query: progressListQuerySchema }),
  listProgressEntries,
)
progressRouter.post(
  '/',
  validateRequest({ body: progressEntrySchema }),
  createProgressEntry,
)
progressRouter.delete(
  '/:progressId',
  validateRequest({ params: progressIdParamSchema }),
  deleteProgressEntry,
)

module.exports = progressRouter
