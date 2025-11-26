// AI Intervention Template System
// Templates are selected based on mood averages and personality traits

import { BigFiveScores } from './tipi'

export type InterventionTemplate = 'compassion' | 'reflection' | 'action'

export interface InterventionMessage {
  title: string
  body: string
  cta_text: string
}

export interface InterventionContext {
  moodAverage: number
  moodTrend: 'improving' | 'declining' | 'stable'
  energyLevel: 'low' | 'mid' | 'high'
  freeText?: string
  personalityTraits?: BigFiveScores
  recentCheckins: number
  streakDays: number
}

/**
 * Determine intervention template based on mood average
 * @param moodAverage Average mood score (1-5)
 * @returns Template type
 */
export function selectInterventionTemplate(moodAverage: number): InterventionTemplate {
  if (moodAverage <= 2.5) {
    return 'compassion' // Low mood - need support and compassion
  } else if (moodAverage <= 3.5) {
    return 'reflection' // Neutral mood - encourage reflection
  } else {
    return 'action' // Good mood - encourage action and growth
  }
}

/**
 * Generate fallback intervention message when AI is unavailable
 * @param template Template type
 * @param context Intervention context
 * @returns Fallback message
 */
export function generateFallbackMessage(
  template: InterventionTemplate,
  context: InterventionContext
): InterventionMessage {
  const { moodAverage, moodTrend, energyLevel, streakDays } = context

  switch (template) {
    case 'compassion':
      return {
        title: "You're Not Alone 💙",
        body: `I notice you've been having a tough time lately. Remember that difficult feelings are temporary, and it's okay to not be okay sometimes. ${
          streakDays > 0 
            ? `Your ${streakDays}-day check-in streak shows your commitment to self-care.` 
            : 'Taking time to check in with yourself is already a positive step.'
        } Consider reaching out to someone you trust or doing something small that brings you comfort.`,
        cta_text: "Take a Deep Breath"
      }

    case 'reflection':
      return {
        title: moodTrend === 'improving' ? "Building Momentum 🌱" : "Time to Reflect 🤔",
        body: `Your mood has been ${moodTrend === 'stable' ? 'steady' : moodTrend} recently. ${
          moodTrend === 'improving' 
            ? "That's wonderful progress! What's been working well for you?" 
            : "This is a good time to pause and reflect on what might help you feel more balanced."
        } ${
          energyLevel === 'low' 
            ? "Your energy seems low - consider what activities or practices might help restore it."
            : "Use this energy to explore what's most important to you right now."
        }`,
        cta_text: "Reflect & Plan"
      }

    case 'action':
      return {
        title: "Riding the Wave 🌊",
        body: `You're feeling good with a mood average of ${moodAverage.toFixed(1)}! ${
          moodTrend === 'improving' ? "And things are looking up - great momentum!" : ""
        } This is an excellent time to ${
          energyLevel === 'high' 
            ? 'channel that high energy into something meaningful'
            : 'take purposeful action toward your goals'
        }. ${
          streakDays >= 7 
            ? `Your ${streakDays}-day streak shows real dedication!` 
            : 'Keep building on this positive foundation.'
        }`,
        cta_text: "Take Action"
      }

    default:
      return {
        title: "Keep Going 🌟",
        body: "Thank you for checking in with yourself today. Self-awareness is the first step toward positive change.",
        cta_text: "Continue Journey"
      }
  }
}

/**
 * Enhance fallback message with personality insights
 * @param message Base message
 * @param traits Personality traits (if available)
 * @param template Template type
 * @returns Enhanced message
 */
export function enhanceMessageWithPersonality(
  message: InterventionMessage,
  traits: BigFiveScores | undefined,
  template: InterventionTemplate
): InterventionMessage {
  if (!traits) return message

  // Convert p01 scores to percentiles for easier interpretation
  const percentiles = {
    extraversion: Math.round(traits.extraversion * 100),
    agreeableness: Math.round(traits.agreeableness * 100),
    conscientiousness: Math.round(traits.conscientiousness * 100),
    neuroticism: Math.round(traits.neuroticism * 100),
    openness: Math.round(traits.openness * 100)
  }

  let personalityInsight = ""

  switch (template) {
    case 'compassion':
      if (percentiles.neuroticism > 70) {
        personalityInsight = " As someone who feels emotions deeply, remember that your sensitivity is also a strength."
      } else if (percentiles.agreeableness > 70) {
        personalityInsight = " Your caring nature means you might put others first - don't forget to be kind to yourself too."
      } else if (percentiles.conscientiousness > 70) {
        personalityInsight = " I know you hold yourself to high standards. Sometimes it's okay to ease up on yourself."
      }
      break

    case 'reflection':
      if (percentiles.openness > 70) {
        personalityInsight = " Your openness to new experiences could help you discover fresh perspectives on your current situation."
      } else if (percentiles.conscientiousness > 70) {
        personalityInsight = " Your organized nature is an asset - consider creating a structured plan for moving forward."
      } else if (percentiles.extraversion < 30) {
        personalityInsight = " Taking quiet time for introspection aligns well with your reflective nature."
      }
      break

    case 'action':
      if (percentiles.extraversion > 70) {
        personalityInsight = " Your outgoing energy is perfect for connecting with others or trying new social activities."
      } else if (percentiles.conscientiousness > 70) {
        personalityInsight = " Your disciplined approach means you're likely to follow through on whatever you decide to pursue."
      } else if (percentiles.openness > 70) {
        personalityInsight = " This might be a great time to explore that creative project or new interest you've been considering."
      }
      break
  }

  if (personalityInsight) {
    return {
      ...message,
      body: message.body + personalityInsight
    }
  }

  return message
}

/**
 * Generate intervention prompt for AI based on context
 * @param template Template type
 * @param context Intervention context
 * @returns AI prompt string
 */
export function generateAIPrompt(
  template: InterventionTemplate,
  context: InterventionContext
): string {
  const { moodAverage, moodTrend, energyLevel, freeText, personalityTraits, recentCheckins, streakDays } = context

  const basePrompt = `Generate a personalized coaching message for someone with the following context:

Mood Information:
- Average mood: ${moodAverage}/5 (${moodAverage <= 2 ? 'low' : moodAverage <= 3.5 ? 'neutral' : 'good'})
- Mood trend: ${moodTrend}
- Energy level: ${energyLevel}
- Recent check-ins: ${recentCheckins}
- Check-in streak: ${streakDays} days

${freeText ? `Recent thoughts: "${freeText}"` : ''}

${personalityTraits ? `Personality traits (0-1 scale):
- Extraversion: ${personalityTraits.extraversion.toFixed(2)}
- Agreeableness: ${personalityTraits.agreeableness.toFixed(2)}
- Conscientiousness: ${personalityTraits.conscientiousness.toFixed(2)}
- Neuroticism: ${personalityTraits.neuroticism.toFixed(2)}
- Openness: ${personalityTraits.openness.toFixed(2)}` : ''}

Template: ${template.toUpperCase()}

Instructions:
`

  switch (template) {
    case 'compassion':
      return basePrompt + `Create a compassionate, supportive message that:
- Validates their current emotional state
- Offers gentle encouragement without toxic positivity
- Suggests small, manageable self-care actions
- Reminds them that difficult feelings are temporary
- Uses warm, empathetic language
- Keeps the tone soft and understanding

Format as JSON: {"title": "...", "body": "...", "cta_text": "..."}`

    case 'reflection':
      return basePrompt + `Create a thoughtful, reflective message that:
- Encourages self-awareness and introspection
- Asks gentle questions to promote insight
- Suggests journaling or mindfulness practices
- Helps them identify patterns or triggers
- Uses curious, non-judgmental language
- Promotes growth through understanding

Format as JSON: {"title": "...", "body": "...", "cta_text": "..."}`

    case 'action':
      return basePrompt + `Create an energizing, action-oriented message that:
- Celebrates their positive mood state
- Suggests concrete, achievable actions
- Encourages goal-setting or skill-building
- Motivates them to build on their momentum
- Uses upbeat, encouraging language
- Focuses on growth and forward movement

Format as JSON: {"title": "...", "body": "...", "cta_text": "..."}`

    default:
      return basePrompt + `Create a balanced, supportive message that encourages continued self-reflection and growth.

Format as JSON: {"title": "...", "body": "...", "cta_text": "..."}`
  }
}

/**
 * Validate intervention message format
 * @param message Message to validate
 * @returns Validation result
 */
export function validateInterventionMessage(message: unknown): message is InterventionMessage {
  if (typeof message !== 'object' || message === null) {
    return false
  }

  const msg = message as Record<string, unknown>
  
  return (
    typeof msg.title === 'string' &&
    typeof msg.body === 'string' &&
    typeof msg.cta_text === 'string' &&
    msg.title.length > 0 &&
    msg.title.length <= 100 &&
    msg.body.length > 0 &&
    msg.body.length <= 500 &&
    msg.cta_text.length > 0 &&
    msg.cta_text.length <= 50
  )
}