'use client'

import { Calendar, Heart, Lightbulb, Target, MessageCircle, Sparkles } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FeedbackStars } from '@/components/FeedbackStars'
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

interface InterventionTimelineItemProps {
  intervention: InterventionRecord
  onFeedbackChange?: (interventionId: string, score: number) => void
  showDate?: boolean
  compact?: boolean
  feedbackDisabled?: boolean
}

export function InterventionTimelineItem({ 
  intervention, 
  onFeedbackChange,
  showDate = true, 
  compact = false,
  feedbackDisabled = false
}: InterventionTimelineItemProps) {
  const t = useTranslations()
  const locale = useLocale()

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
    return t(`history.filters.templateTypes.${templateType}`)
  }

  const getTemplateColor = (templateType: string) => {
    switch (templateType) {
      case 'compassion':
        return 'bg-pink-100 text-pink-800 border-pink-200'
      case 'reflection':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'action':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 1) {
      return t('history.dateFormat.today')
    } else if (diffDays === 2) {
      return t('history.dateFormat.yesterday')
    } else if (diffDays <= 7) {
      return t('history.dateFormat.daysAgo').replace('{days}', (diffDays - 1).toString())
    } else if (diffDays <= 30) {
      const weeks = Math.floor((diffDays - 1) / 7)
      if (weeks === 1) {
        return t('history.dateFormat.weeksAgo').replace('{weeks}', weeks.toString())
      } else {
        return t('history.dateFormat.weeksAgo_plural').replace('{weeks}', weeks.toString())
      }
    } else {
      const months = Math.floor((diffDays - 1) / 30)
      if (months === 1) {
        return t('history.dateFormat.monthsAgo').replace('{months}', months.toString())
      } else {
        return t('history.dateFormat.monthsAgo_plural').replace('{months}', months.toString())
      }
    }
  }

  const formatTime = (dateString: string): string => {
    const localeMap = { vi: 'vi-VN', ja: 'ja-JP', en: 'en-US' }
    const time = new Date(dateString).toLocaleTimeString(localeMap[locale] || 'en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: locale !== 'vi'
    })
    return t('history.dateFormat.timeFormat').replace('{time}', time)
  }

  const handleFeedbackChange = (score: number) => {
    if (onFeedbackChange && !feedbackDisabled) {
      onFeedbackChange(intervention.id, score)
    }
  }

  if (compact) {
    return (
      <div className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/30 transition-colors">
        {/* Template Icon */}
        <div className="flex-shrink-0">
          {getTemplateIcon(intervention.template_type)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate">
            {intervention.message_payload.title}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className={`text-xs ${getTemplateColor(intervention.template_type)}`}>
              {getTemplateLabel(intervention.template_type)}
            </Badge>
            {!intervention.fallback && (
              <div className="flex items-center space-x-1 text-xs text-purple-600">
                <Sparkles className="w-3 h-3" />
                <span>{t('history.items.badges.ai')}</span>
              </div>
            )}
            {intervention.analysis_status === 'pending' && (
              <Badge variant="outline" className="text-[10px] border-amber-200 bg-amber-50 text-amber-700">
                {t('history.items.badges.analysisPending')}
              </Badge>
            )}
            {intervention.analysis_status === 'ready' && (
              <Badge variant="outline" className="text-[10px] border-emerald-200 bg-emerald-50 text-emerald-700">
                {t('history.items.badges.analysisReady')}
              </Badge>
            )}
          </div>
        </div>

        {/* Feedback */}
        {intervention.feedback_score && (
          <div className="flex-shrink-0">
            <FeedbackStars
              rating={intervention.feedback_score}
              readonly={true}
              size="sm"
            />
          </div>
        )}

        {/* Date */}
        {showDate && (
          <div className="flex-shrink-0 text-xs text-muted-foreground">
            {formatDate(intervention.created_at)}
          </div>
        )}
      </div>
    )
  }

  return (
    <Card className="hover:bg-muted/30 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {getTemplateIcon(intervention.template_type)}
            <div className="min-w-0 flex-1">
              <CardTitle className="text-lg leading-tight">
                {intervention.message_payload.title}
              </CardTitle>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className={getTemplateColor(intervention.template_type)}>
                  {getTemplateLabel(intervention.template_type)}
                </Badge>
                {!intervention.fallback ? (
                  <div className="flex items-center space-x-1 text-xs text-purple-600">
                    <Sparkles className="w-3 h-3" />
                    <span>{t('history.items.badges.ai')}</span>
                  </div>
                ) : (
                  <Badge variant="outline" className="text-xs">
                    {t('history.items.badges.template')}
                  </Badge>
                )}
                {intervention.analysis_status === 'pending' && (
                  <Badge variant="outline" className="text-xs border-amber-200 bg-amber-50 text-amber-700">
                    {t('history.items.badges.analysisPending')}
                  </Badge>
                )}
                {intervention.analysis_status === 'ready' && (
                  <Badge variant="outline" className="text-xs border-emerald-200 bg-emerald-50 text-emerald-700">
                    {t('history.items.badges.analysisReady')}
                  </Badge>
                )}
                {!intervention.viewed && (
                  <Badge variant="default" className="text-xs bg-blue-600">
                    {t('history.items.badges.unviewed')}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Date */}
          {showDate && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground flex-shrink-0 ml-4">
              <Calendar className="w-3 h-3" />
              <div className="text-right">
                <div>{formatDate(intervention.created_at)}</div>
                <div>{formatTime(intervention.created_at)}</div>
              </div>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Message Body */}
        <div className="prose prose-sm max-w-none">
          <p className="text-muted-foreground leading-relaxed break-words">
            {intervention.message_payload.body}
          </p>
        </div>

        {/* Call to Action */}
        <div className="p-3 bg-muted/30 rounded-lg border-l-4 border-primary/20">
          <p className="text-sm font-medium text-primary">
            {intervention.message_payload.cta_text}
          </p>
        </div>

        {/* Feedback Section */}
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium">
                {intervention.feedback_score 
                  ? t('history.items.intervention.feedback')
                  : t('history.items.intervention.noFeedback')
                }
              </p>
              {!intervention.feedback_score && (
                <p className="text-xs text-muted-foreground">
                  {t('history.items.intervention.rateNow')}
                </p>
              )}
            </div>

            <FeedbackStars
              rating={intervention.feedback_score}
              onRatingChange={handleFeedbackChange}
              readonly={intervention.feedback_score !== null || feedbackDisabled}
              disabled={feedbackDisabled}
              size="md"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}