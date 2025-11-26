// OpenAI Client for AI Intervention Generation
import OpenAI from 'openai'
import { BigFiveScores } from './tipi'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export interface InterventionContext {
  userId: string
  currentMood: number
  energyLevel: 'low' | 'mid' | 'high'
  recentMoods: number[]
  freeText?: string
  personalityTraits?: BigFiveScores
}

export interface GeneratedIntervention {
  title: string
  body: string
  cta_text: string
  template_type: 'compassion' | 'reflection' | 'action'
}

/**
 * Generate personalized intervention using OpenAI
 */
export async function generatePersonalizedIntervention(
  context: InterventionContext
): Promise<GeneratedIntervention> {
  try {
    const { currentMood, energyLevel, recentMoods, freeText, personalityTraits } = context

    // Calculate mood trend
    const moodTrend = calculateMoodTrend(recentMoods)
    const averageMood = recentMoods.reduce((sum, mood) => sum + mood, 0) / recentMoods.length

    // Determine intervention type based on mood patterns
    const interventionType = determineInterventionType(averageMood, moodTrend)

    // Create personalized prompt
    const prompt = createInterventionPrompt({
      currentMood,
      energyLevel,
      averageMood,
      moodTrend,
      freeText,
      personalityTraits,
      interventionType
    })

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a compassionate mental health coach. Generate supportive, actionable advice based on user's mood data. 
          
          Guidelines:
          - Be empathetic and understanding
          - Provide specific, actionable suggestions
          - Keep messages concise but meaningful
          - Use encouraging, non-judgmental tone
          - Focus on practical steps the user can take
          
          Response format must be valid JSON:
          {
            "title": "Brief, encouraging title (max 50 chars)",
            "body": "Main message with specific advice (max 200 chars)",
            "cta_text": "Action button text (max 25 chars)"
          }`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 300,
    })

    const response = completion.choices[0]?.message?.content
    if (!response) {
      throw new Error('Empty response from OpenAI')
    }

    // Parse JSON response
    const parsed = JSON.parse(response)
    
    return {
      title: parsed.title,
      body: parsed.body,
      cta_text: parsed.cta_text,
      template_type: interventionType
    }

  } catch (error) {
    console.error('OpenAI intervention generation failed:', error)
    throw error
  }
}

/**
 * Create intervention prompt based on context
 */
function createInterventionPrompt(context: {
  currentMood: number
  energyLevel: string
  averageMood: number
  moodTrend: string
  freeText?: string
  personalityTraits?: BigFiveScores
  interventionType: 'compassion' | 'reflection' | 'action'
}): string {
  const { currentMood, energyLevel, averageMood, moodTrend, freeText, interventionType } = context

  let prompt = `User's current situation:
- Current mood: ${currentMood}/5
- Energy level: ${energyLevel}
- Recent mood average: ${averageMood.toFixed(1)}/5
- Mood trend: ${moodTrend}`

  if (freeText) {
    prompt += `\n- User's note: "${freeText}"`
  }

  prompt += `\n\nGenerate a ${interventionType} intervention:`

  switch (interventionType) {
    case 'compassion':
      prompt += `
- Focus on self-compassion and emotional support
- Acknowledge their feelings without judgment
- Suggest gentle self-care activities`
      break
    case 'reflection':
      prompt += `
- Encourage thoughtful self-reflection
- Ask gentle questions to promote insight
- Help them understand their patterns`
      break
    case 'action':
      prompt += `
- Provide specific, actionable steps
- Focus on practical solutions
- Encourage positive behavioral changes`
      break
  }

  return prompt
}

/**
 * Calculate mood trend from recent moods
 */
function calculateMoodTrend(recentMoods: number[]): string {
  if (recentMoods.length < 3) return 'stable'

  const recent = recentMoods.slice(0, Math.floor(recentMoods.length / 2))
  const older = recentMoods.slice(Math.floor(recentMoods.length / 2))

  const recentAvg = recent.reduce((sum, mood) => sum + mood, 0) / recent.length
  const olderAvg = older.reduce((sum, mood) => sum + mood, 0) / older.length

  const difference = recentAvg - olderAvg

  if (difference > 0.3) return 'improving'
  if (difference < -0.3) return 'declining'
  return 'stable'
}

/**
 * Determine intervention type based on mood data
 */
function determineInterventionType(averageMood: number, moodTrend: string): 'compassion' | 'reflection' | 'action' {
  // Low mood needs compassion
  if (averageMood <= 2.5) return 'compassion'
  
  // Declining trend needs reflection
  if (moodTrend === 'declining') return 'reflection'
  
  // Stable or improving mood can handle action-oriented advice
  return 'action'
}

/**
 * Fallback intervention templates when OpenAI fails
 */
export const fallbackInterventions = {
  compassion: {
    title: "You're doing great",
    body: "It's okay to have tough days. Remember to be kind to yourself and take things one step at a time.",
    cta_text: "Self-care tips"
  },
  reflection: {
    title: "Take a moment",
    body: "What's one small thing that brought you joy recently? Sometimes reflecting on positives can shift our perspective.",
    cta_text: "Reflect more"
  },
  action: {
    title: "Small steps forward",
    body: "Try taking a 5-minute walk or doing one thing you've been putting off. Small actions can create positive momentum.",
    cta_text: "Take action"
  }
}

/**
 * Generate intervention with OpenAI fallback
 */
export async function generateInterventionWithFallback(
  context: InterventionContext
): Promise<{ intervention: GeneratedIntervention; fallback: boolean }> {
  try {
    // Try OpenAI first
    const intervention = await generatePersonalizedIntervention(context)
    return { intervention, fallback: false }
  } catch (error) {
    console.warn('OpenAI generation failed, using fallback:', error)
    
    // Use fallback template
    const averageMood = context.recentMoods.reduce((sum, mood) => sum + mood, 0) / context.recentMoods.length
    const moodTrend = calculateMoodTrend(context.recentMoods)
    const interventionType = determineInterventionType(averageMood, moodTrend)
    
    const fallback = fallbackInterventions[interventionType]
    
    return {
      intervention: {
        ...fallback,
        template_type: interventionType
      },
      fallback: true
    }
  }
}