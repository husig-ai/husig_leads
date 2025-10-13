export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          role: 'admin' | 'manager' | 'intern'
          avatar_url: string | null
          created_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          role?: 'admin' | 'manager' | 'intern'
          avatar_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          role?: 'admin' | 'manager' | 'intern'
          avatar_url?: string | null
          created_at?: string
        }
      }
      leads: {
        Row: {
          id: string
          first_name: string
          last_name: string
          email: string
          phone: string | null
          job_title: string
          seniority_level: 'C-Level' | 'VP/Director' | 'Manager' | 'Individual Contributor'
          linkedin_url: string | null
          company_name: string
          company_website: string
          company_size: '1-10' | '11-50' | '51-200' | '201-500' | '501-1000' | '1000+'
          industry: 'Financial Services' | 'Healthcare' | 'Government/Public Sector' | 'E-commerce' | 'Transportation' | 'Education' | 'Manufacturing' | 'Other'
          service_interest: string[]
          pain_point: string
          project_timeline: 'ASAP' | '1-3 months' | '3-6 months' | '6-12 months' | 'Flexible'
          budget_range: '<$10K' | '$10K-$50K' | '$50K-$100K' | '$100K-$250K' | '$250K+' | 'Not Sure' | null
          lead_source: 'LinkedIn' | 'Google Search' | 'Referral' | 'Cold Outreach' | 'Other'
          lead_status: 'New' | 'Contacted' | 'Qualified' | 'Demo Scheduled' | 'Proposal Sent' | 'Won' | 'Lost'
          lead_score: number
          notes: string | null
          assigned_to: string | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          first_name: string
          last_name: string
          email: string
          phone?: string | null
          job_title: string
          seniority_level: 'C-Level' | 'VP/Director' | 'Manager' | 'Individual Contributor'
          linkedin_url?: string | null
          company_name: string
          company_website: string
          company_size: '1-10' | '11-50' | '51-200' | '201-500' | '501-1000' | '1000+'
          industry: 'Financial Services' | 'Healthcare' | 'Government/Public Sector' | 'E-commerce' | 'Transportation' | 'Education' | 'Manufacturing' | 'Other'
          service_interest: string[]
          pain_point: string
          project_timeline: 'ASAP' | '1-3 months' | '3-6 months' | '6-12 months' | 'Flexible'
          budget_range?: '<$10K' | '$10K-$50K' | '$50K-$100K' | '$100K-$250K' | '$250K+' | 'Not Sure' | null
          lead_source: 'LinkedIn' | 'Google Search' | 'Referral' | 'Cold Outreach' | 'Other'
          lead_status?: 'New' | 'Contacted' | 'Qualified' | 'Demo Scheduled' | 'Proposal Sent' | 'Won' | 'Lost'
          lead_score?: number
          notes?: string | null
          assigned_to?: string | null
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          first_name?: string
          last_name?: string
          email?: string
          phone?: string | null
          job_title?: string
          seniority_level?: 'C-Level' | 'VP/Director' | 'Manager' | 'Individual Contributor'
          linkedin_url?: string | null
          company_name?: string
          company_website?: string
          company_size?: '1-10' | '11-50' | '51-200' | '201-500' | '501-1000' | '1000+'
          industry?: 'Financial Services' | 'Healthcare' | 'Government/Public Sector' | 'E-commerce' | 'Transportation' | 'Education' | 'Manufacturing' | 'Other'
          service_interest?: string[]
          pain_point?: string
          project_timeline?: 'ASAP' | '1-3 months' | '3-6 months' | '6-12 months' | 'Flexible'
          budget_range?: '<$10K' | '$10K-$50K' | '$50K-$100K' | '$100K-$250K' | '$250K+' | 'Not Sure' | null
          lead_source?: 'LinkedIn' | 'Google Search' | 'Referral' | 'Cold Outreach' | 'Other'
          lead_status?: 'New' | 'Contacted' | 'Qualified' | 'Demo Scheduled' | 'Proposal Sent' | 'Won' | 'Lost'
          lead_score?: number
          notes?: string | null
          assigned_to?: string | null
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

export type Lead = Database['public']['Tables']['leads']['Row']
export type Profile = Database['public']['Tables']['profiles']['Row']