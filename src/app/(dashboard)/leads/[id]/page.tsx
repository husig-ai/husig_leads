'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Lead } from '@/types/database'
import { DashboardHeader } from '@/components/layout/DashboardHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  ExternalLink, 
  Mail, 
  Phone, 
  Linkedin,
  Globe,
  Building,
  Target,
  Clock,
  User,
  MapPin,
  DollarSign,
  Copy,
  Check
} from 'lucide-react'
import { formatDateTime } from '@/lib/utils'
import { getLeadScoreBadge, getStatusBadgeColor } from '@/lib/validations/lead'
import { toast } from '@/components/ui/use-toast'

// Import the existing components
import StatusSelector from '@/components/leads/StatusSelector'
import NotesSystem from '@/components/leads/NotesSystem'
import ActivityTimeline from '@/components/leads/ActivityTimeline'

export default function LeadDetailPage() {
  const router = useRouter()
  const params = useParams()
  const [lead, setLead] = useState<Lead | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  useEffect(() => {
    if (params.id) {
      loadLead()
    }
  }, [params.id])

  const loadLead = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('id', params.id as string)
        .single()

      if (error) throw error
      setLead(data)
    } catch (err) {
      console.error('Error loading lead:', err)
      setError('Failed to load lead details')
      toast({
        title: "Error",
        description: "Failed to load lead details",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = (newStatus: string) => {
    if (lead) {
      setLead({ ...lead, lead_status: newStatus as any })
    }
  }

  const handleDelete = async () => {
    if (!lead || !confirm('Are you sure you want to delete this lead? This action cannot be undone.')) {
      return
    }

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', lead.id)

      if (error) throw error

      toast({
        title: "Success",
        description: "Lead deleted successfully",
      })

      router.push('/leads')
    } catch (err) {
      console.error('Error deleting lead:', err)
      toast({
        title: "Error",
        description: "Failed to delete lead",
        variant: "destructive",
      })
    }
  }

  const handleCopy = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
      toast({
        title: "Copied!",
        description: `${field} copied to clipboard`,
      })
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <DashboardHeader />
        <div className="flex items-center justify-center h-96">
          <div className="text-lg text-gray-600 dark:text-gray-400">Loading lead details...</div>
        </div>
      </div>
    )
  }

  if (error || !lead) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <DashboardHeader />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Lead Not Found</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{error || 'The lead you are looking for does not exist.'}</p>
            <Link href="/leads">
              <Button>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Leads
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const scoreBadge = getLeadScoreBadge(lead.lead_score)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <DashboardHeader />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/leads">
                <Button variant="ghost" size="sm" className="hover:bg-gray-100 dark:hover:bg-gray-800">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Leads
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  {lead.first_name} {lead.last_name}
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  {lead.job_title} at {lead.company_name}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" asChild>
                <Link href={`/leads/${lead.id}/edit`}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Lead
                </Link>
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - 2/3 width */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact Information */}
            <Card className="shadow-sm border-0 bg-white dark:bg-gray-800">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center text-lg font-semibold">
                  <User className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{lead.email}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Email Address</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(lead.email, 'Email')}
                      className="h-8 w-8 p-0"
                    >
                      {copiedField === 'Email' ? (
                        <Check className="w-3 h-3 text-green-600" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </Button>
                  </div>

                  {lead.phone && (
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{lead.phone}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Phone Number</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopy(lead.phone!, 'Phone')}
                        className="h-8 w-8 p-0"
                      >
                        {copiedField === 'Phone' ? (
                          <Check className="w-3 h-3 text-green-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </Button>
                    </div>
                  )}

                  <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <Target className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{lead.seniority_level}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Seniority Level</p>
                    </div>
                  </div>

                  {lead.linkedin_url && (
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <Linkedin className="w-4 h-4 text-gray-400" />
                      <div>
                        <a 
                          href={lead.linkedin_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center"
                        >
                          LinkedIn Profile
                          <ExternalLink className="w-3 h-3 ml-1" />
                        </a>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Social Profile</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Company Information */}
            <Card className="shadow-sm border-0 bg-white dark:bg-gray-800">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center text-lg font-semibold">
                  <Building className="w-5 h-5 mr-2 text-green-600 dark:text-green-400" />
                  Company Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <Building className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{lead.company_name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Company Name</p>
                    </div>
                  </div>

                  {lead.company_website && (
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <Globe className="w-4 h-4 text-gray-400" />
                      <div>
                        <a 
                          href={lead.company_website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center"
                        >
                          Company Website
                          <ExternalLink className="w-3 h-3 ml-1" />
                        </a>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Website</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{lead.company_size} employees</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Company Size</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <Building className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{lead.industry}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Industry</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Project Details */}
            <Card className="shadow-sm border-0 bg-white dark:bg-gray-800">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center text-lg font-semibold">
                  <Target className="w-5 h-5 mr-2 text-purple-600 dark:text-purple-400" />
                  Project Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">Service Interest</h4>
                  <div className="flex flex-wrap gap-2">
                    {lead.service_interest.map((service, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {service}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">Main Challenge / Goal</h4>
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{lead.pain_point}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{lead.project_timeline}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Project Timeline</p>
                    </div>
                  </div>

                  {lead.budget_range && (
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <DollarSign className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{lead.budget_range}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Budget Range</p>
                      </div>
                    </div>
                  )}

                  {lead.lead_source && (
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <Target className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{lead.lead_source}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Lead Source</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Notes System */}
            <NotesSystem leadId={lead.id} />

            {/* Activity Timeline */}
            <ActivityTimeline leadId={lead.id} />
          </div>

          {/* Sidebar - 1/3 width */}
          <div className="space-y-6">
            {/* Lead Score & Status */}
            <Card className="shadow-sm border-0 bg-white dark:bg-gray-800">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold">Lead Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Lead Score */}
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">Lead Score</p>
                  <div className="flex items-center space-x-2 mb-2">
                    <span className={`px-3 py-1 text-sm font-semibold rounded-full bg-${scoreBadge.color}-100 text-${scoreBadge.color}-800 dark:bg-${scoreBadge.color}-900 dark:text-${scoreBadge.color}-200`}>
                      {scoreBadge.label}
                    </span>
                    <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">{lead.lead_score}</span>
                    <span className="text-gray-500 dark:text-gray-400">/ 100</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full bg-gradient-to-r ${
                        lead.lead_score >= 80 ? 'from-red-400 to-red-600' :
                        lead.lead_score >= 60 ? 'from-orange-400 to-orange-600' :
                        lead.lead_score >= 40 ? 'from-yellow-400 to-yellow-600' :
                        'from-gray-400 to-gray-600'
                      }`}
                      style={{ width: `${lead.lead_score}%` }}
                    />
                  </div>
                </div>

                <Separator />

                {/* Status */}
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Status</p>
                  <StatusSelector 
                    leadId={lead.id}
                    currentStatus={lead.lead_status}
                    onStatusChange={handleStatusChange}
                  />
                </div>

                <Separator />

                {/* Timestamps */}
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Created</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{formatDateTime(lead.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Last Updated</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{formatDateTime(lead.updated_at)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="shadow-sm border-0 bg-white dark:bg-gray-800">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => window.location.href = `mailto:${lead.email}`}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Send Email
                </Button>
                
                {lead.phone && (
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => window.location.href = `tel:${lead.phone}`}
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Call Lead
                  </Button>
                )}

                {lead.linkedin_url && (
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => window.open(lead.linkedin_url, '_blank')}
                  >
                    <Linkedin className="w-4 h-4 mr-2" />
                    View LinkedIn
                  </Button>
                )}

                {lead.company_website && (
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => window.open(lead.company_website, '_blank')}
                  >
                    <Globe className="w-4 h-4 mr-2" />
                    Visit Website
                  </Button>
                )}

                <Separator />

                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  asChild
                >
                  <Link href={`/leads/${lead.id}/edit`}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Details
                  </Link>
                </Button>

                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => handleCopy(
                    `${lead.first_name} ${lead.last_name}\n${lead.email}\n${lead.company_name}\nScore: ${lead.lead_score}/100`,
                    'Lead Summary'
                  )}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Lead Info
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}