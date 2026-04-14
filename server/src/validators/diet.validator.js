const {
  z,
  objectIdSchema,
  paginationQuerySchema,
} = require('./common.validator')

const foodEntrySchema = z.object({
  name: z.string().trim().min(1).max(120),
  quantity: z.coerce.number().min(0).default(1),
  unit: z.string().trim().min(1).max(20).default('serving'),
  calories: z.coerce.number().min(0).default(0),
  proteinG: z.coerce.number().min(0).default(0),
  carbsG: z.coerce.number().min(0).default(0),
  fatsG: z.coerce.number().min(0).default(0),
})

const createDietLogSchema = z.object({
  date: z.coerce.date().optional(),
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  foods: z.array(foodEntrySchema).min(1),
  notes: z.string().max(400).optional(),
})

const updateDietLogSchema = createDietLogSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field is required for update',
  })

const dietLogIdParamSchema = z.object({
  dietLogId: objectIdSchema,
})

const dietListQuerySchema = paginationQuerySchema.extend({
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack']).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
})

const generateDietPlanSchema = z.object({
  objective: z.string().trim().min(5).max(300),
})

module.exports = {
  createDietLogSchema,
  updateDietLogSchema,
  dietLogIdParamSchema,
  dietListQuerySchema,
  generateDietPlanSchema,
}
