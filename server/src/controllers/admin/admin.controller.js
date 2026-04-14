const User = require('../../models/User')
const Trainer = require('../../models/Trainer')
const Workout = require('../../models/Workout')
const Booking = require('../../models/Booking')
const asyncHandler = require('../../utils/asyncHandler')
const ApiError = require('../../utils/apiError')
const { getPagination, getPaginationMeta } = require('../../utils/pagination')
const {
  USER_ROLES,
  TRAINER_APPROVAL_STATUS,
} = require('../../config/constants')

const getAdminAnalytics = asyncHandler(async (_req, res) => {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const [
    totalUsers,
    totalTrainers,
    pendingTrainerApplications,
    bookingSummary,
    workoutSummary,
  ] = await Promise.all([
    User.countDocuments({ isActive: true }),
    User.countDocuments({ role: USER_ROLES.TRAINER, isActive: true }),
    Trainer.countDocuments({ status: TRAINER_APPROVAL_STATUS.PENDING }),
    Booking.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]),
    Workout.aggregate([
      {
        $match: {
          date: { $gte: sevenDaysAgo },
        },
      },
      {
        $group: {
          _id: null,
          totalCalories: { $sum: '$totalCaloriesBurned' },
          totalDurationMin: { $sum: '$durationMin' },
          totalCount: { $sum: 1 },
        },
      },
    ]),
  ])

  res.status(200).json({
    success: true,
    data: {
      totalUsers,
      totalTrainers,
      pendingTrainerApplications,
      bookingsByStatus: bookingSummary,
      workoutsLast7Days: workoutSummary[0] || {
        totalCalories: 0,
        totalDurationMin: 0,
        totalCount: 0,
      },
    },
  })
})

const listUsers = asyncHandler(async (req, res) => {
  const query = req.validatedQuery || req.query
  const { currentPage, perPage, skip } = getPagination(query)

  const filter = {}

  if (query.role) {
    filter.role = query.role
  }

  if (query.search) {
    filter.$or = [
      { name: { $regex: query.search, $options: 'i' } },
      { email: { $regex: query.search, $options: 'i' } },
    ]
  }

  if (query.isActive !== undefined) {
    filter.isActive = query.isActive
  }

  const [users, total] = await Promise.all([
    User.find(filter)
      .select('-passwordHash -resetPasswordTokenHash -resetPasswordExpiresAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(perPage),
    User.countDocuments(filter),
  ])

  res.status(200).json({
    success: true,
    data: {
      users,
      pagination: getPaginationMeta({
        total,
        currentPage,
        perPage,
      }),
    },
  })
})

const updateUserRole = asyncHandler(async (req, res) => {
  const { userId } = req.validatedParams || req.params
  const payload = req.validatedBody || req.body

  const user = await User.findById(userId)

  if (!user) {
    throw new ApiError(404, 'User not found')
  }

  user.role = payload.role

  if (payload.role === USER_ROLES.TRAINER) {
    user.trainerApprovalStatus = TRAINER_APPROVAL_STATUS.PENDING

    await Trainer.findOneAndUpdate(
      { user: user._id },
      {
        $setOnInsert: {
          user: user._id,
          status: TRAINER_APPROVAL_STATUS.PENDING,
        },
      },
      {
        upsert: true,
      },
    )
  } else {
    user.trainerApprovalStatus = TRAINER_APPROVAL_STATUS.APPROVED
  }

  await user.save({ validateBeforeSave: false })

  res.status(200).json({
    success: true,
    message: 'User role updated successfully',
    data: {
      user,
    },
  })
})

const listTrainerApplications = asyncHandler(async (req, res) => {
  const statusFilter = req.query.status || TRAINER_APPROVAL_STATUS.PENDING

  const applications = await Trainer.find({
    status: statusFilter,
  })
    .sort({ createdAt: -1 })
    .populate('user', 'name email avatarUrl role trainerApprovalStatus')

  res.status(200).json({
    success: true,
    data: {
      applications,
    },
  })
})

const toggleUserActiveStatus = asyncHandler(async (req, res) => {
  const { userId } = req.validatedParams || req.params

  const user = await User.findById(userId)

  if (!user) {
    throw new ApiError(404, 'User not found')
  }

  user.isActive = !user.isActive
  await user.save({ validateBeforeSave: false })

  res.status(200).json({
    success: true,
    message: `User account ${user.isActive ? 'activated' : 'deactivated'} successfully`,
    data: {
      user,
    },
  })
})

module.exports = {
  getAdminAnalytics,
  listUsers,
  updateUserRole,
  listTrainerApplications,
  toggleUserActiveStatus,
}
