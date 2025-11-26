'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

interface CheckinRecord {
  id: string
  user_id: string
  mood_score: number
  energy_level: 'low' | 'mid' | 'high'
  free_text: string | null
  created_at: string
}

interface MoodAnalytics {
  averageMood: number
  moodTrend: 'improving' | 'declining' | 'stable'
  energyDistribution: { low: number; mid: number; high: number }
  totalCheckins: number
  streakDays: number
  recentCheckins: CheckinRecord[]
}

export function useMoodAnalytics() {
  const [analytics, setAnalytics] = useState<MoodAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  const calculateAnalytics = (checkins: CheckinRecord[]): MoodAnalytics => {
    if (checkins.length === 0) {
      return {
        averageMood: 0,
        moodTrend: 'stable',
        energyDistribution: { low: 0, mid: 0, high: 0 },
        totalCheckins: 0,
        streakDays: 0,
        recentCheckins: []
      }
    }

    // Calculate average mood
    const totalMood = checkins.reduce((sum, checkin) => sum + checkin.mood_score, 0)
    const averageMood = totalMood / checkins.length

    // Calculate mood trend (compare first half vs second half of recent checkins)
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
      low: (energyCount.low / checkins.length) * 100,
      mid: (energyCount.mid / checkins.length) * 100,
      high: (energyCount.high / checkins.length) * 100
    }

    // Calculate streak (consecutive days with check-ins)
    let streakDays = 0
    const sortedCheckins = [...checkins].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]
    
    // Check if there's a check-in today
    const hasCheckinToday = sortedCheckins.some(checkin => 
      checkin.created_at.split('T')[0] === todayStr
    )
    
    if (hasCheckinToday) {
      streakDays = 1
      const currentDate = new Date(today)
      currentDate.setDate(currentDate.getDate() - 1)
      
      for (let i = 1; i < sortedCheckins.length; i++) {
        const checkinDate = sortedCheckins[i].created_at.split('T')[0]
        const expectedDate = currentDate.toISOString().split('T')[0]
        
        if (checkinDate === expectedDate) {
          streakDays++
          currentDate.setDate(currentDate.getDate() - 1)
        } else {
          break
        }
      }
    }

    return {
      averageMood,
      moodTrend,
      energyDistribution,
      totalCheckins: checkins.length,
      streakDays,
      recentCheckins: checkins.slice(0, 7)
    }
  }

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('Please log in to view your analytics')
        return
      }

      // Fetch recent check-ins for analytics (last 30 days)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const { data: checkins, error: fetchError } = await supabase
        .from('checkins')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: false })

      if (fetchError) {
        console.error('Error fetching check-ins for analytics:', fetchError)
        setError('Failed to load analytics data')
        return
      }

      console.log('📈 Analytics data fetched:', checkins?.length || 0, 'check-ins')
      const analyticsData = calculateAnalytics(checkins || [])
      setAnalytics(analyticsData)
    } catch (err) {
      console.error('Error calculating analytics:', err)
      setError('Failed to calculate analytics')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  const refreshAnalytics = useCallback(() => {
    console.log('🔄 refreshAnalytics called')
    fetchAnalytics()
  }, [fetchAnalytics])

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  return {
    analytics,
    loading,
    error,
    refreshAnalytics
  }
}