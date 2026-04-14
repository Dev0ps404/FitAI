const OpenAI = require('openai')
const { env } = require('../config/env')

const aiClient = env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: env.OPENAI_API_KEY })
  : null

const FITNESS_SYSTEM_PROMPT = `You are FitAI, an expert fitness and nutrition coach.
- Always prioritize user safety and injury prevention.
- Keep advice specific, practical, and step-based.
- Never provide medical diagnoses.
- If user mentions pain/injury, recommend consulting a licensed professional.
- Respect user goals and constraints from profile context.`

function getFallbackReply() {
  return 'AI coach is not fully configured yet. Please connect OPENAI_API_KEY in server environment to enable personalized responses.'
}

function mapHistoryMessages(historyMessages) {
  if (!Array.isArray(historyMessages)) {
    return []
  }

  return historyMessages
    .filter((message) => message?.role && message?.content)
    .slice(-12)
    .map((message) => ({
      role: message.role,
      content: message.content,
    }))
}

function createUserContextBlock(userProfile) {
  if (!userProfile) {
    return ''
  }

  return `\nUser Context:\n- Name: ${userProfile.name}\n- Goal Weight (kg): ${userProfile.goalWeightKg || 'unknown'}\n- Current Weight (kg): ${userProfile.currentWeightKg || 'unknown'}\n- Fitness Level: ${userProfile.fitnessLevel || 'unknown'}\n- Injury Notes: ${userProfile.preferences?.injuryNotes || 'none'}`
}

async function requestAiResponse(messages) {
  const response = await aiClient.responses.create({
    model: env.OPENAI_MODEL,
    input: messages,
    temperature: 0.4,
  })

  if (response.output_text) {
    return response.output_text
  }

  return (
    response.output
      ?.flatMap((item) => item.content || [])
      ?.map((content) => content.text)
      ?.filter(Boolean)
      ?.join('\n') || getFallbackReply()
  )
}

async function generateAiCoachReply({ userProfile, historyMessages, message }) {
  if (!aiClient) {
    return getFallbackReply()
  }

  const messages = [
    {
      role: 'system',
      content: `${FITNESS_SYSTEM_PROMPT}${createUserContextBlock(userProfile)}`,
    },
    ...mapHistoryMessages(historyMessages),
    {
      role: 'user',
      content: message,
    },
  ]

  try {
    return await requestAiResponse(messages)
  } catch {
    return getFallbackReply()
  }
}

async function generateAiDietPlan({ userProfile, objective }) {
  const prompt = `Create a 1-day diet plan for: ${objective}. Include breakfast/lunch/dinner/snack with rough calories and macros.`

  return generateAiCoachReply({
    userProfile,
    historyMessages: [],
    message: prompt,
  })
}

module.exports = {
  generateAiCoachReply,
  generateAiDietPlan,
}
