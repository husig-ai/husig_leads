'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { DashboardHeader } from '@/components/layout/DashboardHeader'
import { LeadScoreBadge } from '@/components/leads/LeadScoreBadge'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Search, 
  Plus, 
  Download, 
  Mail, 
  Building2,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Calendar,
  DollarSign,
  Loader2
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Lead } from '@/types/database'
import Link from 'next/link'
import { toast } from '@/components/ui/use-toast'

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [scoreFilter, setScoreFilter] = useState('all')

  useEffect(() => {
    loadLeads()
  }, [])

  useEffect(() => {
    filterLeads()
  }, [leads, searchTerm, statusFilter, scoreFilter])

  const loadLeads = async () => {
    const supabase = createClient()
    
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setLeads(data || [])
    } catch (error) {
      console.error('Error loading leads:', error)
      toast({
        title: 'Error',
        description: 'Failed to load leads',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const filterLeads = () => {
    let filtered = leads

    if (searchTerm) {
      filtered = filtered.filter(lead =>
        lead.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.email?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(lead => lead.lead_status === statusFilter)
    }

    if (scoreFilter !== 'all') {
      filtered = filtered.filter(lead => {
        if (scoreFilter === 'hot') return lead.lead_score >= 80
        if (scoreFilter === 'warm') return lead.lead_score >= 60 && lead.lead_score < 80
        if (scoreFilter === 'qualified') return lead.lead_score >= 40 && lead.lead_score < 60
        if (scoreFilter === 'cold') return lead.lead_score < 40
        return true
      })
    }

    setFilteredLeads(filtered)
  }

  const handleDelete = async (leadId: string) => {
    if (!confirm('Are you sure you want to delete this lead?')) return

    const supabase = createClient()
    
    try {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', leadId)

      if (error) throw error
      
      setLeads(leads.filter(lead => lead.id !== leadId))
      toast({
        title: 'Success',
        description: 'Lead deleted successfully',
      })
    } catch (error) {
      console.error('Error deleting lead:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete lead',
        variant: 'destructive'
      })
    }
  }

  const exportCSV = () => {
    const csvContent = [
      ['Name', 'Email', 'Company', 'Score', 'Status', 'Timeline', 'Budget', 'Created'].join(','),
      ...filteredLeads.map(lead => [
        `"${lead.first_name} ${lead.last_name}"`,
        lead.email,
        `"${lead.company_name}"`,
        lead.lead_score,
        lead.lead_status,
        lead.project_timeline,
        lead.budget_range || 'Not specified',
        new Date(lead.created_at).toLocaleDateString()
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `leads-export-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    
    toast({
      title: 'Success',
      description: 'Leads exported successfully',
    })
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'new': return 'status-new'
      case 'contacted': return 'status-contacted'
      case 'qualified': return 'status-qualified'
      case 'converted': return 'status-converted'
      case 'lost': return 'status-lost'
      default: return 'bg-gray-500'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-husig-dark">
        <DashboardHeader />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-husig-purple-500 mx-auto mb-4" />
            <div className="text-lg text-gray-300">Loading leads...</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-husig-dark">
      <DashboardHeader />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                <span className="text-husig-gradient">Leads</span>
              </h1>
              <p className="text-gray-400 text-lg">Manage your lead pipeline and track opportunities</p>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" onClick={exportCSV} className="btn-husig-outline">
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
              <Link href="/leads/new">
                <Button className="btn-husig-primary">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Lead
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card className="card-husig-glass border-gray-700/50 mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                <Input 
                  placeholder="Search leads by name, email, or company..." 
                  className="pl-10 husig-input"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48 husig-select">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="qualified">Qualified</SelectItem>
                  <SelectItem value="demo_scheduled">Demo Scheduled</SelectItem>
                  <SelectItem value="proposal_sent">Proposal Sent</SelectItem>
                  <SelectItem value="negotiating">Negotiating</SelectItem>
                  <SelectItem value="converted">Converted</SelectItem>
                  <SelectItem value="lost">Lost</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Score Filter */}
              <Select value={scoreFilter} onValueChange={setScoreFilter}>
                <SelectTrigger className="w-48 husig-select">
                  <SelectValue placeholder="Filter by score" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Scores</SelectItem>
                  <SelectItem value="hot">🔴 Hot (80-100)</SelectItem>
                  <SelectItem value="warm">🟠 Warm (60-79)</SelectItem>
                  <SelectItem value="qualified">🟡 Qualified (40-59)</SelectItem>
                  <SelectItem value="cold">⚪ Cold (&lt;40)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Results Summary */}
        <div className="mb-6">
          <p className="text-gray-400">
            Showing {filteredLeads.length} of {leads.length} leads
          </p>
        </div>

        {/* Leads Grid */}
        {filteredLeads.length === 0 ? (
          <Card className="card-husig-glass border-gray-700/50">
            <CardContent className="p-12 text-center">
              <Building2 className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-300 mb-2">
                {leads.length === 0 ? 'No leads yet' : 'No leads match your filters'}
              </h3>
              <p className="text-gray-500 mb-6">
                {leads.length === 0 
                  ? 'Get started by adding your first lead' 
                  : 'Try adjusting your search or filter criteria'
                }
              </p>
              {leads.length === 0 && (
                <Link href="/leads/new">
                  <Button className="btn-husig-primary">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Your First Lead
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredLeads.map((lead) => (
              <Card 
                key={lead.id} 
                className="card-husig-glass border-gray-700/50 hover:border-husig-purple-500/50 transition-all duration-300 cursor-pointer group"
              >
                <CardContent className="p-6">
                  {/* Header with Avatar and Actions */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-husig-gradient rounded-full flex items-center justify-center">
                        <span className="text-white font-medium">
                          {lead.first_name[0]}{lead.last_name[0]}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white group-hover:text-husig-purple-300 transition-colors">
                          {lead.first_name} {lead.last_name}
                        </h3>
                        <p className="text-sm text-gray-400">{lead.job_title}</p>
                      </div>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:text-white">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700">
                        <Link href={`/leads/${lead.id}`}>
                          <DropdownMenuItem className="text-gray-300 hover:text-white hover:bg-gray-700 cursor-pointer">
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                        </Link>
                        <Link href={`/leads/${lead.id}/edit`}>
                          <DropdownMenuItem className="text-gray-300 hover:text-white hover:bg-gray-700 cursor-pointer">
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                        </Link>
                        <DropdownMenuSeparator className="bg-gray-700" />
                        <DropdownMenuItem 
                          onClick={() => handleDelete(lead.id)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-950/20 cursor-pointer"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Company Info */}
                  <div className="mb-4">
                    <div className="flex items-center text-gray-300 mb-2">
                      <Building2 className="w-4 h-4 mr-2 text-gray-500" />
                      <span className="font-medium">{lead.company_name}</span>
                    </div>
                    <div className="flex items-center text-gray-400 text-sm">
                      <Mail className="w-4 h-4 mr-2" />
                      <span>{lead.email}</span>
                    </div>
                  </div>

                  {/* Score and Status */}
                  <div className="flex items-center justify-between mb-4">
                    <LeadScoreBadge score={lead.lead_score} />
                    <Badge className={`${getStatusBadgeClass(lead.lead_status)} border-0`}>
                      {lead.lead_status.charAt(0).toUpperCase() + lead.lead_status.slice(1)}
                    </Badge>
                  </div>

                  {/* Project Details */}
                  <div className="space-y-2 mb-4">
                    {lead.project_timeline && (
                      <div className="flex items-center text-sm text-gray-400">
                        <Calendar className="w-4 h-4 mr-2" />
                        <span>Timeline: {lead.project_timeline}</span>
                      </div>
                    )}
                    {lead.budget_range && (
                      <div className="flex items-center text-sm text-gray-400">
                        <DollarSign className="w-4 h-4 mr-2" />
                        <span>Budget: {lead.budget_range}</span>
                      </div>
                    )}
                  </div>

                  {/* Action Button */}
                  <Link href={`/leads/${lead.id}`} className="block">
                    <Button className="w-full btn-husig-outline group-hover:btn-husig-primary transition-all duration-300">
                      View Details
                    </Button>
                  </Link>

                  {/* Footer */}
                  <div className="mt-4 pt-4 border-t border-gray-700/50">
                    <p className="text-xs text-gray-500">
                      Created {new Date(lead.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}