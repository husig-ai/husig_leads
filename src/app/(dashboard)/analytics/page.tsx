'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { DashboardHeader } from '@/components/layout/DashboardHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts'
import { 
  TrendingUp, 
  Users, 
  Target, 
  DollarSign, 
  Download,
  Calendar,
  Loader2
} from 'lucide-react'

interface AnalyticsData {
  totalLeads: number
  hotLeads: number
  conversionRate: number
  avgLeadScore: number
  leadsByStatus: Array<{ name: string; value: number; color: string }>
  leadsBySource: Array<{ name: string; value: number }>
  leadsByIndustry: Array<{ name: string; value: number }>
  scoreDistribution: Array<{ range: string; count: number }>
  leadsOverTime: Array<{ date: string; leads: number; converted: number }>
  conversionFunnel: Array<{ stage: string; count: number; percentage: number }>
}

const STATUS_COLORS = {
  new: '#3B82F6',
  contacted: '#8B5CF6',
  qualified: '#10B981',
  demo_scheduled: '#F59E0B',
  proposal_sent: '#EF4444',
  negotiating: '#6366F1',
  converted: '#059669',
  lost: '#DC2626',
  disqualified: '#6B7280'
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('30')

  useEffect(() => {
    loadAnalyticsData()
  }, [dateRange])

  const loadAnalyticsData = async () => {
    const supabase = createClient()
    
    try {
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(endDate.getDate() - parseInt(dateRange))

      const { data: leads, error } = await supabase
        .from('leads')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true })

      if (error) throw error

      const allLeads = leads || []
      const totalLeads = allLeads.length
      const hotLeads = allLeads.filter(lead => lead.lead_score >= 80).length
      const convertedLeads = allLeads.filter(lead => lead.lead_status === 'converted').length
      const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0
      const avgLeadScore = totalLeads > 0 
        ? allLeads.reduce((sum, lead) => sum + (lead.lead_score || 0), 0) / totalLeads 
        : 0

      // Leads by status
      const statusCounts = allLeads.reduce((acc, lead) => {
        acc[lead.lead_status] = (acc[lead.lead_status] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      const leadsByStatus = Object.entries(statusCounts).map(([status, count]) => ({
        name: status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' '),
        value: count,
        color: STATUS_COLORS[status as keyof typeof STATUS_COLORS] || '#6B7280'
      }))

      // Leads by source
      const sourceCounts = allLeads.reduce((acc, lead) => {
        const source = lead.lead_source || 'Unknown'
        acc[source] = (acc[source] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      const leadsBySource = Object.entries(sourceCounts).map(([source, count]) => ({
        name: source,
        value: count
      }))

      // Leads by industry
      const industryCounts = allLeads.reduce((acc, lead) => {
        const industry = lead.industry || 'Unknown'
        acc[industry] = (acc[industry] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      const leadsByIndustry = Object.entries(industryCounts).map(([industry, count]) => ({
        name: industry,
        value: count
      }))

      // Score distribution
      const scoreRanges = [
        { range: '0-20', min: 0, max: 20 },
        { range: '21-40', min: 21, max: 40 },
        { range: '41-60', min: 41, max: 60 },
        { range: '61-80', min: 61, max: 80 },
        { range: '81-100', min: 81, max: 100 }
      ]

      const scoreDistribution = scoreRanges.map(({ range, min, max }) => ({
        range,
        count: allLeads.filter(lead => 
          (lead.lead_score || 0) >= min && (lead.lead_score || 0) <= max
        ).length
      }))

      // Leads over time
      const leadsOverTime: Array<{ date: string; leads: number; converted: number }> = []
      
      for (let i = parseInt(dateRange) - 1; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        const dateStr = date.toISOString().split('T')[0]
        
        const dayLeads = allLeads.filter(lead => 
          lead.created_at.split('T')[0] === dateStr
        )
        
        leadsOverTime.push({
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          leads: dayLeads.length,
          converted: dayLeads.filter(lead => lead.lead_status === 'converted').length
        })
      }

      // Conversion funnel
      const funnelStages = [
        { stage: 'New', statuses: ['new'] },
        { stage: 'Contacted', statuses: ['contacted'] },
        { stage: 'Qualified', statuses: ['qualified'] },
        { stage: 'Demo/Proposal', statuses: ['demo_scheduled', 'proposal_sent'] },
        { stage: 'Negotiating', statuses: ['negotiating'] },
        { stage: 'Won', statuses: ['converted'] }
      ]

      const conversionFunnel = funnelStages.map(({ stage, statuses }) => {
        const count = allLeads.filter(lead => statuses.includes(lead.lead_status)).length
        const percentage = totalLeads > 0 ? (count / totalLeads) * 100 : 0
        return { stage, count, percentage }
      })

      setData({
        totalLeads,
        hotLeads,
        conversionRate,
        avgLeadScore,
        leadsByStatus,
        leadsBySource,
        leadsByIndustry,
        scoreDistribution,
        leadsOverTime,
        conversionFunnel
      })

    } catch (error) {
      console.error('Error loading analytics data:', error)
    } finally {
      setLoading(false)
    }
  }

  const exportData = () => {
    if (!data) return

    const csvContent = [
      ['Metric', 'Value'],
      ['Total Leads', data.totalLeads],
      ['Hot Leads', data.hotLeads],
      ['Conversion Rate', `${data.conversionRate.toFixed(2)}%`],
      ['Average Lead Score', data.avgLeadScore.toFixed(1)],
      [''],
      ['Lead Status', 'Count'],
      ...data.leadsByStatus.map(item => [item.name, item.value]),
      [''],
      ['Lead Source', 'Count'],
      ...data.leadsBySource.map(item => [item.name, item.value])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `analytics-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-husig-dark">
        <DashboardHeader />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-husig-purple-500 mx-auto mb-4" />
            <div className="text-lg text-gray-300">Loading analytics...</div>
          </div>
        </div>
      </div>
    )
  }

  if (!data || data.totalLeads === 0) {
    return (
      <div className="min-h-screen bg-husig-dark">
        <DashboardHeader />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white mb-4">
              <span className="text-husig-gradient">Analytics</span>
            </h1>
            <div className="card-husig-glass border-gray-700/50 p-12 rounded-xl mt-8">
              <Users className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-300 mb-4">No Data Available</h2>
              <p className="text-gray-400 mb-6">
                Start adding leads to see analytics and insights about your pipeline.
              </p>
              <Button className="btn-husig-primary">
                Add Your First Lead
              </Button>
            </div>
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                <span className="text-husig-gradient">Analytics</span>
              </h1>
              <p className="text-gray-400 text-lg">Insights into your lead pipeline performance</p>
            </div>
            <div className="flex items-center space-x-3">
              <select 
                value={dateRange} 
                onChange={(e) => setDateRange(e.target.value)}
                className="husig-select"
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="365">Last year</option>
              </select>
              <Button variant="outline" onClick={exportData} className="btn-husig-outline">
                <Download className="w-4 h-4 mr-2" />
                Export Data
              </Button>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="card-husig-glass border-gray-700/50">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-400">Total Leads</p>
                  <p className="text-2xl font-bold text-white">{data.totalLeads}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-husig-glass border-gray-700/50">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center">
                  <Target className="w-6 h-6 text-red-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-400">Hot Leads</p>
                  <p className="text-2xl font-bold text-white">{data.hotLeads}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-husig-glass border-gray-700/50">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-400">Conversion Rate</p>
                  <p className="text-2xl font-bold text-white">{data.conversionRate.toFixed(1)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-husig-glass border-gray-700/50">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-purple-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-400">Avg Lead Score</p>
                  <p className="text-2xl font-bold text-white">{data.avgLeadScore.toFixed(0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Leads Over Time */}
          <Card className="card-husig-glass border-gray-700/50">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-white">Leads Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={data.leadsOverTime}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#F9FAFB'
                    }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="leads"
                    stackId="1"
                    stroke="#3B82F6"
                    fill="#3B82F6"
                    fillOpacity={0.6}
                    name="New Leads"
                  />
                  <Area
                    type="monotone"
                    dataKey="converted"
                    stackId="2"
                    stroke="#10B981" 
                    fill="#10B981" 
                    fillOpacity={0.8}
                    name="Converted"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Lead Status Distribution */}
          <Card className="card-husig-glass border-gray-700/50">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-white">Lead Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={data.leadsByStatus}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {data.leadsByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#F9FAFB'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Lead Sources */}
          <Card className="card-husig-glass border-gray-700/50">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-white">Lead Sources</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.leadsBySource} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis type="number" stroke="#9CA3AF" />
                  <YAxis dataKey="name" type="category" width={80} stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#F9FAFB'
                    }}
                  />
                  <Bar dataKey="value" fill="#8B5CF6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Score Distribution */}
          <Card className="card-husig-glass border-gray-700/50">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-white">Lead Score Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.scoreDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="range" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#F9FAFB'
                    }}
                  />
                  <Bar dataKey="count" fill="#06B6D4" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Conversion Funnel */}
        <Card className="card-husig-glass border-gray-700/50">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-white">Conversion Funnel</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.conversionFunnel.map((stage, index) => (
                <div key={stage.stage} className="relative">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-300">{stage.stage}</span>
                    <span className="text-sm text-gray-400">
                      {stage.count} leads ({stage.percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-husig-blue-500 to-husig-purple-500 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${stage.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Industry Breakdown */}
        {data.leadsByIndustry.length > 0 && (
          <Card className="card-husig-glass border-gray-700/50 mt-8">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-white">Leads by Industry</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.leadsByIndustry}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="name" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#F9FAFB'
                    }}
                  />
                  <Bar dataKey="value" fill="#F59E0B" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}