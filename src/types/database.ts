
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'id' | 'created_at'>
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>
      }
      leads: {
        Row: Lead
        Insert: Omit<Lead, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Lead, 'id' | 'created_at' | 'updated_at'>>
      }
      activities: {
        Row: Activity
        Insert: Omit<Activity, 'id' | 'created_at'>
        Update: Partial<Omit<Activity, 'id' | 'created_at'>>
      }
      notes: {
        Row: Note
        Insert: Omit<Note, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Note, 'id' | 'created_at' | 'updated_at'>>
      }
    }
  }
}

export interface Profile {
  id: string
  full_name: string | null
  email: string | null
  role: 'admin' | 'manager' | 'intern'
  avatar_url: string | null
  created_at: string
}

export interface Company {
  id: string
  name: string
  website: string | null
  size: CompanySize | null
  industry: Industry | null
  description: string | null
  logo_url: string | null
  linkedin_url: string | null
  phone: string | null
  address: string | null
  
  // Engagement history
  previous_engagement_count: number
  total_revenue_generated: number | null
  last_deal_closed_date: string | null
  last_deal_status: 'won' | 'lost' | null
  last_deal_value: number | null
  
  // Strategic importance
  is_strategic_account: boolean
  account_tier: 'tier1' | 'tier2' | 'tier3' | null
  
  // Metadata
  created_by: string
  created_at: string
  updated_at: string
  tags: string[]
}

// Improved type definitions with proper enums
export type SeniorityLevel = 'C-Level' | 'VP/Director' | 'Manager' | 'Individual Contributor'
export type CompanySize = '1-10' | '11-50' | '51-200' | '201-500' | '501-1000' | '1000+'
export type Industry = 'Financial Services' | 'Healthcare' | 'Government/Public Sector' | 'E-commerce' | 'Transportation' | 'Education' | 'Manufacturing' | 'Other'
export type ProjectTimeline = 'ASAP' | '1-3 months' | '3-6 months' | '6-12 months' | '12+ months' | 'Flexible'
export type BudgetRange = '<$10K' | '$10K-$50K' | '$50K-$100K' | '$100K-$250K' | '$250K+' | 'Not Sure'
export type LeadSource = 'linkedin_outreach' | 'conference' | 'referral' | 'partnership' | 'inbound' | 'cold_email' | 'existing_relationship' | 'other'
export type LeadStatus = 'new' | 'qualifying' | 'qualified' | 'nurturing' | 'demo_scheduled' | 'demo_completed' | 'proposal_sent' | 'negotiating' | 'converted' | 'lost' | 'disqualified'
export type GoNoGoDecision = 'go' | 'no_go' | 'pending'
export type InternalReadinessStatus = 'not_started' | 'researching' | 'ready' | 'blocked'
export type ResourceAllocationStatus = 'available' | 'limited' | 'unavailable'
export type CompetitiveThreatLevel = 'low' | 'medium' | 'high'

export interface Lead {
  id: string
  company_id: string
  
  // Contact information
  first_name: string
  last_name: string
  email: string
  phone: string | null
  job_title: string
  seniority_level: SeniorityLevel
  linkedin_url: string | null
  is_decision_maker: boolean
  is_champion: boolean
  
  // Lead source (how HuSig found them)
  source_type: LeadSource
  source_details: string | null
  sourced_by: string  // User ID who found this lead
  source_url: string | null
  source_cost: number | null
  
  // Project/Opportunity details
  service_interest: string[]
  pain_point: string
  project_timeline: ProjectTimeline
  budget_range: BudgetRange | null
  budget_confirmed: boolean
  authority_confirmed: boolean
  
  // Lead lifecycle
  lead_status: LeadStatus
  lead_stage_updated_at: string
  
  // Scoring (0-100 for all scores)
  lead_score: number
  win_probability: number  // likelihood we'll win
  strategic_fit_score: number  // alignment with HuSig focus
  effort_score: number  // effort required (lower is better)
  
  // Timing and engagement
  first_contact_date: string | null
  last_contact_date: string | null
  next_follow_up_date: string | null
  response_time_hours: number | null
  is_stale: boolean  // Auto-calculated based on last contact
  days_in_current_stage: number
  
  // Internal readiness
  is_qualified: boolean
  qualification_notes: string | null
  go_no_go_decision: GoNoGoDecision | null
  go_no_go_reason: string | null
  internal_readiness_status: InternalReadinessStatus
  assigned_team_members: string[]  // Array of user IDs
  required_skills: string[]
  resource_allocation_status: ResourceAllocationStatus | null
  
  // Competition
  competitors_identified: string[]
  competitive_threat_level: CompetitiveThreatLevel | null
  
  // Notes and context
  notes: string | null
  internal_notes: string | null  // Private notes not shared with all team
  
  // Assignment
  assigned_to: string | null  // Primary owner
  created_by: string
  
  // Legacy fields for backward compatibility (populate from company table)
  company_name: string
  company_website: string | null
  company_size: CompanySize | null
  industry: Industry | null
  lead_source: LeadSource  // Maps to source_type
  
  // Metadata
  created_at: string
  updated_at: string
  tags: string[]
}

export interface Activity {
  id: string
  lead_id: string
  activity_type: 'lead_created' | 'status_changed' | 'note_added' | 'lead_updated' | 'email_sent' | 'call_made' | 'meeting_scheduled' | 'demo_completed' | 'proposal_sent' | 'contract_signed'
  description: string
  metadata: Record<string, any> | null
  created_by: string
  created_at: string
}

export interface Note {
  id: string
  lead_id: string
  content: string
  is_private: boolean
  created_by: string
  created_at: string
  updated_at: string
}

// Utility types for forms and API responses
export type LeadFormData = Omit<Lead, 'id' | 'created_at' | 'updated_at' | 'lead_score' | 'company_id'>
export type LeadSummary = Pick<Lead, 'id' | 'first_name' | 'last_name' | 'email' | 'company_name' | 'lead_status' | 'lead_score' | 'created_at'>
export type LeadListItem = LeadSummary & {
  activity_count: number
  last_activity_date: string | null
}

// API Response types
export interface ApiResponse<T> {
  data: T | null
  error: string | null
  success: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  count: number
  page: number
  limit: number
  total_pages: number
}

// Error types
export interface ApiError {
  message: string
  code: string
  details?: Record<string, any>
}

export interface ValidationError {
  field: string
  message: string
  code: string
}