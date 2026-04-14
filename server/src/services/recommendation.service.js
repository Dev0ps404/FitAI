const Workout = require('../models/Workout')
const Progress = require('../models/Progress')

async function getMissedWorkoutRecommendation(userId) {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const missedCount = await Workout.countDocuments({
    user: userId,
    date: { $gte: sevenDaysAgo },
    status: 'skipped',
  })

  if (!missedCount) {
    return null
  }

  return {
    type: 'missed_workout_alert',
    message: `You skipped ${missedCount} workout sessions in the last 7 days. Consider reducing intensity and focusing on consistency.`,
  }
}

async function getProgressMomentumInsight(userId) {
  const latestProgress = await Progress.findOne({ user: userId }).sort({
    date: -1,
  })

  if (!latestProgress?.weightKg) {
    return null
  }

  return {
    type: 'progress_signal',
    message: `Latest tracked weight is ${latestProgress.weightKg}kg. Keep logging progress weekly for stronger AI recommendations.`,
  }
}

async function getUserRecommendationDigest(userId) {
  const [missedWorkoutInsight, momentumInsight] = await Promise.all([
    getMissedWorkoutRecommendation(userId),
    getProgressMomentumInsight(userId),
  ])

  return [missedWorkoutInsight, momentumInsight].filter(Boolean)
}

module.exports = {
  getUserRecommendationDigest,
}
