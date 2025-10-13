'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Lead } from '@/types/database'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, TrendingUp, CheckCircle, AlertCircle } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { getLeadScoreBadge, getStatusBadgeColor } from '@/lib/validations/lead'

interface DashboardStats {
  totalLeads: number
  hotLeads: number
  wonLeads: number
  newLeads: number
  statusCounts: Record<string, number>
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentLeads, setRecentLeads] = useState<Lead[]>([])
  const [hotLeads, setHotLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadDashboardData = async () => {
      const supabase = createClient()
      
      // Fetch all leads
      const { data: leads } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false })

      if (leads) {
        // Calculate stats
        const statusCounts: Record<string, number> = {}
        leads.forEach(lead => {
          statusCounts[lead.lead_status] = (statusCounts[lead.lead_status] || 0) + 1
        })

        setStats({
          totalLeads: leads.length,
          hotLeads: leads.filter(l => l.lead_score >= 80).length,
          wonLeads: leads.filter(l => l.lead_status === 'Won').length,
          newLeads: leads.filter(l => l.lead_status === 'New').length,
          statusCounts,
        })

        setRecentLeads(leads.slice(0, 5))
        setHotLeads(leads.filter(l => l.lead_score >= 80).slice(0, 5))
      }

      setLoading(false)
    }

    loadDashboardData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-lg text-muted-foreground">Loading dashboard...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your leads and performance</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalLeads || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Hot Leads</CardTitle>
            <TrendingUp className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{stats?.hotLeads || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Won Deals</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{stats?.wonLeads || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">New Leads</CardTitle>
            <AlertCircle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">{stats?.newLeads || 0}</div>
          </CardContent>
        </Card>
      </div>

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
                          <span className={`text-xs px-2 py-1 rounded-full bg-${statusColor}-100 text-${statusColor}-700 dark:bg-${statusColor}-900 dark:text-${statusColor}-300`}>
                            {lead.lead_status}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded-full bg-${scoreBadge.color}-100 text-${scoreBadge.color}-700 dark:bg-${scoreBadge.color}-900 dark:text-${scoreBadge.color}-300`}>
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

      {/* Status Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Leads by Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats && Object.entries(stats.statusCounts).map(([status, count]) => {
              const color = getStatusBadgeColor(status)
              return (
                <div key={status} className="text-center p-4 rounded-lg border">
                  <p className={`text-2xl font-bold text-${color}-500`}>{count}</p>
                  <p className="text-sm text-muted-foreground mt-1">{status}</p>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}