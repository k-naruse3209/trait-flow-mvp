'use client'

import { 
  Calendar, 
  MessageCircle, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Zap, 
  Target,
  Activity
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useTranslations } from '@/components/translation-provider'

interface HistoryStats {
  totalCheckins: number
  totalInterventions: number
  avgMoodScore: number
  streakDays: number
  moodTrend: 'improving' | 'declining' | 'stable'
  energyDistribution: { low: number; mid: number; high: number }
  dateRange: { from: string; to: string }
}

interface HistoryStatsProps {
  stats: HistoryStats
  loading?: boolean
}

export function HistoryStats({ stats, loading = false }: HistoryStatsProps) {
  const t = useTranslations()

  const getMoodTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="w-4 h-4 text-green-600" />
      case 'declining':
        return <TrendingDown className="w-4 h-4 text-red-600" />
      case 'stable':
      default:
        return <Minus className="w-4 h-4 text-gray-600" />
    }
  }

  const getMoodTrendColor = (trend: string) => {
    switch (trend) {
      case 'improving':
        return 'text-green-600'
      case 'declining':
        return 'text-red-600'
      case 'stable':
      default:
        return 'text-gray-600'
    }
  }

  const getMoodScoreColor = (score: number) => {
    if (score >= 4) return 'text-green-600'
    if (score >= 3) return 'text-yellow-600'
    if (score >= 2) return 'text-orange-600'
    return 'text-red-600'
  }

  const getStreakColor = (days: number) => {
    if (days >= 7) return 'text-green-600'
    if (days >= 3) return 'text-yellow-600'
    return 'text-gray-600'
  }

  const getDominantEnergyLevel = () => {
    const { low, mid, high } = stats.energyDistribution
    if (high >= low && high >= mid) return { level: 'high', percentage: high, color: 'text-green-600' }
    if (mid >= low && mid >= high) return { level: 'mid', percentage: mid, color: 'text-yellow-600' }
    return { level: 'low', percentage: low, color: 'text-red-600' }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-3 bg-gray-200 rounded w-20 mb-2"></div>
                  <div className="h-6 bg-gray-200 rounded w-12"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const dominantEnergy = getDominantEnergyLevel()

  return (
    <div className="space-y-4">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Check-ins */}
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-full">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-muted-foreground truncate">
                  {t('history.stats.totalCheckins')}
                </p>
                <p className="text-2xl font-bold text-blue-600">
                  {stats.totalCheckins}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Interventions */}
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-full">
                <MessageCircle className="w-5 h-5 text-purple-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-muted-foreground truncate">
                  {t('history.stats.totalInterventions')}
                </p>
                <p className="text-2xl font-bold text-purple-600">
                  {stats.totalInterventions}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Average Mood */}
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-full">
                <Activity className="w-5 h-5 text-yellow-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-muted-foreground truncate">
                  {t('history.stats.avgMoodScore')}
                </p>
                <div className="flex items-center gap-2">
                  <p className={`text-2xl font-bold ${getMoodScoreColor(stats.avgMoodScore)}`}>
                    {stats.avgMoodScore.toFixed(1)}
                  </p>
                  <span className="text-sm text-muted-foreground">/5</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Current Streak */}
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-full">
                <Target className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-muted-foreground truncate">
                  {t('history.stats.streakDays')}
                </p>
                <div className="flex items-center gap-2">
                  <p className={`text-2xl font-bold ${getStreakColor(stats.streakDays)}`}>
                    {stats.streakDays}
                  </p>
                  <span className="text-sm text-muted-foreground">
                    {stats.streakDays === 1 ? t('history.stats.day') : t('history.stats.days')}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Mood Trend */}
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-full">
                  {getMoodTrendIcon(stats.moodTrend)}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {t('history.stats.moodTrend')}
                  </p>
                  <p className={`font-semibold ${getMoodTrendColor(stats.moodTrend)}`}>
                    {t(`history.trends.${stats.moodTrend}`)}
                  </p>
                </div>
              </div>
              <Badge 
                variant="outline" 
                className={`${getMoodTrendColor(stats.moodTrend)} border-current`}
              >
                {t(`history.trends.${stats.moodTrend}`)}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Energy Distribution */}
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-full">
                  <Zap className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {t('history.stats.energyDistribution')}
                  </p>
                  <p className={`font-semibold ${dominantEnergy.color}`}>
                    {t(`history.energy.${dominantEnergy.level}`)} ({dominantEnergy.percentage}%)
                  </p>
                </div>
              </div>
              <div className="flex gap-1">
                <div className="text-xs text-center">
                  <div className={`w-3 h-8 rounded-sm ${stats.energyDistribution.low > 0 ? 'bg-red-400' : 'bg-gray-200'}`}></div>
                  <span className="text-muted-foreground">{stats.energyDistribution.low}%</span>
                </div>
                <div className="text-xs text-center">
                  <div className={`w-3 h-8 rounded-sm ${stats.energyDistribution.mid > 0 ? 'bg-yellow-400' : 'bg-gray-200'}`}></div>
                  <span className="text-muted-foreground">{stats.energyDistribution.mid}%</span>
                </div>
                <div className="text-xs text-center">
                  <div className={`w-3 h-8 rounded-sm ${stats.energyDistribution.high > 0 ? 'bg-green-400' : 'bg-gray-200'}`}></div>
                  <span className="text-muted-foreground">{stats.energyDistribution.high}%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}