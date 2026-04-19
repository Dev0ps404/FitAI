const Booking = require('../../models/Booking')
const Trainer = require('../../models/Trainer')
const asyncHandler = require('../../utils/asyncHandler')
const ApiError = require('../../utils/apiError')
const {
  USER_ROLES,
  TRAINER_APPROVAL_STATUS,
} = require('../../config/constants')
const { getPagination, getPaginationMeta } = require('../../utils/pagination')
const { isSameId } = require('../../utils/id')
const { createNotification } = require('../../services/notification.service')

const PROMO_DISCOUNT_RATES = Object.freeze({
  KINETIC10: 0.1,
  ELITE20: 0.2,
  FIRST15: 0.15,
})

function roundCurrency(value) {
  const amount = Number(value)

  if (!Number.isFinite(amount)) {
    return 0
  }

  return Number(amount.toFixed(2))
}

function buildPaymentSummary({ booking, paymentMethod, promoCode }) {
  const slotStart = new Date(booking.slotStart).getTime()
  const slotEnd = new Date(booking.slotEnd).getTime()
  const durationHours = Math.max((slotEnd - slotStart) / (1000 * 60 * 60), 1)
  const trainerRate = Math.max(Number(booking.trainer?.hourlyRate) || 0, 49.99)
  const subtotal = roundCurrency(durationHours * trainerRate)
  const normalizedPromo = promoCode || null
  const discountRate = normalizedPromo
    ? PROMO_DISCOUNT_RATES[normalizedPromo] || 0
    : 0
  const discount = roundCurrency(subtotal * discountRate)
  const taxableAmount = Math.max(0, subtotal - discount)
  const tax = roundCurrency(taxableAmount * 0.085)
  const processingFee = paymentMethod === 'wallet' ? 0 : 1.49
  const total = roundCurrency(taxableAmount + tax + processingFee)

  return {
    currency: 'USD',
    subtotal,
    discount,
    tax,
    processingFee,
    total,
    durationHours: roundCurrency(durationHours),
    paymentMethod,
    promoCode: normalizedPromo,
    status: 'paid',
  }
}

async function getTrainerProfileForRequestingUser(user) {
  if (user.role !== USER_ROLES.TRAINER) {
    return null
  }

  return Trainer.findOne({ user: user._id })
}

const createBooking = asyncHandler(async (req, res) => {
  const payload = req.validatedBody || req.body

  const trainerProfile = await Trainer.findById(payload.trainerId).populate(
    'user',
    'name email',
  )

  if (!trainerProfile) {
    throw new ApiError(404, 'Trainer profile not found')
  }

  if (trainerProfile.status !== TRAINER_APPROVAL_STATUS.APPROVED) {
    throw new ApiError(
      403,
      'Selected trainer is not currently available for booking',
    )
  }

  const overlappingBooking = await Booking.findOne({
    trainer: trainerProfile._id,
    status: { $in: ['pending', 'confirmed'] },
    slotStart: { $lt: payload.slotEnd },
    slotEnd: { $gt: payload.slotStart },
  })

  if (overlappingBooking) {
    throw new ApiError(409, 'Selected time slot is already booked')
  }

  const booking = await Booking.create({
    user: req.user._id,
    trainer: trainerProfile._id,
    slotStart: payload.slotStart,
    slotEnd: payload.slotEnd,
    notes: payload.notes || '',
  })

  await createNotification({
    userId: trainerProfile.user._id,
    type: 'booking',
    title: 'New Booking Request',
    message: `${req.user.name} requested a training session.`,
    io: req.app.get('io'),
    meta: {
      bookingId: booking._id,
    },
  })

  res.status(201).json({
    success: true,
    message: 'Booking request created successfully',
    data: {
      booking,
    },
  })
})

const listBookings = asyncHandler(async (req, res) => {
  const query = req.validatedQuery || req.query
  const { currentPage, perPage, skip } = getPagination(query)

  const filter = {}

  if (req.user.role === USER_ROLES.USER) {
    filter.user = req.user._id
  }

  if (req.user.role === USER_ROLES.TRAINER) {
    const trainerProfile = await getTrainerProfileForRequestingUser(req.user)

    if (!trainerProfile) {
      res.status(200).json({
        success: true,
        data: {
          bookings: [],
          pagination: getPaginationMeta({
            total: 0,
            currentPage,
            perPage,
          }),
        },
      })
      return
    }

    filter.trainer = trainerProfile._id
  }

  if (query.status) {
    filter.status = query.status
  }

  const [bookings, total] = await Promise.all([
    Booking.find(filter)
      .sort({ slotStart: -1, createdAt: -1 })
      .skip(skip)
      .limit(perPage)
      .populate('user', 'name email avatarUrl')
      .populate({
        path: 'trainer',
        populate: {
          path: 'user',
          select: 'name email avatarUrl',
        },
      }),
    Booking.countDocuments(filter),
  ])

  res.status(200).json({
    success: true,
    data: {
      bookings,
      pagination: getPaginationMeta({
        total,
        currentPage,
        perPage,
      }),
    },
  })
})

const updateBookingStatus = asyncHandler(async (req, res) => {
  const { bookingId } = req.validatedParams || req.params
  const payload = req.validatedBody || req.body

  const booking = await Booking.findById(bookingId).populate('trainer')

  if (!booking) {
    throw new ApiError(404, 'Booking not found')
  }

  if (req.user.role === USER_ROLES.TRAINER) {
    const trainerProfile = await Trainer.findOne({ user: req.user._id })

    if (!trainerProfile || !isSameId(trainerProfile._id, booking.trainer._id)) {
      throw new ApiError(403, 'You are not authorized to modify this booking')
    }
  }

  booking.status = payload.status

  if (payload.status === 'completed') {
    booking.paymentStatus =
      booking.paymentStatus === 'unpaid' ? 'paid' : booking.paymentStatus
  }

  await booking.save()

  await createNotification({
    userId: booking.user,
    type: 'booking',
    title: 'Booking Status Updated',
    message: `Your booking status has been updated to ${booking.status}.`,
    io: req.app.get('io'),
    meta: {
      bookingId: booking._id,
      status: booking.status,
    },
  })

  res.status(200).json({
    success: true,
    message: 'Booking status updated successfully',
    data: {
      booking,
    },
  })
})

const cancelBooking = asyncHandler(async (req, res) => {
  const { bookingId } = req.validatedParams || req.params

  const booking = await Booking.findById(bookingId)

  if (!booking) {
    throw new ApiError(404, 'Booking not found')
  }

  if (
    req.user.role === USER_ROLES.USER &&
    !isSameId(booking.user, req.user._id)
  ) {
    throw new ApiError(403, 'You are not authorized to cancel this booking')
  }

  if (req.user.role === USER_ROLES.TRAINER) {
    const trainerProfile = await Trainer.findOne({ user: req.user._id })

    if (!trainerProfile || !isSameId(trainerProfile._id, booking.trainer)) {
      throw new ApiError(403, 'You are not authorized to cancel this booking')
    }
  }

  booking.status = 'cancelled'
  await booking.save()

  res.status(200).json({
    success: true,
    message: 'Booking cancelled successfully',
    data: {
      booking,
    },
  })
})

const processBookingPayment = asyncHandler(async (req, res) => {
  const { bookingId } = req.validatedParams || req.params
  const payload = req.validatedBody || req.body

  const booking = await Booking.findById(bookingId).populate({
    path: 'trainer',
    populate: {
      path: 'user',
      select: 'name email',
    },
  })

  if (!booking) {
    throw new ApiError(404, 'Booking not found')
  }

  if (
    req.user.role === USER_ROLES.USER &&
    !isSameId(booking.user, req.user._id)
  ) {
    throw new ApiError(403, 'You are not authorized to pay this booking')
  }

  if (booking.status === 'cancelled') {
    throw new ApiError(409, 'Cannot process payment for cancelled booking')
  }

  const paymentSummary = buildPaymentSummary({
    booking,
    paymentMethod: payload.paymentMethod,
    promoCode: payload.promoCode,
  })

  const wasAlreadyPaid = booking.paymentStatus === 'paid'

  if (!wasAlreadyPaid) {
    booking.paymentStatus = 'paid'

    if (booking.status === 'pending') {
      booking.status = 'confirmed'
    }

    if (!booking.stripePaymentIntentId) {
      booking.stripePaymentIntentId = `sim_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
    }

    await booking.save()

    await createNotification({
      userId: booking.user,
      type: 'booking',
      title: 'Payment Confirmed',
      message: `Payment of $${paymentSummary.total.toFixed(2)} received for your session booking.`,
      io: req.app.get('io'),
      meta: {
        bookingId: booking._id,
        paymentStatus: booking.paymentStatus,
        amount: paymentSummary.total,
      },
    })

    if (booking.trainer?.user?._id) {
      await createNotification({
        userId: booking.trainer.user._id,
        type: 'booking',
        title: 'Client Payment Received',
        message: `${req.user.name} completed payment for an upcoming session.`,
        io: req.app.get('io'),
        meta: {
          bookingId: booking._id,
          paymentStatus: booking.paymentStatus,
          amount: paymentSummary.total,
        },
      })
    }
  }

  res.status(200).json({
    success: true,
    message:
      wasAlreadyPaid
        ? 'Booking is already paid'
        : 'Payment processed successfully',
    data: {
      booking,
      payment: paymentSummary,
    },
  })
})

module.exports = {
  createBooking,
  listBookings,
  updateBookingStatus,
  cancelBooking,
  processBookingPayment,
}
