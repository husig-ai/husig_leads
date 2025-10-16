'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { 
  Clock, 
  User, 
  Mail, 
  Phone, 
  Edit, 
  UserPlus, 
  FileText,
  CheckCircle,
  XCircle,
  ArrowRight,
  Loader2
} from 'lucide-react'

interface Activity {
  id: string
  lead_id: string
  user_id: string
  activity_type: 'email' | 'call' | 'meeting' | 'note' | 'status_change' | 'assigned' | 'created'
  title: string
  description?: string
  metadata?: {
    old_value?: string
    new_value?: string
    [key: string]: any
  }
  created_at: string
  user_name?: string
}

interface ActivityTimelineProps {
  leadId: string
}

export default function ActivityTimeline({ leadId }: ActivityTimelineProps) {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadActivities()
  }, [leadId])

  const loadActivities = async () => {
    const supabase = createClient()
    
    try {
      // Get activities
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading activities:', error)
        setLoading(false)
        return
      }

      if (data && data.length > 0) {
        // Get unique user IDs
        const userIds = [...new Set(data.map(activity => activity.user_id))]
        
        // Fetch user names
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', userIds)

        // Map user names to activities
        const profileMap = new Map(profiles?.map(p => [p.id, p.full_name]) || [])
        
        const activitiesWithNames = data.map(activity => ({
          ...activity,
          user_name: profileMap.get(activity.user_id) || 'Unknown User'
        }))
        
        setActivities(activitiesWithNames)
      } else {
        setActivities([])
      }
    } catch (error) {
      console.error('Error loading activities:', error)
      setActivities([])
    } finally {
      setLoading(false)
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'email': return Mail
      case 'call': return Phone
      case 'meeting': return Clock
      case 'note': return FileText
      case 'status_change': return ArrowRight
      case 'assigned': return UserPlus
      case 'created': return UserPlus
      default: return Clock
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'email': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'call': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'meeting': return 'bg-purple-500/20 text-purple-400 border-purple-500/30'
      case 'note': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'status_change': return 'bg-orange-500/20 text-orange-400 border-orange-500/30'
      case 'assigned': return 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
      case 'created': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
    return date.toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-husig-purple-500" />
      </div>
    )
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-8">
        <Clock className="w-12 h-12 text-gray-600 mx-auto mb-3" />
        <p className="text-gray-400 mb-2">No activity yet</p>
        <p className="text-sm text-gray-500">Activity will appear here as you interact with this lead</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 mb-4">
        <Clock className="w-4 h-4 text-gray-400" />
        <span className="text-sm text-gray-400">
          {activities.length} {activities.length === 1 ? 'activity' : 'activities'}
        </span>
      </div>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-700"></div>
        
        <div className="space-y-6">
          {activities.map((activity, index) => {
            const Icon = getActivityIcon(activity.activity_type)
            
            return (
              <div key={activity.id} className="relative flex items-start space-x-4">
                {/* Timeline dot */}
                <div className={`relative z-10 flex items-center justify-center w-12 h-12 rounded-full border-2 ${getActivityColor(activity.activity_type)}`}>
                  <Icon className="w-5 h-5" />
                </div>
                
                {/* Activity content */}
                <div className="flex-1 min-w-0 bg-gray-800/30 rounded-lg p-4 border border-gray-700/50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="text-sm font-medium text-white">{activity.title}</h4>
                        <Badge className={`${getActivityColor(activity.activity_type)} text-xs border-0`}>
                          {activity.activity_type.replace('_', ' ')}
                        </Badge>
                      </div>
                      
                      {activity.description && (
                        <p className="text-sm text-gray-300 mb-2">{activity.description}</p>
                      )}
                      
                      {activity.metadata && activity.activity_type === 'status_change' && activity.metadata.old_value && (
                        <div className="flex items-center space-x-2 text-xs text-gray-400">
                          <span className="capitalize">{activity.metadata.old_value.replace('_', ' ')}</span>
                          <ArrowRight className="w-3 h-3" />
                          <span className="capitalize">{activity.metadata.new_value?.replace('_', ' ')}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-2 mt-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="bg-husig-gradient text-white text-xs">
                            {getInitials(activity.user_name || 'U')}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-gray-400">
                          {activity.user_name || 'Unknown User'}
                        </span>
                        <span className="text-xs text-gray-500">•</span>
                        <span className="text-xs text-gray-500">
                          {formatRelativeTime(activity.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}