const { Router } = require('express')
const requireAuth = require('../middlewares/requireAuth')
const validateRequest = require('../middlewares/validateRequest')
const {
  createWorkoutSchema,
  updateWorkoutSchema,
  workoutListQuerySchema,
  workoutIdParamSchema,
} = require('../validators/workout.validator')
const {
  createWorkout,
  listWorkouts,
  getWorkoutById,
  updateWorkout,
  deleteWorkout,
  getWorkoutStats,
} = require('../controllers/workout/workout.controller')

const workoutRouter = Router()

workoutRouter.use(requireAuth)

workoutRouter.get('/stats', getWorkoutStats)
workoutRouter.get(
  '/',
  validateRequest({ query: workoutListQuerySchema }),
  listWorkouts,
)
workoutRouter.post(
  '/',
  validateRequest({ body: createWorkoutSchema }),
  createWorkout,
)
workoutRouter.get(
  '/:workoutId',
  validateRequest({ params: workoutIdParamSchema }),
  getWorkoutById,
)
workoutRouter.patch(
  '/:workoutId',
  validateRequest({ params: workoutIdParamSchema, body: updateWorkoutSchema }),
  updateWorkout,
)
workoutRouter.delete(
  '/:workoutId',
  validateRequest({ params: workoutIdParamSchema }),
  deleteWorkout,
)

module.exports = workoutRouter
