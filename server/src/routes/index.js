const { Router } = require('express')
const healthRouter = require('./health.routes')

const apiRouter = Router()

apiRouter.use('/health', healthRouter)

module.exports = apiRouter
