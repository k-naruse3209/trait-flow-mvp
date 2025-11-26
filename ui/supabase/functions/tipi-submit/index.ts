import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// TIPI Types
interface TipiQuestion {
  id: number
  text: string
  trait: 'extraversion' | 'agreeableness' | 'conscientiousness' | 'neuroticism' | 'openness'
  reverse: boolean
}

interface TipiResponse {
  questionId: number
  score: number
}

interface BigFiveScores {
  extraversion: number
  agreeableness: number
  conscientiousness: number
  neuroticism: number
  openness: number
}

// TIPI Questions (same as frontend)
const TIPI_QUESTIONS: TipiQuestion[] = [
  { id: 1, text: "Extraverted, enthusiastic", trait: "extraversion", reverse: false },
  { id: 2, text: "Critical, quarrelsome", trait: "agreeableness", reverse: true },
  { id: 3, text: "Dependable, self-disciplined", trait: "conscientiousness", reverse: false },
  { id: 4, text: "Anxious, easily upset", trait: "neuroticism", reverse: false },
  { id: 5, text: "Open to new experiences, complex", trait: "openness", reverse: false },
  { id: 6, text: "Reserved, quiet", trait: "extraversion", reverse: true },
  { id: 7, text: "Sympathetic, warm", trait: "agreeableness", reverse: false },
  { id: 8, text: "Disorganized, careless", trait: "conscientiousness", reverse: true },
  { id: 9, text: "Calm, emotionally stable", trait: "neuroticism", reverse: true },
  { id: 10, text: "Conventional, uncreative", trait: "openness", reverse: true }
]

// TIPI Scoring Functions
function calculateTipiScores(responses: TipiResponse[]): BigFiveScores {
  if (responses.length !== 10) {
    throw new Error('TIPI requires exactly 10 responses')
  }

  const traitScores: Record<string, number[]> = {
    extraversion: [],
    agreeableness: [],
    conscientiousness: [],
    neuroticism: [],
    openness: []
  }

  responses.forEach(response => {
    const question = TIPI_QUESTIONS.find(q => q.id === response.questionId)
    if (!question) {
      throw new Error(`Invalid question ID: ${response.questionId}`)
    }

    let score = response.score
    if (question.reverse) {
      score = 8 - score
    }

    traitScores[question.trait].push(score)
  })

  return {
    extraversion: traitScores.extraversion.reduce((a, b) => a + b, 0) / 2,
    agreeableness: traitScores.agreeableness.reduce((a, b) => a + b, 0) / 2,
    conscientiousness: traitScores.conscientiousness.reduce((a, b) => a + b, 0) / 2,
    neuroticism: traitScores.neuroticism.reduce((a, b) => a + b, 0) / 2,
    openness: traitScores.openness.reduce((a, b) => a + b, 0) / 2
  }
}

function convertToP01Scale(scores: BigFiveScores): BigFiveScores {
  return {
    extraversion: (scores.extraversion - 1) / 6,
    agreeableness: (scores.agreeableness - 1) / 6,
    conscientiousness: (scores.conscientiousness - 1) / 6,
    neuroticism: (scores.neuroticism - 1) / 6,
    openness: (scores.openness - 1) / 6
  }
}

function convertToTScores(scores: BigFiveScores): BigFiveScores {
  const mean = 4
  const std = 1.5
  
  const convertScore = (score: number): number => {
    const zScore = (score - mean) / std
    const tScore = 50 + (zScore * 10)
    return Math.max(0, Math.min(100, Math.round(tScore)))
  }

  return {
    extraversion: convertScore(scores.extraversion),
    agreeableness: convertScore(scores.agreeableness),
    conscientiousness: convertScore(scores.conscientiousness),
    neuroticism: convertScore(scores.neuroticism),
    openness: convertScore(scores.openness)
  }
}

function validateTipiResponses(responses: TipiResponse[]): string[] {
  const errors: string[] = []

  if (responses.length !== 10) {
    errors.push('All 10 questions must be answered')
  }

  responses.forEach(response => {
    if (response.score < 1 || response.score > 7) {
      errors.push(`Question ${response.questionId}: Score must be between 1 and 7`)
    }

    const question = TIPI_QUESTIONS.find(q => q.id === response.questionId)
    if (!question) {
      errors.push(`Invalid question ID: ${response.questionId}`)
    }
  })

  const questionIds = responses.map(r => r.questionId)
  const uniqueIds = new Set(questionIds)
  if (uniqueIds.size !== questionIds.length) {
    errors.push('Duplicate responses detected')
  }

  return errors
}

serve(async (req) => {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get user from JWT
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser()

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Parse request body
    const { responses } = await req.json()

    if (!responses || !Array.isArray(responses)) {
      return new Response(
        JSON.stringify({ error: 'Invalid request body. Expected responses array.' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Validate responses
    const validationErrors = validateTipiResponses(responses)
    if (validationErrors.length > 0) {
      return new Response(
        JSON.stringify({ error: 'Validation failed', details: validationErrors }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Calculate scores
    const rawScores = calculateTipiScores(responses)
    const p01Scores = convertToP01Scale(rawScores)
    const tScores = convertToTScores(rawScores)

    // Save to database
    const { data, error } = await supabaseClient
      .from('baseline_traits')
      .insert({
        user_id: user.id,
        traits_p01: p01Scores,
        traits_t: tScores,
        instrument: 'tipi_v1',
        administered_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to save assessment results' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Return success response with scores
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          id: data.id,
          raw_scores: rawScores,
          p01_scores: p01Scores,
          t_scores: tScores,
          administered_at: data.administered_at
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})