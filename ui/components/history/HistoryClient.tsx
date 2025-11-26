'use client'

import { useState, useEffect, useCallback } from 'react'
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { HistoryStats } from './HistoryStats'
import { HistoryFilters, type HistoryFiltersState } from './HistoryFilters'
import { CheckinTimelineItem } from './CheckinTimelineItem'
import { InterventionTimelineItem } from './InterventionTimelineItem'
import { GroupedTimelineItem } from './GroupedTimelineItem'
import {
  TimelineLoadingSkeleton,
  StatsLoadingSkeleton,
  FiltersSkeleton
} from './SkeletonLoading'
import {
  HistoryEmptyState,
  PaginationLoadingIndicator
} from './EmptyStates'
import { useTranslations } from '@/components/translation-provider'

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

interface HistoryStatsData {
  totalCheckins: number
  totalInterventions: number
  avgMoodScore: number
  streakDays: number
  moodTrend: 'improving' | 'declining' | 'stable'
  energyDistribution: { low: number; mid: number; high: number }
  dateRange: { from: string; to: string }
}

interface HistoryApiResponse {
  success: boolean
  data: {
    timeline: TimelineItem[]
    stats: HistoryStatsData
  }
  pagination: {
    limit: number
    offset: number
    total: number
    has_more: boolean
  }
}

const ITEMS_PER_PAGE = 20

export function HistoryClient() {
  const [filters, setFilters] = useState<HistoryFiltersState>({
    type: 'all',
    dateRange: 'all',
    moodMin: null,
    moodMax: null,
    templateTypes: []
  })

  const [appliedFilters, setAppliedFilters] = useState<HistoryFiltersState>(filters)
  const [isFiltersCollapsed, setIsFiltersCollapsed] = useState(true)
  const [statsCache, setStatsCache] = useState<HistoryStatsData | null>(null)

  const queryClient = useQueryClient()
  const t = useTranslations()

  // Build query parameters from filters
  const buildQueryParams = (pageParam: number, currentFilters: HistoryFiltersState) => {
    const params = new URLSearchParams({
      limit: ITEMS_PER_PAGE.toString(),
      offset: pageParam.toString(),
      include_stats: (pageParam === 0).toString()
    })

    if (currentFilters.type !== 'all') {
      params.set('type', currentFilters.type)
    }

    if (currentFilters.dateRange !== 'all') {
      params.set('date_range', currentFilters.dateRange)
    }

    if (currentFilters.moodMin !== null) {
      params.set('mood_min', currentFilters.moodMin.toString())
    }

    if (currentFilters.moodMax !== null) {
      params.set('mood_max', currentFilters.moodMax.toString())
    }

    if (currentFilters.templateTypes.length > 0) {
      params.set('template_types', currentFilters.templateTypes.join(','))
    }

    return params
  }

  // Fetch history data with infinite query
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
    refetch
  } = useInfiniteQuery({
    queryKey: ['history', appliedFilters],
    queryFn: async ({ pageParam = 0 }) => {
      console.log('🔄 Fetching history with pageParam:', pageParam, 'filters:', appliedFilters)

      const params = buildQueryParams(pageParam, appliedFilters)
      console.log('📡 API URL:', `/api/history?${params}`)

      const response = await fetch(`/api/history?${params}`)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to load history' }))
        throw new Error(errorData.error || 'Failed to load history')
      }

      const apiResponse: HistoryApiResponse = await response.json()

      if (!apiResponse.success) {
        throw new Error('Failed to load history')
      }

      // Set stats on first page load
      if (pageParam === 0 && apiResponse.data.stats) {
        setStatsCache(apiResponse.data.stats)
      }

      console.log('📨 Received history data:', {
        pageParam,
        timelineLength: apiResponse.data.timeline.length,
        hasMore: apiResponse.pagination.has_more,
        total: apiResponse.pagination.total
      })

      return {
        timeline: apiResponse.data.timeline,
        nextOffset: apiResponse.pagination.has_more ? pageParam + ITEMS_PER_PAGE : null,
        pagination: apiResponse.pagination
      }
    },
    getNextPageParam: (lastPage) => lastPage.nextOffset,
    initialPageParam: 0,
    staleTime: 2 * 60 * 1000, // 2 minutes - longer to avoid flickering
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnMount: 'always', // Always refetch when component mounts
    refetchOnWindowFocus: false, // Don't refetch on window focus to avoid flickering
  })

  // Mutation for feedback submission
  const feedbackMutation = useMutation({
    mutationFn: async ({ interventionId, score }: { interventionId: string; score: number }) => {
      const response = await fetch('/api/intervention-feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ interventionId, score }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to submit feedback' }))
        throw new Error(errorData.error || 'Failed to submit feedback')
      }

      const result = await response.json()
      if (!result.success) {
        throw new Error('Failed to submit feedback')
      }

      return { interventionId, score }
    },
    onSuccess: ({ interventionId, score }) => {
      // Optimistically update the cache
      queryClient.setQueryData(['history', appliedFilters], (oldData: unknown) => {
        if (!oldData || typeof oldData !== 'object') return oldData

        const data = oldData as {
          pages: Array<{
            timeline: TimelineItem[]
            nextOffset: number | null
            pagination: {
              limit: number
              offset: number
              total: number
              has_more: boolean
            }
          }>
          pageParams: unknown[]
        }

        return {
          ...data,
          pages: data.pages.map((page) => ({
            ...page,
            timeline: page.timeline.map((item: TimelineItem) => {
              if (item.type === 'intervention') {
                const intervention = item.data as InterventionRecord
                if (intervention.id === interventionId) {
                  return {
                    ...item,
                    data: {
                      ...intervention,
                      feedback_score: score,
                      feedback_at: new Date().toISOString()
                    }
                  }
                }
              } else if (item.type === 'grouped') {
                const grouped = item.data as GroupedRecord
                return {
                  ...item,
                  data: {
                    ...grouped,
                    interventions: grouped.interventions.map((intervention) =>
                      intervention.id === interventionId
                        ? { ...intervention, feedback_score: score, feedback_at: new Date().toISOString() }
                        : intervention
                    )
                  }
                }
              }
              return item
            })
          }))
        }
      })
      console.log('✅ Feedback submitted successfully')
    },
    onError: (error) => {
      console.error('Error submitting feedback:', error)
    }
  })

  // Infinite scroll handler
  const handleScroll = useCallback(() => {
    if (
      window.innerHeight + document.documentElement.scrollTop
      >= document.documentElement.offsetHeight - 1000 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPage()
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage])

  useEffect(() => {
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  // Filter handlers
  const handleFiltersChange = (newFilters: HistoryFiltersState) => {
    setFilters(newFilters)
  }

  const handleApplyFilters = () => {
    setAppliedFilters(filters)
    setIsFiltersCollapsed(true)
  }

  const handleClearFilters = () => {
    const clearedFilters: HistoryFiltersState = {
      type: 'all',
      dateRange: 'all',
      moodMin: null,
      moodMax: null,
      templateTypes: []
    }
    setFilters(clearedFilters)
    setAppliedFilters(clearedFilters)
  }

  const handleFeedbackChange = (interventionId: string, score: number) => {
    feedbackMutation.mutate({ interventionId, score })
  }

  // Flatten all timeline items from all pages
  const allTimelineItems = data?.pages.flatMap(page => page.timeline) || []

  // Get stats - use cached stats if available, otherwise show loading
  const stats = statsCache

  // Don't reset stats cache too aggressively - only when we get new data
  // This prevents flickering when navigating between pages

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Stats Loading */}
        <StatsLoadingSkeleton />

        {/* Filters Loading */}
        <FiltersSkeleton />

        {/* Timeline Loading */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">{t('history.timeline.title')}</h2>
          <TimelineLoadingSkeleton count={5} />
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="text-center py-12 px-4">
        <AlertCircle className="w-12 h-12 text-red-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {t('history.error.loadFailed')}
        </h3>
        <p className="text-gray-500 mb-6">
          {error instanceof Error ? error.message : t('history.error.networkError')}
        </p>
        <Button onClick={() => refetch()} className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4" />
          {t('history.error.tryAgain')}
        </Button>
      </div>
    )
  }

  // Empty state
  if (allTimelineItems.length === 0) {
    const hasActiveFilters = (
      appliedFilters.type !== 'all' ||
      appliedFilters.dateRange !== 'all' ||
      appliedFilters.moodMin !== null ||
      appliedFilters.moodMax !== null ||
      appliedFilters.templateTypes.length > 0
    )

    return (
      <div className="space-y-6">
        {/* Show stats even if empty */}
        {stats && <HistoryStats stats={stats} />}

        {/* Show filters */}
        <HistoryFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onApply={handleApplyFilters}
          onClear={handleClearFilters}
          isCollapsed={isFiltersCollapsed}
          onToggleCollapse={() => setIsFiltersCollapsed(!isFiltersCollapsed)}
        />

        <HistoryEmptyState
          type={hasActiveFilters ? 'filtered' : 'no-data'}
          onAction={() => {
            if (hasActiveFilters) {
              handleClearFilters()
            } else {
              window.location.href = '/dashboard'
            }
          }}
          actionLabel={hasActiveFilters ? 'Clear Filters' : t('history.timeline.empty.action')}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      {stats && <HistoryStats stats={stats} />}

      {/* Filters */}
      <HistoryFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
        isCollapsed={isFiltersCollapsed}
        onToggleCollapse={() => setIsFiltersCollapsed(!isFiltersCollapsed)}
      />

      {/* Timeline */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">{t('history.timeline.title')}</h2>

        <div className="space-y-4">
          {allTimelineItems.map((item) => {
            switch (item.type) {
              case 'checkin':
                return (
                  <CheckinTimelineItem
                    key={item.id}
                    checkin={item.data as CheckinRecord}
                    showDate={true}
                  />
                )
              case 'intervention':
                return (
                  <InterventionTimelineItem
                    key={item.id}
                    intervention={item.data as InterventionRecord}
                    onFeedbackChange={handleFeedbackChange}
                    showDate={true}
                    feedbackDisabled={feedbackMutation.isPending}
                  />
                )
              case 'grouped':
                return (
                  <GroupedTimelineItem
                    key={item.id}
                    groupedData={item.data as GroupedRecord}
                    onFeedbackChange={handleFeedbackChange}
                    showDate={true}
                    feedbackDisabled={feedbackMutation.isPending}
                  />
                )
              default:
                return null
            }
          })}
        </div>

        {/* Load More Button */}
        {hasNextPage && (
          <div className="text-center pt-6">
            {isFetchingNextPage ? (
              <PaginationLoadingIndicator />
            ) : (
              <Button
                onClick={() => fetchNextPage()}
                variant="outline"
                className="px-8 py-3"
              >
                {t('history.pagination.loadMore')}
              </Button>
            )}
          </div>
        )}

        {/* End indicator */}
        {!hasNextPage && allTimelineItems.length > 0 && (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">
              {t('history.timeline.noMore')}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}