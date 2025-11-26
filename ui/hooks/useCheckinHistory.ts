'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

interface CheckinRecord {
    id: string
    user_id: string
    mood_score: number
    energy_level: 'low' | 'mid' | 'high'
    free_text: string | null
    created_at: string
}

export function useCheckinHistory(limit: number = 10, showPagination: boolean = true) {
    const [checkins, setCheckins] = useState<CheckinRecord[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [currentPage, setCurrentPage] = useState(0)
    const [hasMore, setHasMore] = useState(false)
    const [totalCount, setTotalCount] = useState(0)

    const supabase = createClient()

    const fetchCheckins = useCallback(async (offset: number = 0) => {
        try {
            setLoading(true)
            setError(null)

            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                setError('Please log in to view your check-in history')
                return
            }

            // Fetch checkins with pagination
            const { data, error: fetchError, count } = await supabase
                .from('checkins')
                .select('*', { count: 'exact' })
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1)

            if (fetchError) {
                console.error('Error fetching check-ins:', fetchError)
                setError('Failed to load check-in history')
                return
            }

            console.log('📊 Check-ins fetched:', data?.length || 0)
            setCheckins(data || [])
            setTotalCount(count || 0)
            const shouldPaginate =
                showPagination && (data?.length || 0) === limit && (offset + limit) < (count || 0)
            setHasMore(shouldPaginate)
        } catch (err) {
            console.error('Error fetching check-ins:', err)
            setError('Failed to load check-in history')
        } finally {
            setLoading(false)
        }
    }, [limit, showPagination, supabase])

    const refreshCheckins = useCallback(() => {
        console.log('🔄 refreshCheckins called')
        fetchCheckins(currentPage * limit)
    }, [fetchCheckins, currentPage, limit])

    const handlePreviousPage = () => {
        if (!showPagination) return
        if (currentPage > 0) {
            setCurrentPage(currentPage - 1)
        }
    }

    const handleNextPage = () => {
        if (!showPagination) return
        if (hasMore) {
            setCurrentPage(currentPage + 1)
        }
    }

    useEffect(() => {
        fetchCheckins(currentPage * limit)
    }, [fetchCheckins, currentPage, limit])

    return {
        checkins,
        loading,
        error,
        currentPage,
        hasMore,
        totalCount,
        refreshCheckins,
        handlePreviousPage,
        handleNextPage
    }
}