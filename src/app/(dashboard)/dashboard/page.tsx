'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { DashboardHeader } from '@/components/layout/DashboardHeader'
import { KPICard } from '@/components/dashboard/KPICard'
import { LeadScoreBadge } from '@/components/leads/LeadScoreBadge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  TrendingUp, 
  Target, 
  DollarSign,
  Plus,
  Download,
  ArrowRight
} from 'lucide-react'
import Link from 'next/link'

interface DashboardStats {
  totalLeads: number
  hotLeads: number
  conversionRate: number
  pipelineValue: number
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalLeads: 0,
    hotLeads: 0,
    conversionRate: 0,
    pipelineValue: 0
  })
  const [recentLeads, setRecentLeads] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    const supabase = createClient()
    
    try {
      // Fetch leads data
      const { data: leads, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      // Calculate statistics
      const totalLeads = leads?.length || 0
      const hotLeads = leads?.filter(lead => lead.lead_score >= 80).length || 0
      const wonLeads = leads?.filter(lead => lead.lead_status === 'converted').length || 0
      const conversionRate = totalLeads > 0 ? (wonLeads / totalLeads) * 100 : 0

      // Mock pipeline value
      const pipelineValue = 450000

      setStats({
        totalLeads,
        hotLeads,
        conversionRate,
        pipelineValue
      })

      setRecentLeads(leads?.slice(0, 5) || [])
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader />
        <div className="flex items-center justify-center h-96">
          <div className="text-lg text-gray-600">Loading dashboard...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600 mt-1">Welcome back! Here's what's happening with your leads.</p>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export Report
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

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <KPICard
            title="Total Leads"
            value={stats.totalLeads}
            change="+12% from last month"
            icon={Users}
            color="blue"
            trend="up"
          />
          <KPICard
            title="Hot Leads"
            value={stats.hotLeads}
            change="+8% from last week"
            icon={Target}
            color="red"
            trend="up"
          />
          <KPICard
            title="Conversion Rate"
            value={`${stats.conversionRate.toFixed(1)}%`}
            change="+2.3% improvement"
            icon={TrendingUp}
            color="green"
            trend="up"
          />
          <KPICard
            title="Pipeline Value"
            value={`$${Math.round(stats.pipelineValue / 1000)}K`}
            change="+15% this quarter"
            icon={DollarSign}
            color="purple"
            trend="up"
          />
        </div>

        {/* Recent Leads */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-gray-900">
                Recent Leads
              </CardTitle>
              <Link href="/leads">
                <Button variant="ghost" size="sm">
                  View All
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentLeads.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">No leads yet</p>
                <Link href="/leads/new">
                  <Button className="mt-4 bg-blue-600 hover:bg-blue-700">
                    Add Your First Lead
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {recentLeads.map((lead) => (
                  <div key={lead.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600">
                          {lead.first_name?.[0]}{lead.last_name?.[0]}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {lead.first_name} {lead.last_name}
                        </div>
                        <div className="text-sm text-gray-500">{lead.company_name}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <LeadScoreBadge score={lead.lead_score} showScore={false} size="sm" />
                      <Badge variant="outline" className="text-xs">
                        {lead.lead_status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
