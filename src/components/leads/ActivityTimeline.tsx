// src/components/leads/ActivityTimeline.tsx - IMPROVED VERSION
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  MessageSquare, 
  Phone, 
  Mail, 
  Calendar, 
  FileText, 
  CheckCircle2,
  Clock,
  TrendingUp
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
  lead_updated: TrendingUp,
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
}

interface ActivityTimelineProps {
  leadId: string
}

export default function ActivityTimeline({ leadId }: ActivityTimelineProps) {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddActivity, setShowAddActivity] = useState(false)
  const [activityType, setActivityType] = useState<string>('note_added')
  const [activityDescription, setActivityDescription] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadActivities()
    
    // Set up real-time subscription
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
    const { data, error } = await supabase
      .from('activities')
      .select(`
        *,
        profiles:created_by (full_name)
      `)
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false })

    if (data) {
      const activitiesWithNames = data.map((activity: any) => ({
        ...activity,
        user_name: activity.profiles?.full_name || 'Unknown User'
      }))
      setActivities(activitiesWithNames)
    }
    setLoading(false)
  }

  const handleAddActivity = async () => {
    if (!activityDescription.trim()) return

    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return

    const { error } = await supabase
      .from('activities')
      .insert({
        lead_id: leadId,
        activity_type: activityType,
        description: activityDescription,
        created_by: user.id,
      })

    setSaving(false)
    if (!error) {
      setActivityDescription('')
      setShowAddActivity(false)
      loadActivities()
    }
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
        <div className="flex items-center justify-between">
          <CardTitle>Activity Timeline</CardTitle>
          <Button
            size="sm"
            onClick={() => setShowAddActivity(!showAddActivity)}
          >
            {showAddActivity ? 'Cancel' : 'Add Activity'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Activity Form */}
        {showAddActivity && (
          <div className="space-y-3 p-4 border rounded-lg bg-gray-50 dark:bg-gray-900">
            <div className="space-y-2">
              <Label htmlFor="activity_type">Activity Type</Label>
              <Select value={activityType} onValueChange={setActivityType}>
                <SelectTrigger id="activity_type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="note_added">Note</SelectItem>
                  <SelectItem value="email_sent">Email Sent</SelectItem>
                  <SelectItem value="call_made">Call Made</SelectItem>
                  <SelectItem value="meeting_scheduled">Meeting Scheduled</SelectItem>
                  <SelectItem value="meeting_completed">Meeting Completed</SelectItem>
                  <SelectItem value="document_sent">Document Sent</SelectItem>
                  <SelectItem value="follow_up_scheduled">Follow-up Scheduled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Add details about this activity..."
                rows={3}
                value={activityDescription}
                onChange={(e) => setActivityDescription(e.target.value)}
              />
            </div>

            <Button
              onClick={handleAddActivity}
              disabled={saving || !activityDescription.trim()}
              className="w-full"
            >
              {saving ? 'Saving...' : 'Add Activity'}
            </Button>
          </div>
        )}

        {/* Activity List */}
        {loading ? (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">Loading activities...</p>
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">No activities yet</p>
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

                    {/* Metadata - Show status changes */}
                    {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                      <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-900 rounded text-xs">
                        {activity.activity_type === 'status_changed' && (
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-1 rounded bg-gray-200 dark:bg-gray-700 font-medium">
                              {activity.metadata.old_status}
                            </span>
                            <span>→</span>
                            <span className="px-2 py-1 rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-medium">
                              {activity.metadata.new_status}
                            </span>
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