const { z, objectIdSchema } = require('./common.validator')

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters long')
  .max(72, 'Password is too long')
  .regex(/[A-Z]/, 'Password must include an uppercase letter')
  .regex(/[a-z]/, 'Password must include a lowercase letter')
  .regex(/[0-9]/, 'Password must include a number')

const profileNumberField = (schema) =>
  z.preprocess((value) => {
    if (value === '' || value === null || value === undefined) {
      return undefined
    }

    return value
  }, schema.optional())

const profileGenderSchema = z.enum([
  'male',
  'female',
  'other',
  'prefer_not_to_say',
])

const fitnessLevelSchema = z.enum(['beginner', 'intermediate', 'advanced'])

const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z
    .string()
    .email()
    .transform((value) => value.toLowerCase()),
  password: passwordSchema,
  role: z.enum(['user', 'trainer']).default('user'),
})

const loginSchema = z.object({
  email: z
    .string()
    .email()
    .transform((value) => value.toLowerCase()),
  password: z.string().min(1),
})

const refreshSchema = z.object({
  refreshToken: z.string().min(10).optional(),
})

const forgotPasswordSchema = z.object({
  email: z
    .string()
    .email()
    .transform((value) => value.toLowerCase()),
})

const resetPasswordSchema = z.object({
  token: z.string().min(10),
  newPassword: passwordSchema,
})

const updateProfileSchema = z
  .object({
    name: z.string().trim().min(2).max(80).optional(),
    avatarUrl: z.string().trim().url().max(2048).optional(),
    gender: profileGenderSchema.optional(),
    fitnessLevel: fitnessLevelSchema.optional(),
    age: profileNumberField(z.number().int().min(13).max(120)),
    heightCm: profileNumberField(z.number().min(90).max(260)),
    currentWeightKg: profileNumberField(z.number().min(20).max(500)),
    goalWeightKg: profileNumberField(z.number().min(20).max(500)),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one profile field is required',
  })

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: passwordSchema,
  })
  .refine((value) => value.currentPassword !== value.newPassword, {
    path: ['newPassword'],
    message: 'New password must be different from current password',
  })

const sessionIdParamSchema = z.object({
  sessionId: objectIdSchema,
})

module.exports = {
  registerSchema,
  loginSchema,
  refreshSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateProfileSchema,
  changePasswordSchema,
  sessionIdParamSchema,
}
