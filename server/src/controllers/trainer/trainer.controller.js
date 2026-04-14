const Trainer = require('../../models/Trainer')
const User = require('../../models/User')
const Workout = require('../../models/Workout')
const Booking = require('../../models/Booking')
const asyncHandler = require('../../utils/asyncHandler')
const ApiError = require('../../utils/apiError')
const { getPagination, getPaginationMeta } = require('../../utils/pagination')
const {
  USER_ROLES,
  TRAINER_APPROVAL_STATUS,
} = require('../../config/constants')
const { createNotification } = require('../../services/notification.service')

const upsertTrainerProfile = asyncHandler(async (req, res) => {
  const payload = req.validatedBody || req.body

  let trainerProfile = await Trainer.findOne({ user: req.user._id })

  if (!trainerProfile) {
    trainerProfile = await Trainer.create({
      user: req.user._id,
      status: TRAINER_APPROVAL_STATUS.PENDING,
    })
  }

  Object.assign(trainerProfile, {
    bio: payload.bio ?? trainerProfile.bio,
    specializations: payload.specializations ?? trainerProfile.specializations,
    certifications: payload.certifications ?? trainerProfile.certifications,
    yearsOfExperience:
      payload.yearsOfExperience ?? trainerProfile.yearsOfExperience,
    hourlyRate: payload.hourlyRate ?? trainerProfile.hourlyRate,
    location: payload.location ?? trainerProfile.location,
    languages: payload.languages ?? trainerProfile.languages,
    availableSlots: payload.availableSlots ?? trainerProfile.availableSlots,
  })

  await trainerProfile.save()

  res.status(200).json({
    success: true,
    message: 'Trainer profile saved successfully',
    data: {
      trainerProfile,
    },
  })
})

const listTrainers = asyncHandler(async (req, res) => {
  const query = req.validatedQuery || req.query
  const { currentPage, perPage, skip } = getPagination(query)

  const filter = {
    status: query.status || TRAINER_APPROVAL_STATUS.APPROVED,
  }

  const [trainerProfiles, total] = await Promise.all([
    Trainer.find(filter)
      .sort({ ratingAvg: -1, createdAt: -1 })
      .skip(skip)
      .limit(perPage)
      .populate('user', 'name email avatarUrl role')
      .lean(),
    Trainer.countDocuments(filter),
  ])

  const searchTerm = query.search?.toLowerCase()
  const filteredProfiles =
    searchTerm && searchTerm.length > 0
      ? trainerProfiles.filter((profile) => {
          const searchableText =
            `${profile.user?.name || ''} ${profile.user?.email || ''} ${profile.specializations?.join(' ') || ''}`.toLowerCase()
          return searchableText.includes(searchTerm)
        })
      : trainerProfiles

  res.status(200).json({
    success: true,
    data: {
      trainers: filteredProfiles,
      pagination: getPaginationMeta({
        total,
        currentPage,
        perPage,
      }),
    },
  })
})

const getTrainerById = asyncHandler(async (req, res) => {
  const { trainerId } = req.validatedParams || req.params

  const trainerProfile = await Trainer.findById(trainerId).populate(
    'user',
    'name email avatarUrl role',
  )

  if (!trainerProfile) {
    throw new ApiError(404, 'Trainer not found')
  }

  res.status(200).json({
    success: true,
    data: {
      trainer: trainerProfile,
    },
  })
})

const approveTrainerProfile = asyncHandler(async (req, res) => {
  const { trainerId } = req.validatedParams || req.params
  const payload = req.validatedBody || req.body

  const trainerProfile = await Trainer.findById(trainerId)

  if (!trainerProfile) {
    throw new ApiError(404, 'Trainer profile not found')
  }

  trainerProfile.status = payload.status
  trainerProfile.rejectionReason =
    payload.status === TRAINER_APPROVAL_STATUS.REJECTED
      ? payload.rejectionReason || 'Application rejected by admin'
      : null
  await trainerProfile.save()

  const user = await User.findById(trainerProfile.user)

  if (user) {
    user.role =
      payload.status === TRAINER_APPROVAL_STATUS.APPROVED
        ? USER_ROLES.TRAINER
        : USER_ROLES.USER
    user.trainerApprovalStatus = payload.status
    await user.save({ validateBeforeSave: false })
  }

  await createNotification({
    userId: trainerProfile.user,
    type: 'system',
    title: 'Trainer Application Update',
    message:
      payload.status === TRAINER_APPROVAL_STATUS.APPROVED
        ? 'Your trainer profile has been approved. You can now manage clients on FitAI.'
        : 'Your trainer profile was rejected. Review feedback and resubmit your profile.',
    io: req.app.get('io'),
  })

  res.status(200).json({
    success: true,
    message: 'Trainer approval status updated',
    data: {
      trainerProfile,
    },
  })
})

const getTrainerClients = asyncHandler(async (req, res) => {
  const trainerProfile = await Trainer.findOne({ user: req.user._id })

  if (!trainerProfile) {
    throw new ApiError(404, 'Trainer profile not found')
  }

  const bookings = await Booking.find({
    trainer: trainerProfile._id,
    status: {
      $in: ['confirmed', 'completed'],
    },
  }).populate('user', 'name email avatarUrl')

  const uniqueClients = []
  const seenClientIds = new Set()

  bookings.forEach((booking) => {
    if (booking.user && !seenClientIds.has(String(booking.user._id))) {
      seenClientIds.add(String(booking.user._id))
      uniqueClients.push(booking.user)
    }
  })

  res.status(200).json({
    success: true,
    data: {
      clients: uniqueClients,
    },
  })
})

const assignWorkoutPlan = asyncHandler(async (req, res) => {
  const payload = req.validatedBody || req.body

  const trainerProfile = await Trainer.findOne({ user: req.user._id })

  if (
    !trainerProfile ||
    trainerProfile.status !== TRAINER_APPROVAL_STATUS.APPROVED
  ) {
    throw new ApiError(403, 'Only approved trainers can assign workout plans')
  }

  const client = await User.findById(payload.userId)

  if (!client) {
    throw new ApiError(404, 'Client user not found')
  }

  const workout = await Workout.create({
    user: client._id,
    trainer: req.user._id,
    name: payload.name,
    exercises: payload.exercises.map((exercise) => ({
      exercise: exercise.exerciseId || null,
      name: exercise.name,
      sets: exercise.sets,
      reps: exercise.reps,
      weightKg: exercise.weightKg,
      durationMin: exercise.durationMin,
      caloriesBurned: exercise.caloriesBurned,
    })),
    status: 'planned',
    planSource: 'trainer',
    notes: payload.notes || '',
  })

  await createNotification({
    userId: client._id,
    type: 'workout_reminder',
    title: 'New Trainer Plan Assigned',
    message: `${req.user.name} assigned a new workout plan for you: ${payload.name}`,
    io: req.app.get('io'),
    meta: {
      workoutId: workout._id,
      trainerId: req.user._id,
    },
  })

  res.status(201).json({
    success: true,
    message: 'Workout plan assigned successfully',
    data: {
      workout,
    },
  })
})

module.exports = {
  upsertTrainerProfile,
  listTrainers,
  getTrainerById,
  approveTrainerProfile,
  getTrainerClients,
  assignWorkoutPlan,
}
