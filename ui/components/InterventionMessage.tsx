'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { Heart, Lightbulb, Target, X, ExternalLink, Check } from 'lucide-react'

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

interface InterventionMessageProps {
  intervention: InterventionRecord
  onDismiss?: (interventionId: string) => void
  onInteraction?: (interventionId: string, action: 'view' | 'cta_click' | 'dismiss') => void
  className?: string
}

export function InterventionMessage({ 
  intervention, 
  onDismiss, 
  onInteraction,
  className 
}: InterventionMessageProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [isMarkedAsViewed, setIsMarkedAsViewed] = useState(intervention.viewed)
  const [loading, setLoading] = useState(false)

  const supabase = createClient()

  // Mark intervention as viewed when component mounts (if not already viewed)
  useEffect(() => {
    if (!intervention.viewed) {
      markAsViewed()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intervention.viewed])

  const markAsViewed = async () => {
    if (isMarkedAsViewed) return

    try {
      const { error } = await supabase
        .from('interventions')
        .update({ viewed: true })
        .eq('id', intervention.id)

      if (!error) {
        setIsMarkedAsViewed(true)
        onInteraction?.(intervention.id, 'view')
      }
    } catch (err) {
      console.error('Failed to mark intervention as viewed:', err)
    }
  }

  const handleCtaClick = async () => {
    setLoading(true)
    try {
      // Track CTA interaction
      onInteraction?.(intervention.id, 'cta_click')
      
      // For now, we'll just mark it as interacted with
      // In a real implementation, this might navigate to a specific page or trigger an action
      console.log('CTA clicked for intervention:', intervention.id)
      
      // You could add specific actions based on template type:
      // - compassion: might open a self-care guide
      // - reflection: might open a journaling interface
      // - action: might open goal-setting tools
      
    } catch (err) {
      console.error('Failed to handle CTA click:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDismiss = async () => {
    try {
      setIsVisible(false)
      onInteraction?.(intervention.id, 'dismiss')
      onDismiss?.(intervention.id)
    } catch (err) {
      console.error('Failed to dismiss intervention:', err)
    }
  }

  const getTemplateIcon = (templateType: string) => {
    switch (templateType) {
      case 'compassion':
        return <Heart className="w-5 h-5 text-pink-600" />
      case 'reflection':
        return <Lightbulb className="w-5 h-5 text-yellow-600" />
      case 'action':
        return <Target className="w-5 h-5 text-blue-600" />
      default:
        return <Heart className="w-5 h-5 text-muted-foreground" />
    }
  }

  const getTemplateColor = (templateType: string) => {
    switch (templateType) {
      case 'compassion':
        return 'border-pink-200 bg-pink-50'
      case 'reflection':
        return 'border-yellow-200 bg-yellow-50'
      case 'action':
        return 'border-blue-200 bg-blue-50'
      default:
        return 'border-muted bg-muted/30'
    }
  }

  const getTemplateLabel = (templateType: string) => {
    switch (templateType) {
      case 'compassion':
        return 'Self-Care Message'
      case 'reflection':
        return 'Reflection Prompt'
      case 'action':
        return 'Action Suggestion'
      default:
        return 'Coaching Message'
    }
  }

  if (!isVisible) {
    return null
  }

  return (
    <Card className={`${className} ${getTemplateColor(intervention.template_type)} border-2`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {getTemplateIcon(intervention.template_type)}
            <div>
              <CardTitle className="text-lg">{intervention.message_payload.title}</CardTitle>
              <CardDescription className="text-sm">
                {getTemplateLabel(intervention.template_type)}
                {intervention.fallback && (
                  <span className="ml-2 text-xs bg-muted px-2 py-0.5 rounded">
                    Template
                  </span>
                )}
              </CardDescription>
            </div>
          </div>
          
          <Button
            onClick={handleDismiss}
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-background/80"
            aria-label="Dismiss message"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Message Body */}
        <div className="prose prose-sm max-w-none">
          <p className="text-muted-foreground leading-relaxed">
            {intervention.message_payload.body}
          </p>
        </div>

        {/* Call to Action */}
        <div className="flex items-center justify-between pt-2">
          <Button
            onClick={handleCtaClick}
            disabled={loading}
            className="flex items-center gap-2"
            size="sm"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
            ) : (
              <ExternalLink className="w-4 h-4" />
            )}
            {intervention.message_payload.cta_text}
          </Button>

          {/* Viewed indicator */}
          {isMarkedAsViewed && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Check className="w-3 h-3" />
              <span>Viewed</span>
            </div>
          )}
        </div>

        {/* Metadata */}
        <div className="pt-2 border-t border-current/10">
          <p className="text-xs text-muted-foreground">
            Generated {new Date(intervention.created_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
              hour12: true
            })}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

// Container component for displaying multiple interventions
interface InterventionListProps {
  interventions: InterventionRecord[]
  onDismiss?: (interventionId: string) => void
  onInteraction?: (interventionId: string, action: 'view' | 'cta_click' | 'dismiss') => void
  className?: string
}

export function InterventionList({ 
  interventions, 
  onDismiss, 
  onInteraction,
  className 
}: InterventionListProps) {
  const [visibleInterventions, setVisibleInterventions] = useState(interventions)
  
  console.log('📋 InterventionList received:', interventions.length, 'interventions:', interventions)
  
  // Update visible interventions when props change
  useEffect(() => {
    setVisibleInterventions(interventions)
  }, [interventions])

  const handleDismiss = (interventionId: string) => {
    setVisibleInterventions(prev => 
      prev.filter(intervention => intervention.id !== interventionId)
    )
    onDismiss?.(interventionId)
  }

  if (visibleInterventions.length === 0) {
    return null
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {visibleInterventions.map((intervention) => (
        <InterventionMessage
          key={intervention.id}
          intervention={intervention}
          onDismiss={handleDismiss}
          onInteraction={onInteraction}
        />
      ))}
    </div>
  )
}