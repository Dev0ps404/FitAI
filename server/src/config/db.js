const mongoose = require('mongoose')
const { env } = require('./env')

async function connectToDatabase() {
  if (env.SKIP_DB_CONNECTION) {
    console.warn('[DB] SKIP_DB_CONNECTION=true, MongoDB connection skipped')
    return
  }

  mongoose.set('strictQuery', true)

  await mongoose.connect(env.MONGODB_URI, {
    maxPoolSize: env.DB_MAX_POOL_SIZE,
    minPoolSize: env.DB_MIN_POOL_SIZE,
    maxIdleTimeMS: 30_000,
    socketTimeoutMS: 45_000,
    serverSelectionTimeoutMS: env.DB_SERVER_SELECTION_TIMEOUT_MS,
  })

  console.info('[DB] MongoDB connected')
}

module.exports = {
  connectToDatabase,
}
