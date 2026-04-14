const {
  z,
  objectIdSchema,
  paginationQuerySchema,
} = require('./common.validator')

const exerciseEntrySchema = z.object({
  exerciseId: objectIdSchema.optional(),
  name: z.string().trim().min(2).max(120),
  sets: z.coerce.number().int().min(0).max(30).default(3),
  reps: z.coerce.number().int().min(0).max(100).default(10),
  weightKg: z.coerce.number().min(0).max(1000).default(0),
  durationMin: z.coerce.number().min(0).max(600).default(0),
  caloriesBurned: z.coerce.number().min(0).max(5000).default(0),
  notes: z.string().max(280).optional(),
})

const createWorkoutSchema = z.object({
  userId: objectIdSchema.optional(),
  name: z.string().trim().min(2).max(140),
  date: z.coerce.date().optional(),
  exercises: z.array(exerciseEntrySchema).min(1),
  status: z.enum(['planned', 'completed', 'skipped']).optional(),
  planSource: z.enum(['custom', 'predefined', 'trainer', 'ai']).optional(),
  notes: z.string().max(400).optional(),
})

const updateWorkoutSchema = createWorkoutSchema
  .omit({ userId: true })
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field is required for update',
  })

const workoutListQuerySchema = paginationQuerySchema.extend({
  status: z.enum(['planned', 'completed', 'skipped']).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  userId: objectIdSchema.optional(),
})

const workoutIdParamSchema = z.object({
  workoutId: objectIdSchema,
})

module.exports = {
  createWorkoutSchema,
  updateWorkoutSchema,
  workoutListQuerySchema,
  workoutIdParamSchema,
}
