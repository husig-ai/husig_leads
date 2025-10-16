import React from 'react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface LeadScoreBadgeProps {
  score: number
  className?: string
}

export function LeadScoreBadge({ score, className }: LeadScoreBadgeProps) {
  const getScoreConfig = (score: number) => {
    if (score >= 80) {
      return {
        label: 'Hot',
        emoji: '🔴',
        class: 'score-hot bg-gradient-to-r from-red-500 to-red-600 text-white border-0',
        bgClass: 'bg-red-500/20 text-red-400 border-red-500/30'
      }
    } else if (score >= 60) {
      return {
        label: 'Warm',
        emoji: '🟠',
        class: 'score-warm bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0',
        bgClass: 'bg-orange-500/20 text-orange-400 border-orange-500/30'
      }
    } else if (score >= 40) {
      return {
        label: 'Qualified',
        emoji: '🟡',
        class: 'score-qualified bg-gradient-to-r from-yellow-500 to-yellow-600 text-white border-0',
        bgClass: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      }
    } else {
      return {
        label: 'Cold',
        emoji: '⚪',
        class: 'score-cold bg-gradient-to-r from-gray-500 to-gray-600 text-white border-0',
        bgClass: 'bg-gray-500/20 text-gray-400 border-gray-500/30'
      }
    }
  }

  const config = getScoreConfig(score)

  return (
    <div className="flex items-center space-x-2">
      <Badge className={cn(config.class, className)}>
        {config.emoji} {config.label}
      </Badge>
      <span className="text-xs text-gray-400 font-medium">
        {score}/100
      </span>
    </div>
  )
}