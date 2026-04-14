const { Router } = require('express')
const requireAuth = require('../middlewares/requireAuth')
const authorizeRoles = require('../middlewares/authorizeRoles')
const validateRequest = require('../middlewares/validateRequest')
const { USER_ROLES } = require('../config/constants')
const {
  trainerProfileSchema,
  trainerIdParamSchema,
  trainerApprovalSchema,
  trainerListQuerySchema,
  assignWorkoutPlanSchema,
} = require('../validators/trainer.validator')
const {
  upsertTrainerProfile,
  listTrainers,
  getTrainerById,
  approveTrainerProfile,
  getTrainerClients,
  assignWorkoutPlan,
} = require('../controllers/trainer/trainer.controller')

const trainerRouter = Router()

trainerRouter.get(
  '/',
  validateRequest({ query: trainerListQuerySchema }),
  listTrainers,
)
trainerRouter.get(
  '/:trainerId',
  validateRequest({ params: trainerIdParamSchema }),
  getTrainerById,
)

trainerRouter.put(
  '/me/profile',
  requireAuth,
  authorizeRoles(USER_ROLES.TRAINER, USER_ROLES.ADMIN),
  validateRequest({ body: trainerProfileSchema }),
  upsertTrainerProfile,
)

trainerRouter.get(
  '/me/clients',
  requireAuth,
  authorizeRoles(USER_ROLES.TRAINER),
  getTrainerClients,
)

trainerRouter.post(
  '/me/assign-plan',
  requireAuth,
  authorizeRoles(USER_ROLES.TRAINER),
  validateRequest({ body: assignWorkoutPlanSchema }),
  assignWorkoutPlan,
)

trainerRouter.patch(
  '/:trainerId/approval',
  requireAuth,
  authorizeRoles(USER_ROLES.ADMIN),
  validateRequest({
    params: trainerIdParamSchema,
    body: trainerApprovalSchema,
  }),
  approveTrainerProfile,
)

module.exports = trainerRouter
