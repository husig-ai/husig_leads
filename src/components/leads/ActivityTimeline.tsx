// src/components/leads/ActivityTimeline.tsx - READ-ONLY VERSION
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  MessageSquare, 
  Phone, 
  Mail, 
  Calendar, 
  FileText, 
  CheckCircle2,
  Clock,
  TrendingUp,
  Edit,
  UserPlus
} from 'lucide-react'

interface Activity {
  id: string
  lead_id: string
  activity_type: string
  description: string
  metadata: any
  created_by: string
  created_at: string
  user_name?: string
}

const ACTIVITY_ICONS: Record<string, any> = {
  status_changed: TrendingUp,
  note_added: MessageSquare,
  email_sent: Mail,
  call_made: Phone,
  meeting_scheduled: Calendar,
  meeting_completed: CheckCircle2,
  document_sent: FileText,
  follow_up_scheduled: Clock,
  lead_updated: Edit,
  lead_created: UserPlus,
}

const ACTIVITY_COLORS: Record<string, string> = {
  status_changed: 'text-blue-500 bg-blue-100 dark:bg-blue-900',
  note_added: 'text-purple-500 bg-purple-100 dark:bg-purple-900',
  email_sent: 'text-green-500 bg-green-100 dark:bg-green-900',
  call_made: 'text-orange-500 bg-orange-100 dark:bg-orange-900',
  meeting_scheduled: 'text-indigo-500 bg-indigo-100 dark:bg-indigo-900',
  meeting_completed: 'text-green-600 bg-green-100 dark:bg-green-900',
  document_sent: 'text-pink-500 bg-pink-100 dark:bg-pink-900',
  follow_up_scheduled: 'text-yellow-500 bg-yellow-100 dark:bg-yellow-900',
  lead_updated: 'text-gray-500 bg-gray-100 dark:bg-gray-800',
  lead_created: 'text-green-500 bg-green-100 dark:bg-green-900',
}

interface ActivityTimelineProps {
  leadId: string
}

export default function ActivityTimeline({ leadId }: ActivityTimelineProps) {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadActivities()
    
    // Set up real-time subscription for automatic updates
    const supabase = createClient()
    const channel = supabase
      .channel(`activities-${leadId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'activities',
          filter: `lead_id=eq.${leadId}`
        },
        () => {
          loadActivities()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [leadId])

  const loadActivities = async () => {
  const supabase = createClient()
  
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
      user_name: profileMap.get(activity.created_by) || 'System'
    }))
    
    setActivities(activitiesWithNames)
  } else {
    setActivities([])
  }
  
  setLoading(false)
}

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    // Show relative time for recent activities
    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    
    // Show full date/time for older activities
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Log</CardTitle>
        <p className="text-sm text-muted-foreground">Automatic timeline of all lead activities</p>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">Loading activities...</p>
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-8 border rounded-lg border-dashed">
            <Clock className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No activity yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Activities will appear here when you make changes
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity, index) => {
              const Icon = ACTIVITY_ICONS[activity.activity_type] || MessageSquare
              const colorClass = ACTIVITY_COLORS[activity.activity_type] || 'text-gray-500 bg-gray-100 dark:bg-gray-800'

              return (
                <div key={activity.id} className="flex gap-3">
                  {/* Timeline Line */}
                  <div className="flex flex-col items-center">
                    <div className={`rounded-full p-2 ${colorClass}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    {index < activities.length - 1 && (
                      <div className="w-0.5 h-full min-h-[40px] bg-gray-200 dark:bg-gray-700 mt-2" />
                    )}
                  </div>

                  {/* Activity Content */}
                  <div className="flex-1 pb-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{activity.description}</p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <span className="font-medium">{activity.user_name}</span>
                          <span>•</span>
                          <span>{formatDateTime(activity.created_at)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Metadata - Show status changes with visual badges */}
                    {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                      <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border text-xs">
                        {activity.activity_type === 'status_changed' && (
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-1 rounded bg-gray-200 dark:bg-gray-700 font-medium">
                              {activity.metadata.old_status}
                            </span>
                            <span className="text-muted-foreground">→</span>
                            <span className="px-2 py-1 rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-medium">
                              {activity.metadata.new_status}
                            </span>
                          </div>
                        )}
                        {activity.activity_type === 'lead_updated' && activity.metadata.lead_score && (
                          <div className="text-muted-foreground">
                            Lead score: <span className="font-medium">{activity.metadata.lead_score}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}