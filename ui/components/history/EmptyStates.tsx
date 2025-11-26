'use client'

import { Calendar, MessageSquare, Filter, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useTranslations } from '@/components/translation-provider'

interface EmptyStateProps {
  type?: 'general' | 'filtered' | 'no-data'
  onAction?: () => void
  actionLabel?: string
}

export function HistoryEmptyState({ 
  type = 'general', 
  onAction, 
  actionLabel 
}: EmptyStateProps) {
  const t = useTranslations()

  if (type === 'filtered') {
    return (
      <Card className="border-dashed border-2">
        <CardContent className="text-center py-12 px-4">
          <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
            <Filter className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No results found
          </h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            No history items match your current filters. Try adjusting your filter criteria or clearing all filters.
          </p>
          {onAction && (
            <Button onClick={onAction} variant="outline">
              {actionLabel || 'Clear Filters'}
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  if (type === 'no-data') {
    return (
      <Card className="border-dashed border-2">
        <CardContent className="text-center py-12 px-4">
          <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
            <Calendar className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {t('history.timeline.empty.title')}
          </h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            {t('history.timeline.empty.description')}
          </p>
          {onAction && (
            <Button onClick={onAction}>
              {actionLabel || t('history.timeline.empty.action')}
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  // General empty state with features overview
  return (
    <div className="space-y-8">
      <Card className="border-dashed border-2">
        <CardContent className="text-center py-12 px-4">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
            <TrendingUp className="w-10 h-10 text-blue-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-3">
            {t('history.timeline.empty.title')}
          </h3>
          <p className="text-gray-500 mb-8 max-w-lg mx-auto">
            {t('history.timeline.empty.description')}
          </p>
          {onAction && (
            <Button onClick={onAction} size="lg" className="px-8">
              {actionLabel || t('history.timeline.empty.action')}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Feature Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <h4 className="font-semibold text-blue-900">Track Your Journey</h4>
            </div>
            <p className="text-blue-800 text-sm leading-relaxed">
              Record your daily mood and energy levels to build a comprehensive history of your mental health journey.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <h4 className="font-semibold text-purple-900">Get Personalized Insights</h4>
            </div>
            <p className="text-purple-800 text-sm leading-relaxed">
              Receive AI-powered coaching messages and insights based on your mood patterns and check-in history.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export function LoadingStateIndicator({ message }: { message?: string }) {
  const t = useTranslations()
  
  return (
    <div className="flex items-center justify-center py-8">
      <div className="flex items-center gap-3 text-muted-foreground">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div>
        <span className="text-sm">
          {message || t('history.timeline.loading')}
        </span>
      </div>
    </div>
  )
}

export function FilterChangeIndicator() {
  return (
    <div className="flex items-center justify-center py-4">
      <div className="flex items-center gap-2 text-muted-foreground bg-muted/30 px-3 py-2 rounded-full">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
        <span className="text-xs">Applying filters...</span>
      </div>
    </div>
  )
}

export function PaginationLoadingIndicator() {
  return (
    <div className="text-center py-6">
      <div className="inline-flex items-center gap-2 text-muted-foreground bg-muted/30 px-4 py-2 rounded-full">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
        <span className="text-sm">Loading more...</span>
      </div>
    </div>
  )
}