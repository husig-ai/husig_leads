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

// Updated Profile interface with admin approval fields
export interface Profile {
  id: string
  full_name: string | null
  email: string | null
  role: 'admin' | 'manager' | 'intern'
  avatar_url: string | null
  
  // Admin approval fields
  is_approved: boolean
  approved_by: string | null
  approved_at: string | null
  invitation_token: string | null
  invited_by: string | null
  invited_at: string | null
  
  // Additional profile fields
  phone: string | null
  job_title: string | null
  bio: string | null
  
  created_at: string
}

// Enum type definitions
export type SeniorityLevel = 'C-Level' | 'VP/Director' | 'Manager' | 'Individual Contributor'
export type CompanySize = '1-10' | '11-50' | '51-200' | '201-500' | '501-1000' | '1000+'
export type Industry = 'Financial Services' | 'Healthcare' | 'Government/Public Sector' | 'E-commerce' | 'Transportation' | 'Education' | 'Manufacturing' | 'Other'
export type ProjectTimeline = 'ASAP' | '1-3 months' | '3-6 months' | '6-12 months' | 'Flexible'
export type BudgetRange = '<$10K' | '$10K-$50K' | '$50K-$100K' | '$100K-$250K' | '$250K+' | 'Not Sure'
export type LeadSource = 'LinkedIn' | 'Google Search' | 'Website' | 'Referral' | 'Conference' | 'Cold Outreach' | 'Other'
export type LeadStatus = 'new' | 'qualifying' | 'qualified' | 'nurturing' | 'demo_scheduled' | 'demo_completed' | 'proposal_sent' | 'negotiating' | 'converted' | 'lost' | 'disqualified'
export type ActivityType = 'status_changed' | 'note_added' | 'email_sent' | 'call_made' | 'meeting_scheduled' | 'meeting_completed' | 'document_sent' | 'follow_up_scheduled' | 'lead_updated' | 'lead_created'

// Lead interface matching the actual schema
export interface Lead {
  id: string
  
  // Contact Information
  first_name: string
  last_name: string
  email: string
  phone: string | null
  job_title: string
  seniority_level: SeniorityLevel | null
  linkedin_url: string | null
  
  // Company Information  
  company_name: string
  company_website: string
  company_size: CompanySize | null
  industry: Industry | null
  
  // Project Details
  service_interest: string[]
  pain_point: string
  project_timeline: ProjectTimeline | null
  budget_range: BudgetRange | null
  lead_source: LeadSource | null
  
  // Lead Management
  lead_status: LeadStatus
  lead_score: number
  notes: string | null
  
  // Assignment and Ownership
  assigned_to: string | null
  created_by: string
  
  // Timestamps
  created_at: string
  updated_at: string
}

// Activity interface matching the schema
export interface Activity {
  id: string
  lead_id: string
  activity_type: ActivityType
  description: string
  metadata: Record<string, any> | null
  created_by: string
  created_at: string
}

// Note interface matching the schema  
export interface Note {
  id: string
  lead_id: string
  content: string
  created_by: string
  created_at: string
  updated_at: string
}

// Extended interfaces for UI components (with joined data)
export interface ProfileWithRelations extends Profile {
  approver_name?: string
  inviter_name?: string
}

export interface NoteWithUser extends Note {
  user_name?: string
  profiles?: {
    full_name: string | null
  }
}

export interface ActivityWithUser extends Activity {
  user_name?: string
  profiles?: {
    full_name: string | null
  }
}

export interface LeadWithRelations extends Lead {
  assigned_user?: {
    full_name: string | null
  }
  creator?: {
    full_name: string | null
  }
  notes_count?: number
  activities_count?: number
  last_activity_date?: string | null
}

// Form data types (for creating/updating records)
export type LeadFormData = Omit<Lead, 'id' | 'created_at' | 'updated_at' | 'lead_score' | 'created_by'>
export type ProfileFormData = Pick<Profile, 'full_name' | 'phone' | 'job_title' | 'bio'>
export type NoteFormData = Pick<Note, 'content'>

// Summary/list item types for UI tables and cards
export type LeadSummary = Pick<Lead, 'id' | 'first_name' | 'last_name' | 'email' | 'company_name' | 'lead_status' | 'lead_score' | 'created_at'>

export interface LeadListItem extends LeadSummary {
  activity_count?: number
  notes_count?: number
  last_activity_date?: string | null
  assigned_user_name?: string | null
}

// User invitation types
export interface InvitationData {
  email: string
  full_name: string
  role: 'admin' | 'manager' | 'intern'
}

export interface PendingUser extends Profile {
  days_pending?: number
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
  assigned_to?: string[]
  created_after?: string
  created_before?: string
  search?: string
}

export interface UserFilters {
  role?: ('admin' | 'manager' | 'intern')[]
  is_approved?: boolean
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

export interface UserMetrics {
  total_users: number
  pending_users: number
  approved_users: number
  admin_users: number
  manager_users: number
  intern_users: number
}

// Status configuration for UI components
export interface StatusConfig {
  icon: string
  color: string
  description: string
}

export interface RoleConfig {
  icon: string
  color: string
  description: string
  permissions: string[]
}

// Utility types
export type RequiredKeys<T, K extends keyof T> = T & Required<Pick<T, K>>
export type PartialKeys<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

// Export commonly used union types
export type UserRole = Profile['role']
export type ApprovalStatus = boolean