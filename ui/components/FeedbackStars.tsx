'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FeedbackStarsProps {
  rating?: number | null
  onRatingChange?: (rating: number) => void
  readonly?: boolean
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  className?: string
}

export function FeedbackStars({
  rating = null,
  onRatingChange,
  readonly = false,
  size = 'md',
  disabled = false,
  className
}: FeedbackStarsProps) {
  const [hoverRating, setHoverRating] = useState<number | null>(null)

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  }

  const handleClick = (starRating: number) => {
    if (readonly || disabled) return
    onRatingChange?.(starRating)
  }

  const handleMouseEnter = (starRating: number) => {
    if (readonly || disabled) return
    setHoverRating(starRating)
  }

  const handleMouseLeave = () => {
    if (readonly || disabled) return
    setHoverRating(null)
  }

  const getStarColor = (starIndex: number) => {
    const currentRating = hoverRating || rating || 0
    
    if (starIndex <= currentRating) {
      if (currentRating <= 2) return 'text-red-400 fill-red-400'
      if (currentRating <= 3) return 'text-yellow-400 fill-yellow-400'
      return 'text-green-400 fill-green-400'
    }
    
    return 'text-gray-300'
  }

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {[1, 2, 3, 4, 5].map((starIndex) => (
        <button
          key={starIndex}
          type="button"
          onClick={() => handleClick(starIndex)}
          onMouseEnter={() => handleMouseEnter(starIndex)}
          onMouseLeave={handleMouseLeave}
          disabled={readonly || disabled}
          className={cn(
            'transition-colors duration-150',
            !readonly && !disabled && 'hover:scale-110 cursor-pointer',
            readonly && 'cursor-default',
            disabled && 'cursor-not-allowed opacity-50'
          )}
          aria-label={`Rate ${starIndex} star${starIndex !== 1 ? 's' : ''}`}
        >
          <Star
            className={cn(
              sizeClasses[size],
              getStarColor(starIndex),
              'transition-all duration-150'
            )}
          />
        </button>
      ))}
      
      {rating && (
        <span className="ml-2 text-sm text-muted-foreground">
          {rating}/5
        </span>
      )}
    </div>
  )
}