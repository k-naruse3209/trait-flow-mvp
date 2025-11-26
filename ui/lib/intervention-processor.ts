// Intervention Processing Logic
// Handles the complete flow from check-in to intervention generation

import { 
  InterventionTemplate, 
  InterventionMessage, 
  InterventionContext,
  selectInterventionTemplate,
  generateFallbackMessage,
  enhanceMessageWithPersonality,
  generateAIPrompt,
  validateInterventionMessage
} from './intervention-templates'
import { BigFiveScores } from './tipi'
import { CheckinRecord, generateMoodAnalytics } from './mood-analytics'
import { generateInterventionWithFallback, InterventionContext as OpenAIContext } from './openai-client'

export interface ProcessInterventionParams {
  userId: string
  checkinId: string
  recentCheckins: CheckinRecord[]
  personalityTraits?: BigFiveScores
  currentCheckin: {
    moodScore: number
    energyLevel: 'low' | 'mid' | 'high'
    freeText?: string
  }
}

export interface InterventionResult {
  template: InterventionTemplate
  message: InterventionMessage
  fallback: boolean
  context: InterventionContext
}

/**
 * Process intervention generation for a check-in (synchronous fallback)
 * @param params Processing parameters
 * @returns Intervention result
 */
export function processIntervention(params: ProcessInterventionParams): InterventionResult {
  const { recentCheckins, personalityTraits, currentCheckin } = params

  // Generate mood analytics
  const analytics = generateMoodAnalytics(recentCheckins)

  // Create intervention context
  const context: InterventionContext = {
    moodAverage: analytics.averageMood,
    moodTrend: analytics.moodTrend,
    energyLevel: currentCheckin.energyLevel,
    freeText: currentCheckin.freeText,
    personalityTraits,
    recentCheckins: recentCheckins.length,
    streakDays: analytics.streakDays
  }

  // Select template based on mood
  const template = selectInterventionTemplate(analytics.averageMood)

  // Generate fallback message (always available)
  let message = generateFallbackMessage(template, context)

  // Enhance with personality insights if available
  if (personalityTraits) {
    message = enhanceMessageWithPersonality(message, personalityTraits, template)
  }

  return {
    template,
    message,
    fallback: true, // Will be set to false when AI generation is implemented
    context
  }
}

/**
 * Process intervention with OpenAI integration (async)
 * @param params Processing parameters
 * @returns Promise<Intervention result>
 */
export async function processInterventionWithAI(params: ProcessInterventionParams): Promise<InterventionResult> {
  const { recentCheckins, personalityTraits, currentCheckin } = params

  // Generate mood analytics
  const analytics = generateMoodAnalytics(recentCheckins)

  // Create OpenAI context
  const openaiContext: OpenAIContext = {
    userId: params.userId,
    currentMood: currentCheckin.moodScore,
    energyLevel: currentCheckin.energyLevel,
    recentMoods: recentCheckins.map(c => c.mood_score),
    freeText: currentCheckin.freeText,
    personalityTraits
  }

  try {
    // Try OpenAI generation first
    const { intervention, fallback } = await generateInterventionWithFallback(openaiContext)

    // Create intervention context for compatibility
    const context: InterventionContext = {
      moodAverage: analytics.averageMood,
      moodTrend: analytics.moodTrend,
      energyLevel: currentCheckin.energyLevel,
      freeText: currentCheckin.freeText,
      personalityTraits,
      recentCheckins: recentCheckins.length,
      streakDays: analytics.streakDays
    }

    return {
      template: intervention.template_type,
      message: {
        title: intervention.title,
        body: intervention.body,
        cta_text: intervention.cta_text
      },
      fallback,
      context
    }
  } catch (error) {
    console.error('AI intervention processing failed, using fallback:', error)
    // Fall back to synchronous processing
    return processIntervention(params)
  }
}

/**
 * Generate AI prompt for intervention
 * @param params Processing parameters
 * @returns AI prompt string
 */
export function generateInterventionPrompt(params: ProcessInterventionParams): string {
  const { recentCheckins, personalityTraits, currentCheckin } = params

  const analytics = generateMoodAnalytics(recentCheckins)
  const template = selectInterventionTemplate(analytics.averageMood)

  const context: InterventionContext = {
    moodAverage: analytics.averageMood,
    moodTrend: analytics.moodTrend,
    energyLevel: currentCheckin.energyLevel,
    freeText: currentCheckin.freeText,
    personalityTraits,
    recentCheckins: recentCheckins.length,
    streakDays: analytics.streakDays
  }

  return generateAIPrompt(template, context)
}

/**
 * Parse and validate AI response
 * @param aiResponse Raw AI response
 * @param fallbackMessage Fallback message to use if parsing fails
 * @returns Validated intervention message
 */
export function parseAIResponse(
  aiResponse: string, 
  fallbackMessage: InterventionMessage
): { message: InterventionMessage; success: boolean } {
  try {
    // Try to parse JSON response
    const parsed = JSON.parse(aiResponse.trim())
    
    if (validateInterventionMessage(parsed)) {
      return { message: parsed, success: true }
    } else {
      console.warn('AI response validation failed:', parsed)
      return { message: fallbackMessage, success: false }
    }
  } catch (error) {
    console.warn('Failed to parse AI response:', error)
    return { message: fallbackMessage, success: false }
  }
}

/**
 * Determine if intervention should be generated
 * @param recentCheckins Recent check-ins
 * @param lastInterventionTime Last intervention timestamp
 * @returns Whether to generate intervention
 */
export function shouldGenerateIntervention(
  recentCheckins: CheckinRecord[],
  lastInterventionTime?: string
): boolean {
  // Don't generate if no check-ins
  if (!recentCheckins || recentCheckins.length === 0) {
    return false
  }

  // Don't generate intervention more than once per day
  if (lastInterventionTime) {
    const lastIntervention = new Date(lastInterventionTime)
    const today = new Date()
    
    if (lastIntervention.toDateString() === today.toDateString()) {
      return false
    }
  }

  // Generate intervention for engaged users (3+ check-ins)
  if (recentCheckins.length >= 3) {
    return true
  }

  // Generate intervention for users with concerning mood patterns
  const analytics = generateMoodAnalytics(recentCheckins)
  
  if (analytics.averageMood <= 2) {
    return true // Very low mood
  }

  if (analytics.moodTrend === 'declining' && analytics.averageMood <= 3) {
    return true // Declining trend with low mood
  }

  return false
}

/**
 * Calculate intervention priority
 * @param context Intervention context
 * @returns Priority score (higher = more urgent)
 */
export function calculateInterventionPriority(context: InterventionContext): number {
  let priority = 0

  // Mood-based priority
  if (context.moodAverage <= 2) {
    priority += 10 // Very low mood is high priority
  } else if (context.moodAverage <= 2.5) {
    priority += 7
  } else if (context.moodAverage <= 3) {
    priority += 4
  }

  // Trend-based priority
  if (context.moodTrend === 'declining') {
    priority += 5
  } else if (context.moodTrend === 'improving') {
    priority += 2 // Still worth encouraging
  }

  // Engagement-based priority
  if (context.recentCheckins >= 7) {
    priority += 3 // Highly engaged users
  } else if (context.recentCheckins >= 3) {
    priority += 2
  }

  // Streak-based priority
  if (context.streakDays >= 7) {
    priority += 2 // Reward consistency
  }

  // Energy-based adjustments
  if (context.energyLevel === 'low' && context.moodAverage <= 3) {
    priority += 3 // Low energy + low mood
  }

  return priority
}