// src/components/leads/LeadScoreBadge.tsx
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { getLeadScoreStyle } from '@/lib/brand';

interface LeadScoreBadgeProps {
  score: number;
  showScore?: boolean;
  size?: 'sm' | 'default' | 'lg';
}

export const LeadScoreBadge: React.FC<LeadScoreBadgeProps> = ({ 
  score, 
  showScore = true,
  size = 'default' 
}) => {
  const scoreStyle = getLeadScoreStyle(score);
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    default: 'text-sm px-2.5 py-0.5',
    lg: 'text-base px-3 py-1'
  };

  return (
    <Badge 
      className={`
        border font-medium
        ${scoreStyle.bg} 
        ${scoreStyle.text} 
        ${scoreStyle.border}
        ${sizeClasses[size]}
      `}
    >
      {scoreStyle.label} {showScore && `(${score})`}
    </Badge>
  );
};