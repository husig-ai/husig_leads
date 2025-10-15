'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Lead } from '@/types/database'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, TrendingUp, CheckCircle, AlertCircle, Calendar } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { getLeadScoreBadge, getStatusBadgeColor } from '@/lib/validations/lead'
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface DashboardStats {
  totalLeads: number
  hotLeads: number
  wonLeads: number
  newLeads: number
  statusCounts: Record<string, number>
  leadsByMonth: Array<{ month: string; count: number }>
  leadsBySource: Array<{ source: string; count: number }>
  scoreDistribution: Array<{ range: string; count: number }>
  conversionRate: number
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']
const STATUS_COLORS: Record<string, string> = {
  'New': '#3b82f6',
  'Contacted': '#8b5cf6',
  'Qualified': '#10b981',
  'Demo Scheduled': '#f59e0b',
  'Proposal Sent': '#ec4899',
  'Won': '#10b981',
  'Lost': '#ef4444'
}

export default function EnhancedDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentLeads, setRecentLeads] = useState<Lead[]>([])
  const [hotLeads, setHotLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    const supabase = createClient()
    const { data: leads } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false })

    if (leads) {
      // Status counts
      const statusCounts: Record<string, number> = {}
      leads.forEach(lead => {
        statusCounts[lead.lead_status] = (statusCounts[lead.lead_status] || 0) + 1
      })

      // Leads by month (last 6 months)
      const leadsByMonth = calculateLeadsByMonth(leads)
      
      // Leads by source
      const leadsBySource = calculateLeadsBySource(leads)
      
      // Score distribution
      const scoreDistribution = [
        { range: 'Hot (80-100)', count: leads.filter(l => l.lead_score >= 80).length },
        { range: 'Warm (60-79)', count: leads.filter(l => l.lead_score >= 60 && l.lead_score < 80).length },
        { range: 'Qualified (40-59)', count: leads.filter(l => l.lead_score >= 40 && l.lead_score < 60).length },
        { range: 'Cold (<40)', count: leads.filter(l => l.lead_score < 40).length },
      ]

      // Conversion rate
      const wonLeads = leads.filter(l => l.lead_status === 'Won').length
      const conversionRate = leads.length > 0 ? (wonLeads / leads.length) * 100 : 0

      setStats({
        totalLeads: leads.length,
        hotLeads: leads.filter(l => l.lead_score >= 80).length,
        wonLeads,
        newLeads: leads.filter(l => l.lead_status === 'New').length,
        statusCounts,
        leadsByMonth,
        leadsBySource,
        scoreDistribution,
        conversionRate,
      })

      setRecentLeads(leads.slice(0, 5))
      setHotLeads(leads.filter(l => l.lead_score >= 80).slice(0, 5))
    }

    setLoading(false)
  }

  const calculateLeadsByMonth = (leads: Lead[]) => {
    const monthCounts: Record<string, number> = {}
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    
    leads.forEach(lead => {
      const date = new Date(lead.created_at)
      const monthKey = `${months[date.getMonth()]} ${date.getFullYear()}`
      monthCounts[monthKey] = (monthCounts[monthKey] || 0) + 1
    })

    return Object.entries(monthCounts)
      .map(([month, count]) => ({ month, count }))
      .slice(-6)
  }

  const calculateLeadsBySource = (leads: Lead[]) => {
    const sourceCounts: Record<string, number> = {}
    leads.forEach(lead => {
      sourceCounts[lead.lead_source] = (sourceCounts[lead.lead_source] || 0) + 1
    })

    return Object.entries(sourceCounts)
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-lg text-muted-foreground">Loading dashboard...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Overview of your lead pipeline and performance</p>
        </div>
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">{new Date().toLocaleDateString()}</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalLeads || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Hot Leads</CardTitle>
            <TrendingUp className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{stats?.hotLeads || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Score ≥ 80</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Won Deals</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{stats?.wonLeads || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Closed successfully</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">New Leads</CardTitle>
            <AlertCircle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">{stats?.newLeads || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Need follow-up</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {stats?.conversionRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">Conversion rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lead Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Lead Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={Object.entries(stats?.statusCounts || {}).map(([status, count]) => ({
                    name: status,
                    value: count
                  }))}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {Object.entries(stats?.statusCounts || {}).map(([status], index) => (
                    <Cell key={`cell-${index}`} fill={STATUS_COLORS[status] || COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Lead Score Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Lead Score Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats?.scoreDistribution || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leads by Month Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Lead Generation Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats?.leadsByMonth || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} name="Leads" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Leads by Source */}
        <Card>
          <CardHeader>
            <CardTitle>Lead Sources</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats?.leadsBySource || []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="source" type="category" width={120} />
                <Tooltip />
                <Bar dataKey="count" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent & Hot Leads */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Leads */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Leads</CardTitle>
          </CardHeader>
          <CardContent>
            {recentLeads.length === 0 ? (
              <p className="text-sm text-muted-foreground">No leads yet</p>
            ) : (
              <div className="space-y-4">
                {recentLeads.map((lead) => {
                  const scoreBadge = getLeadScoreBadge(lead.lead_score)
                  const statusColor = getStatusBadgeColor(lead.lead_status)
                  
                  return (
                    <Link
                      key={lead.id}
                      href={`/leads/${lead.id}`}
                      className="block p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">
                            {lead.first_name} {lead.last_name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {lead.company_name}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className={`text-xs px-2 py-1 rounded-full bg-${statusColor}-100 text-${statusColor}-700`}>
                            {lead.lead_status}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded-full bg-${scoreBadge.color}-100 text-${scoreBadge.color}-700`}>
                            {scoreBadge.label}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatDate(lead.created_at)}
                      </p>
                    </Link>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Hot Leads */}
        <Card>
          <CardHeader>
            <CardTitle>Hot Leads (Score {'>'} 80)</CardTitle>
          </CardHeader>
          <CardContent>
            {hotLeads.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hot leads yet</p>
            ) : (
              <div className="space-y-4">
                {hotLeads.map((lead) => (
                  <Link
                    key={lead.id}
                    href={`/leads/${lead.id}`}
                    className="block p-3 rounded-lg border border-red-200 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">
                          {lead.first_name} {lead.last_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {lead.company_name}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300">
                          Score: {lead.lead_score}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {lead.job_title} • {lead.seniority_level}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}