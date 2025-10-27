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

// Simplified Profile interface - no admin/approval fields
export interface Profile {
  id: string
  full_name: string | null
  email: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

// Enum type definitions
export type SeniorityLevel = 'C-Level' | 'VP/Director' | 'Manager' | 'Individual Contributor'
export type CompanySize = '1-10' | '11-50' | '51-200' | '201-500' | '501-1000' | '1000+'
export type Industry = 'Financial Services' | 'Healthcare' | 'Government/Public Sector' | 'E-commerce' | 'Transportation' | 'Education' | 'Manufacturing' | 'Other'
export type ProjectTimeline = 'ASAP' | '1-3 months' | '3-6 months' | '6-12 months' | 'Flexible'
export type BudgetRange = '<$10K' | '$10K-$50K' | '$50K-$100K' | '$100K-$250K' | '$250K+' | 'Not Sure'
export type LeadSource = 'LinkedIn' | 'Google Search' | 'Website' | 'Referral' | 'Conference' | 'Cold Outreach' | 'Other'
export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost' | 'archived'
export type ActivityType = 'status_changed' | 'note_added' | 'email_sent' | 'call_made' | 'meeting_scheduled' | 'lead_updated' | 'lead_created'

// Lead interface matching the simplified schema
export interface Lead {
  id: string
  
  // Contact Information
  first_name: string
  last_name: string
  email: string
  phone: string | null
  job_title: string
  seniority_level: SeniorityLevel
  linkedin_url: string | null
  
  // Company Information
  company_name: string
  company_website: string | null
  company_size: CompanySize
  industry: Industry
  
  // Project Information
  service_interest: string[]
  pain_point: string
  project_timeline: ProjectTimeline
  budget_range: BudgetRange | null
  
  // Lead Management
  lead_status: LeadStatus
  lead_score: number
  lead_source: LeadSource
  tags: string[]
  notes: string | null
  
  // System fields
  created_by: string
  updated_by: string | null
  created_at: string
  updated_at: string
  
  // Optional computed fields
  created_by_name?: string | null
}

// Activity interface
export interface Activity {
  id: string
  lead_id: string
  activity_type: ActivityType
  description: string
  metadata: Record<string, any> | null
  created_by: string
  created_at: string
  
  // Optional computed fields
  created_by_name?: string | null
}

// Note interface
export interface Note {
  id: string
  lead_id: string
  content: string
  note_type: 'general' | 'call' | 'email' | 'meeting' | 'follow_up'
  is_private: boolean
  created_by: string
  created_at: string
  updated_at: string
  
  // Optional computed fields
  created_by_name?: string | null
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

// Search and filter types
export interface LeadFilters {
  status?: LeadStatus[]
  score_min?: number
  score_max?: number
  company_size?: CompanySize[]
  industry?: Industry[]
  created_after?: string
  created_before?: string
  search?: string
}

// Dashboard analytics types
export interface LeadMetrics {
  total_leads: number
  new_leads: number
  qualified_leads: number
  converted_leads: number
  average_score: number
  conversion_rate: number
}

// Status configuration for UI components
export interface StatusConfig {
  icon: string
  color: string
  description: string
}

// Utility types
export type RequiredKeys<T, K extends keyof T> = T & Required<Pick<T, K>>
export type PartialKeys<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>