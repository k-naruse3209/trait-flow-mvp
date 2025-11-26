// Mood Analytics and Calculation Utilities

export interface CheckinRecord {
  id: string
  mood_score: number
  energy_level: 'low' | 'mid' | 'high'
  free_text: string | null
  created_at: string
}

export interface MoodAnalytics {
  averageMood: number
  moodTrend: 'improving' | 'declining' | 'stable'
  energyDistribution: {
    low: number
    mid: number
    high: number
  }
  totalCheckins: number
  streakDays: number
}

export interface MoodInsights {
  weeklyMoodAverage: number | null
  monthlyMoodAverage: number
  dominantEnergyLevel: 'low' | 'mid' | 'high'
  checkinFrequency: number
  moodStability: number | null
}

/**
 * Calculate average mood from last N check-ins
 * @param checkins Array of recent check-ins
 * @param limit Number of check-ins to consider (default: 3)
 * @returns Average mood score
 */
export function calculateMoodAverage(checkins: CheckinRecord[], limit: number = 3): number {
  if (!checkins || checkins.length === 0) {
    return 3 // Default neutral mood
  }

  // Take the most recent N check-ins
  const recentCheckins = checkins.slice(0, limit)
  const totalMood = recentCheckins.reduce((sum, checkin) => sum + checkin.mood_score, 0)
  
  return Math.round((totalMood / recentCheckins.length) * 10) / 10 // Round to 1 decimal
}

/**
 * Determine mood trend based on recent check-ins
 * @param checkins Array of recent check-ins (should be ordered by date desc)
 * @returns Mood trend indicator
 */
export function calculateMoodTrend(checkins: CheckinRecord[]): 'improving' | 'declining' | 'stable' {
  if (!checkins || checkins.length < 3) {
    return 'stable'
  }

  // Compare first half vs second half of recent check-ins
  const midPoint = Math.floor(checkins.length / 2)
  const recentHalf = checkins.slice(0, midPoint)
  const olderHalf = checkins.slice(midPoint)

  const recentAvg = calculateMoodAverage(recentHalf, recentHalf.length)
  const olderAvg = calculateMoodAverage(olderHalf, olderHalf.length)

  const difference = recentAvg - olderAvg

  if (difference > 0.3) return 'improving'
  if (difference < -0.3) return 'declining'
  return 'stable'
}

/**
 * Calculate energy level distribution
 * @param checkins Array of check-ins
 * @returns Energy distribution percentages
 */
export function calculateEnergyDistribution(checkins: CheckinRecord[]): {
  low: number
  mid: number
  high: number
} {
  if (!checkins || checkins.length === 0) {
    return { low: 0, mid: 0, high: 0 }
  }

  const counts = { low: 0, mid: 0, high: 0 }
  
  checkins.forEach(checkin => {
    counts[checkin.energy_level]++
  })

  const total = checkins.length
  
  return {
    low: Math.round((counts.low / total) * 100),
    mid: Math.round((counts.mid / total) * 100),
    high: Math.round((counts.high / total) * 100)
  }
}

/**
 * Calculate check-in streak (consecutive days)
 * @param checkins Array of check-ins ordered by date desc
 * @returns Number of consecutive days with check-ins
 */
export function calculateCheckinStreak(checkins: CheckinRecord[]): number {
  if (!checkins || checkins.length === 0) {
    return 0
  }

  let streak = 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Group check-ins by date
  const checkinsByDate = new Map<string, boolean>()
  
  checkins.forEach(checkin => {
    const checkinDate = new Date(checkin.created_at)
    checkinDate.setHours(0, 0, 0, 0)
    const dateKey = checkinDate.toISOString().split('T')[0]
    checkinsByDate.set(dateKey, true)
  })

  // Count consecutive days starting from today
  const currentDate = new Date(today)
  
  while (true) {
    const dateKey = currentDate.toISOString().split('T')[0]
    
    if (checkinsByDate.has(dateKey)) {
      streak++
      currentDate.setDate(currentDate.getDate() - 1)
    } else {
      break
    }
  }

  return streak
}

/**
 * Generate comprehensive mood analytics
 * @param checkins Array of user's check-ins
 * @returns Complete mood analytics object
 */
export function generateMoodAnalytics(checkins: CheckinRecord[]): MoodAnalytics {
  return {
    averageMood: calculateMoodAverage(checkins, 7), // Last 7 check-ins
    moodTrend: calculateMoodTrend(checkins),
    energyDistribution: calculateEnergyDistribution(checkins),
    totalCheckins: checkins.length,
    streakDays: calculateCheckinStreak(checkins)
  }
}

/**
 * Determine intervention template type based on mood average
 * @param moodAverage Average mood score from recent check-ins
 * @returns Template type for intervention
 */
export function determineInterventionTemplate(moodAverage: number): 'compassion' | 'reflection' | 'action' {
  if (moodAverage <= 2.5) {
    return 'compassion' // Low mood - need support and compassion
  } else if (moodAverage <= 3.5) {
    return 'reflection' // Neutral mood - encourage reflection
  } else {
    return 'action' // Good mood - encourage action and growth
  }
}

/**
 * Check if user needs intervention based on mood patterns
 * @param checkins Recent check-ins
 * @returns Whether intervention should be triggered
 */
export function shouldTriggerIntervention(checkins: CheckinRecord[]): boolean {
  if (!checkins || checkins.length === 0) {
    return false
  }

  const analytics = generateMoodAnalytics(checkins)
  
  // Trigger intervention if:
  // 1. Average mood is very low (≤ 2)
  // 2. Mood is declining trend with low average
  // 3. User has consistent check-ins (≥ 3 recent check-ins)
  
  if (analytics.averageMood <= 2) {
    return true
  }
  
  if (analytics.moodTrend === 'declining' && analytics.averageMood <= 3) {
    return true
  }
  
  if (checkins.length >= 3) {
    return true // Always provide intervention for engaged users
  }
  
  return false
}