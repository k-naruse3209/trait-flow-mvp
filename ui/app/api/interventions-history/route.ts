import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { withMonitoring } from '@/lib/monitoring'

interface InterventionRecord {
  id: string
  user_id: string
  checkin_id: string
  template_type: 'compassion' | 'reflection' | 'action'
  message_payload: {
    title: string
    body: string
    cta_text: string
  }
  fallback: boolean
  viewed: boolean
  feedback_score: number | null
  created_at: string
  feedback_at: string | null
  analysis_status?: 'pending' | 'ready'
  analysis_ready_at?: string | null
}

async function handleInterventionsHistoryGet(request: NextRequest) {
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
    const includeStats = searchParams.get('include_stats') === 'true'

    // Fetch interventions with pagination
    const { data: interventions, error, count } = await supabase
      .from('interventions')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch interventions' },
        { status: 500 }
      )
    }

    // Prepare response
    const response: {
      success: boolean
      data: InterventionRecord[]
      pagination: {
        limit: number
        offset: number
        total: number
        has_more: boolean
      }
      stats?: {
        total_interventions: number
        with_feedback: number
        ai_generated: number
        template_generated: number
        avg_feedback_score: number | null
      }
    } = {
      success: true,
      data: interventions || [],
      pagination: {
        limit,
        offset,
        total: count || 0,
        has_more: (count || 0) > offset + limit
      }
    }

    // Include stats if requested
    if (includeStats && interventions && interventions.length > 0) {
      const totalInterventions = count || 0
      const withFeedback = interventions.filter(i => i.feedback_score !== null).length
      const aiGenerated = interventions.filter(i => !i.fallback).length
      const templateGenerated = interventions.filter(i => i.fallback).length
      
      // Calculate average feedback score from all interventions with feedback
      const { data: feedbackData } = await supabase
        .from('interventions')
        .select('feedback_score')
        .eq('user_id', user.id)
        .not('feedback_score', 'is', null)

      const avgFeedbackScore = feedbackData && feedbackData.length > 0
        ? feedbackData.reduce((sum, item) => sum + (item.feedback_score || 0), 0) / feedbackData.length
        : null

      response.stats = {
        total_interventions: totalInterventions,
        with_feedback: withFeedback,
        ai_generated: aiGenerated,
        template_generated: templateGenerated,
        avg_feedback_score: avgFeedbackScore ? Math.round(avgFeedbackScore * 10) / 10 : null
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

// Wrap handler with monitoring
export const GET = withMonitoring('/api/interventions-history', 'GET', handleInterventionsHistoryGet)