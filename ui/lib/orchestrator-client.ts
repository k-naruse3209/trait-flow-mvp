import type { BigFiveScores } from '@/lib/tipi'

export interface OrchestratorRequestPayload {
  user_id: string
  latest_checkin: {
    mood_score: number
    energy_level: 'low' | 'mid' | 'high'
    note?: string
  }
  analytics: {
    average_mood: number | null
    trend: 'improving' | 'declining' | 'stable'
    streak_days: number
  }
  personality: BigFiveScores | null
  history_refs: string[]
}

export interface OrchestratorResponsePayload {
  title: string
  body: string
  suggested_action?: string
  tone_used?: string
  metadata?: Record<string, unknown>
}

/**
 * Call the LangGraph Orchestrator to generate a coaching message.
 */
export async function requestCoachingMessage(
  payload: OrchestratorRequestPayload
): Promise<OrchestratorResponsePayload> {
  const baseUrl = process.env.ORCHESTRATOR_URL
  const apiKey = process.env.ORCHESTRATOR_API_KEY

  if (!baseUrl || !apiKey) {
    throw new Error('Orchestrator environment variables are not configured')
  }

  const controller = new AbortController()
  const timeoutMs = Number(process.env.ORCHESTRATOR_TIMEOUT_MS ?? 15000)
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, '')}/api/respond`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    })

    if (!response.ok) {
      throw new Error(`Orchestrator responded with status ${response.status}`)
    }

    const data = (await response.json()) as OrchestratorResponsePayload
    return data
  } finally {
    clearTimeout(timeout)
  }
}

/**
 * Map an orchestrator tone label into the intervention template type
 * used by the Supabase data model.
 */
export function mapToneToTemplate(
  tone?: string | null
): 'compassion' | 'reflection' | 'action' | null {
  if (!tone) return null

  const normalized = tone.toLowerCase()
  if (normalized.includes('compassion') || normalized.includes('care')) {
    return 'compassion'
  }
  if (normalized.includes('reflection') || normalized.includes('insight')) {
    return 'reflection'
  }
  if (normalized.includes('action') || normalized.includes('motivate')) {
    return 'action'
  }

  return null
}
