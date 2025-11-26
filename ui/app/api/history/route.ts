import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { withMonitoring } from '@/lib/monitoring'

interface CheckinRecord {
  id: string
  user_id: string
  mood_score: number
  energy_level: 'low' | 'mid' | 'high'
  free_text: string | null
  created_at: string
}

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

interface TimelineItem {
  id: string
  type: 'checkin' | 'intervention' | 'grouped'
  date: string
  data: CheckinRecord | InterventionRecord | GroupedRecord
}

interface GroupedRecord {
  checkin: CheckinRecord
  interventions: InterventionRecord[]
}

interface HistoryStats {
  totalCheckins: number
  totalInterventions: number
  avgMoodScore: number
  energyDistribution: { low: number; mid: number; high: number }
  streakDays: number
  moodTrend: 'improving' | 'declining' | 'stable'
  dateRange: { from: string; to: string }
}

interface HistoryApiResponse {
  success: boolean
  data: {
    timeline: TimelineItem[]
    stats: HistoryStats
  }
  pagination: {
    limit: number
    offset: number
    total: number
    has_more: boolean
  }
}

function calculateStreakDays(checkins: CheckinRecord[]): number {
  if (checkins.length === 0) return 0

  // Sort checkins by date (most recent first)
  const sortedCheckins = [...checkins].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  // Check if there's a checkin today or yesterday
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().split('T')[0]

  const mostRecentDate = sortedCheckins[0].created_at.split('T')[0]
  
  // If most recent checkin is not today or yesterday, streak is 0
  if (mostRecentDate !== todayStr && mostRecentDate !== yesterdayStr) {
    return 0
  }

  let streakDays = 1
  let currentDate = new Date(mostRecentDate)
  
  // Check consecutive days backwards
  for (let i = 1; i < sortedCheckins.length; i++) {
    const expectedDate = new Date(currentDate)
    expectedDate.setDate(expectedDate.getDate() - 1)
    const expectedDateStr = expectedDate.toISOString().split('T')[0]
    
    const checkinDate = sortedCheckins[i].created_at.split('T')[0]
    
    if (checkinDate === expectedDateStr) {
      streakDays++
      currentDate = expectedDate
    } else {
      break
    }
  }

  return streakDays
}

function calculateMoodTrend(checkins: CheckinRecord[]): 'improving' | 'declining' | 'stable' {
  if (checkins.length < 4) return 'stable'

  // Sort by date (oldest first for trend calculation)
  const sortedCheckins = [...checkins].sort((a, b) => 
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )

  const midPoint = Math.floor(sortedCheckins.length / 2)
  const olderHalf = sortedCheckins.slice(0, midPoint)
  const recentHalf = sortedCheckins.slice(midPoint)

  const olderAvg = olderHalf.reduce((sum, c) => sum + c.mood_score, 0) / olderHalf.length
  const recentAvg = recentHalf.reduce((sum, c) => sum + c.mood_score, 0) / recentHalf.length

  const difference = recentAvg - olderAvg
  
  if (difference > 0.3) {
    return 'improving'
  } else if (difference < -0.3) {
    return 'declining'
  }
  
  return 'stable'
}

function mergeTimelineData(checkins: CheckinRecord[], interventions: InterventionRecord[]): TimelineItem[] {
  const timeline: TimelineItem[] = []
  
  // Create a map of interventions by checkin_id for grouping
  const interventionsByCheckin = new Map<string, InterventionRecord[]>()
  interventions.forEach(intervention => {
    const checkinId = intervention.checkin_id
    if (!interventionsByCheckin.has(checkinId)) {
      interventionsByCheckin.set(checkinId, [])
    }
    interventionsByCheckin.get(checkinId)!.push(intervention)
  })

  // Process checkins and group with related interventions
  checkins.forEach(checkin => {
    const relatedInterventions = interventionsByCheckin.get(checkin.id) || []
    
    if (relatedInterventions.length > 0) {
      // Create grouped item
      timeline.push({
        id: `grouped-${checkin.id}`,
        type: 'grouped',
        date: checkin.created_at,
        data: {
          checkin,
          interventions: relatedInterventions
        }
      })
      
      // Remove processed interventions from the map
      interventionsByCheckin.delete(checkin.id)
    } else {
      // Create standalone checkin item
      timeline.push({
        id: `checkin-${checkin.id}`,
        type: 'checkin',
        date: checkin.created_at,
        data: checkin
      })
    }
  })

  // Add any remaining standalone interventions (orphaned interventions)
  interventionsByCheckin.forEach((interventionList) => {
    interventionList.forEach(intervention => {
      timeline.push({
        id: `intervention-${intervention.id}`,
        type: 'intervention',
        date: intervention.created_at,
        data: intervention
      })
    })
  })

  // Sort timeline by date (most recent first)
  timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return timeline
}

async function handleHistoryGet(request: NextRequest) {
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

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)
    const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0)
    const type = searchParams.get('type') || 'all' // 'all', 'checkins', 'interventions'
    const dateRange = searchParams.get('date_range') || 'month' // 'week', 'month', 'quarter', 'all'
    const moodMin = searchParams.get('mood_min') ? parseInt(searchParams.get('mood_min')!) : null
    const moodMax = searchParams.get('mood_max') ? parseInt(searchParams.get('mood_max')!) : null
    const templateTypes = searchParams.get('template_types')?.split(',').filter(Boolean) || []
    const includeStats = searchParams.get('include_stats') !== 'false' // default true

    // Calculate date range filter
    let dateFrom: string | null = null
    const now = new Date()
    
    switch (dateRange) {
      case 'week':
        const weekAgo = new Date(now)
        weekAgo.setDate(weekAgo.getDate() - 7)
        dateFrom = weekAgo.toISOString()
        break
      case 'month':
        const monthAgo = new Date(now)
        monthAgo.setMonth(monthAgo.getMonth() - 1)
        dateFrom = monthAgo.toISOString()
        break
      case 'quarter':
        const quarterAgo = new Date(now)
        quarterAgo.setMonth(quarterAgo.getMonth() - 3)
        dateFrom = quarterAgo.toISOString()
        break
      case 'all':
      default:
        dateFrom = null
        break
    }

    // Fetch checkins if needed
    let checkins: CheckinRecord[] = []
    let totalCheckins = 0
    
    if (type === 'all' || type === 'checkins') {
      let checkinsQuery = supabase
        .from('checkins')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      // Apply date filter
      if (dateFrom) {
        checkinsQuery = checkinsQuery.gte('created_at', dateFrom)
      }

      // Apply mood range filter
      if (moodMin !== null) {
        checkinsQuery = checkinsQuery.gte('mood_score', moodMin)
      }
      if (moodMax !== null) {
        checkinsQuery = checkinsQuery.lte('mood_score', moodMax)
      }

      const { data: checkinsData, error: checkinsError, count: checkinsCount } = await checkinsQuery

      if (checkinsError) {
        console.error('Error fetching checkins:', checkinsError)
        return NextResponse.json(
          { error: 'Failed to fetch checkins' },
          { status: 500 }
        )
      }

      checkins = checkinsData || []
      totalCheckins = checkinsCount || 0
    }

    // Fetch interventions if needed
    let interventions: InterventionRecord[] = []
    let totalInterventions = 0
    
    if (type === 'all' || type === 'interventions') {
      let interventionsQuery = supabase
        .from('interventions')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      // Apply date filter
      if (dateFrom) {
        interventionsQuery = interventionsQuery.gte('created_at', dateFrom)
      }

      // Apply template type filter
      if (templateTypes.length > 0) {
        interventionsQuery = interventionsQuery.in('template_type', templateTypes)
      }

      const { data: interventionsData, error: interventionsError, count: interventionsCount } = await interventionsQuery

      if (interventionsError) {
        console.error('Error fetching interventions:', interventionsError)
        return NextResponse.json(
          { error: 'Failed to fetch interventions' },
          { status: 500 }
        )
      }

      interventions = interventionsData || []
      totalInterventions = interventionsCount || 0
    }

    // Merge and create timeline
    const timeline = mergeTimelineData(checkins, interventions)

    // Apply pagination to timeline
    const paginatedTimeline = timeline.slice(offset, offset + limit)
    const totalItems = timeline.length

    // Calculate stats if requested
    let stats: HistoryStats | null = null
    
    if (includeStats) {
      // For stats, we need all data regardless of pagination
      // Get all checkins for stats calculation
      let allCheckinsQuery = supabase
        .from('checkins')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (dateFrom) {
        allCheckinsQuery = allCheckinsQuery.gte('created_at', dateFrom)
      }

      const { data: allCheckins } = await allCheckinsQuery
      const statsCheckins = allCheckins || []

      // Calculate energy distribution
      const energyCount = { low: 0, mid: 0, high: 0 }
      statsCheckins.forEach(checkin => {
        energyCount[checkin.energy_level as 'low' | 'mid' | 'high']++
      })

      const totalCheckinsForStats = statsCheckins.length
      const energyDistribution = totalCheckinsForStats > 0 ? {
        low: Math.round((energyCount.low / totalCheckinsForStats) * 100),
        mid: Math.round((energyCount.mid / totalCheckinsForStats) * 100),
        high: Math.round((energyCount.high / totalCheckinsForStats) * 100)
      } : { low: 0, mid: 0, high: 0 }

      // Calculate average mood score
      const avgMoodScore = totalCheckinsForStats > 0
        ? statsCheckins.reduce((sum, c) => sum + c.mood_score, 0) / totalCheckinsForStats
        : 0

      // Calculate streak days
      const streakDays = calculateStreakDays(statsCheckins)

      // Calculate mood trend
      const moodTrend = calculateMoodTrend(statsCheckins)

      // Determine date range for stats
      const oldestDate = statsCheckins.length > 0 
        ? statsCheckins[statsCheckins.length - 1].created_at 
        : now.toISOString()
      const newestDate = statsCheckins.length > 0 
        ? statsCheckins[0].created_at 
        : now.toISOString()

      stats = {
        totalCheckins,
        totalInterventions,
        avgMoodScore: Math.round(avgMoodScore * 10) / 10,
        energyDistribution,
        streakDays,
        moodTrend,
        dateRange: {
          from: oldestDate,
          to: newestDate
        }
      }
    }

    const response: HistoryApiResponse = {
      success: true,
      data: {
        timeline: paginatedTimeline,
        stats: stats || {
          totalCheckins: 0,
          totalInterventions: 0,
          avgMoodScore: 0,
          energyDistribution: { low: 0, mid: 0, high: 0 },
          streakDays: 0,
          moodTrend: 'stable',
          dateRange: { from: now.toISOString(), to: now.toISOString() }
        }
      },
      pagination: {
        limit,
        offset,
        total: totalItems,
        has_more: totalItems > offset + limit
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
export const GET = withMonitoring('/api/history', 'GET', handleHistoryGet)