const mongoose = require('mongoose')
const {
  TRAINER_APPROVAL_STATUS,
  TRAINER_APPROVAL_STATUS_LIST,
} = require('../config/constants')

const availabilitySlotSchema = new mongoose.Schema(
  {
    dayOfWeek: {
      type: Number,
      min: 0,
      max: 6,
      required: true,
    },
    startTime: {
      type: String,
      required: true,
    },
    endTime: {
      type: String,
      required: true,
    },
  },
  {
    _id: false,
  },
)

const trainerSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    bio: {
      type: String,
      default: '',
      maxlength: 1000,
    },
    specializations: {
      type: [String],
      default: [],
    },
    certifications: {
      type: [String],
      default: [],
    },
    yearsOfExperience: {
      type: Number,
      min: 0,
      max: 70,
      default: 0,
    },
    hourlyRate: {
      type: Number,
      min: 0,
      default: 0,
    },
    ratingAvg: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
      index: true,
    },
    ratingCount: {
      type: Number,
      min: 0,
      default: 0,
    },
    availableSlots: {
      type: [availabilitySlotSchema],
      default: [],
    },
    location: {
      type: String,
      default: '',
      maxlength: 140,
    },
    languages: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: TRAINER_APPROVAL_STATUS_LIST,
      default: TRAINER_APPROVAL_STATUS.PENDING,
      index: true,
    },
    rejectionReason: {
      type: String,
      default: null,
      maxlength: 400,
    },
  },
  {
    timestamps: true,
  },
)

trainerSchema.index({ status: 1, ratingAvg: -1, createdAt: -1 })

module.exports =
  mongoose.models.Trainer || mongoose.model('Trainer', trainerSchema)
