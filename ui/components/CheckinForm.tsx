'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import { useTranslations } from '@/components/translation-provider'

export interface CheckinData {
  moodScore: number
  energyLevel: 'low' | 'mid' | 'high'
  freeText: string
}

interface CheckinFormProps {
  onSubmit: (data: CheckinData) => Promise<void>
  loading?: boolean
}

export function CheckinForm({ onSubmit, loading = false }: CheckinFormProps) {
  const [moodScore, setMoodScore] = useState<number>(3)
  const [energyLevel, setEnergyLevel] = useState<'low' | 'mid' | 'high'>('mid')
  const [freeText, setFreeText] = useState<string>('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const t = useTranslations()

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!moodScore || moodScore < 1 || moodScore > 5) {
      newErrors.moodScore = t('dashboard.checkin.errors.moodScore')
    }

    if (!energyLevel || !['low', 'mid', 'high'].includes(energyLevel)) {
      newErrors.energyLevel = t('dashboard.checkin.errors.energyLevel')
    }

    if (freeText && freeText.length > 280) {
      newErrors.freeText = t('dashboard.checkin.errors.freeText')
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    try {
      await onSubmit({
        moodScore,
        energyLevel,
        freeText: freeText.trim()
      })
    } catch (error) {
      console.error('Failed to submit check-in:', error)
    }
  }

  const getMoodLabel = (score: number): string => {
    switch (score) {
      case 1: return t('dashboard.checkin.mood.veryLow')
      case 2: return t('dashboard.checkin.mood.low')
      case 3: return t('dashboard.checkin.mood.neutral')
      case 4: return t('dashboard.checkin.mood.good')
      case 5: return t('dashboard.checkin.mood.excellent')
      default: return t('dashboard.checkin.mood.neutral')
    }
  }

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

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-base sm:text-lg">{t('dashboard.checkin.title')}</CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          {t('dashboard.checkin.description')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* Mood Score Slider */}
          <div className="space-y-3 sm:space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <Label htmlFor="mood-slider" className="text-sm sm:text-base font-medium">
                {t('dashboard.checkin.moodScore')}
              </Label>
              <div className="flex items-center gap-2">
                <span className="text-xl sm:text-2xl">{getMoodEmoji(moodScore)}</span>
                <span className="text-xs sm:text-sm font-medium text-muted-foreground">
                  {getMoodLabel(moodScore)} ({moodScore}/5)
                </span>
              </div>
            </div>

            <div className="px-2">
              <Slider
                id="mood-slider"
                min={1}
                max={5}
                step={1}
                value={[moodScore]}
                onValueChange={(value: number[]) => setMoodScore(value[0])}
                className="w-full"
                disabled={loading}
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span className="text-xs">{t('dashboard.checkin.mood.veryLow')}</span>
                <span className="text-xs hidden sm:inline">{t('dashboard.checkin.mood.low')}</span>
                <span className="text-xs">{t('dashboard.checkin.mood.neutral')}</span>
                <span className="text-xs hidden sm:inline">{t('dashboard.checkin.mood.good')}</span>
                <span className="text-xs">{t('dashboard.checkin.mood.excellent')}</span>
              </div>
            </div>

            {errors.moodScore && (
              <p className="text-sm text-red-600">{errors.moodScore}</p>
            )}
          </div>

          {/* Energy Level Selection */}
          <div className="space-y-3 sm:space-y-4">
            <Label className="text-sm sm:text-base font-medium">{t('dashboard.checkin.energyLevel')}</Label>
            <RadioGroup
              value={energyLevel}
              onValueChange={(value) => setEnergyLevel(value as 'low' | 'mid' | 'high')}
              disabled={loading}
              className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4"
            >
              <div className="flex items-center space-x-2 p-2 sm:p-3 border rounded-lg hover:bg-accent transition-colors">
                <RadioGroupItem value="low" id="energy-low" />
                <Label htmlFor="energy-low" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <span className="text-base sm:text-lg">🔋</span>
                    <div>
                      <div className="font-medium text-sm sm:text-base">{t('dashboard.checkin.energy.low')}</div>
                      <div className="text-xs text-muted-foreground">{t('dashboard.checkin.energy.lowDescription')}</div>
                    </div>
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-2 p-2 sm:p-3 border rounded-lg hover:bg-accent transition-colors">
                <RadioGroupItem value="mid" id="energy-mid" />
                <Label htmlFor="energy-mid" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <span className="text-base sm:text-lg">🔋🔋</span>
                    <div>
                      <div className="font-medium text-sm sm:text-base">{t('dashboard.checkin.energy.medium')}</div>
                      <div className="text-xs text-muted-foreground">{t('dashboard.checkin.energy.mediumDescription')}</div>
                    </div>
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-2 p-2 sm:p-3 border rounded-lg hover:bg-accent transition-colors">
                <RadioGroupItem value="high" id="energy-high" />
                <Label htmlFor="energy-high" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <span className="text-base sm:text-lg">🔋🔋🔋</span>
                    <div>
                      <div className="font-medium text-sm sm:text-base">{t('dashboard.checkin.energy.high')}</div>
                      <div className="text-xs text-muted-foreground">{t('dashboard.checkin.energy.highDescription')}</div>
                    </div>
                  </div>
                </Label>
              </div>
            </RadioGroup>

            {errors.energyLevel && (
              <p className="text-sm text-red-600">{errors.energyLevel}</p>
            )}
          </div>

          {/* Optional Free Text */}
          <div className="space-y-2">
            <Label htmlFor="free-text" className="text-sm sm:text-base font-medium">
              {t('dashboard.checkin.additionalNotes')}
            </Label>
            <Textarea
              id="free-text"
              placeholder={t('dashboard.checkin.notesPlaceholder')}
              value={freeText}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFreeText(e.target.value)}
              disabled={loading}
              className="min-h-[80px] resize-none"
              maxLength={280}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span className="hidden sm:inline">{t('dashboard.checkin.notesHelper')}</span>
              <span className="sm:hidden">{t('dashboard.checkin.notesHelperMobile')}</span>
              <span>{freeText.length}/280</span>
            </div>

            {errors.freeText && (
              <p className="text-sm text-red-600">{errors.freeText}</p>
            )}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={loading}
            size="lg"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                {t('dashboard.checkin.submitting')}
              </div>
            ) : (
              t('dashboard.checkin.submitButton')
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}