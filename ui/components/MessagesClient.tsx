'use client'

import { useState, useEffect, useCallback } from 'react'
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MessageCircle, Heart, Lightbulb, Target, ThumbsUp, Calendar, AlertCircle, Sparkles } from 'lucide-react'
import { FeedbackStars } from './FeedbackStars'
import { useTranslations, useLocale } from '@/components/translation-provider'

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

interface ApiResponse {
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
}

const ITEMS_PER_PAGE = 10

export function MessagesClient() {
  const [stats, setStats] = useState<ApiResponse['stats'] | null>(null)
  const queryClient = useQueryClient()
  const t = useTranslations()
  const locale = useLocale()

  // Fetch interventions with infinite query
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
    refetch
  } = useInfiniteQuery({
    queryKey: ['interventions-history'],
    queryFn: async ({ pageParam = 0 }) => {
      console.log('🔄 React Query fetching with pageParam:', pageParam)

      const params = new URLSearchParams({
        limit: ITEMS_PER_PAGE.toString(),
        offset: pageParam.toString(),
        include_stats: (pageParam === 0).toString()
      })

      console.log('📡 API URL:', `/api/interventions-history?${params}`)
      const response = await fetch(`/api/interventions-history?${params}`)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to load coaching messages' }))
        throw new Error(errorData.error || 'Failed to load coaching messages')
      }

      const apiResponse: ApiResponse = await response.json()

      if (!apiResponse.success) {
        throw new Error('Failed to load coaching messages')
      }

      // Set stats on first page load
      if (pageParam === 0 && apiResponse.stats) {
        setStats(apiResponse.stats)
      }

      console.log('📨 React Query received:', {
        pageParam,
        dataLength: apiResponse.data.length,
        hasMore: apiResponse.pagination.has_more,
        nextOffset: apiResponse.pagination.has_more ? pageParam + ITEMS_PER_PAGE : null,
        total: apiResponse.pagination.total
      })

      return {
        interventions: apiResponse.data,
        nextOffset: apiResponse.pagination.has_more ? pageParam + ITEMS_PER_PAGE : null,
        pagination: apiResponse.pagination
      }
    },
    getNextPageParam: (lastPage) => lastPage.nextOffset,
    initialPageParam: 0,
    staleTime: 0, // Disable caching for debugging
    gcTime: 0, // Disable caching for debugging
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
      queryClient.setQueryData(['interventions-history'], (oldData: unknown) => {
        if (!oldData || typeof oldData !== 'object') return oldData

        const data = oldData as {
          pages: Array<{
            interventions: InterventionRecord[]
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
            interventions: page.interventions.map((intervention: InterventionRecord) =>
              intervention.id === interventionId
                ? { ...intervention, feedback_score: score, feedback_at: new Date().toISOString() }
                : intervention
            )
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

  const getTemplateIcon = (templateType: string) => {
    switch (templateType) {
      case 'compassion':
        return <Heart className="w-4 h-4 text-pink-600" />
      case 'reflection':
        return <Lightbulb className="w-4 h-4 text-yellow-600" />
      case 'action':
        return <Target className="w-4 h-4 text-blue-600" />
      default:
        return <MessageCircle className="w-4 h-4 text-muted-foreground" />
    }
  }

  const getTemplateLabel = (templateType: string) => {
    switch (templateType) {
      case 'compassion':
        return t('messages.templateTypes.compassion')
      case 'reflection':
        return t('messages.templateTypes.reflection')
      case 'action':
        return t('messages.templateTypes.action')
      default:
        return t('messages.templateTypes.coaching')
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    const localeMap = { vi: 'vi-VN', ja: 'ja-JP', en: 'en-US' };
    const localeString = localeMap[locale] || 'en-US';
    
    if (date.toDateString() === today.toDateString()) {
      return `${t('messages.dateFormat.today')} ${date.toLocaleTimeString(localeString, { hour: 'numeric', minute: '2-digit' })}`
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `${t('messages.dateFormat.yesterday')} ${date.toLocaleTimeString(localeString, { hour: 'numeric', minute: '2-digit' })}`
    } else {
      return date.toLocaleDateString(localeString, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      })
    }
  }

  // Flatten all interventions from all pages
  const allInterventions = data?.pages.flatMap(page => page.interventions) || []

  if (isLoading) {
    return (
      <div className="space-y-3 sm:space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse p-3 sm:p-4 border border-gray-200 rounded-md sm:rounded-lg">
            <div className="flex items-start space-x-2 sm:space-x-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-200 rounded-full flex-shrink-0"></div>
              <div className="flex-1 min-w-0">
                <div className="h-3 sm:h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-2 sm:h-3 bg-gray-200 rounded w-full mb-1"></div>
                <div className="h-2 sm:h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-6 sm:py-8 px-4">
        <AlertCircle className="w-10 h-10 sm:w-12 sm:h-12 text-red-300 mx-auto mb-3 sm:mb-4" />
        <p className="text-red-600 text-xs sm:text-sm mb-4">
          {error instanceof Error ? error.message : t('messages.error.loadFailed')}
        </p>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 min-h-[44px] text-blue-600 hover:text-blue-700 text-sm font-medium border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
        >
          {t('messages.error.tryAgain')}
        </button>
      </div>
    )
  }

  if (allInterventions.length === 0) {
    return (
      <div className="text-center py-8 sm:py-12 px-4">
        <MessageCircle className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
        <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">{t('messages.empty.title')}</h3>
        <p className="text-sm sm:text-base text-gray-500 mb-4 sm:mb-6 leading-relaxed">
          {t('messages.empty.description')}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">{t('messages.stats.totalMessages')}</p>
                <p className="text-2xl font-bold">
                  {stats?.total_interventions ?? allInterventions.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <ThumbsUp className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">{t('messages.stats.withFeedback')}</p>
                <p className="text-2xl font-bold">
                  {stats?.with_feedback ?? allInterventions.filter(i => i.feedback_score !== null).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">{t('messages.stats.aiGenerated')}</p>
                <p className="text-2xl font-bold">
                  {stats?.ai_generated ?? allInterventions.filter(i => !i.fallback).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-pink-600" />
              <div>
                <p className="text-sm text-muted-foreground">{t('messages.stats.avgRating')}</p>
                <p className="text-2xl font-bold">
                  {stats?.avg_feedback_score ? `${stats.avg_feedback_score}/5` : 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Messages List */}
      <div className="space-y-4">
        {allInterventions.map((intervention) => (
          <Card key={intervention.id} className="relative hover:bg-gray-50 transition-colors">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {getTemplateIcon(intervention.template_type)}
                  <div>
                    <CardTitle className="text-lg">{intervention.message_payload.title}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {getTemplateLabel(intervention.template_type)}
                      </Badge>
                      {!intervention.fallback && (
                        <div className="flex items-center space-x-1 text-xs text-purple-600">
                          <Sparkles className="w-3 h-3" />
                          <span>{t('messages.badges.ai')}</span>
                        </div>
                      )}
                      {intervention.fallback && (
                        <Badge variant="outline" className="text-xs">
                          {t('messages.badges.template')}
                        </Badge>
                      )}
                      {intervention.analysis_status === 'pending' && (
                        <Badge variant="outline" className="text-xs border-amber-200 bg-amber-50 text-amber-700">
                          {t('messages.badges.analysisPending')}
                        </Badge>
                      )}
                      {intervention.analysis_status === 'ready' && (
                        <Badge variant="outline" className="text-xs border-emerald-200 bg-emerald-50 text-emerald-700">
                          {t('messages.badges.analysisReady')}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  {formatDate(intervention.created_at)}
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="prose prose-sm max-w-none">
                <p className="text-muted-foreground leading-relaxed break-words">
                  {intervention.message_payload.body}
                </p>
              </div>

              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-sm font-medium text-primary">
                  {intervention.message_payload.cta_text}
                </p>
              </div>

              {intervention.analysis_status === 'pending' && (
                <div className="flex items-start gap-2 p-3 border border-amber-200 bg-amber-50 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-amber-800">
                      {t('messages.feedback.analysisPendingTitle')}
                    </p>
                    <p className="text-xs text-amber-700 leading-relaxed">
                      {t('messages.feedback.analysisPendingBody')}
                    </p>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{t('messages.feedback.rateMessage')}</p>

                  <FeedbackStars
                    rating={intervention.feedback_score}
                    onRatingChange={(rating) =>
                      feedbackMutation.mutate({ interventionId: intervention.id, score: rating })
                    }
                    readonly={intervention.feedback_score !== null}
                    disabled={feedbackMutation.isPending}
                    size="md"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Load More Button */}
        {hasNextPage && (
          <div className="text-center pt-4">
            <Button
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              variant="outline"
              className="px-6 py-3 min-h-[44px]"
            >
              {isFetchingNextPage ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                  <span>{t('messages.feedback.loading')}</span>
                </div>
              ) : (
                t('messages.feedback.loadMore')
              )}
            </Button>
          </div>
        )}

        {/* End indicator */}
        {!hasNextPage && allInterventions.length > 0 && (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">
              {t('messages.feedback.endMessage')}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}