const mongoose = require('mongoose')

const strengthMetricSchema = new mongoose.Schema(
  {
    exerciseName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    oneRepMaxKg: {
      type: Number,
      min: 0,
      max: 1000,
      default: 0,
    },
  },
  {
    _id: false,
  },
)

const progressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    date: {
      type: Date,
      default: Date.now,
      index: true,
    },
    weightKg: {
      type: Number,
      min: 20,
      max: 500,
    },
    bodyFatPercent: {
      type: Number,
      min: 0,
      max: 80,
    },
    caloriesBurned: {
      type: Number,
      min: 0,
      default: 0,
    },
    strengthMetrics: {
      type: [strengthMetricSchema],
      default: [],
    },
    measurements: {
      chestCm: {
        type: Number,
        min: 0,
      },
      waistCm: {
        type: Number,
        min: 0,
      },
      hipsCm: {
        type: Number,
        min: 0,
      },
      armCm: {
        type: Number,
        min: 0,
      },
      thighCm: {
        type: Number,
        min: 0,
      },
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

progressSchema.index({ user: 1, date: -1 })

module.exports =
  mongoose.models.Progress || mongoose.model('Progress', progressSchema)
