const mongoose = require('mongoose')
const { WORKOUT_STATUS_LIST } = require('../config/constants')

const workoutExerciseSchema = new mongoose.Schema(
  {
    exercise: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exercise',
      default: null,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    sets: {
      type: Number,
      min: 0,
      max: 30,
      default: 3,
    },
    reps: {
      type: Number,
      min: 0,
      max: 100,
      default: 10,
    },
    weightKg: {
      type: Number,
      min: 0,
      max: 1000,
      default: 0,
    },
    durationMin: {
      type: Number,
      min: 0,
      max: 600,
      default: 0,
    },
    caloriesBurned: {
      type: Number,
      min: 0,
      max: 5000,
      default: 0,
    },
    notes: {
      type: String,
      default: '',
      maxlength: 280,
    },
  },
  {
    _id: false,
  },
)

const workoutSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    trainer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 140,
    },
    date: {
      type: Date,
      default: Date.now,
      index: true,
    },
    exercises: {
      type: [workoutExerciseSchema],
      default: [],
    },
    durationMin: {
      type: Number,
      min: 0,
      max: 600,
      default: 0,
    },
    totalCaloriesBurned: {
      type: Number,
      min: 0,
      default: 0,
    },
    status: {
      type: String,
      enum: WORKOUT_STATUS_LIST,
      default: 'planned',
      index: true,
    },
    planSource: {
      type: String,
      enum: ['custom', 'predefined', 'trainer', 'ai'],
      default: 'custom',
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

workoutSchema.pre('save', function syncWorkoutTotals(next) {
  if (!Array.isArray(this.exercises) || this.exercises.length === 0) {
    next()
    return
  }

  this.durationMin = this.exercises.reduce(
    (total, exercise) => total + (exercise.durationMin || 0),
    0,
  )
  this.totalCaloriesBurned = this.exercises.reduce(
    (total, exercise) => total + (exercise.caloriesBurned || 0),
    0,
  )

  next()
})

workoutSchema.index({ user: 1, date: -1 })
workoutSchema.index({ trainer: 1, date: -1 })

module.exports =
  mongoose.models.Workout || mongoose.model('Workout', workoutSchema)
