const cors = require('cors')
const cookieParser = require('cookie-parser')
const express = require('express')
const helmet = require('helmet')
const morgan = require('morgan')
const { passport, configurePassport } = require('./config/passport')
const { rateLimit } = require('express-rate-limit')
const { env } = require('./config/env')
const { errorHandler } = require('./middlewares/errorHandler')
const { notFound } = require('./middlewares/notFound')
const apiRouter = require('./routes')

const app = express()

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
})

configurePassport()

app.disable('x-powered-by')
app.set('trust proxy', 1)

app.use(helmet())
app.use(
  cors({
    origin: env.CLIENT_ORIGIN,
    credentials: true,
  }),
)
app.use(morgan(env.NODE_ENV === 'development' ? 'dev' : 'combined'))
app.use(express.json({ limit: '2mb' }))
app.use(express.urlencoded({ extended: true, limit: '2mb' }))
app.use(cookieParser())
app.use(passport.initialize())
app.use('/api', apiLimiter, apiRouter)

app.get('/', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'FitAI backend is running',
    docs: '/api/health',
  })
})

app.use(notFound)
app.use(errorHandler)

module.exports = app
