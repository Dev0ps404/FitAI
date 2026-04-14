const mongoose = require('mongoose')

const exerciseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
      index: true,
    },
    muscleGroup: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    equipment: {
      type: String,
      default: 'bodyweight',
      trim: true,
    },
    description: {
      type: String,
      default: '',
      maxlength: 500,
    },
    instructions: {
      type: [String],
      default: [],
    },
    defaultSets: {
      type: Number,
      min: 1,
      max: 20,
      default: 3,
    },
    defaultReps: {
      type: Number,
      min: 1,
      max: 50,
      default: 12,
    },
    caloriesPerMinute: {
      type: Number,
      min: 0,
      max: 100,
      default: 6,
    },
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner',
    },
    isPredefined: {
      type: Boolean,
      default: false,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  },
)

module.exports =
  mongoose.models.Exercise || mongoose.model('Exercise', exerciseSchema)
