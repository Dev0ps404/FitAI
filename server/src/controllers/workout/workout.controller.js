const Workout = require('../../models/Workout')
const User = require('../../models/User')
const ApiError = require('../../utils/apiError')
const asyncHandler = require('../../utils/asyncHandler')
const { USER_ROLES } = require('../../config/constants')
const { isSameId } = require('../../utils/id')
const { getPagination, getPaginationMeta } = require('../../utils/pagination')

function mapWorkoutExerciseEntries(exercises) {
  return exercises.map((exercise) => ({
    exercise: exercise.exerciseId || null,
    name: exercise.name,
    sets: exercise.sets,
    reps: exercise.reps,
    weightKg: exercise.weightKg,
    durationMin: exercise.durationMin,
    caloriesBurned: exercise.caloriesBurned,
    notes: exercise.notes || '',
  }))
}

function canAccessWorkout(user, workout) {
  if (user.role === USER_ROLES.ADMIN) {
    return true
  }

  if (user.role === USER_ROLES.USER) {
    return isSameId(workout.user, user._id)
  }

  if (user.role === USER_ROLES.TRAINER) {
    return (
      isSameId(workout.trainer, user._id) || isSameId(workout.user, user._id)
    )
  }

  return false
}

async function resolveWorkoutByIdForUser(workoutId, user) {
  const workout = await Workout.findById(workoutId)
    .populate('user', 'name email role')
    .populate('trainer', 'name email role')

  if (!workout) {
    throw new ApiError(404, 'Workout not found')
  }

  if (!canAccessWorkout(user, workout)) {
    throw new ApiError(403, 'You are not authorized to access this workout')
  }

  return workout
}

const createWorkout = asyncHandler(async (req, res) => {
  const payload = req.validatedBody || req.body

  const targetUserId =
    req.user.role === USER_ROLES.USER
      ? req.user._id
      : payload.userId || req.user._id

  const targetUser = await User.findById(targetUserId)

  if (!targetUser) {
    throw new ApiError(404, 'Target user not found')
  }

  const workout = await Workout.create({
    user: targetUserId,
    trainer: req.user.role === USER_ROLES.TRAINER ? req.user._id : null,
    name: payload.name,
    date: payload.date || new Date(),
    exercises: mapWorkoutExerciseEntries(payload.exercises),
    status: payload.status || 'planned',
    planSource:
      payload.planSource ||
      (req.user.role === USER_ROLES.TRAINER ? 'trainer' : 'custom'),
    notes: payload.notes || '',
  })

  const populatedWorkout = await Workout.findById(workout._id)
    .populate('user', 'name email role')
    .populate('trainer', 'name email role')

  res.status(201).json({
    success: true,
    message: 'Workout created successfully',
    data: {
      workout: populatedWorkout,
    },
  })
})

const listWorkouts = asyncHandler(async (req, res) => {
  const query = req.validatedQuery || req.query
  const { currentPage, perPage, skip } = getPagination(query)

  const filter = {}

  if (req.user.role === USER_ROLES.USER) {
    filter.user = req.user._id
  } else if (req.user.role === USER_ROLES.TRAINER) {
    filter.$or = [{ trainer: req.user._id }, { user: req.user._id }]

    if (query.userId) {
      filter.$or = [{ trainer: req.user._id, user: query.userId }]
    }
  } else if (query.userId) {
    filter.user = query.userId
  }

  if (query.status) {
    filter.status = query.status
  }

  if (query.startDate || query.endDate) {
    filter.date = {}

    if (query.startDate) {
      filter.date.$gte = query.startDate
    }

    if (query.endDate) {
      filter.date.$lte = query.endDate
    }
  }

  const [workouts, total] = await Promise.all([
    Workout.find(filter)
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(perPage)
      .populate('user', 'name email role')
      .populate('trainer', 'name email role'),
    Workout.countDocuments(filter),
  ])

  res.status(200).json({
    success: true,
    data: {
      workouts,
      pagination: getPaginationMeta({
        total,
        currentPage,
        perPage,
      }),
    },
  })
})

const getWorkoutById = asyncHandler(async (req, res) => {
  const { workoutId } = req.validatedParams || req.params
  const workout = await resolveWorkoutByIdForUser(workoutId, req.user)

  res.status(200).json({
    success: true,
    data: {
      workout,
    },
  })
})

const updateWorkout = asyncHandler(async (req, res) => {
  const { workoutId } = req.validatedParams || req.params
  const payload = req.validatedBody || req.body

  const workout = await resolveWorkoutByIdForUser(workoutId, req.user)

  if (payload.name !== undefined) {
    workout.name = payload.name
  }

  if (payload.date !== undefined) {
    workout.date = payload.date
  }

  if (payload.exercises !== undefined) {
    workout.exercises = mapWorkoutExerciseEntries(payload.exercises)
  }

  if (payload.status !== undefined) {
    workout.status = payload.status
  }

  if (payload.planSource !== undefined) {
    workout.planSource = payload.planSource
  }

  if (payload.notes !== undefined) {
    workout.notes = payload.notes
  }

  await workout.save()

  res.status(200).json({
    success: true,
    message: 'Workout updated successfully',
    data: {
      workout,
    },
  })
})

const deleteWorkout = asyncHandler(async (req, res) => {
  const { workoutId } = req.validatedParams || req.params
  const workout = await resolveWorkoutByIdForUser(workoutId, req.user)

  await workout.deleteOne()

  res.status(200).json({
    success: true,
    message: 'Workout deleted successfully',
  })
})

const getWorkoutStats = asyncHandler(async (req, res) => {
  const lastThirtyDays = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const filter = {
    date: {
      $gte: lastThirtyDays,
    },
  }

  if (req.user.role === USER_ROLES.USER) {
    filter.user = req.user._id
  }

  if (req.user.role === USER_ROLES.TRAINER) {
    filter.trainer = req.user._id
  }

  const [summary, timeline] = await Promise.all([
    Workout.aggregate([
      {
        $match: filter,
      },
      {
        $group: {
          _id: null,
          totalCalories: {
            $sum: '$totalCaloriesBurned',
          },
          totalDurationMin: {
            $sum: '$durationMin',
          },
          completedCount: {
            $sum: {
              $cond: [{ $eq: ['$status', 'completed'] }, 1, 0],
            },
          },
          totalCount: {
            $sum: 1,
          },
        },
      },
    ]),
    Workout.aggregate([
      {
        $match: filter,
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$date',
            },
          },
          calories: {
            $sum: '$totalCaloriesBurned',
          },
          durationMin: {
            $sum: '$durationMin',
          },
          workouts: {
            $sum: 1,
          },
        },
      },
      {
        $sort: {
          _id: 1,
        },
      },
    ]),
  ])

  res.status(200).json({
    success: true,
    data: {
      summary: summary[0] || {
        totalCalories: 0,
        totalDurationMin: 0,
        completedCount: 0,
        totalCount: 0,
      },
      timeline,
    },
  })
})

module.exports = {
  createWorkout,
  listWorkouts,
  getWorkoutById,
  updateWorkout,
  deleteWorkout,
  getWorkoutStats,
}
