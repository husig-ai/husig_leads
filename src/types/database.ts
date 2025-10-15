// src/types/database.ts
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at'>
        Update: Partial<Profile>
      }
      companies: {
        Row: Company
        Insert: Omit<Company, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Company>
      }
      leads: {
        Row: Lead
        Insert: Omit<Lead, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Lead>
      }
      activities: {
        Row: Activity
        Insert: Omit<Activity, 'id' | 'created_at'>
        Update: Partial<Activity>
      }
      notes: {
        Row: Note
        Insert: Omit<Note, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Note>
      }
      opportunities: {
        Row: Opportunity
        Insert: Omit<Opportunity, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Opportunity>
      }
      lead_history: {
        Row: LeadHistory
        Insert: Omit<LeadHistory, 'id' | 'created_at'>
        Update: Partial<LeadHistory>
      }
      saved_views: {
        Row: SavedView
        Insert: Omit<SavedView, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<SavedView>
      }
    }
  }
}

// ============================================================================
// CORE ENTITIES
// ============================================================================

export interface Profile {
  id: string
  full_name: string | null
  role: 'admin' | 'manager' | 'intern'
  avatar_url: string | null
  email: string
  timezone: string | null
  created_at: string
}

export interface Company {
  id: string
  name: string
  website: string | null
  domain: string | null
  size: '1-10' | '11-50' | '51-200' | '201-500' | '501-1000' | '1000+' | null
  industry: string[]  // Multiple industries possible
  revenue_range: '<$1M' | '$1M-$10M' | '$10M-$50M' | '$50M-$100M' | '$100M-$500M' | '$500M+' | null
  employee_count: number | null
  headquarters_location: string | null
  description: string | null
  linkedin_url: string | null
  twitter_handle: string | null
  
  // Company health and engagement
  engagement_level: 'cold' | 'warm' | 'hot' | null
  last_contact_date: string | null
  relationship_status: 'never_contacted' | 'in_conversation' | 'customer' | 'churned' | 'lost' | null
  
  // Previous engagement history
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

export interface Lead {
  id: string
  company_id: string  // Foreign key to companies
  
  // Contact information
  first_name: string
  last_name: string
  email: string
  phone: string | null
  job_title: string
  seniority_level: 'C-Level' | 'VP/Director' | 'Manager' | 'Individual Contributor'
  linkedin_url: string | null
  is_decision_maker: boolean
  is_champion: boolean
  
  // Lead source (how HuSig found them)
  source_type: 'linkedin_outreach' | 'conference' | 'referral' | 'partnership' | 'inbound' | 'cold_email' | 'existing_relationship' | 'other'
  source_details: string | null  // Specific campaign, event name, referrer, etc.
  sourced_by: string  // User ID who found this lead
  source_url: string | null
  source_cost: number | null
  
  // Project/Opportunity details
  service_interest: string[]
  pain_point: string
  project_timeline: 'ASAP' | '1-3 months' | '3-6 months' | '6-12 months' | '12+ months' | 'Flexible'
  budget_range: '<$10K' | '$10K-$50K' | '$50K-$100K' | '$100K-$250K' | '$250K+' | 'Not Sure' | null
  budget_confirmed: boolean
  authority_confirmed: boolean
  
  // Lead lifecycle
  lead_status: 'new' | 'qualifying' | 'qualified' | 'nurturing' | 'demo_scheduled' | 'demo_completed' | 'proposal_sent' | 'negotiating' | 'converted' | 'lost' | 'disqualified'
  lead_stage_updated_at: string
  
  // Scoring
  lead_score: number  // 0-100
  win_probability: number  // 0-100 - NEW: likelihood we'll win
  strategic_fit_score: number  // 0-100 - NEW: alignment with HuSig focus
  effort_score: number  // 0-100 - NEW: effort required (lower is better)
  
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
  go_no_go_decision: 'go' | 'no_go' | 'pending' | null
  go_no_go_reason: string | null
  internal_readiness_status: 'not_started' | 'researching' | 'ready' | 'blocked'
  assigned_team_members: string[]  // Array of user IDs
  required_skills: string[]
  resource_allocation_status: 'available' | 'limited' | 'unavailable' | null
  
  // Competition
  competitors_identified: string[]
  competitive_threat_level: 'low' | 'medium' | 'high' | null
  
  // Notes and context
  notes: string | null
  internal_notes: string | null  // Private notes not shared with all team
  
  // Assignment
  assigned_to: string | null  // Primary owner
  created_by: string
  
  // Metadata
  created_at: string
  updated_at: string
  tags: string[]
}

export interface Opportunity {
  id: string
  lead_id: string  // Foreign key to leads
  company_id: string  // Foreign key to companies
  
  // Opportunity details
  name: string
  description: string | null
  type: 'new_business' | 'upsell' | 'renewal' | 'expansion'
  
  // Financial
  estimated_value: number
  weighted_value: number  // estimated_value * probability
  actual_value: number | null  // Final contract value
  currency: string
  payment_terms: string | null
  
  // Timeline
  expected_close_date: string
  actual_close_date: string | null
  sales_cycle_days: number | null
  
  // Stage and probability
  stage: 'discovery' | 'qualification' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost'
  probability: number  // 0-100
  
  // Proposal and contract
  proposal_sent_date: string | null
  proposal_version: number
  contract_status: 'draft' | 'sent' | 'signed' | 'executed' | null
  contract_signed_date: string | null
  
  // Team
  opportunity_owner: string
  team_members: string[]
  
  // Close reason
  close_reason: string | null
  loss_reason: 'price' | 'competitor' | 'timing' | 'no_budget' | 'no_authority' | 'no_need' | 'other' | null
  competitor_won: string | null
  
  // Metadata
  created_by: string
  created_at: string
  updated_at: string
}

export interface Activity {
  id: string
  lead_id: string | null
  company_id: string | null
  opportunity_id: string | null
  
  activity_type: 
    | 'status_changed'
    | 'stage_changed'
    | 'note_added'
    | 'email_sent'
    | 'email_received'
    | 'call_made'
    | 'call_received'
    | 'meeting_scheduled'
    | 'meeting_completed'
    | 'demo_completed'
    | 'document_sent'
    | 'proposal_sent'
    | 'contract_sent'
    | 'follow_up_scheduled'
    | 'lead_created'
    | 'lead_updated'
    | 'lead_assigned'
    | 'opportunity_created'
    | 'opportunity_won'
    | 'opportunity_lost'
    | 'research_completed'
  
  title: string
  description: string
  metadata: Record<string, any> | null
  
  // Participants
  created_by: string
  participants: string[]  // Other team members involved
  
  // Timing
  activity_date: string  // When the activity happened
  created_at: string  // When it was logged
  
  // Result tracking
  outcome: 'positive' | 'neutral' | 'negative' | null
  follow_up_required: boolean
  next_action: string | null
}

export interface Note {
  id: string
  lead_id: string | null
  company_id: string | null
  opportunity_id: string | null
  
  note_type: 'general' | 'meeting' | 'call' | 'research' | 'qualification' | 'technical' | 'competitive' | 'internal' | 'discovery' | 'objection'
  
  // Content
  title: string | null
  content: string
  
  // Structure for qualification frameworks
  bant_budget: string | null
  bant_authority: string | null
  bant_need: string | null
  bant_timeline: string | null
  
  meddic_metrics: string | null
  meddic_economic_buyer: string | null
  meddic_decision_criteria: string | null
  meddic_decision_process: string | null
  meddic_identify_pain: string | null
  meddic_champion: string | null
  
  // Visibility
  is_private: boolean
  visibility: 'private' | 'team' | 'everyone'
  
  // Organization
  tags: string[]
  pinned: boolean
  
  // Metadata
  created_by: string
  created_at: string
  updated_at: string
}

export interface LeadHistory {
  id: string
  lead_id: string
  company_id: string
  
  // Historical engagement
  engagement_date: string
  engagement_type: 'previous_lead' | 'previous_customer' | 'previous_conversation'
  outcome: 'won' | 'lost' | 'no_decision' | null
  
  // Details
  description: string
  deal_value: number | null
  loss_reason: string | null
  key_learnings: string | null
  
  // References
  previous_lead_id: string | null
  previous_opportunity_id: string | null
  
  // Metadata
  created_by: string
  created_at: string
}

export interface SavedView {
  id: string
  name: string
  description: string | null
  
  // View type
  view_type: 'leads' | 'companies' | 'opportunities'
  
  // Filters (stored as JSON)
  filters: Record<string, any>
  
  // Sort and display
  sort_by: string | null
  sort_order: 'asc' | 'desc'
  columns: string[]  // Which columns to show
  
  // Sharing
  is_shared: boolean
  shared_with: string[]  // User IDs or 'everyone'
  
  // Ownership
  created_by: string
  created_at: string
  updated_at: string
}

// ============================================================================
// HELPER TYPES
// ============================================================================

export type LeadStatus = Lead['lead_status']
export type LeadStage = Lead['lead_status']
export type OpportunityStage = Opportunity['stage']
export type ActivityType = Activity['activity_type']
export type NoteType = Note['note_type']
export type SourceType = Lead['source_type']

// ============================================================================
// UTILITY TYPES FOR FRONTEND
// ============================================================================

export interface LeadWithCompany extends Lead {
  company: Company
}

export interface LeadWithRelations extends Lead {
  company: Company
  opportunity: Opportunity | null
  assigned_user: Profile | null
  recent_activities: Activity[]
  notes_count: number
}

export interface CompanyWithLeads extends Company {
  leads: Lead[]
  opportunities: Opportunity[]
  total_pipeline_value: number
}

export interface DashboardStats {
  total_leads: number
  total_companies: number
  total_opportunities: number
  total_pipeline_value: number
  weighted_pipeline_value: number
  win_rate: number
  average_deal_size: number
  average_sales_cycle_days: number
  leads_by_status: Record<LeadStatus, number>
  opportunities_by_stage: Record<OpportunityStage, number>
  leads_by_source: Record<SourceType, number>
  activities_this_week: number
  follow_ups_overdue: number
  stale_leads_count: number
}