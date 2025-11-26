import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { withMonitoring } from '@/lib/monitoring'

async function handleInterventionFeedbackPost(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    
    // Get user from session
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { interventionId, score } = body

    // Validate input
    if (!interventionId || typeof score !== 'number' || score < 1 || score > 5) {
      return NextResponse.json(
        { error: 'Invalid intervention ID or score. Score must be between 1-5.' },
        { status: 400 }
      )
    }

    // Update intervention feedback
    const { data, error } = await supabase
      .from('interventions')
      .update({
        feedback_score: score,
        feedback_at: new Date().toISOString()
      })
      .eq('id', interventionId)
      .eq('user_id', user.id) // Ensure user can only update their own interventions
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to submit feedback' },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Intervention not found or access denied' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        id: data.id,
        feedback_score: data.feedback_score,
        feedback_at: data.feedback_at
      }
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Wrap handler with monitoring
export const POST = withMonitoring('/api/intervention-feedback', 'POST', handleInterventionFeedbackPost)