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
  created_by: string
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
        const userIds = [...new Set(data.map(activity => activity.created_by))]
        
        // Fetch user names
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', userIds)

        // Map user names to activities
        const profileMap = new Map(profiles?.map(p => [p.id, p.full_name]) || [])
        
        const activitiesWithNames = data.map(activity => ({
          ...activity,
          user_name: profileMap.get(activity.created_by) || 'Unknown User'
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
      case 'email': return 'bg-husig-blue-500/20 text-husig-blue-400 border-husig-blue-500/30'
      case 'call': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'meeting': return 'bg-husig-purple-500/20 text-husig-purple-400 border-husig-purple-500/30'
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
        <Loader2 className="w-6 h-6 animate-spin text-husig-purple-400" />
        <span className="ml-2 text-gray-400">Loading activity...</span>
      </div>
    )
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-husig-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Clock className="w-8 h-8 text-husig-purple-400" />
        </div>
        <h3 className="text-lg font-medium text-white mb-2">No activity yet</h3>
        <p className="text-gray-400 max-w-sm mx-auto">
          Activity will appear here as you interact with this lead. Start by adding a note or updating the status.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-husig-gradient rounded-lg flex items-center justify-center">
            <Clock className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Activity Timeline</h3>
            <p className="text-sm text-gray-400">
              {activities.length} {activities.length === 1 ? 'activity' : 'activities'}
            </p>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-husig-purple-500/50 via-husig-blue-500/30 to-transparent"></div>
        
        <div className="space-y-6">
          {activities.map((activity, index) => {
            const Icon = getActivityIcon(activity.activity_type)
            
            return (
              <div key={activity.id} className="relative flex items-start space-x-4">
                {/* Timeline dot with enhanced styling */}
                <div className={`relative z-10 flex items-center justify-center w-12 h-12 rounded-full border-2 ${getActivityColor(activity.activity_type)} shadow-lg`}>
                  <Icon className="w-5 h-5" />
                  {/* Glow effect for recent activities */}
                  {index < 3 && (
                    <div className="absolute inset-0 rounded-full bg-current opacity-20 animate-pulse"></div>
                  )}
                </div>
                
                {/* Activity content with enhanced HuSig styling */}
                <div className="flex-1 min-w-0 bg-gradient-to-br from-gray-800/50 to-gray-900/30 rounded-xl p-5 border border-gray-700/50 backdrop-blur-sm hover:border-husig-purple-500/30 transition-all duration-300 shadow-lg hover:shadow-husig">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="text-base font-semibold text-white">{activity.title}</h4>
                        <Badge className={`${getActivityColor(activity.activity_type)} text-xs border-0 px-2 py-1 font-medium`}>
                          {activity.activity_type.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                      
                      {activity.description && (
                        <p className="text-sm text-gray-300 leading-relaxed mb-3 bg-gray-800/30 p-3 rounded-lg border border-gray-700/30">
                          {activity.description}
                        </p>
                      )}
                      
                      {/* Status change metadata with enhanced styling */}
                      {activity.metadata && activity.activity_type === 'status_change' && activity.metadata.old_value && (
                        <div className="flex items-center space-x-3 text-sm bg-gradient-to-r from-orange-500/10 to-amber-500/10 p-3 rounded-lg border border-orange-500/20">
                          <span className="capitalize text-orange-300 font-medium">
                            {activity.metadata.old_value.replace('_', ' ')}
                          </span>
                          <ArrowRight className="w-4 h-4 text-orange-400" />
                          <span className="capitalize text-green-300 font-medium">
                            {activity.metadata.new_value?.replace('_', ' ')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* User info and timestamp with enhanced styling */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-700/50">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8 border-2 border-husig-purple-500/30">
                        <AvatarFallback className="bg-husig-gradient text-white text-sm font-semibold">
                          {getInitials(activity.user_name || 'U')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium text-white">
                          {activity.user_name || 'Unknown User'}
                        </p>
                        <p className="text-xs text-gray-400">
                          {formatRelativeTime(activity.created_at)}
                        </p>
                      </div>
                    </div>
                    
                    {/* Activity type indicator */}
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${getActivityColor(activity.activity_type)}`}>
                      {activity.activity_type === 'email' && '📧'}
                      {activity.activity_type === 'call' && '📞'}
                      {activity.activity_type === 'meeting' && '📅'}
                      {activity.activity_type === 'note' && '📝'}
                      {activity.activity_type === 'status_change' && '🔄'}
                      {activity.activity_type === 'assigned' && '👤'}
                      {activity.activity_type === 'created' && '✨'}
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