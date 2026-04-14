const admin = require('firebase-admin')
const { env } = require('../config/env')

let firebaseInitialized = false

function initializeFirebase() {
  if (firebaseInitialized) {
    return true
  }

  if (
    !env.FIREBASE_PROJECT_ID ||
    !env.FIREBASE_CLIENT_EMAIL ||
    !env.FIREBASE_PRIVATE_KEY
  ) {
    return false
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: env.FIREBASE_PROJECT_ID,
      clientEmail: env.FIREBASE_CLIENT_EMAIL,
      privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  })

  firebaseInitialized = true
  return true
}

async function sendPushNotification({ token, title, body, data }) {
  if (!token) {
    return {
      sent: false,
      reason: 'missing_push_token',
    }
  }

  if (!initializeFirebase()) {
    return {
      sent: false,
      reason: 'firebase_not_configured',
    }
  }

  try {
    await admin.messaging().send({
      token,
      notification: {
        title,
        body,
      },
      data: Object.entries(data || {}).reduce((accumulator, [key, value]) => {
        accumulator[key] = String(value)
        return accumulator
      }, {}),
    })

    return {
      sent: true,
    }
  } catch (error) {
    return {
      sent: false,
      reason: error.message,
    }
  }
}

module.exports = {
  initializeFirebase,
  sendPushNotification,
}
