const mongoose = require('mongoose')
const { env } = require('./env')

async function connectToDatabase() {
  if (env.SKIP_DB_CONNECTION) {
    console.warn('[DB] SKIP_DB_CONNECTION=true, MongoDB connection skipped')
    return
  }

  mongoose.set('strictQuery', true)

  await mongoose.connect(env.MONGODB_URI, {
    maxPoolSize: 20,
    serverSelectionTimeoutMS: 8000,
  })

  console.info('[DB] MongoDB connected')
}

module.exports = {
  connectToDatabase,
}
