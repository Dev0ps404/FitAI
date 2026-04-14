const DietLog = require('../../models/DietLog')
const asyncHandler = require('../../utils/asyncHandler')
const ApiError = require('../../utils/apiError')
const { getPagination, getPaginationMeta } = require('../../utils/pagination')
const { USER_ROLES } = require('../../config/constants')
const { isSameId } = require('../../utils/id')
const { generateAiDietPlan } = require('../../services/ai.service')

function canAccessDietLog(user, dietLog) {
  if (user.role === USER_ROLES.ADMIN) {
    return true
  }

  return isSameId(dietLog.user, user._id)
}

async function resolveDietLogForUser(dietLogId, user) {
  const dietLog = await DietLog.findById(dietLogId)

  if (!dietLog) {
    throw new ApiError(404, 'Diet log not found')
  }

  if (!canAccessDietLog(user, dietLog)) {
    throw new ApiError(403, 'You are not authorized to access this diet log')
  }

  return dietLog
}

const createDietLog = asyncHandler(async (req, res) => {
  const payload = req.validatedBody || req.body

  const dietLog = await DietLog.create({
    user: req.user._id,
    date: payload.date || new Date(),
    mealType: payload.mealType,
    foods: payload.foods,
    notes: payload.notes || '',
  })

  res.status(201).json({
    success: true,
    message: 'Diet log created successfully',
    data: {
      dietLog,
    },
  })
})

const listDietLogs = asyncHandler(async (req, res) => {
  const query = req.validatedQuery || req.query
  const { currentPage, perPage, skip } = getPagination(query)

  const filter = {
    user: req.user._id,
  }

  if (query.mealType) {
    filter.mealType = query.mealType
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

  const [dietLogs, total] = await Promise.all([
    DietLog.find(filter).sort({ date: -1 }).skip(skip).limit(perPage),
    DietLog.countDocuments(filter),
  ])

  res.status(200).json({
    success: true,
    data: {
      dietLogs,
      pagination: getPaginationMeta({
        total,
        currentPage,
        perPage,
      }),
    },
  })
})

const updateDietLog = asyncHandler(async (req, res) => {
  const { dietLogId } = req.validatedParams || req.params
  const payload = req.validatedBody || req.body

  const dietLog = await resolveDietLogForUser(dietLogId, req.user)

  if (payload.date !== undefined) {
    dietLog.date = payload.date
  }

  if (payload.mealType !== undefined) {
    dietLog.mealType = payload.mealType
  }

  if (payload.foods !== undefined) {
    dietLog.foods = payload.foods
  }

  if (payload.notes !== undefined) {
    dietLog.notes = payload.notes
  }

  await dietLog.save()

  res.status(200).json({
    success: true,
    message: 'Diet log updated successfully',
    data: {
      dietLog,
    },
  })
})

const deleteDietLog = asyncHandler(async (req, res) => {
  const { dietLogId } = req.validatedParams || req.params

  const dietLog = await resolveDietLogForUser(dietLogId, req.user)
  await dietLog.deleteOne()

  res.status(200).json({
    success: true,
    message: 'Diet log deleted successfully',
  })
})

const getNutritionSummary = asyncHandler(async (req, res) => {
  const sinceDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const summary = await DietLog.aggregate([
    {
      $match: {
        user: req.user._id,
        date: {
          $gte: sinceDate,
        },
      },
    },
    {
      $group: {
        _id: null,
        totalCalories: {
          $sum: '$totals.calories',
        },
        totalProteinG: {
          $sum: '$totals.proteinG',
        },
        totalCarbsG: {
          $sum: '$totals.carbsG',
        },
        totalFatsG: {
          $sum: '$totals.fatsG',
        },
        logCount: {
          $sum: 1,
        },
      },
    },
  ])

  res.status(200).json({
    success: true,
    data: {
      summary: summary[0] || {
        totalCalories: 0,
        totalProteinG: 0,
        totalCarbsG: 0,
        totalFatsG: 0,
        logCount: 0,
      },
    },
  })
})

const createAiDietPlan = asyncHandler(async (req, res) => {
  const payload = req.validatedBody || req.body

  const aiPlan = await generateAiDietPlan({
    userProfile: req.user,
    objective: payload.objective,
  })

  res.status(200).json({
    success: true,
    data: {
      plan: aiPlan,
    },
  })
})

module.exports = {
  createDietLog,
  listDietLogs,
  updateDietLog,
  deleteDietLog,
  getNutritionSummary,
  createAiDietPlan,
}
