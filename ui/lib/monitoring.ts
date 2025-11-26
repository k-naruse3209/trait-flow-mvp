// Performance monitoring and error tracking utilities

export interface PerformanceMetric {
  endpoint: string
  method: string
  duration: number
  status: number
  timestamp: Date
  userId?: string
  error?: string
}

export interface ErrorLog {
  message: string
  stack?: string
  endpoint?: string
  userId?: string
  timestamp: Date
  level: 'error' | 'warn' | 'info'
  metadata?: Record<string, unknown>
}

export interface OpenAIMetric {
  success: boolean
  duration: number
  model: string
  promptTokens?: number
  completionTokens?: number
  totalTokens?: number
  error?: string
  timestamp: Date
  userId?: string
}

class MonitoringService {
  private performanceMetrics: PerformanceMetric[] = []
  private errorLogs: ErrorLog[] = []
  private openAIMetrics: OpenAIMetric[] = []

  // Track API endpoint performance
  trackPerformance(metric: PerformanceMetric) {
    this.performanceMetrics.push(metric)
    
    // Log slow requests (> 2 seconds)
    if (metric.duration > 2000) {
      console.warn(`🐌 Slow request detected: ${metric.method} ${metric.endpoint} took ${metric.duration}ms`)
    }

    // Log errors
    if (metric.status >= 400) {
      console.error(`❌ API Error: ${metric.method} ${metric.endpoint} returned ${metric.status}`)
    }

    // Keep only last 1000 metrics in memory
    if (this.performanceMetrics.length > 1000) {
      this.performanceMetrics = this.performanceMetrics.slice(-1000)
    }
  }

  // Track errors with structured logging
  logError(error: ErrorLog) {
    this.errorLogs.push(error)
    
    // Console logging based on level
    switch (error.level) {
      case 'error':
        console.error(`❌ ${error.message}`, error.metadata)
        break
      case 'warn':
        console.warn(`⚠️ ${error.message}`, error.metadata)
        break
      case 'info':
        console.info(`ℹ️ ${error.message}`, error.metadata)
        break
    }

    // Keep only last 1000 error logs in memory
    if (this.errorLogs.length > 1000) {
      this.errorLogs = this.errorLogs.slice(-1000)
    }
  }

  // Track OpenAI API performance
  trackOpenAI(metric: OpenAIMetric) {
    this.openAIMetrics.push(metric)

    if (!metric.success) {
      console.error(`🤖 OpenAI API Error: ${metric.error}`)
    }

    // Log slow OpenAI requests (> 5 seconds)
    if (metric.duration > 5000) {
      console.warn(`🐌 Slow OpenAI request: ${metric.duration}ms`)
    }

    // Keep only last 1000 OpenAI metrics in memory
    if (this.openAIMetrics.length > 1000) {
      this.openAIMetrics = this.openAIMetrics.slice(-1000)
    }
  }

  // Get performance analytics
  getPerformanceAnalytics(timeWindow: number = 3600000) { // Default 1 hour
    const now = new Date()
    const cutoff = new Date(now.getTime() - timeWindow)
    
    const recentMetrics = this.performanceMetrics.filter(
      metric => metric.timestamp >= cutoff
    )

    if (recentMetrics.length === 0) {
      return {
        totalRequests: 0,
        averageResponseTime: 0,
        errorRate: 0,
        slowRequestRate: 0,
        endpointStats: {}
      }
    }

    const totalRequests = recentMetrics.length
    const averageResponseTime = recentMetrics.reduce((sum, m) => sum + m.duration, 0) / totalRequests
    const errorCount = recentMetrics.filter(m => m.status >= 400).length
    const slowRequestCount = recentMetrics.filter(m => m.duration > 2000).length
    
    // Group by endpoint
    const endpointStats: Record<string, {
      count: number
      averageTime: number
      errorRate: number
    }> = {}

    recentMetrics.forEach(metric => {
      const key = `${metric.method} ${metric.endpoint}`
      if (!endpointStats[key]) {
        endpointStats[key] = { count: 0, averageTime: 0, errorRate: 0 }
      }
      endpointStats[key].count++
      endpointStats[key].averageTime += metric.duration
    })

    // Calculate averages
    Object.keys(endpointStats).forEach(key => {
      const stats = endpointStats[key]
      stats.averageTime = stats.averageTime / stats.count
      const endpointMetrics = recentMetrics.filter(m => `${m.method} ${m.endpoint}` === key)
      const endpointErrors = endpointMetrics.filter(m => m.status >= 400).length
      stats.errorRate = (endpointErrors / endpointMetrics.length) * 100
    })

    return {
      totalRequests,
      averageResponseTime: Math.round(averageResponseTime),
      errorRate: Math.round((errorCount / totalRequests) * 100),
      slowRequestRate: Math.round((slowRequestCount / totalRequests) * 100),
      endpointStats
    }
  }

  // Get OpenAI analytics
  getOpenAIAnalytics(timeWindow: number = 3600000) { // Default 1 hour
    const now = new Date()
    const cutoff = new Date(now.getTime() - timeWindow)
    
    const recentMetrics = this.openAIMetrics.filter(
      metric => metric.timestamp >= cutoff
    )

    if (recentMetrics.length === 0) {
      return {
        totalRequests: 0,
        successRate: 0,
        averageResponseTime: 0,
        totalTokensUsed: 0,
        averageTokensPerRequest: 0
      }
    }

    const totalRequests = recentMetrics.length
    const successCount = recentMetrics.filter(m => m.success).length
    const averageResponseTime = recentMetrics.reduce((sum, m) => sum + m.duration, 0) / totalRequests
    const totalTokens = recentMetrics.reduce((sum, m) => sum + (m.totalTokens || 0), 0)

    return {
      totalRequests,
      successRate: Math.round((successCount / totalRequests) * 100),
      averageResponseTime: Math.round(averageResponseTime),
      totalTokensUsed: totalTokens,
      averageTokensPerRequest: Math.round(totalTokens / totalRequests)
    }
  }

  // Get recent errors
  getRecentErrors(limit: number = 50) {
    return this.errorLogs
      .slice(-limit)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }

  // Check system health
  getSystemHealth() {
    const performanceStats = this.getPerformanceAnalytics()
    const openAIStats = this.getOpenAIAnalytics()
    
    const health = {
      status: 'healthy' as 'healthy' | 'warning' | 'critical',
      issues: [] as string[],
      metrics: {
        performance: performanceStats,
        openAI: openAIStats
      }
    }

    // Check for issues
    if (performanceStats.errorRate > 10) {
      health.status = 'warning'
      health.issues.push(`High error rate: ${performanceStats.errorRate}%`)
    }

    if (performanceStats.errorRate > 25) {
      health.status = 'critical'
    }

    if (performanceStats.averageResponseTime > 3000) {
      health.status = health.status === 'critical' ? 'critical' : 'warning'
      health.issues.push(`Slow response time: ${performanceStats.averageResponseTime}ms`)
    }

    if (openAIStats.successRate < 97 && openAIStats.totalRequests > 0) {
      health.status = health.status === 'critical' ? 'critical' : 'warning'
      health.issues.push(`Low OpenAI success rate: ${openAIStats.successRate}%`)
    }

    return health
  }
}

// Singleton instance
export const monitoring = new MonitoringService()

// Middleware helper for API routes
export function withMonitoring<T extends unknown[], R>(
  endpoint: string,
  method: string,
  handler: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    const startTime = Date.now()
    let status = 200
    let error: string | undefined

    try {
      const result = await handler(...args)
      return result
    } catch (err) {
      status = 500
      error = err instanceof Error ? err.message : 'Unknown error'
      
      monitoring.logError({
        message: `API Error in ${endpoint}`,
        stack: err instanceof Error ? err.stack : undefined,
        endpoint,
        timestamp: new Date(),
        level: 'error',
        metadata: { method, error }
      })
      
      throw err
    } finally {
      const duration = Date.now() - startTime
      
      monitoring.trackPerformance({
        endpoint,
        method,
        duration,
        status,
        timestamp: new Date(),
        error
      })
    }
  }
}

// User engagement tracking
export interface UserEngagementMetric {
  userId: string
  action: 'login' | 'checkin' | 'intervention_view' | 'feedback_submit' | 'assessment_complete'
  timestamp: Date
  metadata?: Record<string, unknown>
}

class EngagementTracker {
  private engagementMetrics: UserEngagementMetric[] = []

  track(metric: UserEngagementMetric) {
    this.engagementMetrics.push(metric)
    
    // Keep only last 10000 engagement metrics
    if (this.engagementMetrics.length > 10000) {
      this.engagementMetrics = this.engagementMetrics.slice(-10000)
    }
  }

  // Get daily active users
  getDailyActiveUsers(date: Date = new Date()): number {
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    const uniqueUsers = new Set(
      this.engagementMetrics
        .filter(m => m.timestamp >= startOfDay && m.timestamp <= endOfDay)
        .map(m => m.userId)
    )

    return uniqueUsers.size
  }

  // Get check-in completion rate
  getCheckinCompletionRate(days: number = 7): number {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - days)

    const recentMetrics = this.engagementMetrics.filter(
      m => m.timestamp >= cutoff
    )

    const uniqueUsers = new Set(recentMetrics.map(m => m.userId))
    const usersWithCheckins = new Set(
      recentMetrics
        .filter(m => m.action === 'checkin')
        .map(m => m.userId)
    )

    if (uniqueUsers.size === 0) return 0
    return Math.round((usersWithCheckins.size / uniqueUsers.size) * 100)
  }

  // Get average message rating
  getAverageMessageRating(days: number = 30): number {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - days)

    const feedbackMetrics = this.engagementMetrics.filter(
      m => m.timestamp >= cutoff && 
          m.action === 'feedback_submit' && 
          m.metadata?.rating
    )

    if (feedbackMetrics.length === 0) return 0

    const totalRating = feedbackMetrics.reduce(
      (sum, m) => sum + (typeof m.metadata?.rating === 'number' ? m.metadata.rating : 0), 
      0
    )

    return Math.round((totalRating / feedbackMetrics.length) * 10) / 10
  }

  // Get continuation rate (users with 4+ check-ins in 2 weeks)
  getContinuationRate(): number {
    const twoWeeksAgo = new Date()
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)

    const recentCheckins = this.engagementMetrics.filter(
      m => m.timestamp >= twoWeeksAgo && m.action === 'checkin'
    )

    // Group by user
    const userCheckinCounts: Record<string, number> = {}
    recentCheckins.forEach(m => {
      userCheckinCounts[m.userId] = (userCheckinCounts[m.userId] || 0) + 1
    })

    const totalUsers = Object.keys(userCheckinCounts).length
    if (totalUsers === 0) return 0

    const continuingUsers = Object.values(userCheckinCounts).filter(count => count >= 4).length
    
    return Math.round((continuingUsers / totalUsers) * 100)
  }

  // Get activity breakdown
  getActivityBreakdown(days: number = 30): {
    checkins: number
    assessments: number
    feedbacks: number
    interventionViews: number
  } {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - days)

    const recentMetrics = this.engagementMetrics.filter(
      m => m.timestamp >= cutoff
    )

    return {
      checkins: recentMetrics.filter(m => m.action === 'checkin').length,
      assessments: recentMetrics.filter(m => m.action === 'assessment_complete').length,
      feedbacks: recentMetrics.filter(m => m.action === 'feedback_submit').length,
      interventionViews: recentMetrics.filter(m => m.action === 'intervention_view').length,
    }
  }

  // Get user retention rates
  getUserRetention(): { day1: number; day7: number; day30: number } {
    // Simple retention calculation based on recent activity
    const day1Users = this.getActiveUsers(1)
    const day7Users = this.getActiveUsers(7)
    const day30Users = this.getActiveUsers(30)
    const todayUsers = this.getDailyActiveUsers()

    return {
      day1: day1Users > 0 ? Math.round((todayUsers / day1Users) * 100) : 0,
      day7: day7Users > 0 ? Math.round((todayUsers / day7Users) * 100) : 0,
      day30: day30Users > 0 ? Math.round((todayUsers / day30Users) * 100) : 0,
    }
  }

  // Get active users for a period
  getActiveUsers(days: number): number {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - days)

    const uniqueUsers = new Set(
      this.engagementMetrics
        .filter(m => m.timestamp >= cutoff)
        .map(m => m.userId)
    )

    return uniqueUsers.size
  }

  // Get engagement trends
  getEngagementTrends(days: number): Array<{
    date: string
    activeUsers: number
    checkins: number
    feedbacks: number
  }> {
    const trends = []

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]

      const startOfDay = new Date(date)
      startOfDay.setHours(0, 0, 0, 0)
      
      const endOfDay = new Date(date)
      endOfDay.setHours(23, 59, 59, 999)

      const dayMetrics = this.engagementMetrics.filter(
        m => m.timestamp >= startOfDay && m.timestamp <= endOfDay
      )

      trends.push({
        date: dateStr,
        activeUsers: new Set(dayMetrics.map(m => m.userId)).size,
        checkins: dayMetrics.filter(m => m.action === 'checkin').length,
        feedbacks: dayMetrics.filter(m => m.action === 'feedback_submit').length,
      })
    }

    return trends
  }
}

export const engagement = new EngagementTracker()