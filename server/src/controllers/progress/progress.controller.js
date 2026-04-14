const Progress = require('../../models/Progress')
const asyncHandler = require('../../utils/asyncHandler')
const ApiError = require('../../utils/apiError')
const { getPagination, getPaginationMeta } = require('../../utils/pagination')
const { USER_ROLES } = require('../../config/constants')
const { isSameId } = require('../../utils/id')

function getProgressOwnerFilter(req) {
  if (req.user.role === USER_ROLES.ADMIN && req.query.userId) {
    return { user: req.query.userId }
  }

  return { user: req.user._id }
}

async function resolveProgressEntryForUser(progressId, user) {
  const progressEntry = await Progress.findById(progressId)

  if (!progressEntry) {
    throw new ApiError(404, 'Progress entry not found')
  }

  if (
    user.role !== USER_ROLES.ADMIN &&
    !isSameId(progressEntry.user, user._id)
  ) {
    throw new ApiError(
      403,
      'You are not authorized to access this progress entry',
    )
  }

  return progressEntry
}

const createProgressEntry = asyncHandler(async (req, res) => {
  const payload = req.validatedBody || req.body

  const progressEntry = await Progress.create({
    user: req.user._id,
    date: payload.date || new Date(),
    weightKg: payload.weightKg,
    bodyFatPercent: payload.bodyFatPercent,
    caloriesBurned: payload.caloriesBurned || 0,
    strengthMetrics: payload.strengthMetrics || [],
    measurements: payload.measurements || {},
    notes: payload.notes || '',
  })

  res.status(201).json({
    success: true,
    message: 'Progress entry created successfully',
    data: {
      progressEntry,
    },
  })
})

const listProgressEntries = asyncHandler(async (req, res) => {
  const query = req.validatedQuery || req.query
  const { currentPage, perPage, skip } = getPagination(query)

  const filter = {
    ...getProgressOwnerFilter(req),
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

  const [progressEntries, total] = await Promise.all([
    Progress.find(filter).sort({ date: -1 }).skip(skip).limit(perPage),
    Progress.countDocuments(filter),
  ])

  res.status(200).json({
    success: true,
    data: {
      progressEntries,
      pagination: getPaginationMeta({
        total,
        currentPage,
        perPage,
      }),
    },
  })
})

const deleteProgressEntry = asyncHandler(async (req, res) => {
  const { progressId } = req.validatedParams || req.params

  const progressEntry = await resolveProgressEntryForUser(progressId, req.user)
  await progressEntry.deleteOne()

  res.status(200).json({
    success: true,
    message: 'Progress entry deleted successfully',
  })
})

const getProgressAnalytics = asyncHandler(async (req, res) => {
  const ownerFilter = getProgressOwnerFilter(req)
  const sinceDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)

  const timeline = await Progress.find({
    ...ownerFilter,
    date: {
      $gte: sinceDate,
    },
  })
    .sort({ date: 1 })
    .select('date weightKg bodyFatPercent caloriesBurned strengthMetrics')

  const weightEntries = timeline.filter(
    (entry) => typeof entry.weightKg === 'number',
  )
  const firstWeight = weightEntries[0]?.weightKg || null
  const latestWeight = weightEntries[weightEntries.length - 1]?.weightKg || null

  const weightChangeKg =
    firstWeight !== null && latestWeight !== null
      ? Number((latestWeight - firstWeight).toFixed(2))
      : null

  res.status(200).json({
    success: true,
    data: {
      timeline,
      summary: {
        firstWeight,
        latestWeight,
        weightChangeKg,
      },
    },
  })
})

module.exports = {
  createProgressEntry,
  listProgressEntries,
  deleteProgressEntry,
  getProgressAnalytics,
}
