const AiChatSession = require('../../models/AiChatSession')
const asyncHandler = require('../../utils/asyncHandler')
const ApiError = require('../../utils/apiError')
const { generateAiCoachReply } = require('../../services/ai.service')
const {
  getUserRecommendationDigest,
} = require('../../services/recommendation.service')
const { env } = require('../../config/env')

const sendAiMessage = asyncHandler(async (req, res) => {
  const payload = req.validatedBody || req.body

  let session = null

  if (payload.sessionId) {
    session = await AiChatSession.findOne({
      _id: payload.sessionId,
      user: req.user._id,
    })

    if (!session) {
      throw new ApiError(404, 'AI chat session not found')
    }
  }

  if (!session) {
    session = await AiChatSession.create({
      user: req.user._id,
      title: payload.message.slice(0, 60),
      messages: [],
    })
  }

  const assistantReply = await generateAiCoachReply({
    userProfile: req.user,
    historyMessages: session.messages,
    message: payload.message,
  })

  session.messages.push(
    {
      role: 'user',
      content: payload.message,
      createdAt: new Date(),
    },
    {
      role: 'assistant',
      content: assistantReply,
      createdAt: new Date(),
    },
  )

  const maxHistoryMessages = Math.max(env.AI_MAX_HISTORY_MESSAGES, 4)

  if (session.messages.length > maxHistoryMessages) {
    session.messages = session.messages.slice(-maxHistoryMessages)
  }

  await session.save()

  res.status(200).json({
    success: true,
    data: {
      sessionId: session._id,
      assistantReply,
      messageCount: session.messages.length,
    },
  })
})

const listAiSessions = asyncHandler(async (req, res) => {
  const sessions = await AiChatSession.find({ user: req.user._id })
    .sort({ updatedAt: -1 })
    .select('title updatedAt createdAt')

  res.status(200).json({
    success: true,
    data: {
      sessions,
    },
  })
})

const getAiSessionMessages = asyncHandler(async (req, res) => {
  const { sessionId } = req.validatedParams || req.params

  const session = await AiChatSession.findOne({
    _id: sessionId,
    user: req.user._id,
  })

  if (!session) {
    throw new ApiError(404, 'AI chat session not found')
  }

  res.status(200).json({
    success: true,
    data: {
      session,
    },
  })
})

const deleteAiSession = asyncHandler(async (req, res) => {
  const { sessionId } = req.validatedParams || req.params

  const deletedSession = await AiChatSession.findOneAndDelete({
    _id: sessionId,
    user: req.user._id,
  })

  if (!deletedSession) {
    throw new ApiError(404, 'AI chat session not found')
  }

  res.status(200).json({
    success: true,
    message: 'AI chat session deleted',
  })
})

const getAiRecommendations = asyncHandler(async (req, res) => {
  const recommendations = await getUserRecommendationDigest(req.user._id)

  res.status(200).json({
    success: true,
    data: {
      recommendations,
    },
  })
})

module.exports = {
  sendAiMessage,
  listAiSessions,
  getAiSessionMessages,
  deleteAiSession,
  getAiRecommendations,
}
