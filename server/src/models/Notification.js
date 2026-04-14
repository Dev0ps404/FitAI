const mongoose = require('mongoose')

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        'workout_reminder',
        'water_reminder',
        'goal_alert',
        'booking',
        'diet',
        'ai',
        'system',
      ],
      default: 'system',
      index: true,
    },
    title: {
      type: String,
      required: true,
      maxlength: 160,
    },
    message: {
      type: String,
      required: true,
      maxlength: 500,
    },
    channel: {
      type: String,
      enum: ['in_app', 'push', 'email'],
      default: 'in_app',
      index: true,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    scheduledFor: {
      type: Date,
      default: null,
      index: true,
    },
    sentAt: {
      type: Date,
      default: null,
      index: true,
    },
    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  },
)

notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 })

module.exports =
  mongoose.models.Notification ||
  mongoose.model('Notification', notificationSchema)
