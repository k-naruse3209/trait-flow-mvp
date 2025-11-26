'use client'

import { InterventionList } from './InterventionMessage'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MessageCircle, AlertCircle, RefreshCw } from 'lucide-react'
import { useTranslations } from '@/components/translation-provider'

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
  feedback_score?: number | null
  analysis_status?: 'pending' | 'ready'
  analysis_ready_at?: string | null
  created_at: string
}

interface DashboardInterventionsProps {
  className?: string
  interventions: InterventionRecord[]
  loading: boolean
  error: string | null
  refreshInterventions: () => void
}

export function DashboardInterventions({ 
  className, 
  interventions, 
  loading, 
  error, 
  refreshInterventions 
}: DashboardInterventionsProps) {
  const t = useTranslations()
  
  console.log('🎨 DashboardInterventions render:', { 
    interventionsCount: interventions.length, 
    loading, 
    error,
    interventions: interventions 
  })

  const handleInterventionDismiss = (interventionId: string) => {
    console.log(`Intervention ${interventionId} dismissed`)
    // Refresh interventions to update the list
    refreshInterventions()
  }

  const handleInterventionInteraction = async (interventionId: string, action: 'view' | 'cta_click' | 'dismiss') => {
    console.log(`Intervention ${interventionId} - ${action}`)
    
    // Track interaction in analytics or monitoring system
    // This could be expanded to send data to your analytics service
    try {
      // Example: Track in a separate analytics table or service
      // await trackInterventionInteraction(interventionId, action)
    } catch (err) {
      console.error('Failed to track intervention interaction:', err)
    }
  }

  // Loading state
  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            {t('dashboard.interventions.title')}
          </CardTitle>
          <CardDescription>{t('dashboard.interventions.description')}</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current" />
            {t('dashboard.interventions.loading')}
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
            <MessageCircle className="w-5 h-5" />
            {t('dashboard.interventions.title')}
          </CardTitle>
          <CardDescription>{t('dashboard.interventions.description')}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8 space-y-4">
          <AlertCircle className="w-8 h-8 text-red-500" />
          <div className="text-center">
            <p className="text-sm text-red-600 mb-2">{error}</p>
            <Button 
              onClick={refreshInterventions} 
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
  if (interventions.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            {t('dashboard.interventions.title')}
          </CardTitle>
          <CardDescription>{t('dashboard.interventions.description')}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8 space-y-4">
          <MessageCircle className="w-12 h-12 text-muted-foreground" />
          <div className="text-center">
            <h3 className="font-medium mb-1">{t('dashboard.interventions.noMessage')}</h3>
            <p className="text-sm text-muted-foreground">
              {t('dashboard.interventions.noMessageDescription')}
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Display interventions
  console.log('🎨 Rendering interventions section with:', interventions.length, 'interventions')
  
  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          <h2 className="text-lg font-semibold">{t('dashboard.interventions.title')}</h2>
        </div>
        <Button 
          onClick={refreshInterventions} 
          variant="outline" 
          size="sm"
          className="flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          {t('dashboard.interventions.refresh')}
        </Button>
      </div>
      
      {interventions.length > 0 ? (
        <InterventionList
          interventions={interventions}
          onDismiss={handleInterventionDismiss}
          onInteraction={handleInterventionInteraction}
        />
      ) : (
        <div className="text-center py-4 text-muted-foreground">
          No interventions to display (but data was fetched: {interventions.length})
        </div>
      )}
    </div>
  )
}