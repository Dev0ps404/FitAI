const { z, objectIdSchema } = require('./common.validator')

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters long')
  .max(72, 'Password is too long')
  .regex(/[A-Z]/, 'Password must include an uppercase letter')
  .regex(/[a-z]/, 'Password must include a lowercase letter')
  .regex(/[0-9]/, 'Password must include a number')

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

const sessionIdParamSchema = z.object({
  sessionId: objectIdSchema,
})

module.exports = {
  registerSchema,
  loginSchema,
  refreshSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  sessionIdParamSchema,
}
