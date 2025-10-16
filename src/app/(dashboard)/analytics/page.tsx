'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { DashboardHeader } from '@/components/layout/DashboardHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
  Area,
  AreaChart
} from 'recharts'
import { 
  TrendingUp, 
  Users, 
  Target, 
  DollarSign,
  Calendar,
  Download,
  Filter,
  BarChart3,
  PieChart as PieChartIcon
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

const COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316']

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('30')

  useEffect(() => {
    loadAnalyticsData()
  }, [timeRange])

  const loadAnalyticsData = async () => {
    const supabase = createClient()
    
    try {
      // Calculate date range
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - parseInt(timeRange))

      // Fetch leads data
      const { data: leads, error } = await supabase
        .from('leads')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: true })

      if (error) throw error

      // Calculate analytics
      const totalLeads = leads?.length || 0
      const hotLeads = leads?.filter(lead => lead.lead_score >= 80).length || 0
      const convertedLeads = leads?.filter(lead => lead.lead_status === 'Won').length || 0
      const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0
      const avgLeadScore = totalLeads > 0 ? 
        leads.reduce((sum, lead) => sum + (lead.lead_score || 0), 0) / totalLeads : 0

      // Leads by status
      const statusCounts = leads?.reduce((acc, lead) => {
        acc[lead.lead_status] = (acc[lead.lead_status] || 0) + 1
        return acc
      }, {} as Record<string, number>) || {}

      const leadsByStatus = [
        { name: 'New', value: statusCounts['New'] || 0, color: '#3B82F6' },
        { name: 'Contacted', value: statusCounts['Contacted'] || 0, color: '#F59E0B' },
        { name: 'Qualified', value: statusCounts['Qualified'] || 0, color: '#10B981' },
        { name: 'Proposal', value: statusCounts['Proposal'] || 0, color: '#8B5CF6' },
        { name: 'Won', value: statusCounts['Won'] || 0, color: '#10B981' },
        { name: 'Lost', value: statusCounts['Lost'] || 0, color: '#EF4444' }
      ].filter(item => item.value > 0)

      // Leads by source
      const sourceCounts = leads?.reduce((acc, lead) => {
        const source = lead.lead_source || 'Unknown'
        acc[source] = (acc[source] || 0) + 1
        return acc
      }, {} as Record<string, number>) || {}

      const leadsBySource = Object.entries(sourceCounts).map(([name, value]) => ({
        name,
        value
      }))

      // Leads by industry
      const industryCounts = leads?.reduce((acc, lead) => {
        acc[lead.industry] = (acc[lead.industry] || 0) + 1
        return acc
      }, {} as Record<string, number>) || {}

      const leadsByIndustry = Object.entries(industryCounts).map(([name, value]) => ({
        name,
        value
      }))

      // Score distribution
      const scoreRanges = {
        '0-20': 0,
        '21-40': 0,
        '41-60': 0,
        '61-80': 0,
        '81-100': 0
      }

      leads?.forEach(lead => {
        const score = lead.lead_score || 0
        if (score <= 20) scoreRanges['0-20']++
        else if (score <= 40) scoreRanges['21-40']++
        else if (score <= 60) scoreRanges['41-60']++
        else if (score <= 80) scoreRanges['61-80']++
        else scoreRanges['81-100']++
      })

      const scoreDistribution = Object.entries(scoreRanges).map(([range, count]) => ({
        range,
        count
      }))

      // Leads over time (daily)
      const dailyLeads = new Map()
      const dailyConverted = new Map()

      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateKey = d.toISOString().split('T')[0]
        dailyLeads.set(dateKey, 0)
        dailyConverted.set(dateKey, 0)
      }

      leads?.forEach(lead => {
        const dateKey = lead.created_at.split('T')[0]
        dailyLeads.set(dateKey, (dailyLeads.get(dateKey) || 0) + 1)
        
        if (lead.lead_status === 'Won') {
          dailyConverted.set(dateKey, (dailyConverted.get(dateKey) || 0) + 1)
        }
      })

      const leadsOverTime = Array.from(dailyLeads.entries()).map(([date, leads]) => ({
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        leads,
        converted: dailyConverted.get(date) || 0
      }))

      // Conversion funnel
      const conversionFunnel = [
        { stage: 'Total Leads', count: totalLeads, percentage: 100 },
        { stage: 'Contacted', count: statusCounts['Contacted'] || 0, percentage: totalLeads > 0 ? ((statusCounts['Contacted'] || 0) / totalLeads) * 100 : 0 },
        { stage: 'Qualified', count: statusCounts['Qualified'] || 0, percentage: totalLeads > 0 ? ((statusCounts['Qualified'] || 0) / totalLeads) * 100 : 0 },
        { stage: 'Proposal', count: statusCounts['Proposal'] || 0, percentage: totalLeads > 0 ? ((statusCounts['Proposal'] || 0) / totalLeads) * 100 : 0 },
        { stage: 'Won', count: convertedLeads, percentage: conversionRate }
      ]

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
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader />
        <div className="flex items-center justify-center h-96">
          <div className="text-lg text-gray-600">Loading analytics...</div>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">No Data Available</h1>
            <p className="text-gray-600">No analytics data found for the selected time period.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
              <p className="text-gray-600 mt-1">Insights into your lead pipeline performance</p>
            </div>
            <div className="flex items-center space-x-3">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                  <SelectItem value="365">Last year</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={exportData}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white shadow-sm border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Leads</p>
                  <p className="text-3xl font-bold text-gray-900">{data.totalLeads}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Hot Leads</p>
                  <p className="text-3xl font-bold text-gray-900">{data.hotLeads}</p>
                </div>
                <div className="p-3 bg-red-100 rounded-full">
                  <Target className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Conversion Rate</p>
                  <p className="text-3xl font-bold text-gray-900">{data.conversionRate.toFixed(1)}%</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg Lead Score</p>
                  <p className="text-3xl font-bold text-gray-900">{data.avgLeadScore.toFixed(1)}</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <BarChart3 className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Leads Over Time */}
          <Card className="bg-white shadow-sm border-0">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Leads Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={data.leadsOverTime}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
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
          <Card className="bg-white shadow-sm border-0">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Lead Status Distribution</CardTitle>
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
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Lead Sources */}
          <Card className="bg-white shadow-sm border-0">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Lead Sources</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.leadsBySource} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={80} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Score Distribution */}
          <Card className="bg-white shadow-sm border-0">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Lead Score Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.scoreDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="range" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8B5CF6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Full Width Charts */}
        <div className="space-y-8">
          {/* Industry Analysis */}
          <Card className="bg-white shadow-sm border-0">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Leads by Industry</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={data.leadsByIndustry}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#10B981" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Conversion Funnel */}
          <Card className="bg-white shadow-sm border-0">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Conversion Funnel</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.conversionFunnel.map((stage, index) => (
                  <div key={stage.stage} className="relative">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-900">{stage.stage}</span>
                      <span className="text-sm text-gray-600">
                        {stage.count} leads ({stage.percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-8 relative overflow-hidden">
                      <div 
                        className={`h-8 rounded-full transition-all duration-500 ${
                          index === 0 ? 'bg-blue-600' :
                          index === 1 ? 'bg-yellow-500' :
                          index === 2 ? 'bg-green-500' :
                          index === 3 ? 'bg-purple-500' :
                          'bg-green-600'
                        }`}
                        style={{ width: `${stage.percentage}%` }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-sm font-medium text-white">
                          {stage.count} ({stage.percentage.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Performance Insights */}
          <Card className="bg-white shadow-sm border-0">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Key Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-medium text-blue-900 mb-2">Best Performing Source</h3>
                  <p className="text-blue-700">
                    {data.leadsBySource.length > 0 
                      ? data.leadsBySource.reduce((prev, current) => 
                          prev.value > current.value ? prev : current
                        ).name
                      : 'No data'
                    }
                  </p>
                </div>

                <div className="p-4 bg-green-50 rounded-lg">
                  <h3 className="font-medium text-green-900 mb-2">Top Industry</h3>
                  <p className="text-green-700">
                    {data.leadsByIndustry.length > 0
                      ? data.leadsByIndustry.reduce((prev, current) => 
                          prev.value > current.value ? prev : current
                        ).name
                      : 'No data'
                    }
                  </p>
                </div>

                <div className="p-4 bg-purple-50 rounded-lg">
                  <h3 className="font-medium text-purple-900 mb-2">Quality Score</h3>
                  <p className="text-purple-700">
                    {data.avgLeadScore >= 70 ? 'Excellent' :
                     data.avgLeadScore >= 50 ? 'Good' :
                     data.avgLeadScore >= 30 ? 'Average' : 'Needs Improvement'}
                  </p>
                  <p className="text-sm text-purple-600 mt-1">
                    Average: {data.avgLeadScore.toFixed(1)}/100
                  </p>
                </div>
              </div>

              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-3">Recommendations</h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  {data.conversionRate < 10 && (
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                      Low conversion rate detected. Consider improving lead qualification process.
                    </li>
                  )}
                  {data.avgLeadScore < 50 && (
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                      Average lead score is below 50. Focus on higher-quality lead sources.
                    </li>
                  )}
                  {data.hotLeads / data.totalLeads > 0.3 && (
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                      Great job! High percentage of hot leads indicates quality pipeline.
                    </li>
                  )}
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                    Consider A/B testing different outreach strategies for your top-performing sources.
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}