// src/app/(dashboard)/dashboard/page.tsx
'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { DashboardHeader } from '@/components/layout/DashboardHeader'
import { KPICard } from '@/components/dashboard/KPICard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Users, 
  TrendingUp, 
  CheckCircle, 
  Target, 
  DollarSign,
  Plus,
  Clock,
  Download,
  ArrowRight
} from 'lucide-react'
import { 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  Legend
} from 'recharts'
import Link from 'next/link'

interface DashboardStats {
  totalLeads: number
  hotLeads: number
  warmLeads: number
  qualifiedLeads: number
  coldLeads: number
  newLeads: number
  wonLeads: number
  conversionRate: number
  pipelineValue: number
  statusCounts: Record<string, number>
  scoreDistribution: Array<{ range: string; count: number }>
  leadsByMonth: Array<{ month: string; count: number }>
  leadsBySource: Array<{ source: string; count: number }>
}

const SCORE_COLORS = ['#ef4444', '#f97316', '#eab308', '#6b7280']

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
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
      const warmLeads = leads?.filter(lead => lead.lead_score >= 60 && lead.lead_score < 80).length || 0
      const qualifiedLeads = leads?.filter(lead => lead.lead_score >= 40 && lead.lead_score < 60).length || 0
      const coldLeads = leads?.filter(lead => lead.lead_score < 40).length || 0
      const newLeads = leads?.filter(lead => lead.lead_status === 'new').length || 0
      const wonLeads = leads?.filter(lead => lead.lead_status === 'converted').length || 0
      const conversionRate = totalLeads > 0 ? (wonLeads / totalLeads) * 100 : 0

      // Mock pipeline value - you can calculate this based on your business logic
      const pipelineValue = leads?.reduce((sum, lead) => {
        const budgetMap: Record<string, number> = {
          '<$10K': 5000,
          '$10K-$50K': 30000,
          '$50K-$100K': 75000,
          '$100K-$250K': 175000,
          '$250K+': 350000
        }
        return sum + (budgetMap[lead.budget_range] || 0)
      }, 0) || 0

      // Status distribution
      const statusCounts = leads?.reduce((acc: Record<string, number>, lead) => {
        acc[lead.lead_status] = (acc[lead.lead_status] || 0) + 1
        return acc
      }, {}) || {}

      // Score distribution
      const scoreDistribution = [
        { range: 'Hot (80-100)', count: hotLeads },
        { range: 'Warm (60-79)', count: warmLeads },
        { range: 'Qualified (40-59)', count: qualifiedLeads },
        { range: 'Cold (<40)', count: coldLeads }
      ]

      // Mock data for charts
      const leadsByMonth = [
        { month: 'Jan', count: 12 },
        { month: 'Feb', count: 19 },
        { month: 'Mar', count: 15 },
        { month: 'Apr', count: 23 },
        { month: 'May', count: 28 },
        { month: 'Jun', count: 35 }
      ]

      const leadsBySource = [
        { source: 'LinkedIn', count: 45 },
        { source: 'Website', count: 32 },
        { source: 'Referral', count: 28 },
        { source: 'Conference', count: 15 },
        { source: 'Cold Email', count: 12 }
      ]

      setStats({
        totalLeads,
        hotLeads,
        warmLeads,
        qualifiedLeads,
        coldLeads,
        newLeads,
        wonLeads,
        conversionRate,
        pipelineValue,
        statusCounts,
        scoreDistribution,
        leadsByMonth,
        leadsBySource
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
            value={stats?.totalLeads || 0}
            change="+12% from last month"
            icon={Users}
            color="blue"
            trend="up"
          />
          <KPICard
            title="Hot Leads"
            value={stats?.hotLeads || 0}
            change="+8% from last week"
            icon={Target}
            color="red"
            trend="up"
          />
          <KPICard
            title="Conversion Rate"
            value={`${stats?.conversionRate.toFixed(1) || 0}%`}
            change="+2.3% improvement"
            icon={TrendingUp}
            color="green"
            trend="up"
          />
          <KPICard
            title="Pipeline Value"
            value={`$${Math.round((stats?.pipelineValue || 0) / 1000)}K`}
            change="+15% this quarter"
            icon={DollarSign}
            color="purple"
            trend="up"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Lead Score Distribution */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">
                Lead Score Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={stats?.scoreDistribution || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {(stats?.scoreDistribution || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={SCORE_COLORS[index % SCORE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Lead Generation Trend */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">
                Lead Generation Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={stats?.leadsByMonth || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#0ea5e9" 
                    strokeWidth={3}
                    dot={{ fill: '#0ea5e9', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Leads */}
          <Card className="lg:col-span-2 border-0 shadow-sm">
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

          {/* Quick Actions */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link href="/leads/new">
                <Button className="w-full bg-blue-600 hover:bg-blue-700 justify-start">
                  <Plus className="w-4 h-4 mr-2" />
                  Add New Lead
                </Button>
              </Link>
              
              <Link href="/leads?filter=hot">
                <Button variant="outline" className="w-full justify-start">
                  <Target className="w-4 h-4 mr-2" />
                  Review Hot Leads
                </Button>
              </Link>
              
              <Link href="/leads?filter=follow-up">
                <Button variant="outline" className="w-full justify-start">
                  <Clock className="w-4 h-4 mr-2" />
                  Follow-up Required
                </Button>
              </Link>
              
              <Link href="/analytics">
                <Button variant="outline" className="w-full justify-start">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  View Analytics
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}