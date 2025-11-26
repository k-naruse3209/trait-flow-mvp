import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { calculateMoodAverage, shouldTriggerIntervention, determineInterventionTemplate } from '@/lib/mood-analytics'
import type { ProcessInterventionParams } from '@/lib/intervention-processor'
import type { InterventionMessage } from '@/lib/intervention-templates'
import { enhanceMessageWithPersonality, generateFallbackMessage } from '@/lib/intervention-templates'
import { engagement, withMonitoring } from '@/lib/monitoring'
import { requestCoachingMessage, mapToneToTemplate } from '@/lib/orchestrator-client'

// Simplified intervention generation - generate directly in same request context
interface CheckinAnalyticsSummary {
  mood_average: number | null
  mood_trend: 'improving' | 'declining' | 'stable'
  streak_days: number
}

async function upgradeInterventionWithAI(params: {
  interventionId: string
  userId: string
  checkin: CheckinRecord
  analytics?: CheckinAnalyticsSummary
  traits?: { traits_p01?: unknown }
  recentCheckins: CheckinRecord[]
  baseTemplate: 'reflection' | 'action' | 'compassion'
  fallbackMessage: InterventionMessage
}) {
  const supabaseService = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  try {
    const { processInterventionWithAI } = await import('@/lib/intervention-processor')

    let templateType: 'reflection' | 'action' | 'compassion' = params.baseTemplate
    let messagePayload: InterventionMessage | null = null
    let fallback = true

    if (process.env.ORCHESTRATOR_URL && process.env.ORCHESTRATOR_API_KEY) {
      try {
        const response = await requestCoachingMessage({
          user_id: params.userId,
          latest_checkin: {
            mood_score: params.checkin.mood_score,
            energy_level: params.checkin.energy_level,
            note: params.checkin.free_text || undefined
          },
          analytics: {
            average_mood: params.analytics?.mood_average ?? null,
            trend: params.analytics?.mood_trend ?? 'stable',
            streak_days: params.analytics?.streak_days ?? 0
          },
          personality: params.traits?.traits_p01 ?? null,
          history_refs: params.recentCheckins.map(c => c.id)
        })

        templateType = mapToneToTemplate(response.tone_used) ?? templateType
        messagePayload = {
          title: response.title,
          body: response.body,
          cta_text: response.suggested_action ?? undefined
        }
        fallback = false
      } catch (error) {
        console.warn('⚠️ Orchestrator generation failed, falling back to local AI:', error)
      }
    }

    if (!messagePayload) {
      const result = await processInterventionWithAI({
        userId: params.userId,
        checkinId: params.checkin.id,
        recentCheckins: params.recentCheckins,
        personalityTraits: params.traits?.traits_p01 as ProcessInterventionParams['personalityTraits'],
        currentCheckin: {
          moodScore: params.checkin.mood_score,
          energyLevel: params.checkin.energy_level,
          freeText: params.checkin.free_text || undefined
        }
      })
      templateType = result.template
      messagePayload = result.message
      fallback = result.fallback
    }

    const { error: updateError } = await supabaseService
      .from('interventions')
      .update({
        template_type: templateType,
        message_payload: messagePayload ?? params.fallbackMessage,
        fallback,
        analysis_status: 'ready',
        analysis_ready_at: new Date().toISOString()
      })
      .eq('id', params.interventionId)

    if (updateError) {
      console.error('❌ Failed to upgrade intervention:', updateError)
    }
  } catch (error) {
    console.error('❌ Error upgrading intervention with AI:', error)
    await supabaseService
      .from('interventions')
      .update({
        analysis_status: 'ready',
        analysis_ready_at: new Date().toISOString()
      })
      .eq('id', params.interventionId)
  }
}

async function triggerInterventionGeneration(checkin: CheckinRecord, userId: string, analytics?: CheckinAnalyticsSummary) {
  try {
    console.log(`🔄 Generating intervention directly for checkin: ${checkin.id}`)

    const supabaseService = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data: recentCheckins, error: checkinsError } = await supabaseService
      .from('checkins')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(7)

    if (checkinsError || !recentCheckins) {
      console.error('❌ Failed to fetch recent check-ins:', checkinsError)
      return
    }

    if (!shouldTriggerIntervention(recentCheckins)) {
      console.log('ℹ️ Intervention not needed based on current conditions')
      return
    }

    const { data: traits } = await supabaseService
      .from('baseline_traits')
      .select('traits_p01')
      .eq('user_id', userId)
      .order('administered_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const baseTemplate: 'reflection' | 'action' | 'compassion' = determineInterventionTemplate(
      analytics?.mood_average ?? checkin.mood_score
    )

    const fallbackMessage = enhanceMessageWithPersonality(
      generateFallbackMessage(baseTemplate, {
        moodAverage: analytics?.mood_average ?? checkin.mood_score,
        moodTrend: analytics?.mood_trend ?? 'stable',
        energyLevel: checkin.energy_level,
        freeText: checkin.free_text || undefined,
        personalityTraits: traits?.traits_p01,
        recentCheckins: recentCheckins.length,
        streakDays: analytics?.streak_days ?? 1
      }),
      traits?.traits_p01,
      baseTemplate
    )

    const { data: savedIntervention, error: saveError } = await supabaseService
      .from('interventions')
      .insert({
        user_id: userId,
        checkin_id: checkin.id,
        template_type: baseTemplate,
        message_payload: fallbackMessage,
        fallback: true,
        viewed: false,
        analysis_status: 'pending'
      })
      .select()
      .single()

    if (saveError || !savedIntervention) {
      console.error('❌ Failed to save fallback intervention:', saveError)
      return
    }

    queueMicrotask(() => upgradeInterventionWithAI({
      interventionId: savedIntervention.id,
      userId,
      checkin,
      analytics,
      traits,
      recentCheckins,
      baseTemplate,
      fallbackMessage
    }))

    console.log(`✅ Immediate template delivered, background AI upgrade queued for ${savedIntervention.id}`)
  } catch (error) {
    console.error('❌ Error in direct intervention generation:', error)
  }
}

interface CheckinData {
  moodScore: number
  energyLevel: 'low' | 'mid' | 'high'
  freeText: string
}

interface CheckinRecord {
  id: string
  user_id: string
  mood_score: number
  energy_level: 'low' | 'mid' | 'high'
  free_text: string | null
  created_at: string
  updated_at?: string
}

async function handleCheckinPost(request: NextRequest) {
  try {
    const supabase = await createServerClient();

    // Get user from session
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const { moodScore, energyLevel, freeText }: CheckinData = await request.json()

    // Validation
    if (!moodScore || moodScore < 1 || moodScore > 5) {
      return NextResponse.json(
        { error: 'Mood score must be between 1 and 5' },
        { status: 400 }
      )
    }

    if (!energyLevel || !['low', 'mid', 'high'].includes(energyLevel)) {
      return NextResponse.json(
        { error: 'Energy level must be low, mid, or high' },
        { status: 400 }
      )
    }

    if (freeText && freeText.length > 280) {
      return NextResponse.json(
        { error: 'Free text must be 280 characters or less' },
        { status: 400 }
      )
    }

    // Save to database
    const { data, error } = await supabase
      .from('checkins')
      .insert({
        user_id: user.id,
        mood_score: moodScore,
        energy_level: energyLevel,
        free_text: freeText.trim() || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to save check-in' },
        { status: 500 }
      )
    }

    // Get recent check-ins for mood analysis (including the one just created)
    const { data: recentCheckins, error: fetchError } = await supabase
      .from('checkins')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(7)

    if (fetchError) {
      console.error('Error fetching recent check-ins:', fetchError)
      // Continue without mood analysis if fetch fails
    }

    // Enhanced analytics calculation
    const analytics = {
      mood_average: null as number | null,
      mood_trend: 'stable' as 'improving' | 'declining' | 'stable',
      energy_distribution: { low: 0, mid: 0, high: 0 },
      intervention_triggered: false,
      template_type: null as string | null,
      recent_checkins_count: 0,
      streak_days: 0,
      total_checkins: 0
    }

    if (recentCheckins && recentCheckins.length > 0) {
      // Calculate mood average from last 7 check-ins
      analytics.mood_average = calculateMoodAverage(recentCheckins, Math.min(7, recentCheckins.length))
      analytics.recent_checkins_count = recentCheckins.length

      // Calculate mood trend (compare recent vs older check-ins)
      if (recentCheckins.length >= 4) {
        const midPoint = Math.floor(recentCheckins.length / 2)
        const recentHalf = recentCheckins.slice(0, midPoint)
        const olderHalf = recentCheckins.slice(midPoint)

        const recentAvg = recentHalf.reduce((sum, c) => sum + c.mood_score, 0) / recentHalf.length
        const olderAvg = olderHalf.reduce((sum, c) => sum + c.mood_score, 0) / olderHalf.length

        const difference = recentAvg - olderAvg
        if (difference > 0.3) {
          analytics.mood_trend = 'improving'
        } else if (difference < -0.3) {
          analytics.mood_trend = 'declining'
        }
      }

      // Calculate energy distribution
      const energyCount = { low: 0, mid: 0, high: 0 }
      recentCheckins.forEach(checkin => {
        energyCount[checkin.energy_level as 'low' | 'mid' | 'high']++
      })

      analytics.energy_distribution = {
        low: Math.round((energyCount.low / recentCheckins.length) * 100),
        mid: Math.round((energyCount.mid / recentCheckins.length) * 100),
        high: Math.round((energyCount.high / recentCheckins.length) * 100)
      }

      // Calculate streak (consecutive days with check-ins)
      const sortedCheckins = [...recentCheckins].sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )

      const today = new Date()

      // Since we just added a check-in, start with 1
      analytics.streak_days = 1
      const currentDate = new Date(today)
      currentDate.setDate(currentDate.getDate() - 1)

      for (let i = 1; i < sortedCheckins.length; i++) {
        const checkinDate = sortedCheckins[i].created_at.split('T')[0]
        const expectedDate = currentDate.toISOString().split('T')[0]

        if (checkinDate === expectedDate) {
          analytics.streak_days++
          currentDate.setDate(currentDate.getDate() - 1)
        } else {
          break
        }
      }

      // Get total check-ins count
      const { count: totalCount } = await supabase
        .from('checkins')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

      analytics.total_checkins = totalCount || 0

      // Determine if intervention should be triggered
      analytics.intervention_triggered = shouldTriggerIntervention(recentCheckins)

      if (analytics.intervention_triggered && analytics.mood_average !== null) {
        analytics.template_type = determineInterventionTemplate(analytics.mood_average)

        // Trigger intervention generation synchronously for testing
        try {
          await triggerInterventionGeneration(data, user.id, {
            mood_average: analytics.mood_average,
            mood_trend: analytics.mood_trend,
            streak_days: analytics.streak_days
          })
          console.log('✅ Intervention generation completed successfully')
        } catch (error) {
          console.error('❌ Failed to trigger intervention generation:', error)
        }

        console.log(`Intervention triggered: ${analytics.template_type} template for mood average ${analytics.mood_average}`)
      }
    }

    // Track user engagement
    engagement.track({
      userId: user.id,
      action: 'checkin',
      timestamp: new Date(),
      metadata: {
        moodScore: data.mood_score,
        energyLevel: data.energy_level
      }
    })

    return NextResponse.json({
      success: true,
      data: data,
      analytics: analytics
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function handleCheckinGet(request: NextRequest) {
  try {
    const supabase = await createServerClient();

    // Get user from session
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get query parameters with validation
    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50) // Max 50 items
    const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0)
    const includeAnalytics = searchParams.get('include_analytics') === 'true'
    const dateFrom = searchParams.get('date_from')
    const dateTo = searchParams.get('date_to')

    // Build query with optional date filtering
    let query = supabase
      .from('checkins')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    // Add date filters if provided
    if (dateFrom) {
      query = query.gte('created_at', dateFrom)
    }
    if (dateTo) {
      query = query.lte('created_at', dateTo)
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    // Execute query
    const { data: checkins, error, count } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch check-ins' },
        { status: 500 }
      )
    }

    // Prepare response
    const response: {
      success: boolean
      data: CheckinRecord[]
      pagination: {
        limit: number
        offset: number
        total: number
        has_more: boolean
      }
      analytics?: {
        mood_average: number
        mood_trend: string
        energy_distribution: { low: number; mid: number; high: number }
        total_checkins: number
        date_range: { from?: string; to?: string }
      }
    } = {
      success: true,
      data: checkins || [],
      pagination: {
        limit,
        offset,
        total: count || 0,
        has_more: (count || 0) > offset + limit
      }
    }

    // Include analytics if requested
    if (includeAnalytics && checkins && checkins.length > 0) {
      // Calculate analytics for the returned data
      const totalMood = checkins.reduce((sum, checkin) => sum + checkin.mood_score, 0)
      const averageMood = totalMood / checkins.length

      // Calculate mood trend (compare first half vs second half)
      let moodTrend: 'improving' | 'declining' | 'stable' = 'stable'
      if (checkins.length >= 4) {
        const midPoint = Math.floor(checkins.length / 2)
        const recentHalf = checkins.slice(0, midPoint)
        const olderHalf = checkins.slice(midPoint)

        const recentAvg = recentHalf.reduce((sum, c) => sum + c.mood_score, 0) / recentHalf.length
        const olderAvg = olderHalf.reduce((sum, c) => sum + c.mood_score, 0) / olderHalf.length

        const difference = recentAvg - olderAvg
        if (difference > 0.3) {
          moodTrend = 'improving'
        } else if (difference < -0.3) {
          moodTrend = 'declining'
        }
      }

      // Calculate energy distribution
      const energyCount = { low: 0, mid: 0, high: 0 }
      checkins.forEach(checkin => {
        energyCount[checkin.energy_level as 'low' | 'mid' | 'high']++
      })

      const energyDistribution = {
        low: Math.round((energyCount.low / checkins.length) * 100),
        mid: Math.round((energyCount.mid / checkins.length) * 100),
        high: Math.round((energyCount.high / checkins.length) * 100)
      }

      response.analytics = {
        mood_average: Math.round(averageMood * 10) / 10,
        mood_trend: moodTrend,
        energy_distribution: energyDistribution,
        total_checkins: count || 0,
        date_range: {
          from: checkins[checkins.length - 1]?.created_at,
          to: checkins[0]?.created_at
        }
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Wrap handlers with monitoring
export const POST = withMonitoring('/api/checkins', 'POST', handleCheckinPost)
export const GET = withMonitoring('/api/checkins', 'GET', handleCheckinGet)
