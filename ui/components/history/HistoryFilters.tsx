'use client'

import { useState } from 'react'
import { 
  Filter, 
  X, 
  ChevronDown, 
  Calendar, 
  MessageSquare, 
  Activity,
  Heart,
  Lightbulb,
  Target
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { useTranslations } from '@/components/translation-provider'

export interface HistoryFiltersState {
  type: 'all' | 'checkins' | 'interventions'
  dateRange: 'week' | 'month' | 'quarter' | 'all'
  moodMin: number | null
  moodMax: number | null
  templateTypes: string[]
}

interface HistoryFiltersProps {
  filters: HistoryFiltersState
  onFiltersChange: (filters: HistoryFiltersState) => void
  onApply: () => void
  onClear: () => void
  isCollapsed?: boolean
  onToggleCollapse?: () => void
  className?: string
}

export function HistoryFilters({
  filters,
  onFiltersChange,
  onApply,
  onClear,
  isCollapsed = false,
  onToggleCollapse,
  className = ''
}: HistoryFiltersProps) {
  const t = useTranslations()
  const [localFilters, setLocalFilters] = useState<HistoryFiltersState>(filters)

  const updateFilter = <K extends keyof HistoryFiltersState>(
    key: K,
    value: HistoryFiltersState[K]
  ) => {
    const newFilters = { ...localFilters, [key]: value }
    setLocalFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const toggleTemplateType = (templateType: string) => {
    const newTemplateTypes = localFilters.templateTypes.includes(templateType)
      ? localFilters.templateTypes.filter(t => t !== templateType)
      : [...localFilters.templateTypes, templateType]
    
    updateFilter('templateTypes', newTemplateTypes)
  }

  const hasActiveFilters = () => {
    return (
      localFilters.type !== 'all' ||
      localFilters.dateRange !== 'all' ||
      localFilters.moodMin !== null ||
      localFilters.moodMax !== null ||
      localFilters.templateTypes.length > 0
    )
  }

  const getActiveFiltersCount = () => {
    let count = 0
    if (localFilters.type !== 'all') count++
    if (localFilters.dateRange !== 'all') count++
    if (localFilters.moodMin !== null || localFilters.moodMax !== null) count++
    if (localFilters.templateTypes.length > 0) count++
    return count
  }

  const getTemplateIcon = (templateType: string) => {
    switch (templateType) {
      case 'compassion':
        return <Heart className="w-4 h-4 text-pink-600" />
      case 'reflection':
        return <Lightbulb className="w-4 h-4 text-yellow-600" />
      case 'action':
        return <Target className="w-4 h-4 text-blue-600" />
      default:
        return <MessageSquare className="w-4 h-4 text-muted-foreground" />
    }
  }

  // Mobile collapsed view
  if (isCollapsed) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleCollapse}
          className="flex items-center gap-2 min-h-[44px]"
        >
          <Filter className="w-4 h-4" />
          {t('history.filters.showFilters')}
          {hasActiveFilters() && (
            <Badge variant="secondary" className="ml-1 text-xs">
              {getActiveFiltersCount()}
            </Badge>
          )}
        </Button>
        
        {hasActiveFilters() && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="text-muted-foreground hover:text-foreground min-h-[44px]"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="w-5 h-5" />
            {t('history.filters.title')}
          </CardTitle>
          
          <div className="flex items-center gap-2">
            {hasActiveFilters() && (
              <Badge variant="secondary" className="text-xs">
                {getActiveFiltersCount()} active
              </Badge>
            )}
            
            {onToggleCollapse && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleCollapse}
                className="lg:hidden min-h-[44px]"
              >
                {t('history.filters.hideFilters')}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Type Filter */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            {t('history.filters.type.label')}
          </Label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full justify-between min-h-[44px]">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  {t(`history.filters.type.${localFilters.type}`)}
                </div>
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-full">
              <DropdownMenuItem onClick={() => updateFilter('type', 'all')}>
                {t('history.filters.type.all')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => updateFilter('type', 'checkins')}>
                {t('history.filters.type.checkins')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => updateFilter('type', 'interventions')}>
                {t('history.filters.type.interventions')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Date Range Filter */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            {t('history.filters.dateRange.label')}
          </Label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full justify-between min-h-[44px]">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {t(`history.filters.dateRange.${localFilters.dateRange}`)}
                </div>
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-full">
              <DropdownMenuItem onClick={() => updateFilter('dateRange', 'week')}>
                {t('history.filters.dateRange.week')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => updateFilter('dateRange', 'month')}>
                {t('history.filters.dateRange.month')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => updateFilter('dateRange', 'quarter')}>
                {t('history.filters.dateRange.quarter')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => updateFilter('dateRange', 'all')}>
                {t('history.filters.dateRange.all')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Mood Range Filter */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">
            {t('history.filters.moodRange.label')}
          </Label>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">
                {t('history.filters.moodRange.min')}
              </Label>
              <Input
                type="number"
                min="1"
                max="5"
                placeholder="1"
                value={localFilters.moodMin || ''}
                onChange={(e) => {
                  const value = e.target.value ? parseInt(e.target.value) : null
                  updateFilter('moodMin', value)
                }}
                className="min-h-[44px]"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">
                {t('history.filters.moodRange.max')}
              </Label>
              <Input
                type="number"
                min="1"
                max="5"
                placeholder="5"
                value={localFilters.moodMax || ''}
                onChange={(e) => {
                  const value = e.target.value ? parseInt(e.target.value) : null
                  updateFilter('moodMax', value)
                }}
                className="min-h-[44px]"
              />
            </div>
          </div>
        </div>

        {/* Template Types Filter */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">
            {t('history.filters.templateTypes.label')}
          </Label>
          <div className="space-y-2">
            {['compassion', 'reflection', 'action'].map((templateType) => (
              <div
                key={templateType}
                className={`
                  flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors min-h-[44px]
                  ${localFilters.templateTypes.includes(templateType)
                    ? 'bg-primary/10 border-primary'
                    : 'hover:bg-muted/50'
                  }
                `}
                onClick={() => toggleTemplateType(templateType)}
              >
                {getTemplateIcon(templateType)}
                <span className="flex-1 text-sm">
                  {t(`history.filters.templateTypes.${templateType}`)}
                </span>
                {localFilters.templateTypes.includes(templateType) && (
                  <Badge variant="secondary" className="text-xs">
                    ✓
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
          <Button 
            onClick={onApply} 
            className="flex-1 min-h-[44px]"
            disabled={!hasActiveFilters()}
          >
            <Activity className="w-4 h-4 mr-2" />
            {t('history.filters.apply')}
          </Button>
          
          <Button 
            variant="outline" 
            onClick={onClear}
            className="flex-1 min-h-[44px]"
            disabled={!hasActiveFilters()}
          >
            <X className="w-4 h-4 mr-2" />
            {t('history.filters.clear')}
          </Button>
        </div>

        {/* Active Filters Summary */}
        {hasActiveFilters() && (
          <div className="space-y-2 pt-4 border-t">
            <Label className="text-xs text-muted-foreground">Active Filters:</Label>
            <div className="flex flex-wrap gap-2">
              {localFilters.type !== 'all' && (
                <Badge variant="secondary" className="text-xs">
                  Type: {t(`history.filters.type.${localFilters.type}`)}
                </Badge>
              )}
              {localFilters.dateRange !== 'all' && (
                <Badge variant="secondary" className="text-xs">
                  Date: {t(`history.filters.dateRange.${localFilters.dateRange}`)}
                </Badge>
              )}
              {(localFilters.moodMin !== null || localFilters.moodMax !== null) && (
                <Badge variant="secondary" className="text-xs">
                  Mood: {localFilters.moodMin || 1}-{localFilters.moodMax || 5}
                </Badge>
              )}
              {localFilters.templateTypes.map((type) => (
                <Badge key={type} variant="secondary" className="text-xs">
                  {t(`history.filters.templateTypes.${type}`)}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}