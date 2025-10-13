'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Lead } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card } from '@/components/ui/card'
import { Plus, Search, Download, Eye, Pencil, Trash2 } from 'lucide-react'
import { formatDate, exportToCSV } from '@/lib/utils'
import { getLeadScoreBadge, getStatusBadgeColor } from '@/lib/validations/lead'

export default function LeadsPage() {
  const router = useRouter()
  const [leads, setLeads] = useState<Lead[]>([])
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [scoreFilter, setScoreFilter] = useState('All')
  const [currentPage, setCurrentPage] = useState(1)
  const leadsPerPage = 20

  useEffect(() => {
    loadLeads()
  }, [])

  useEffect(() => {
    filterLeads()
  }, [leads, searchQuery, statusFilter, scoreFilter])

  const loadLeads = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false })

    if (data) {
      setLeads(data)
    }
    setLoading(false)
  }

  const filterLeads = () => {
    let filtered = [...leads]

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(lead =>
        lead.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.company_name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== 'All') {
      filtered = filtered.filter(lead => lead.lead_status === statusFilter)
    }

    // Score filter
    if (scoreFilter !== 'All') {
      if (scoreFilter === 'Hot') {
        filtered = filtered.filter(lead => lead.lead_score >= 80)
      } else if (scoreFilter === 'Warm') {
        filtered = filtered.filter(lead => lead.lead_score >= 60 && lead.lead_score < 80)
      } else if (scoreFilter === 'Qualified') {
        filtered = filtered.filter(lead => lead.lead_score >= 40 && lead.lead_score < 60)
      } else if (scoreFilter === 'Cold') {
        filtered = filtered.filter(lead => lead.lead_score < 40)
      }
    }

    setFilteredLeads(filtered)
    setCurrentPage(1)
  }

  const handleExport = () => {
    const exportData = filteredLeads.map(lead => ({
      'First Name': lead.first_name,
      'Last Name': lead.last_name,
      'Email': lead.email,
      'Phone': lead.phone || '',
      'Job Title': lead.job_title,
      'Seniority Level': lead.seniority_level,
      'LinkedIn URL': lead.linkedin_url || '',
      'Company Name': lead.company_name,
      'Company Website': lead.company_website,
      'Company Size': lead.company_size,
      'Industry': lead.industry,
      'Service Interest': lead.service_interest.join('; '),
      'Pain Point': lead.pain_point,
      'Project Timeline': lead.project_timeline,
      'Budget Range': lead.budget_range || '',
      'Lead Source': lead.lead_source,
      'Status': lead.lead_status,
      'Lead Score': lead.lead_score,
      'Created Date': formatDate(lead.created_at),
    }))

    exportToCSV(exportData, `husig-leads-${new Date().toISOString().split('T')[0]}.csv`)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this lead?')) return

    const supabase = createClient()
    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', id)

    if (!error) {
      setLeads(leads.filter(l => l.id !== id))
    }
  }

  // Pagination
  const indexOfLastLead = currentPage * leadsPerPage
  const indexOfFirstLead = indexOfLastLead - leadsPerPage
  const currentLeads = filteredLeads.slice(indexOfFirstLead, indexOfLastLead)
  const totalPages = Math.ceil(filteredLeads.length / leadsPerPage)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-lg text-muted-foreground">Loading leads...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Leads</h1>
          <p className="text-muted-foreground">Manage your lead pipeline</p>
        </div>
        <Link href="/leads/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add New Lead
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Statuses</SelectItem>
              <SelectItem value="New">New</SelectItem>
              <SelectItem value="Contacted">Contacted</SelectItem>
              <SelectItem value="Qualified">Qualified</SelectItem>
              <SelectItem value="Demo Scheduled">Demo Scheduled</SelectItem>
              <SelectItem value="Proposal Sent">Proposal Sent</SelectItem>
              <SelectItem value="Won">Won</SelectItem>
              <SelectItem value="Lost">Lost</SelectItem>
            </SelectContent>
          </Select>

          <Select value={scoreFilter} onValueChange={setScoreFilter}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Filter by score" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Scores</SelectItem>
              <SelectItem value="Hot">Hot (80-100)</SelectItem>
              <SelectItem value="Warm">Warm (60-79)</SelectItem>
              <SelectItem value="Qualified">Qualified (40-59)</SelectItem>
              <SelectItem value="Cold">Cold ({'<'}40)</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
        
        <div className="mt-3 text-sm text-muted-foreground">
          Showing {currentLeads.length} of {filteredLeads.length} leads
        </div>
      </Card>

      {/* Leads Table */}
      {filteredLeads.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground mb-4">
            {searchQuery || statusFilter !== 'All' || scoreFilter !== 'All'
              ? 'No leads match your filters'
              : 'No leads yet. Add your first lead!'}
          </p>
          {!searchQuery && statusFilter === 'All' && scoreFilter === 'All' && (
            <Link href="/leads/new">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add New Lead
              </Button>
            </Link>
          )}
        </Card>
      ) : (
        <>
          <div className="bg-white dark:bg-gray-800 rounded-lg border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Company
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Job Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {currentLeads.map((lead) => {
                    const scoreBadge = getLeadScoreBadge(lead.lead_score)
                    const statusColor = getStatusBadgeColor(lead.lead_status)
                    
                    return (
                      <tr
                        key={lead.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer"
                        onClick={() => router.push(`/leads/${lead.id}`)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {lead.first_name} {lead.last_name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-gray-100">
                            {lead.company_name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <a
                            href={`mailto:${lead.email}`}
                            className="text-sm text-primary hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {lead.email}
                          </a>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {lead.job_title}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-${statusColor}-100 text-${statusColor}-800 dark:bg-${statusColor}-900 dark:text-${statusColor}-200`}>
                            {lead.lead_status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-${scoreBadge.color}-100 text-${scoreBadge.color}-800 dark:bg-${scoreBadge.color}-900 dark:text-${scoreBadge.color}-200`}>
                            {scoreBadge.label} ({lead.lead_score})
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(lead.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2" onClick={(e) => e.stopPropagation()}>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => router.push(`/leads/${lead.id}`)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => router.push(`/leads/${lead.id}/edit`)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(lead.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center space-x-2">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}