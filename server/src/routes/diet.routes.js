const { Router } = require('express')
const requireAuth = require('../middlewares/requireAuth')
const validateRequest = require('../middlewares/validateRequest')
const {
  createDietLogSchema,
  updateDietLogSchema,
  dietLogIdParamSchema,
  dietListQuerySchema,
  generateDietPlanSchema,
} = require('../validators/diet.validator')
const {
  createDietLog,
  listDietLogs,
  updateDietLog,
  deleteDietLog,
  getNutritionSummary,
  createAiDietPlan,
} = require('../controllers/diet/diet.controller')

const dietRouter = Router()

dietRouter.use(requireAuth)

dietRouter.get('/summary', getNutritionSummary)
dietRouter.post(
  '/ai-plan',
  validateRequest({ body: generateDietPlanSchema }),
  createAiDietPlan,
)
dietRouter.get(
  '/',
  validateRequest({ query: dietListQuerySchema }),
  listDietLogs,
)
dietRouter.post(
  '/',
  validateRequest({ body: createDietLogSchema }),
  createDietLog,
)
dietRouter.patch(
  '/:dietLogId',
  validateRequest({ params: dietLogIdParamSchema, body: updateDietLogSchema }),
  updateDietLog,
)
dietRouter.delete(
  '/:dietLogId',
  validateRequest({ params: dietLogIdParamSchema }),
  deleteDietLog,
)

module.exports = dietRouter
