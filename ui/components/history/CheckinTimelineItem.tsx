'use client'

import { Calendar, MessageSquare } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useTranslations, useLocale } from '@/components/translation-provider'

interface CheckinRecord {
  id: string
  user_id: string
  mood_score: number
  energy_level: 'low' | 'mid' | 'high'
  free_text: string | null
  created_at: string
}

interface CheckinTimelineItemProps {
  checkin: CheckinRecord
  showDate?: boolean
  compact?: boolean
}

export function CheckinTimelineItem({ 
  checkin, 
  showDate = true, 
  compact = false 
}: CheckinTimelineItemProps) {
  const t = useTranslations()
  const locale = useLocale()

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
    return t(`history.mood.${score}`)
  }

  const getMoodColor = (score: number): string => {
    switch (score) {
      case 1: return 'bg-red-100 text-red-800 border-red-200'
      case 2: return 'bg-orange-100 text-orange-800 border-orange-200'
      case 3: return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 4: return 'bg-green-100 text-green-800 border-green-200'
      case 5: return 'bg-emerald-100 text-emerald-800 border-emerald-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
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
    return t(`history.energy.${level}`)
  }

  const getEnergyColor = (level: string): string => {
    switch (level) {
      case 'low': return 'bg-red-100 text-red-700 border-red-200'
      case 'mid': return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'high': return 'bg-green-100 text-green-700 border-green-200'
      default: return 'bg-gray-100 text-gray-700 border-gray-200'
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

  if (compact) {
    return (
      <div className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/30 transition-colors">
        {/* Mood */}
        <div className="flex items-center gap-2">
          <span className="text-lg">{getMoodEmoji(checkin.mood_score)}</span>
          <Badge variant="outline" className={getMoodColor(checkin.mood_score)}>
            {checkin.mood_score}/5
          </Badge>
        </div>

        {/* Energy */}
        <div className="flex items-center gap-2">
          <span className="text-sm">{getEnergyIcon(checkin.energy_level)}</span>
          <Badge variant="outline" className={getEnergyColor(checkin.energy_level)}>
            {getEnergyLabel(checkin.energy_level)}
          </Badge>
        </div>

        {/* Note indicator */}
        {checkin.free_text && (
          <MessageSquare className="w-4 h-4 text-muted-foreground" />
        )}

        {/* Date */}
        {showDate && (
          <div className="ml-auto text-xs text-muted-foreground">
            {formatDate(checkin.created_at)}
          </div>
        )}
      </div>
    )
  }

  return (
    <Card className="hover:bg-muted/30 transition-colors">
      <CardContent className="p-4 sm:p-6">
        <div className="space-y-4">
          {/* Header with date */}
          {showDate && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>{formatDate(checkin.created_at)}</span>
              <span>{formatTime(checkin.created_at)}</span>
            </div>
          )}

          {/* Mood and Energy */}
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Mood Section */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">{getMoodEmoji(checkin.mood_score)}</span>
                <div>
                  <div className="font-medium text-sm">{t('history.items.checkin.mood')}</div>
                  <div className="text-xs text-muted-foreground">
                    {getMoodLabel(checkin.mood_score)} ({checkin.mood_score}/5)
                  </div>
                </div>
              </div>
              <Badge variant="outline" className={getMoodColor(checkin.mood_score)}>
                {getMoodLabel(checkin.mood_score)}
              </Badge>
            </div>

            {/* Energy Section */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-lg">{getEnergyIcon(checkin.energy_level)}</span>
                <div>
                  <div className="font-medium text-sm">{t('history.items.checkin.energy')}</div>
                  <div className="text-xs text-muted-foreground">
                    {getEnergyLabel(checkin.energy_level)}
                  </div>
                </div>
              </div>
              <Badge variant="outline" className={getEnergyColor(checkin.energy_level)}>
                {getEnergyLabel(checkin.energy_level)}
              </Badge>
            </div>
          </div>

          {/* Free Text Note */}
          {checkin.free_text && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">{t('history.items.checkin.note')}</span>
              </div>
              <div className="p-3 bg-muted/30 rounded-lg border-l-4 border-primary/20">
                <p className="text-sm text-muted-foreground leading-relaxed break-words">
                  {checkin.free_text}
                </p>
              </div>
            </div>
          )}

          {/* No note indicator */}
          {!checkin.free_text && (
            <div className="text-xs text-muted-foreground italic">
              {t('history.items.checkin.noNote')}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}