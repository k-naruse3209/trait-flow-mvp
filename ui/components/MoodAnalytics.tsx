'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { createClient } from '@/lib/supabase/client'
import { TrendingUp, TrendingDown, Minus, BarChart3, Flame, Calendar, AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTranslations } from '@/components/translation-provider'

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

interface MoodAnalyticsProps {
  className?: string
  analytics?: MoodAnalytics | null
  loading?: boolean
  error?: string | null
  refreshAnalytics?: () => void
}

export function MoodAnalytics({ 
  className,
  analytics: propAnalytics,
  loading: propLoading,
  error: propError,
  refreshAnalytics
}: MoodAnalyticsProps) {
  const [localAnalytics, setLocalAnalytics] = useState<MoodAnalytics | null>(null)
  const [localLoading, setLocalLoading] = useState(true)
  const [localError, setLocalError] = useState<string | null>(null)
  
  // Use props if available, otherwise use local state
  const analytics = propAnalytics ?? localAnalytics
  const loading = propLoading ?? localLoading
  const error = propError ?? localError

  const supabase = createClient()
  const t = useTranslations()

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
      energyCount[checkin.energy_level]++
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

  const fetchAnalytics = async () => {
    // Only fetch if not using props (standalone mode)
    if (propAnalytics !== undefined) return
    
    try {
      setLocalLoading(true)
      setLocalError(null)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLocalError(t('dashboard.checkin.errors.loginRequired'))
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
        setLocalError(t('dashboard.errors.loadFailed'))
        return
      }

      const analyticsData = calculateAnalytics(checkins || [])
      setLocalAnalytics(analyticsData)
    } catch (err) {
      console.error('Error calculating analytics:', err)
      setLocalError(t('dashboard.errors.loadFailed'))
    } finally {
      setLocalLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propAnalytics])

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="w-4 h-4 text-green-600" />
      case 'declining':
        return <TrendingDown className="w-4 h-4 text-red-600" />
      default:
        return <Minus className="w-4 h-4 text-muted-foreground" />
    }
  }

  const getTrendLabel = (trend: string) => {
    switch (trend) {
      case 'improving':
        return t('dashboard.analytics.trends.improving')
      case 'declining':
        return t('dashboard.analytics.trends.declining')
      default:
        return t('dashboard.analytics.trends.stable')
    }
  }

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'improving':
        return 'text-green-600'
      case 'declining':
        return 'text-red-600'
      default:
        return 'text-muted-foreground'
    }
  }

  const getMoodEmoji = (score: number): string => {
    if (score >= 4.5) return '😄'
    if (score >= 3.5) return '😊'
    if (score >= 2.5) return '😐'
    if (score >= 1.5) return '😕'
    return '😢'
  }

  // Loading state
  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            {t('dashboard.analytics.title')}
          </CardTitle>
          <CardDescription>{t('dashboard.analytics.description')}</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current" />
            {t('dashboard.analytics.calculating')}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Error state
  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            {t('dashboard.analytics.title')}
          </CardTitle>
          <CardDescription>{t('dashboard.analytics.description')}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8 space-y-4">
          <AlertCircle className="w-8 h-8 text-red-500" />
          <div className="text-center">
            <p className="text-sm text-red-600 mb-2">{error}</p>
            <Button 
              onClick={refreshAnalytics || fetchAnalytics} 
              variant="outline" 
              size="sm"
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              {t('dashboard.errors.tryAgain')}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Empty state
  if (!analytics || analytics.totalCheckins === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            {t('dashboard.analytics.title')}
          </CardTitle>
          <CardDescription>{t('dashboard.analytics.description')}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8 space-y-4">
          <BarChart3 className="w-12 h-12 text-muted-foreground" />
          <div className="text-center">
            <h3 className="font-medium mb-1">{t('dashboard.analytics.noData')}</h3>
            <p className="text-sm text-muted-foreground">
              {t('dashboard.analytics.noDataDescription')}
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          {t('dashboard.analytics.title')}
        </CardTitle>
        <CardDescription>
          {t('dashboard.analytics.basedOn').replace('{count}', analytics.totalCheckins.toString())}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Average Mood and Trend */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg">
            <span className="text-3xl">{getMoodEmoji(analytics.averageMood)}</span>
            <div>
              <p className="text-sm text-muted-foreground">{t('dashboard.analytics.averageMood')}</p>
              <p className="text-xl font-semibold">{analytics.averageMood.toFixed(1)}/5</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg">
            {getTrendIcon(analytics.moodTrend)}
            <div>
              <p className="text-sm text-muted-foreground">{t('dashboard.analytics.moodTrend')}</p>
              <p className={`text-lg font-medium ${getTrendColor(analytics.moodTrend)}`}>
                {getTrendLabel(analytics.moodTrend)}
              </p>
            </div>
          </div>
        </div>

        {/* Check-in Streak */}
        <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg">
          <Flame className={`w-6 h-6 ${analytics.streakDays > 0 ? 'text-orange-500' : 'text-muted-foreground'}`} />
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">{t('dashboard.analytics.checkinStreak')}</p>
            <p className="text-xl font-semibold">
              {analytics.streakDays} {analytics.streakDays === 1 ? t('dashboard.analytics.day') : t('dashboard.analytics.days')}
            </p>
          </div>
          <Calendar className="w-5 h-5 text-muted-foreground" />
        </div>

        {/* Energy Distribution */}
        <div className="space-y-3">
          <h4 className="font-medium flex items-center gap-2">
            <span>{t('dashboard.analytics.energyDistribution')}</span>
          </h4>
          
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-sm w-16">{t('dashboard.analytics.energy.low')}</span>
              <Progress value={analytics.energyDistribution.low} className="flex-1" />
              <span className="text-sm text-muted-foreground w-12 text-right">
                {Math.round(analytics.energyDistribution.low)}%
              </span>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="text-sm w-16">{t('dashboard.analytics.energy.mid')}</span>
              <Progress value={analytics.energyDistribution.mid} className="flex-1" />
              <span className="text-sm text-muted-foreground w-12 text-right">
                {Math.round(analytics.energyDistribution.mid)}%
              </span>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="text-sm w-16">{t('dashboard.analytics.energy.high')}</span>
              <Progress value={analytics.energyDistribution.high} className="flex-1" />
              <span className="text-sm text-muted-foreground w-12 text-right">
                {Math.round(analytics.energyDistribution.high)}%
              </span>
            </div>
          </div>
        </div>

        {/* Total Check-ins */}
        <div className="pt-2 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{t('dashboard.analytics.totalCheckins')}</span>
            <span className="font-medium">{analytics.totalCheckins}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}