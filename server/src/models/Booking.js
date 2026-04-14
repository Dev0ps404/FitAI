const mongoose = require('mongoose')
const { BOOKING_STATUS_LIST } = require('../config/constants')

const bookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    trainer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trainer',
      required: true,
      index: true,
    },
    slotStart: {
      type: Date,
      required: true,
      index: true,
    },
    slotEnd: {
      type: Date,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: BOOKING_STATUS_LIST,
      default: 'pending',
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'paid', 'refunded'],
      default: 'unpaid',
      index: true,
    },
    stripePaymentIntentId: {
      type: String,
      default: null,
      index: true,
    },
    notes: {
      type: String,
      default: '',
      maxlength: 400,
    },
  },
  {
    timestamps: true,
  },
)

bookingSchema.index(
  {
    trainer: 1,
    slotStart: 1,
    slotEnd: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      status: {
        $in: ['pending', 'confirmed'],
      },
    },
  },
)

module.exports =
  mongoose.models.Booking || mongoose.model('Booking', bookingSchema)
