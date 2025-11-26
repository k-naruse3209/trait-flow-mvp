'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { History, Calendar, MessageSquare, ChevronLeft, ChevronRight, AlertCircle, RefreshCw } from 'lucide-react'
import { useTranslations, useLocale } from '@/components/translation-provider'

interface CheckinRecord {
  id: string
  user_id: string
  mood_score: number
  energy_level: 'low' | 'mid' | 'high'
  free_text: string | null
  created_at: string
}

interface CheckinHistoryProps {
  limit?: number
  showPagination?: boolean
  checkins?: CheckinRecord[]
  loading?: boolean
  error?: string | null
  totalCount?: number
  currentPage?: number
  hasMore?: boolean
  onPreviousPage?: () => void
  onNextPage?: () => void
}

export function CheckinHistory({
  limit = 10,
  showPagination = true,
  checkins: propCheckins,
  loading: propLoading,
  error: propError,
  totalCount: propTotalCount,
  currentPage: propCurrentPage,
  hasMore: propHasMore,
  onPreviousPage,
  onNextPage
}: CheckinHistoryProps) {
  // Use props if provided, otherwise use local state (for standalone usage)
  const [localCheckins, setLocalCheckins] = useState<CheckinRecord[]>([])
  const [localLoading, setLocalLoading] = useState(true)
  const [localError, setLocalError] = useState<string | null>(null)
  const [localCurrentPage, setLocalCurrentPage] = useState(0)
  const [localHasMore, setLocalHasMore] = useState(false)
  const [localTotalCount, setLocalTotalCount] = useState(0)

  const supabase = createClient()
  const t = useTranslations()
  const locale = useLocale()

  // Use props if available, otherwise use local state
  const checkins = propCheckins ?? localCheckins
  const loading = propLoading ?? localLoading
  const error = propError ?? localError
  const currentPage = propCurrentPage ?? localCurrentPage
  const hasMore = propHasMore ?? localHasMore
  const totalCount = propTotalCount ?? localTotalCount

  const fetchCheckins = async (offset: number = 0) => {
    // Only fetch if not using props (standalone mode)
    if (propCheckins !== undefined) return

    try {
      setLocalLoading(true)
      setLocalError(null)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLocalError(t('dashboard.checkin.errors.loginRequired'))
        return
      }

      // Fetch checkins with pagination
      const { data, error: fetchError, count } = await supabase
        .from('checkins')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (fetchError) {
        console.error('Error fetching check-ins:', fetchError)
        setLocalError(t('dashboard.errors.loadFailed'))
        return
      }

      setLocalCheckins(data || [])
      setLocalTotalCount(count || 0)
      setLocalHasMore((data?.length || 0) === limit && (offset + limit) < (count || 0))
    } catch (err) {
      console.error('Error fetching check-ins:', err)
      setLocalError(t('dashboard.errors.loadFailed'))
    } finally {
      setLocalLoading(false)
    }
  }

  useEffect(() => {
    fetchCheckins(currentPage * limit)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, limit, propCheckins])

  const handlePreviousPage = () => {
    if (onPreviousPage) {
      onPreviousPage()
    } else if (currentPage > 0) {
      setLocalCurrentPage(currentPage - 1)
    }
  }

  const handleNextPage = () => {
    if (onNextPage) {
      onNextPage()
    } else if (hasMore) {
      setLocalCurrentPage(currentPage + 1)
    }
  }

  const getMoodEmoji = (score: number): string => {
    switch (score) {
      case 1: return '😢'
      case 2: return '😕'
      case 3: return '😐'
      case 4: return '😊'
      case 5: return '😄'
      default: return '😐'
    }
  }

  const getMoodLabel = (score: number): string => {
    switch (score) {
      case 1: return t('dashboard.checkin.mood.veryLow')
      case 2: return t('dashboard.checkin.mood.low')
      case 3: return t('dashboard.checkin.mood.neutral')
      case 4: return t('dashboard.checkin.mood.good')
      case 5: return t('dashboard.checkin.mood.excellent')
      default: return t('dashboard.checkin.mood.neutral')
    }
  }

  const getEnergyIcon = (level: string): string => {
    switch (level) {
      case 'low': return '🔋'
      case 'mid': return '🔋🔋'
      case 'high': return '🔋🔋🔋'
      default: return '🔋'
    }
  }

  const getEnergyLabel = (level: string): string => {
    switch (level) {
      case 'low': return t('dashboard.checkin.energy.low')
      case 'mid': return t('dashboard.checkin.energy.medium')
      case 'high': return t('dashboard.checkin.energy.high')
      default: return 'Unknown'
    }
  }

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 1) {
      return t('dashboard.history.today')
    } else if (diffDays === 2) {
      return t('dashboard.history.yesterday')
    } else if (diffDays <= 7) {
      return t('dashboard.history.daysAgo').replace('{days}', (diffDays - 1).toString())
    } else {
      const localeMap = { vi: 'vi-VN', ja: 'ja-JP', en: 'en-US' };
      return date.toLocaleDateString(localeMap[locale] || 'en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      })
    }
  }

  const formatTime = (dateString: string): string => {
    const localeMap = { vi: 'vi-VN', ja: 'ja-JP', en: 'en-US' };
    return new Date(dateString).toLocaleTimeString(localeMap[locale] || 'en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: locale !== 'vi'
    })
  }

  // Loading state
  if (loading && checkins.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <History className="w-4 h-4 sm:w-5 sm:h-5" />
            {t('dashboard.history.title')}
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">{t('dashboard.history.description')}</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current" />
            {t('dashboard.history.loading')}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Error state
  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <History className="w-4 h-4 sm:w-5 sm:h-5" />
            Check-in History
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">Your recent mood and energy tracking</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8 space-y-4">
          <AlertCircle className="w-8 h-8 text-red-500" />
          <div className="text-center">
            <p className="text-sm text-red-600 mb-2">{error}</p>
            <Button
              onClick={() => fetchCheckins(currentPage * limit)}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Empty state
  if (checkins.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <History className="w-4 h-4 sm:w-5 sm:h-5" />
            Check-in History
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">Your recent mood and energy tracking</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8 space-y-4">
          <Calendar className="w-12 h-12 text-muted-foreground" />
          <div className="text-center">
            <h3 className="font-medium mb-1">No check-ins yet</h3>
            <p className="text-sm text-muted-foreground">
              Start tracking your mood and energy levels by submitting your first daily check-in.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <History className="w-4 h-4 sm:w-5 sm:h-5" />
          Check-in History
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          {totalCount > 0 && (
            <>
              Showing {currentPage * limit + 1}-{Math.min((currentPage + 1) * limit, totalCount)} of {totalCount} check-ins
            </>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Check-ins List */}
        <div className="space-y-3">
          {checkins.map((checkin) => (
            <div
              key={checkin.id}
              className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4 p-3 sm:p-4 border rounded-lg hover:bg-muted/30 transition-colors"
            >
              {/* Date Column */}
              <div className="flex items-center sm:flex-col sm:items-center gap-2 sm:gap-0 sm:min-w-[80px] sm:text-center">
                <Calendar className="w-4 h-4 text-muted-foreground sm:mb-1" />
                <div className="flex items-center gap-2 sm:flex-col sm:gap-0">
                  <div className="text-sm font-medium">{formatDate(checkin.created_at)}</div>
                  <div className="text-xs text-muted-foreground">{formatTime(checkin.created_at)}</div>
                </div>
              </div>

              {/* Mood and Energy */}
              <div className="flex-1 flex flex-col sm:flex-row gap-3 sm:gap-6">
                {/* Mood */}
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-lg sm:text-xl">{getMoodEmoji(checkin.mood_score)}</span>
                  <div className="min-w-0">
                    <div className="text-sm font-medium">{getMoodLabel(checkin.mood_score)}</div>
                    <div className="text-xs text-muted-foreground">Mood: {checkin.mood_score}/5</div>
                  </div>
                </div>

                {/* Energy */}
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm">{getEnergyIcon(checkin.energy_level)}</span>
                  <div className="min-w-0">
                    <div className="text-sm font-medium">{getEnergyLabel(checkin.energy_level)} Energy</div>
                    <div className="text-xs text-muted-foreground">Energy Level</div>
                  </div>
                </div>
              </div>

              {/* Free Text Note */}
              {checkin.free_text && (
                <div className="w-full sm:flex-1 sm:max-w-xs">
                  <div className="flex items-start gap-2 p-2 bg-muted/30 rounded-md">
                    <MessageSquare className="w-3 h-3 mt-0.5 text-muted-foreground flex-shrink-0" />
                    <p className="text-xs text-muted-foreground line-clamp-2 break-words">
                      {checkin.free_text}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Pagination */}
        {showPagination && totalCount > limit && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t">
            <Button
              onClick={handlePreviousPage}
              disabled={currentPage === 0 || loading}
              variant="outline"
              size="sm"
              className="flex items-center gap-2 w-full sm:w-auto"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>

            <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
              <span>
                Page {currentPage + 1} of {Math.ceil(totalCount / limit)}
              </span>
              {loading && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
              )}
            </div>

            <Button
              onClick={handleNextPage}
              disabled={!hasMore || loading}
              variant="outline"
              size="sm"
              className="flex items-center gap-2 w-full sm:w-auto"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}