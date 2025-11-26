'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { CheckinForm, CheckinData } from './CheckinForm'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { Check, Calendar, MessageSquare, AlertCircle, RefreshCw, ShieldCheck } from 'lucide-react'
import { useDashboard } from '@/contexts/DashboardContext'
import { useTranslations, useLocale } from '@/components/translation-provider'
import { FeedbackStars } from './FeedbackStars'

interface CheckinRecord {
  id: string
  user_id: string
  mood_score: number
  energy_level: 'low' | 'mid' | 'high'
  free_text: string | null
  created_at: string
}

interface CheckinCardProps {
  pendingFeedbackCount?: number
  pendingFeedbackIntervention?: {
    id: string
    message_payload: { title: string; cta_text: string; body: string }
    feedback_score?: number | null
    created_at: string
  } | null
  onFeedbackSubmitted?: () => void
}

export function CheckinCard({
  pendingFeedbackCount = 0,
  pendingFeedbackIntervention,
  onFeedbackSubmitted
}: CheckinCardProps) {
  const [todayCheckin, setTodayCheckin] = useState<CheckinRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [feedbackError, setFeedbackError] = useState<string | null>(null)
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false)

  const supabase = createClient()
  const { refreshInterventions, refreshCheckins, refreshAnalytics } = useDashboard()
  const t = useTranslations()
  const locale = useLocale()

  // Check if user has checked in today
  const checkTodayCheckin = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError(t('dashboard.checkin.errors.loginRequired'))
        return
      }

      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split('T')[0]

      const { data, error: fetchError } = await supabase
        .from('checkins')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', `${today}T00:00:00.000Z`)
        .lt('created_at', `${today}T23:59:59.999Z`)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (fetchError) {
        console.error('Error fetching today\'s check-in:', fetchError)
        setError(t('dashboard.checkin.errors.loadFailed'))
        return
      }

      setTodayCheckin(data)
    } catch (err) {
      console.error('Error checking today\'s check-in:', err)
      setError(t('dashboard.checkin.errors.loadFailed'))
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitFeedback = async (score: number) => {
    if (!pendingFeedbackIntervention) return

    try {
      setFeedbackSubmitting(true)
      setFeedbackError(null)

      const response = await fetch('/api/intervention-feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ interventionId: pendingFeedbackIntervention.id, score })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to submit feedback' }))
        throw new Error(errorData.error || 'Failed to submit feedback')
      }

      onFeedbackSubmitted?.()
    } catch (err) {
      console.error('Failed to submit feedback:', err)
      setFeedbackError(err instanceof Error ? err.message : t('dashboard.checkin.feedbackGate.error'))
    } finally {
      setFeedbackSubmitting(false)
    }
  }

  // Submit new check-in
  const handleSubmitCheckin = async (data: CheckinData) => {
    try {
      setSubmitting(true)
      setError(null)

      const response = await fetch('/api/checkins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to submit check-in')
      }

      const result = await response.json()

      // Update the local state with the new check-in
      setTodayCheckin(result.data)
      setShowForm(false)

      // Refresh all dashboard components to show updated data
      console.log('🔄 Triggering dashboard refresh in 2 seconds...')
      setTimeout(() => {
        console.log('🔄 Refreshing all dashboard components now...')
        refreshInterventions()
        refreshCheckins()
        refreshAnalytics()
      }, 2000) // Increased delay to ensure intervention is generated

      console.log('✅ Check-in submitted successfully')
    } catch (err) {
      console.error('Failed to submit check-in:', err)
      setError(err instanceof Error ? err.message : t('dashboard.checkin.errors.submitFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  // Load today's check-in on component mount
  useEffect(() => {
    checkTodayCheckin()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
      case 'low': return t('dashboard.checkin.energy.lowEnergy')
      case 'mid': return t('dashboard.checkin.energy.mediumEnergy')
      case 'high': return t('dashboard.checkin.energy.highEnergy')
      default: return 'Unknown'
    }
  }

  const formatDate = (dateString: string): string => {
    const localeMap = { vi: 'vi-VN', ja: 'ja-JP', en: 'en-US' };
    return new Date(dateString).toLocaleTimeString(localeMap[locale] || 'en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: locale !== 'vi'
    })
  }

  // Loading state
  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
            {t('dashboard.checkin.title')}
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">{t('dashboard.history.description')}</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-6 sm:py-8">
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-current" />
            <span className="text-xs sm:text-sm">{t('dashboard.checkin.loadingStatus')}</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Error state
  if (error && !todayCheckin) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
            {t('dashboard.checkin.title')}
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">{t('dashboard.history.description')}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-6 sm:py-8 space-y-3 sm:space-y-4">
          <AlertCircle className="w-6 h-6 sm:w-8 sm:h-8 text-red-500" />
          <div className="text-center px-4">
            <p className="text-xs sm:text-sm text-red-600 mb-2 break-words">{error}</p>
            <Button
              onClick={checkTodayCheckin}
              variant="outline"
              size="sm"
              className="flex items-center gap-2 text-xs sm:text-sm"
            >
              <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4" />
              {t('dashboard.checkin.tryAgain')}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (pendingFeedbackCount > 0 && !todayCheckin) {
    return (
      <Card className="w-full border-primary/40 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            {t('dashboard.checkin.feedbackGate.title')}
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            {t('dashboard.checkin.feedbackGate.subtitle')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-primary/20 bg-background p-3 sm:p-4">
            <p className="text-sm font-medium mb-1">
              {pendingFeedbackIntervention?.message_payload.title || t('dashboard.checkin.feedbackGate.placeholderTitle')}
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t('dashboard.checkin.feedbackGate.copy')}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium">{t('dashboard.checkin.feedbackGate.rateLabel')}</p>
              <p className="text-xs text-muted-foreground">
                {t('dashboard.checkin.feedbackGate.reward')}
              </p>
            </div>

            <FeedbackStars
              rating={pendingFeedbackIntervention ? pendingFeedbackIntervention.feedback_score : null}
              onRatingChange={handleSubmitFeedback}
              disabled={feedbackSubmitting}
              size="md"
            />
          </div>

          {feedbackError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-700">
              {feedbackError}
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-muted-foreground">
            <span>
              {t('dashboard.checkin.feedbackGate.locked')}
            </span>
            <Link
              href={`/${locale}/messages`}
              className="inline-flex items-center justify-center rounded-md border border-primary/30 px-3 py-2 text-primary text-sm font-medium hover:bg-primary/10"
            >
              {t('dashboard.checkin.feedbackGate.viewMessages')}
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Show form if user wants to check in or hasn't checked in today
  if (showForm || !todayCheckin) {
    return (
      <div className="w-full">
        <CheckinForm onSubmit={handleSubmitCheckin} loading={submitting} />
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

      </div>
    )
  }

  // Show completed check-in summary
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
          {t('dashboard.checkin.completed')}
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          {t('dashboard.checkin.completedAt')} {formatDate(todayCheckin.created_at)}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Mood and Energy Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <span className="text-2xl">{getMoodEmoji(todayCheckin.mood_score)}</span>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-sm sm:text-base">{getMoodLabel(todayCheckin.mood_score)}</p>
              <p className="text-xs sm:text-sm text-muted-foreground">{t('dashboard.history.mood')}: {todayCheckin.mood_score}/5</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <span className="text-lg sm:text-xl">{getEnergyIcon(todayCheckin.energy_level)}</span>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-sm sm:text-base">{getEnergyLabel(todayCheckin.energy_level)}</p>
              <p className="text-xs sm:text-sm text-muted-foreground">{t('dashboard.history.energyLevel')}</p>
            </div>
          </div>
        </div>

        {/* Free Text Note */}
        {todayCheckin.free_text && (
          <div className="p-3 bg-muted/30 rounded-lg">
            <div className="flex items-start gap-2">
              <MessageSquare className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium mb-1">{t('dashboard.checkin.yourNote')}</p>
                <p className="text-xs sm:text-sm text-muted-foreground break-words">{todayCheckin.free_text}</p>
              </div>
            </div>
          </div>
        )}

        {/* Completion Message */}
        <div className="pt-2 text-center">
          <p className="text-xs sm:text-sm text-muted-foreground">
            {t('dashboard.checkin.completionMessage')}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}