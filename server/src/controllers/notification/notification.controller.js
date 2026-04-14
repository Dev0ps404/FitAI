const mongoose = require('mongoose')
const Notification = require('../../models/Notification')
const asyncHandler = require('../../utils/asyncHandler')
const ApiError = require('../../utils/apiError')
const { getPagination, getPaginationMeta } = require('../../utils/pagination')
const {
  createBulkNotifications,
} = require('../../services/notification.service')

const listMyNotifications = asyncHandler(async (req, res) => {
  const query = req.query
  const { currentPage, perPage, skip } = getPagination(query)

  const filter = {
    user: req.user._id,
  }

  if (query.isRead !== undefined) {
    filter.isRead = String(query.isRead) === 'true'
  }

  const [notifications, total] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(perPage),
    Notification.countDocuments(filter),
  ])

  res.status(200).json({
    success: true,
    data: {
      notifications,
      pagination: getPaginationMeta({
        total,
        currentPage,
        perPage,
      }),
    },
  })
})

const markNotificationAsRead = asyncHandler(async (req, res) => {
  const { notificationId } = req.params

  if (!mongoose.isValidObjectId(notificationId)) {
    throw new ApiError(400, 'Invalid notification id')
  }

  const notification = await Notification.findOne({
    _id: notificationId,
    user: req.user._id,
  })

  if (!notification) {
    throw new ApiError(404, 'Notification not found')
  }

  notification.isRead = true
  await notification.save()

  res.status(200).json({
    success: true,
    message: 'Notification marked as read',
    data: {
      notification,
    },
  })
})

const markAllNotificationsAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    {
      user: req.user._id,
      isRead: false,
    },
    {
      isRead: true,
    },
  )

  res.status(200).json({
    success: true,
    message: 'All notifications marked as read',
  })
})

const createAdminNotifications = asyncHandler(async (req, res) => {
  const payload = req.validatedBody || req.body

  const notifications = await createBulkNotifications({
    userIds: payload.userIds,
    type: payload.type,
    title: payload.title,
    message: payload.message,
    channel: payload.channel,
    io: req.app.get('io'),
  })

  res.status(201).json({
    success: true,
    message: 'Notifications created successfully',
    data: {
      count: notifications.length,
      notifications,
    },
  })
})

module.exports = {
  listMyNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  createAdminNotifications,
}
