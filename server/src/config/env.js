const { z } = require('zod')

const booleanFromEnv = z.preprocess((value) => {
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()

    if (['true', '1', 'yes', 'on'].includes(normalized)) {
      return true
    }

    if (['false', '0', 'no', 'off'].includes(normalized)) {
      return false
    }
  }

  return value
}, z.boolean())

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().positive().default(5000),
  CLIENT_ORIGIN: z.string().default('http://localhost:5173'),
  MONGODB_URI: z.string().default('mongodb://127.0.0.1:27017/fitai'),
  DB_MAX_POOL_SIZE: z.coerce.number().int().positive().default(20),
  DB_MIN_POOL_SIZE: z.coerce.number().int().min(0).default(2),
  DB_SERVER_SELECTION_TIMEOUT_MS: z.coerce
    .number()
    .int()
    .positive()
    .default(8000),
  JWT_ACCESS_SECRET: z
    .string()
    .default('fitai-local-access-secret-change-this-in-production'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_SECRET: z
    .string()
    .default('fitai-local-refresh-secret-change-this-in-production'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  REFRESH_COOKIE_NAME: z.string().default('fitai_refresh_token'),
  ACCESS_COOKIE_NAME: z.string().default('fitai_access_token'),
  COOKIE_SECURE: booleanFromEnv.default(false),
  COOKIE_SAME_SITE: z.enum(['lax', 'strict', 'none']).default('lax'),
  PASSWORD_RESET_TOKEN_TTL_MINUTES: z.coerce
    .number()
    .int()
    .positive()
    .default(30),
  PASSWORD_RESET_URL: z
    .string()
    .default('http://localhost:5173/reset-password'),
  OAUTH_SUCCESS_REDIRECT: z
    .string()
    .default('http://localhost:5173/oauth/callback'),
  OAUTH_FAILURE_REDIRECT: z
    .string()
    .default('http://localhost:5173/login?oauth=failed'),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default('gpt-4.1-mini'),
  AI_MAX_HISTORY_MESSAGES: z.coerce.number().int().min(4).max(100).default(24),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CALLBACK_URL: z
    .string()
    .default('http://localhost:5000/api/auth/google/callback'),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  MAIL_FROM: z.string().default('no-reply@fitai.local'),
  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_CLIENT_EMAIL: z.string().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  SKIP_DB_CONNECTION: booleanFromEnv.default(false),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error(
    'Invalid environment configuration',
    parsed.error.flatten().fieldErrors,
  )
  throw new Error('Invalid environment configuration')
}

module.exports = {
  env: parsed.data,
}
