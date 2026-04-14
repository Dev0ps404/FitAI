const mongoose = require('mongoose')

const aiChatMessageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ['system', 'user', 'assistant'],
      required: true,
    },
    content: {
      type: String,
      required: true,
      maxlength: 4000,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: false,
  },
)

const aiChatSessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      default: 'AI Fitness Session',
      maxlength: 120,
    },
    messages: {
      type: [aiChatMessageSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  },
)

aiChatSessionSchema.index({ user: 1, updatedAt: -1 })

module.exports =
  mongoose.models.AiChatSession ||
  mongoose.model('AiChatSession', aiChatSessionSchema)
