'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

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

export function useInterventions() {
  const [interventions, setInterventions] = useState<InterventionRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pendingFeedbackCount, setPendingFeedbackCount] = useState(0)
  const [pendingFeedbackIntervention, setPendingFeedbackIntervention] = useState<InterventionRecord | null>(null)
  
  // Debug state changes
  useEffect(() => {
    console.log('🔄 Interventions state changed:', interventions.length, interventions)
  }, [interventions])

  const supabase = createClient()

  const fetchInterventions = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('Please log in to view your messages')
        return
      }

      // Fetch the most recent intervention that has an associated check-in
      const { data, error: fetchError } = await supabase
        .from('interventions')
        .select('*')
        .eq('user_id', user.id)
        .not('checkin_id', 'is', null) // Only interventions with check-in data
        .order('created_at', { ascending: false })
        .limit(1) // Show only the most recent intervention

      if (fetchError) {
        console.error('Error fetching interventions:', fetchError)
        setError('Failed to load coaching message')
        return
      }

      console.log('🔍 Interventions fetched:', data)
      console.log('🔍 About to call setInterventions with:', data || [])
      
      // If no data with inner join, try a simpler query
      if (!data || data.length === 0) {
        console.log('🔍 No interventions found, trying simpler query...')
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('interventions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
        
        if (fallbackError) {
          console.error('Fallback query error:', fallbackError)
        } else {
          console.log('🔍 Fallback interventions:', fallbackData)
          console.log('🔍 About to call setInterventions with fallback:', fallbackData || [])
          setInterventions(fallbackData || [])
          return
        }
      }
      
      setInterventions(data || [])
      console.log('🔍 setInterventions called with:', data || [])

      const { data: pendingData, count: pendingCount, error: pendingError } = await supabase
        .from('interventions')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .is('feedback_score', null)
        .order('created_at', { ascending: false })
        .limit(1)

      if (pendingError) {
        console.error('Failed to fetch pending feedback interventions:', pendingError)
      }

      setPendingFeedbackCount(pendingCount || 0)
      setPendingFeedbackIntervention((pendingData && pendingData.length > 0) ? pendingData[0] as InterventionRecord : null)
    } catch (err) {
      console.error('Error fetching interventions:', err)
      setError('Failed to load coaching message')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  const refreshInterventions = useCallback(() => {
    console.log('🔄 refreshInterventions called, fetching...')
    fetchInterventions()
  }, [fetchInterventions])

  useEffect(() => {
    fetchInterventions()
  }, [fetchInterventions])

  return {
    interventions,
    loading,
    error,
    refreshInterventions,
    pendingFeedbackCount,
    pendingFeedbackIntervention
  }
}