'use client'

import { useState } from 'react'
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts'
import { Button } from '@/components/ui/button'
import { BigFiveScores } from '@/lib/tipi'
import { useTranslations } from '@/components/translation-provider'

interface TraitRadarChartProps {
  scores: BigFiveScores
  tScores?: BigFiveScores
  title?: string
  showTScores?: boolean
  allowScaleToggle?: boolean
  compact?: boolean
}

export function TraitRadarChart({
  scores,
  tScores,
  title,
  showTScores = false,
  allowScaleToggle = false,
  compact = false
}: TraitRadarChartProps) {
  const [displayTScores, setDisplayTScores] = useState(showTScores)
  const t = useTranslations()

  // Use translated title if not provided
  const chartTitle = title || t('results.chart.title')

  // Determine which scores to use
  const activeScores = displayTScores && tScores ? tScores : scores
  const isUsingTScores = displayTScores && tScores

  // Convert scores to chart data with translated trait names
  const data = [
    {
      trait: t('results.traits.extraversion'),
      score: isUsingTScores ? activeScores.extraversion : activeScores.extraversion * 100,
      fullMark: 100
    },
    {
      trait: t('results.traits.agreeableness'),
      score: isUsingTScores ? activeScores.agreeableness : activeScores.agreeableness * 100,
      fullMark: 100
    },
    {
      trait: t('results.traits.conscientiousness'),
      score: isUsingTScores ? activeScores.conscientiousness : activeScores.conscientiousness * 100,
      fullMark: 100
    },
    {
      trait: t('results.traits.neuroticism'),
      score: isUsingTScores ? activeScores.neuroticism : activeScores.neuroticism * 100,
      fullMark: 100
    },
    {
      trait: t('results.traits.openness'),
      score: isUsingTScores ? activeScores.openness : activeScores.openness * 100,
      fullMark: 100
    }
  ]

  return (
    <div className="w-full">
      {/* Header with title and scale toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h3 className="text-lg font-semibold mb-0">{chartTitle}</h3>

        {allowScaleToggle && tScores && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <span className="text-sm text-muted-foreground">{t('results.scores.title')}:</span>
            <div className="flex rounded-md border border-input bg-background">
              <Button
                variant={!displayTScores ? "default" : "ghost"}
                size="sm"
                onClick={() => setDisplayTScores(false)}
                className="rounded-r-none border-r min-h-[40px] flex-1 sm:flex-none"
              >
                {t('results.scores.normalized')}
              </Button>
              <Button
                variant={displayTScores ? "default" : "ghost"}
                size="sm"
                onClick={() => setDisplayTScores(true)}
                className="rounded-l-none min-h-[40px] flex-1 sm:flex-none"
              >
                {t('results.scores.tScores')}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Radar Chart */}
      <div className={compact ? "h-64 sm:h-80" : "h-72 landscape:h-64 sm:h-80 md:h-96"}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} margin={{ top: 15, right: 15, bottom: 15, left: 15 }}>
            <PolarGrid gridType="polygon" />
            <PolarAngleAxis
              dataKey="trait"
              tick={{
                fontSize: compact ? 9 : 11,
                fill: 'hsl(var(--foreground))',
                textAnchor: 'middle'
              }}
              className="text-foreground"
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tick={{
                fontSize: compact ? 7 : 9,
                fill: 'hsl(var(--muted-foreground))'
              }}
              tickCount={6}
            />
            <Radar
              name="Score"
              dataKey="score"
              stroke="hsl(var(--primary))"
              fill="hsl(var(--primary))"
              fillOpacity={0.2}
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 3 }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Score Details */}
      {!compact && (
        <div className="mt-4 md:mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-3">
          {data.map((item) => (
            <div key={item.trait} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg min-h-[44px]">
              <span className="font-medium text-sm md:text-base">{item.trait}</span>
              <span className="text-base md:text-lg font-semibold text-primary">
                {isUsingTScores ? Math.round(item.score) : `${Math.round(item.score)}%`}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Scale Information */}
      {allowScaleToggle && tScores && (
        <div className="mt-4 p-3 bg-muted/30 rounded-lg">
          <p className="text-xs text-muted-foreground">
            {isUsingTScores
              ? t('results.chart.tScoreInfo')
              : t('results.chart.normalizedInfo')
            }
          </p>
        </div>
      )}

      {/* Interpretation Guide - only show in non-compact mode */}
      {!compact && (
        <div className="mt-4 md:mt-6 p-3 md:p-4 bg-muted/30 rounded-lg">
          <h4 className="font-medium mb-2 text-sm md:text-base">{t('results.chart.understandingScores')}</h4>
          <div className="text-xs md:text-sm text-muted-foreground space-y-1">
            <p><strong>{t('results.traits.extraversion')}:</strong> {t('results.chart.traitDescriptions.extraversion')}</p>
            <p><strong>{t('results.traits.agreeableness')}:</strong> {t('results.chart.traitDescriptions.agreeableness')}</p>
            <p><strong>{t('results.traits.conscientiousness')}:</strong> {t('results.chart.traitDescriptions.conscientiousness')}</p>
            <p><strong>{t('results.traits.neuroticism')}:</strong> {t('results.chart.traitDescriptions.neuroticism')}</p>
            <p><strong>{t('results.traits.openness')}:</strong> {t('results.chart.traitDescriptions.openness')}</p>
          </div>
        </div>
      )}
    </div>
  )
}