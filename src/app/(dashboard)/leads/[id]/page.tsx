// src/app/(dashboard)/leads/[id]/page.tsx - COMPLETE UPDATED VERSION
'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Lead } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Edit, Trash2, ExternalLink, Mail, Phone, Linkedin } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'
import { getLeadScoreBadge, getStatusBadgeColor } from '@/lib/validations/lead'

// Import the new components
import StatusSelector from '@/components/leads/StatusSelector'
import NotesSystem from '@/components/leads/NotesSystem'
import ActivityTimeline from '@/components/leads/ActivityTimeline'

export default function LeadDetailPage() {
  const router = useRouter()
  const params = useParams()
  const [lead, setLead] = useState<Lead | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params.id) {
      loadLead()
    }
  }, [params.id])

  const loadLead = async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('id', params.id as string)
      .single()

    if (data) {
      setLead(data)
    } else if (error) {
      console.error(error)
      router.push('/leads')
    }
    setLoading(false)
  }

  const handleStatusChange = (newStatus: string) => {
    if (lead) {
      setLead({ ...lead, lead_status: newStatus as any })
    }
  }

  const handleDelete = async () => {
    if (!lead) return
    if (!confirm('Are you sure you want to delete this lead?')) return

    const supabase = createClient()
    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', lead.id)

    if (!error) {
      router.push('/leads')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-lg text-muted-foreground">Loading lead...</div>
      </div>
    )
  }

  if (!lead) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <div className="text-lg text-muted-foreground">Lead not found</div>
        <Link href="/leads">
          <Button>Back to Leads</Button>
        </Link>
      </div>
    )
  }

  const scoreBadge = getLeadScoreBadge(lead.lead_score)
  const statusColor = getStatusBadgeColor(lead.lead_status)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/leads">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {lead.first_name} {lead.last_name}
            </h1>
            <p className="text-muted-foreground">{lead.job_title} at {lead.company_name}</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Link href={`/leads/${lead.id}/edit`}>
            <Button variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </Link>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - 2/3 width */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Name</p>
                  <p className="text-base">{lead.first_name} {lead.last_name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Job Title</p>
                  <p className="text-base">{lead.job_title}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <a 
                    href={`mailto:${lead.email}`}
                    className="text-base text-primary hover:underline flex items-center"
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    {lead.email}
                  </a>
                </div>
                {lead.phone && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Phone</p>
                    <a 
                      href={`tel:${lead.phone}`}
                      className="text-base text-primary hover:underline flex items-center"
                    >
                      <Phone className="h-4 w-4 mr-2" />
                      {lead.phone}
                    </a>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Seniority Level</p>
                  <p className="text-base">{lead.seniority_level}</p>
                </div>
                {lead.linkedin_url && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">LinkedIn</p>
                    <a 
                      href={lead.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-base text-primary hover:underline flex items-center"
                    >
                      <Linkedin className="h-4 w-4 mr-2" />
                      View Profile
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Company Information */}
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Company Name</p>
                <p className="text-base">{lead.company_name}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground">Company Website</p>
                <a 
                  href={lead.company_website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-base text-primary hover:underline flex items-center"
                >
                  {lead.company_website}
                  <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Company Size</p>
                  <p className="text-base">{lead.company_size} employees</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Industry</p>
                  <p className="text-base">{lead.industry}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Project Details */}
          <Card>
            <CardHeader>
              <CardTitle>Project Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Service Interest</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {lead.service_interest.map((service) => (
                    <span 
                      key={service}
                      className="px-3 py-1 text-xs bg-primary/10 text-primary rounded-full"
                    >
                      {service}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground">Main Challenge / Goal</p>
                <p className="text-base mt-1 whitespace-pre-wrap">{lead.pain_point}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Project Timeline</p>
                  <p className="text-base">{lead.project_timeline}</p>
                </div>
                {lead.budget_range && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Budget Range</p>
                    <p className="text-base">{lead.budget_range}</p>
                  </div>
                )}
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground">Lead Source</p>
                <p className="text-base">{lead.lead_source}</p>
              </div>
            </CardContent>
          </Card>

          {/* NEW: Notes System - Replace old textarea */}
          <NotesSystem leadId={lead.id} />

          {/* NEW: Activity Timeline */}
          <ActivityTimeline leadId={lead.id} />
        </div>

        {/* Right Column - 1/3 width */}
        <div className="space-y-6">
          {/* Lead Management */}
          <Card>
            <CardHeader>
              <CardTitle>Lead Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Status</p>
                {/* NEW: StatusSelector with save button */}
                <StatusSelector 
                  leadId={lead.id}
                  currentStatus={lead.lead_status}
                  onStatusChange={handleStatusChange}
                />
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Lead Score</p>
                <div className="flex items-center space-x-2">
                  <span className={`px-3 py-1 text-sm font-semibold rounded-full bg-${scoreBadge.color}-100 text-${scoreBadge.color}-800 dark:bg-${scoreBadge.color}-900 dark:text-${scoreBadge.color}-200`}>
                    {scoreBadge.label}
                  </span>
                  <span className="text-2xl font-bold">{lead.lead_score}</span>
                  <span className="text-muted-foreground">/ 100</span>
                </div>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm font-medium text-muted-foreground">Created</p>
                <p className="text-sm">{formatDateTime(lead.created_at)}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
                <p className="text-sm">{formatDateTime(lead.updated_at)}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}