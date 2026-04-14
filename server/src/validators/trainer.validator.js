const {
  z,
  objectIdSchema,
  paginationQuerySchema,
} = require('./common.validator')

const trainerProfileSchema = z.object({
  bio: z.string().max(1000).optional(),
  specializations: z.array(z.string().trim().min(2).max(60)).optional(),
  certifications: z.array(z.string().trim().min(2).max(120)).optional(),
  yearsOfExperience: z.coerce.number().min(0).max(70).optional(),
  hourlyRate: z.coerce.number().min(0).optional(),
  location: z.string().max(140).optional(),
  languages: z.array(z.string().trim().min(2).max(40)).optional(),
  availableSlots: z
    .array(
      z.object({
        dayOfWeek: z.coerce.number().int().min(0).max(6),
        startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
        endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
      }),
    )
    .optional(),
})

const trainerIdParamSchema = z.object({
  trainerId: objectIdSchema,
})

const trainerApprovalSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  rejectionReason: z.string().max(400).optional(),
})

const trainerListQuerySchema = paginationQuerySchema.extend({
  status: z.enum(['pending', 'approved', 'rejected']).optional(),
  search: z.string().trim().min(1).max(80).optional(),
})

const assignWorkoutPlanSchema = z.object({
  userId: objectIdSchema,
  name: z.string().trim().min(2).max(140),
  exercises: z
    .array(
      z.object({
        exerciseId: objectIdSchema.optional(),
        name: z.string().trim().min(2).max(120),
        sets: z.coerce.number().int().min(0).max(30).default(3),
        reps: z.coerce.number().int().min(0).max(100).default(10),
        weightKg: z.coerce.number().min(0).max(1000).default(0),
        durationMin: z.coerce.number().min(0).max(600).default(0),
        caloriesBurned: z.coerce.number().min(0).max(5000).default(0),
      }),
    )
    .min(1),
  notes: z.string().max(400).optional(),
})

module.exports = {
  trainerProfileSchema,
  trainerIdParamSchema,
  trainerApprovalSchema,
  trainerListQuerySchema,
  assignWorkoutPlanSchema,
}
