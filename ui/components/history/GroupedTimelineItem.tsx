'use client'

import { Calendar, ArrowDown, MessageSquare } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckinTimelineItem } from './CheckinTimelineItem'
import { InterventionTimelineItem } from './InterventionTimelineItem'
import { useTranslations, useLocale } from '@/components/translation-provider'

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

interface GroupedRecord {
  checkin: CheckinRecord
  interventions: InterventionRecord[]
}

interface GroupedTimelineItemProps {
  groupedData: GroupedRecord
  onFeedbackChange?: (interventionId: string, score: number) => void
  showDate?: boolean
  feedbackDisabled?: boolean
}

export function GroupedTimelineItem({ 
  groupedData, 
  onFeedbackChange,
  showDate = true,
  feedbackDisabled = false
}: GroupedTimelineItemProps) {
  const t = useTranslations()
  const locale = useLocale()
  const { checkin, interventions } = groupedData

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

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="space-y-0">
          {/* Group Header with Date */}
          {showDate && (
            <div className="px-4 sm:px-6 py-3 bg-muted/30 border-b">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span className="font-medium">{formatDate(checkin.created_at)}</span>
                <span>{formatTime(checkin.created_at)}</span>
                <div className="ml-auto flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {interventions.length === 1 
                      ? t('history.timeline.groupedItem.checkinAndMessages').replace('{count}', '1')
                      : t('history.timeline.groupedItem.checkinAndMessages_plural').replace('{count}', interventions.length.toString())
                    }
                  </Badge>
                </div>
              </div>
            </div>
          )}

          {/* Check-in Section */}
          <div className="p-4 sm:p-6 border-b bg-gradient-to-r from-blue-50/30 to-transparent">
            <CheckinTimelineItem 
              checkin={checkin} 
              showDate={false} 
              compact={false}
            />
          </div>

          {/* Connection Indicator */}
          <div className="flex justify-center py-2 bg-muted/20">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <ArrowDown className="w-4 h-4" />
              <span>{t('history.items.intervention.title')}</span>
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>

          {/* Interventions Section */}
          <div className="space-y-0">
            {interventions.map((intervention, index) => (
              <div 
                key={intervention.id}
                className={`
                  p-4 sm:p-6 bg-gradient-to-r from-purple-50/30 to-transparent
                  ${index < interventions.length - 1 ? 'border-b border-dashed border-muted-foreground/20' : ''}
                `}
              >
                <InterventionTimelineItem
                  intervention={intervention}
                  onFeedbackChange={onFeedbackChange}
                  showDate={false}
                  compact={false}
                  feedbackDisabled={feedbackDisabled}
                />
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}