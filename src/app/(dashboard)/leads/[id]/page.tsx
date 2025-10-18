'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Lead, LeadStatus } from '@/types/database'
import { DashboardHeader } from '@/components/layout/DashboardHeader'
import { LeadScoreBadge } from '@/components/leads/LeadScoreBadge'
import NotesSystem from '@/components/leads/NotesSystem'
import ActivityTimeline from '@/components/leads/ActivityTimeline'
import StatusSelector from '@/components/leads/StatusSelector'
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
  DollarSign,
  Copy,
  Check,
  Loader2,
  AlertCircle
} from 'lucide-react'
import { toast } from '@/components/ui/use-toast'

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
    } catch (error) {
      console.error('Error deleting lead:', error)
      toast({
        title: "Error",
        description: "Failed to delete lead",
        variant: "destructive",
      })
    }
  }

  const handleCopy = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(fieldName)
      toast({
        title: "Copied!",
        description: `${fieldName} copied to clipboard`,
      })
      setTimeout(() => setCopiedField(null), 2000)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      })
    }
  }

  const handleStatusChange = (newStatus: LeadStatus) => {
    if (lead) {
      setLead({ ...lead, lead_status: newStatus })
    }
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'contacted': return 'bg-purple-500/20 text-purple-400 border-purple-500/30'
      case 'qualified': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'demo_scheduled': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'proposal_sent': return 'bg-orange-500/20 text-orange-400 border-orange-500/30'
      case 'negotiating': return 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
      case 'converted': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
      case 'lost': return 'bg-red-500/20 text-red-400 border-red-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-husig-dark">
        <DashboardHeader />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-husig-purple-500 mx-auto mb-4" />
            <div className="text-lg text-gray-300">Loading lead details...</div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !lead) {
    return (
      <div className="min-h-screen bg-husig-dark">
        <DashboardHeader />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-4">Lead Not Found</h1>
            <p className="text-gray-400 mb-6">{error}</p>
            <Link href="/leads">
              <Button className="btn-husig-primary">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Leads
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-husig-dark">
      <DashboardHeader />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Link href="/leads">
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white hover:bg-gray-800">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Leads
              </Button>
            </Link>
          </div>
          
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-husig-gradient rounded-full flex items-center justify-center">
                <span className="text-white text-xl font-bold">
                  {lead.first_name[0]}{lead.last_name[0]}
                </span>
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">
                  {lead.first_name} {lead.last_name}
                </h1>
                <p className="text-gray-400 text-lg">{lead.job_title} at {lead.company_name}</p>
                <div className="flex items-center space-x-3 mt-2">
                  <LeadScoreBadge score={lead.lead_score} />
                  <Badge className={`${getStatusBadgeClass(lead.lead_status)} border`}>
                    {lead.lead_status.charAt(0).toUpperCase() + lead.lead_status.slice(1).replace('_', ' ')}
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Link href={`/leads/${lead.id}/edit`}>
                <Button className="btn-husig-outline">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Lead
                </Button>
              </Link>
              <Button
                variant="outline"
                onClick={handleDelete}
                className="border-red-500/30 text-red-400 hover:bg-red-500/10"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact Information */}
            <Card className="card-husig-glass border-gray-700/50">
              <CardHeader>
                <CardTitle className="flex items-center text-white">
                  <User className="w-5 h-5 mr-2 text-husig-purple-400" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between group">
                      <div className="flex items-center space-x-3">
                        <Mail className="w-4 h-4 text-gray-500" />
                        <div>
                          <p className="text-sm text-gray-500">Email</p>
                          <p className="text-gray-300">{lead.email}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopy(lead.email, 'Email')}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-white"
                      >
                        {copiedField === 'Email' ? (
                          <Check className="w-4 h-4 text-green-400" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>

                    {lead.phone && (
                      <div className="flex items-center justify-between group">
                        <div className="flex items-center space-x-3">
                          <Phone className="w-4 h-4 text-gray-500" />
                          <div>
                            <p className="text-sm text-gray-500">Phone</p>
                            <p className="text-gray-300">{lead.phone}</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopy(lead.phone!, 'Phone')}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-white"
                        >
                          {copiedField === 'Phone' ? (
                            <Check className="w-4 h-4 text-green-400" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-500">Seniority Level</p>
                      <p className="text-gray-300">{lead.seniority_level}</p>
                    </div>

                    {lead.linkedin_url && (
                      <div>
                        <p className="text-sm text-gray-500">LinkedIn</p>
                        <a 
                          href={lead.linkedin_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-husig-blue-400 hover:text-husig-blue-300 flex items-center"
                        >
                          <Linkedin className="w-4 h-4 mr-2" />
                          View Profile
                          <ExternalLink className="w-3 h-3 ml-1" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Company Information */}
            <Card className="card-husig-glass border-gray-700/50">
              <CardHeader>
                <CardTitle className="flex items-center text-white">
                  <Building className="w-5 h-5 mr-2 text-husig-blue-400" />
                  Company Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-500">Company</p>
                      <p className="text-xl font-semibold text-white">{lead.company_name}</p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500">Website</p>
                        <a 
                          href={lead.company_website || '#'} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-husig-blue-400 hover:text-husig-blue-300 flex items-center"
                        >
                        <Globe className="w-4 h-4 mr-2" />
                        {lead.company_website}
                        <ExternalLink className="w-3 h-3 ml-1" />
                      </a>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-500">Company Size</p>
                      <p className="text-gray-300">{lead.company_size} employees</p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500">Industry</p>
                      <p className="text-gray-300">{lead.industry}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Project Details */}
            <Card className="card-husig-glass border-gray-700/50">
              <CardHeader>
                <CardTitle className="flex items-center text-white">
                  <Target className="w-5 h-5 mr-2 text-green-400" />
                  Project Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Services of Interest */}
                <div>
                  <p className="text-sm text-gray-500 mb-3">Services of Interest</p>
                  <div className="flex flex-wrap gap-2">
                    {lead.service_interest?.map((service, index) => (
                      <Badge key={index} className="bg-husig-purple-500/20 text-husig-purple-300 border-husig-purple-500/30">
                        {service}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Pain Point */}
                <div>
                  <p className="text-sm text-gray-500 mb-2">Main Pain Point</p>
                  <p className="text-gray-300 bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                    {lead.pain_point}
                  </p>
                </div>

                {/* Timeline and Budget */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center space-x-3">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Timeline</p>
                      <p className="text-gray-300">{lead.project_timeline}</p>
                    </div>
                  </div>

                  {lead.budget_range && (
                    <div className="flex items-center space-x-3">
                      <DollarSign className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-500">Budget Range</p>
                        <p className="text-gray-300">{lead.budget_range}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Notes Section - Commented out until components are created */}
            
            <Card className="card-husig-glass border-gray-700/50">
              <CardHeader>
                <CardTitle className="flex items-center text-white">
                  <Edit className="w-5 h-5 mr-2 text-yellow-400" />
                  Notes & Comments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <NotesSystem leadId={lead.id} />
              </CardContent>
            </Card>
            

            {/* Activity Timeline - Commented out until components are created */}
            
            <Card className="card-husig-glass border-gray-700/50">
              <CardHeader>
                <CardTitle className="flex items-center text-white">
                  <Clock className="w-5 h-5 mr-2 text-orange-400" />
                  Activity Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ActivityTimeline leadId={lead.id} />
              </CardContent>
            </Card>
            
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* 🟣 New Lead Status Card */}
            <Card className="card-husig-glass border-gray-700/50">
              <CardHeader>
                <CardTitle className="text-white">Lead Status</CardTitle>
              </CardHeader>
              <CardContent>
                <StatusSelector 
                  leadId={lead.id} 
                  currentStatus={lead.lead_status}
                  onStatusChange={handleStatusChange}
                />
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="card-husig-glass border-gray-700/50">
              <CardHeader>
                <CardTitle className="text-white">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  className="w-full btn-husig-outline justify-start"
                  onClick={() => window.open(`mailto:${lead.email}`, '_blank')}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Send Email
                </Button>

                {lead.phone && (
                  <Button 
                    className="w-full btn-husig-outline justify-start"
                    onClick={() => window.open(`tel:${lead.phone}`, '_blank')}
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Call
                  </Button>
                )}

                {lead.linkedin_url && (
                  <Button 
                    className="w-full btn-husig-outline justify-start"
                    onClick={() => window.open(lead.linkedin_url!, '_blank')}
                  >
                    <Linkedin className="w-4 h-4 mr-2" />
                    LinkedIn
                  </Button>
                )}

                {lead.company_website && (
                  <Button 
                    className="w-full btn-husig-outline justify-start"
                    onClick={() => window.open(lead.company_website!, '_blank')}
                  >
                    <Globe className="w-4 h-4 mr-2" />
                    Visit Website
                  </Button>
                )}

                <Separator className="bg-gray-700" />

                <Button 
                  className="w-full btn-husig-outline justify-start"
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

            {/* Lead Metadata */}
            <Card className="card-husig-glass border-gray-700/50">
              <CardHeader>
                <CardTitle className="text-white">Lead Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Lead Source</p>
                  <p className="text-gray-300">{lead.lead_source || 'Not specified'}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Created</p>
                  <p className="text-gray-300">{new Date(lead.created_at).toLocaleDateString()}</p>
                </div>

                {lead.updated_at && (
                  <div>
                    <p className="text-sm text-gray-500">Last Updated</p>
                    <p className="text-gray-300">{new Date(lead.updated_at).toLocaleDateString()}</p>
                  </div>
                )}

                <Separator className="bg-gray-700" />

                <div>
                  <p className="text-sm text-gray-500 mb-2">Lead Score Breakdown</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Overall Score</span>
                      <span className="text-white font-medium">{lead.lead_score}/100</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-husig-blue-500 to-husig-purple-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${lead.lead_score}%` }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
