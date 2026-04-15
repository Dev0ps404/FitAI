function sanitizeUser(userDoc) {
  if (!userDoc) {
    return null
  }

  return {
    id: userDoc._id,
    name: userDoc.name,
    email: userDoc.email,
    role: userDoc.role,
    avatarUrl: userDoc.avatarUrl || null,
    isEmailVerified: userDoc.isEmailVerified,
    trainerApprovalStatus: userDoc.trainerApprovalStatus,
    fitnessLevel: userDoc.fitnessLevel,
    gender: userDoc.gender,
    age: userDoc.age,
    heightCm: userDoc.heightCm,
    currentWeightKg: userDoc.currentWeightKg,
    goalWeightKg: userDoc.goalWeightKg,
    streakDays: userDoc.streakDays,
    badgePoints: userDoc.badgePoints,
    lastLoginAt: userDoc.lastLoginAt,
    preferences: userDoc.preferences || {
      injuryNotes: '',
      dietaryPreferences: [],
      workoutDaysPerWeek: 4,
    },
    createdAt: userDoc.createdAt,
    updatedAt: userDoc.updatedAt,
  }
}

module.exports = sanitizeUser
