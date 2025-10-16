import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { LucideIcon } from 'lucide-react'

interface KPICardProps {
  title: string
  value: string | number
  change: string
  icon: LucideIcon
  color: 'blue' | 'red' | 'green' | 'purple' | 'orange'
  trend: 'up' | 'down' | 'neutral'
}

const colorClasses = {
  blue: {
    bg: 'bg-blue-500/20',
    icon: 'text-blue-400',
    border: 'border-blue-500/30'
  },
  red: {
    bg: 'bg-red-500/20',
    icon: 'text-red-400',
    border: 'border-red-500/30'
  },
  green: {
    bg: 'bg-green-500/20',
    icon: 'text-green-400',
    border: 'border-green-500/30'
  },
  purple: {
    bg: 'bg-purple-500/20',
    icon: 'text-purple-400',
    border: 'border-purple-500/30'
  },
  orange: {
    bg: 'bg-orange-500/20',
    icon: 'text-orange-400',
    border: 'border-orange-500/30'
  }
}

export function KPICard({ title, value, change, icon: Icon, color, trend }: KPICardProps) {
  const colors = colorClasses[color]
  
  return (
    <Card className="card-husig-glass border-gray-700/50 hover:border-husig-purple-500/30 transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-400 mb-1">{title}</p>
            <p className="text-3xl font-bold text-white mb-2">{value}</p>
            <p className="text-sm text-gray-500">{change}</p>
          </div>
          <div className={`w-12 h-12 ${colors.bg} rounded-lg flex items-center justify-center`}>
            <Icon className={`w-6 h-6 ${colors.icon}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}