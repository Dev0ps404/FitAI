const mongoose = require('mongoose')

const foodEntrySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    quantity: {
      type: Number,
      min: 0,
      default: 1,
    },
    unit: {
      type: String,
      default: 'serving',
      trim: true,
    },
    calories: {
      type: Number,
      min: 0,
      default: 0,
    },
    proteinG: {
      type: Number,
      min: 0,
      default: 0,
    },
    carbsG: {
      type: Number,
      min: 0,
      default: 0,
    },
    fatsG: {
      type: Number,
      min: 0,
      default: 0,
    },
  },
  {
    _id: false,
  },
)

const dietLogSchema = new mongoose.Schema(
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
    mealType: {
      type: String,
      enum: ['breakfast', 'lunch', 'dinner', 'snack'],
      required: true,
      index: true,
    },
    foods: {
      type: [foodEntrySchema],
      default: [],
    },
    totals: {
      calories: {
        type: Number,
        min: 0,
        default: 0,
      },
      proteinG: {
        type: Number,
        min: 0,
        default: 0,
      },
      carbsG: {
        type: Number,
        min: 0,
        default: 0,
      },
      fatsG: {
        type: Number,
        min: 0,
        default: 0,
      },
    },
    aiGenerated: {
      type: Boolean,
      default: false,
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

dietLogSchema.pre('validate', function calculateTotals(next) {
  if (!Array.isArray(this.foods)) {
    next()
    return
  }

  this.totals.calories = this.foods.reduce(
    (total, food) => total + (food.calories || 0),
    0,
  )
  this.totals.proteinG = this.foods.reduce(
    (total, food) => total + (food.proteinG || 0),
    0,
  )
  this.totals.carbsG = this.foods.reduce(
    (total, food) => total + (food.carbsG || 0),
    0,
  )
  this.totals.fatsG = this.foods.reduce(
    (total, food) => total + (food.fatsG || 0),
    0,
  )

  next()
})

dietLogSchema.index({ user: 1, date: -1, mealType: 1 })

module.exports =
  mongoose.models.DietLog || mongoose.model('DietLog', dietLogSchema)
