const {
  z,
  objectIdSchema,
  paginationQuerySchema,
} = require('./common.validator')

const strengthMetricSchema = z.object({
  exerciseName: z.string().trim().min(2).max(120),
  oneRepMaxKg: z.coerce.number().min(0).max(1000),
})

const progressEntrySchema = z.object({
  date: z.coerce.date().optional(),
  weightKg: z.coerce.number().min(20).max(500).optional(),
  bodyFatPercent: z.coerce.number().min(0).max(80).optional(),
  caloriesBurned: z.coerce.number().min(0).optional(),
  strengthMetrics: z.array(strengthMetricSchema).optional(),
  measurements: z
    .object({
      chestCm: z.coerce.number().min(0).optional(),
      waistCm: z.coerce.number().min(0).optional(),
      hipsCm: z.coerce.number().min(0).optional(),
      armCm: z.coerce.number().min(0).optional(),
      thighCm: z.coerce.number().min(0).optional(),
    })
    .optional(),
  notes: z.string().max(400).optional(),
})

const progressIdParamSchema = z.object({
  progressId: objectIdSchema,
})

const progressListQuerySchema = paginationQuerySchema.extend({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
})

module.exports = {
  progressEntrySchema,
  progressIdParamSchema,
  progressListQuerySchema,
}
