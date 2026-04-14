require('dotenv').config()

const http = require('node:http')
const app = require('./app')
const { connectToDatabase } = require('./config/db')
const { env } = require('./config/env')
const { initializeSocketServer } = require('./sockets')

async function bootstrap() {
  try {
    await connectToDatabase()

    const httpServer = http.createServer(app)
    const io = initializeSocketServer(httpServer, env.CLIENT_ORIGIN)
    app.set('io', io)

    httpServer.listen(env.PORT, () => {
      console.info(`[SERVER] FitAI backend listening on port ${env.PORT}`)
    })
  } catch (error) {
    console.error('[SERVER] Failed to bootstrap FitAI backend', error)
    process.exit(1)
  }
}

bootstrap()
