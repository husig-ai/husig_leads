'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Lead } from '@/types/database'
import { DashboardHeader } from '@/components/layout/DashboardHeader'
import { LeadScoreBadge } from '@/components/leads/LeadScoreBadge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { 
  Plus, 
  Search, 
  Download, 
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Mail,
  Phone,
  Building2,
  Calendar,
  TrendingUp,
  Users,
  Target,
  ExternalLink
} from 'lucide-react'
import { toast } from '@/components/ui/use-toast'

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [scoreFilter, setScoreFilter] = useState('all')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    loadLeads()
  }, [])

  useEffect(() => {
    filterAndSortLeads()
  }, [leads, searchTerm, statusFilter, scoreFilter, sortBy, sortOrder])

  const loadLeads = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setLeads(data || [])
    } catch (error) {
      console.error('Error loading leads:', error)
      toast({
        title: "Error",
        description: "Failed to load leads",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filterAndSortLeads = () => {
    let filtered = [...leads]

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(lead =>
        lead.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.company_name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(lead => lead.lead_status === statusFilter)
    }

    // Apply score filter
    if (scoreFilter !== 'all') {
      filtered = filtered.filter(lead => {
        switch (scoreFilter) {
          case 'hot': return lead.lead_score >= 80
          case 'warm': return lead.lead_score >= 60 && lead.lead_score < 80
          case 'qualified': return lead.lead_score >= 40 && lead.lead_score < 60
          case 'cold': return lead.lead_score < 40
          default: return true
        }
      })
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue = a[sortBy as keyof Lead]
      let bValue = b[sortBy as keyof Lead]

      if (typeof aValue === 'string') aValue = aValue.toLowerCase()
      if (typeof bValue === 'string') bValue = bValue.toLowerCase()

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })

    setFilteredLeads(filtered)
  }

  const handleDelete = async (leadId: string) => {
    if (!confirm('Are you sure you want to delete this lead?')) return

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', leadId)

      if (error) throw error

      setLeads(leads.filter(lead => lead.id !== leadId))
      toast({
        title: "Success",
        description: "Lead deleted successfully",
      })
    } catch (error) {
      console.error('Error deleting lead:', error)
      toast({
        title: "Error",
        description: "Failed to delete lead",
        variant: "destructive",
      })
    }
  }

  const exportCSV = () => {
    const headers = ['Name', 'Email', 'Company', 'Score', 'Status', 'Timeline', 'Created']
    const rows = filteredLeads.map(lead => [
      `${lead.first_name} ${lead.last_name}`,
      lead.email,
      lead.company_name,
      lead.lead_score.toString(),
      lead.lead_status,
      lead.project_timeline,
      new Date(lead.created_at).toLocaleDateString()
    ])

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `leads-export-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'New': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'Contacted': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'Qualified': return 'bg-green-100 text-green-800 border-green-200'
      case 'Proposal': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'Negotiation': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'Won': return 'bg-green-200 text-green-900 border-green-300'
      case 'Lost': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader />
        <div className="flex items-center justify-center h-96">
          <div className="text-lg text-gray-600">Loading leads...</div>
        </div>
      </div>
    )
  }

  const stats = {
    total: leads.length,
    hot: leads.filter(lead => lead.lead_score >= 80).length,
    new: leads.filter(lead => lead.lead_status === 'New').length,
    thisMonth: leads.filter(lead => {
      const leadDate = new Date(lead.created_at)
      const now = new Date()
      return leadDate.getMonth() === now.getMonth() && leadDate.getFullYear() === now.getFullYear()
    }).length
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Leads</h1>
              <p className="text-gray-600 mt-1">Manage your lead pipeline and track opportunities</p>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" onClick={exportCSV}>
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
              <Link href="/leads/new">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Lead
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white shadow-sm border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Leads</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Hot Leads</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.hot}</p>
                </div>
                <div className="p-3 bg-red-100 rounded-full">
                  <Target className="w-5 h-5 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">New Leads</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.new}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">This Month</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.thisMonth}</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <Calendar className="w-5 h-5 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Table */}
        <Card className="shadow-sm border-0 bg-white">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <CardTitle className="text-lg font-semibold">All Leads ({filteredLeads.length})</CardTitle>
              
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                {/* Search */}
                <div className="relative min-w-[200px]">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input 
                    placeholder="Search leads..." 
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                {/* Status Filter */}
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="New">New</SelectItem>
                    <SelectItem value="Contacted">Contacted</SelectItem>
                    <SelectItem value="Qualified">Qualified</SelectItem>
                    <SelectItem value="Proposal">Proposal</SelectItem>
                    <SelectItem value="Won">Won</SelectItem>
                    <SelectItem value="Lost">Lost</SelectItem>
                  </SelectContent>
                </Select>

                {/* Score Filter */}
                <Select value={scoreFilter} onValueChange={setScoreFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="All Scores" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Scores</SelectItem>
                    <SelectItem value="hot">🔥 Hot (80+)</SelectItem>
                    <SelectItem value="warm">🟠 Warm (60-79)</SelectItem>
                    <SelectItem value="qualified">🟡 Qualified (40-59)</SelectItem>
                    <SelectItem value="cold">⚪ Cold (&lt;40)</SelectItem>
                  </SelectContent>
                </Select>

                {/* Sort */}
                <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
                  const [field, order] = value.split('-')
                  setSortBy(field)
                  setSortOrder(order as 'asc' | 'desc')
                }}>
                  <SelectTrigger className="w-44">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="created_at-desc">Newest First</SelectItem>
                    <SelectItem value="created_at-asc">Oldest First</SelectItem>
                    <SelectItem value="lead_score-desc">Highest Score</SelectItem>
                    <SelectItem value="lead_score-asc">Lowest Score</SelectItem>
                    <SelectItem value="first_name-asc">Name A-Z</SelectItem>
                    <SelectItem value="first_name-desc">Name Z-A</SelectItem>
                    <SelectItem value="company_name-asc">Company A-Z</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {filteredLeads.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500 mb-4">
                  {searchTerm || statusFilter !== 'all' || scoreFilter !== 'all' 
                    ? 'No leads match your filters' 
                    : 'No leads yet'
                  }
                </p>
                {!searchTerm && statusFilter === 'all' && scoreFilter === 'all' && (
                  <Link href="/leads/new">
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Your First Lead
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Company
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Score
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Timeline
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredLeads.map((lead) => (
                      <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-blue-700">
                                {lead.first_name?.[0]}{lead.last_name?.[0]}
                              </span>
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">
                                {lead.first_name} {lead.last_name}
                              </div>
                              <div className="text-sm text-gray-600">{lead.job_title}</div>
                              <div className="flex items-center space-x-2 mt-1">
                                <Mail className="w-3 h-3 text-gray-400" />
                                <span className="text-xs text-gray-500">{lead.email}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="font-medium text-gray-900">{lead.company_name}</div>
                            <div className="text-sm text-gray-600">{lead.industry}</div>
                            <div className="text-xs text-gray-500 mt-1">{lead.company_size}</div>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          <LeadScoreBadge score={lead.lead_score} />
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge 
                            variant="outline" 
                            className={`text-xs capitalize border ${getStatusBadgeColor(lead.lead_status)}`}
                          >
                            {lead.lead_status?.replace('_', ' ')}
                          </Badge>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-3 h-3 text-gray-400" />
                            <span className="text-sm text-gray-600">{lead.project_timeline}</span>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-600">
                            {formatDate(lead.created_at)}
                          </span>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            {/* Quick Actions */}
                            <button
                              onClick={() => window.location.href = `mailto:${lead.email}`}
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="Send Email"
                            >
                              <Mail className="w-4 h-4" />
                            </button>
                            
                            {lead.phone && (
                              <button
                                onClick={() => window.location.href = `tel:${lead.phone}`}
                                className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                                title="Call Lead"
                              >
                                <Phone className="w-4 h-4" />
                              </button>
                            )}

                            {/* More Actions Dropdown */}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
                                >
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem asChild>
                                  <Link 
                                    href={`/leads/${lead.id}`}
                                    className="flex items-center w-full"
                                  >
                                    <Eye className="mr-2 h-4 w-4" />
                                    View Details
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                  <Link 
                                    href={`/leads/${lead.id}/edit`}
                                    className="flex items-center w-full"
                                  >
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit Lead
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => handleDelete(lead.id)}
                                  className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete Lead
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination would go here if needed */}
        {filteredLeads.length > 50 && (
          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">1</span> to <span className="font-medium">{Math.min(50, filteredLeads.length)}</span> of{' '}
              <span className="font-medium">{filteredLeads.length}</span> results
            </p>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" disabled>
                Previous
              </Button>
              <Button variant="outline" size="sm">
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}