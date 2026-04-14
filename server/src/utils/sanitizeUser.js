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
    currentWeightKg: userDoc.currentWeightKg,
    goalWeightKg: userDoc.goalWeightKg,
    streakDays: userDoc.streakDays,
    badgePoints: userDoc.badgePoints,
    createdAt: userDoc.createdAt,
    updatedAt: userDoc.updatedAt,
  }
}

module.exports = sanitizeUser
