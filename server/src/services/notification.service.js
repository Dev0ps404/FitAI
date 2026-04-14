const Notification = require('../models/Notification')
const User = require('../models/User')
const { sendEmail } = require('./email.service')
const { sendPushNotification } = require('./firebase.service')

async function createNotification({
  userId,
  type,
  title,
  message,
  channel = 'in_app',
  io,
  meta,
}) {
  const notification = await Notification.create({
    user: userId,
    type,
    title,
    message,
    channel,
    sentAt: new Date(),
    meta: meta || {},
  })

  if (io) {
    io.to(`user:${String(userId)}`).emit('fitai:notification', {
      id: notification._id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      createdAt: notification.createdAt,
      meta: notification.meta,
    })
  }

  if (channel === 'email' || channel === 'push') {
    const user = await User.findById(userId)

    if (channel === 'email' && user?.email) {
      await sendEmail({
        to: user.email,
        subject: `FitAI: ${title}`,
        text: message,
      })
    }

    if (channel === 'push' && Array.isArray(user?.pushTokens)) {
      await Promise.all(
        user.pushTokens.map((token) =>
          sendPushNotification({
            token,
            title,
            body: message,
            data: meta,
          }),
        ),
      )
    }
  }

  return notification
}

async function createBulkNotifications({
  userIds,
  type,
  title,
  message,
  channel,
  io,
  meta,
}) {
  return Promise.all(
    userIds.map((userId) =>
      createNotification({
        userId,
        type,
        title,
        message,
        channel,
        io,
        meta,
      }),
    ),
  )
}

module.exports = {
  createNotification,
  createBulkNotifications,
}
