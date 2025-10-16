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
  ArrowRight,
  Mail,
  Phone,
  Building2,
  Calendar,
  Loader2
} from 'lucide-react'
import Link from 'next/link'

interface DashboardStats {
  totalLeads: number
  hotLeads: number
  conversionRate: number
  avgLeadScore: number
  newThisWeek: number
  newThisMonth: number
  convertedThisMonth: number
  totalConverted: number
}

interface Lead {
  id: string
  first_name: string
  last_name: string
  email: string
  company_name: string
  lead_score: number
  lead_status: string
  created_at: string
  project_timeline: string
  budget_range: string
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalLeads: 0,
    hotLeads: 0,
    conversionRate: 0,
    avgLeadScore: 0,
    newThisWeek: 0,
    newThisMonth: 0,
    convertedThisMonth: 0,
    totalConverted: 0
  })
  const [recentLeads, setRecentLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    const supabase = createClient()
    
    try {
      // Fetch all leads data
      const { data: leads, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      const now = new Date()
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

      // Calculate real statistics
      const totalLeads = leads?.length || 0
      const hotLeads = leads?.filter(lead => lead.lead_score >= 80).length || 0
      const totalConverted = leads?.filter(lead => lead.lead_status === 'converted').length || 0
      const conversionRate = totalLeads > 0 ? (totalConverted / totalLeads) * 100 : 0
      
      const newThisWeek = leads?.filter(lead => 
        new Date(lead.created_at) >= oneWeekAgo
      ).length || 0
      
      const newThisMonth = leads?.filter(lead => 
        new Date(lead.created_at) >= oneMonthAgo
      ).length || 0
      
      const convertedThisMonth = leads?.filter(lead => 
        lead.lead_status === 'converted' && new Date(lead.created_at) >= oneMonthAgo
      ).length || 0

      const avgLeadScore = totalLeads > 0 
        ? leads.reduce((sum, lead) => sum + (lead.lead_score || 0), 0) / totalLeads 
        : 0

      setStats({
        totalLeads,
        hotLeads,
        conversionRate,
        avgLeadScore,
        newThisWeek,
        newThisMonth,
        convertedThisMonth,
        totalConverted
      })

      setRecentLeads(leads?.slice(0, 5) || [])
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-husig-dark">
        <DashboardHeader />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-husig-purple-500 mx-auto mb-4" />
            <div className="text-lg text-gray-300">Loading dashboard...</div>
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
                <span className="text-husig-gradient">Dashboard</span>
              </h1>
              <p className="text-gray-400 text-lg">Welcome back! Here's your lead pipeline overview.</p>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" className="btn-husig-outline">
                <Download className="w-4 h-4 mr-2" />
                Export Report
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

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <KPICard
            title="Total Leads"
            value={stats.totalLeads}
            change={`+${stats.newThisMonth} this month`}
            icon={Users}
            color="blue"
            trend="up"
          />
          <KPICard
            title="Hot Leads"
            value={stats.hotLeads}
            change={`${stats.newThisWeek} new this week`}
            icon={Target}
            color="red"
            trend="up"
          />
          <KPICard
            title="Conversion Rate"
            value={`${stats.conversionRate.toFixed(1)}%`}
            change={`${stats.convertedThisMonth} converted this month`}
            icon={TrendingUp}
            color="green"
            trend="up"
          />
          <KPICard
            title="Avg Lead Score"
            value={stats.avgLeadScore.toFixed(0)}
            change={`${stats.totalConverted} total converted`}
            icon={DollarSign}
            color="purple"
            trend="up"
          />
        </div>

        {/* Recent Leads */}
        <Card className="card-husig-glass border-gray-700/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl font-semibold text-white">
                Recent Leads
              </CardTitle>
              <Link href="/leads">
                <Button variant="ghost" size="sm" className="text-husig-purple-400 hover:text-husig-purple-300 hover:bg-husig-purple-500/10">
                  View All
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentLeads.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-300 mb-2">No leads yet</h3>
                <p className="text-gray-500 mb-4">Get started by adding your first lead</p>
                <Link href="/leads/new">
                  <Button className="btn-husig-primary">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Your First Lead
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {recentLeads.map((lead, index) => (
                  <Link 
                    key={lead.id} 
                    href={`/leads/${lead.id}`}
                    className="block"
                  >
                    <div className="p-4 rounded-lg bg-gray-800/30 hover:bg-gray-800/50 transition-all duration-200 border border-gray-700/30 hover:border-husig-purple-500/30 group cursor-pointer">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 bg-husig-gradient rounded-full flex items-center justify-center">
                              <span className="text-white font-medium text-sm">
                                {lead.first_name[0]}{lead.last_name[0]}
                              </span>
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">
                              {lead.first_name} {lead.last_name}
                            </p>
                            <div className="flex items-center space-x-4 mt-1">
                              <p className="text-sm text-gray-400 flex items-center">
                                <Mail className="w-3 h-3 mr-1" />
                                {lead.email}
                              </p>
                              <p className="text-sm text-gray-400 flex items-center">
                                <Building2 className="w-3 h-3 mr-1" />
                                {lead.company_name}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <LeadScoreBadge score={lead.lead_score} />
                          <Badge className={`${getStatusBadgeClass(lead.lead_status)} border-0`}>
                            {lead.lead_status.charAt(0).toUpperCase() + lead.lead_status.slice(1)}
                          </Badge>
                          <div className="text-sm text-gray-500">
                            {new Date(lead.created_at).toLocaleDateString()}
                          </div>
                          <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-husig-purple-400 transition-colors" />
                        </div>
                      </div>
                      
                      {/* Additional lead info */}
                      <div className="mt-3 flex items-center space-x-4 text-xs text-gray-500">
                        {lead.project_timeline && (
                          <span className="flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />
                            Timeline: {lead.project_timeline}
                          </span>
                        )}
                        {lead.budget_range && (
                          <span className="flex items-center">
                            <DollarSign className="w-3 h-3 mr-1" />
                            Budget: {lead.budget_range}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="card-husig-glass border-gray-700/50">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-husig-purple-500/20 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-husig-purple-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Manage Leads</h3>
                  <p className="text-gray-400 text-sm">View and manage all your leads</p>
                </div>
              </div>
              <Link href="/leads" className="block mt-4">
                <Button className="w-full btn-husig-outline">
                  View All Leads
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="card-husig-glass border-gray-700/50">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-husig-blue-500/20 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-husig-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Analytics</h3>
                  <p className="text-gray-400 text-sm">Deep dive into your metrics</p>
                </div>
              </div>
              <Link href="/analytics" className="block mt-4">
                <Button className="w-full btn-husig-outline">
                  View Analytics
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="card-husig-glass border-gray-700/50">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <Plus className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Add Lead</h3>
                  <p className="text-gray-400 text-sm">Capture a new lead opportunity</p>
                </div>
              </div>
              <Link href="/leads/new" className="block mt-4">
                <Button className="w-full btn-husig-primary">
                  Add New Lead
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}