import { z } from 'zod'

export const leadSchema = z.object({
  // Step 1: Contact Information
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  job_title: z.string().min(1, 'Job title is required'),
  seniority_level: z.enum(['C-Level', 'VP/Director', 'Manager', 'Individual Contributor']),
  linkedin_url: z.string().url('Invalid URL').optional().or(z.literal('')),
  
  // Step 2: Company Information
  company_name: z.string().min(1, 'Company name is required'),
  company_website: z.string().url('Invalid URL'),
  company_size: z.enum(['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+']),
  industry: z.enum([
    'Financial Services',
    'Healthcare',
    'Government/Public Sector',
    'E-commerce',
    'Transportation',
    'Education',
    'Manufacturing',
    'Other'
  ]),
  
  // Step 3: Project Details
  service_interest: z.array(z.string()).min(1, 'Select at least one service'),
  pain_point: z.string().min(50, 'Please provide at least 50 characters'),
  project_timeline: z.enum(['ASAP', '1-3 months', '3-6 months', '6-12 months', 'Flexible']),
  budget_range: z.enum(['<$10K', '$10K-$50K', '$50K-$100K', '$100K-$250K', '$250K+', 'Not Sure']).optional(),
  lead_source: z.enum(['LinkedIn', 'Google Search', 'Referral', 'Cold Outreach', 'Other']),
})

export type LeadFormData = z.infer<typeof leadSchema>

// Calculate lead score based on form data
export function calculateLeadScore(data: LeadFormData): number {
  let score = 0
  
  // Seniority level scoring
  if (data.seniority_level === 'C-Level') score += 25
  else if (data.seniority_level === 'VP/Director') score += 20
  else if (data.seniority_level === 'Manager') score += 15
  
  // Budget scoring
  if (data.budget_range === '$250K+') score += 20
  else if (data.budget_range === '$100K-$250K') score += 20
  else if (data.budget_range === '$50K-$100K') score += 15
  else if (data.budget_range === '$10K-$50K') score += 10
  
  // Timeline scoring
  if (data.project_timeline === 'ASAP') score += 20
  else if (data.project_timeline === '1-3 months') score += 15
  else if (data.project_timeline === '3-6 months') score += 10
  
  // Company size scoring
  if (data.company_size === '51-200') score += 10
  else if (data.company_size === '201-500') score += 15
  else if (data.company_size === '501-1000') score += 15
  else if (data.company_size === '1000+') score += 15
  
  // Additional data scoring
  if (data.linkedin_url && data.linkedin_url.length > 0) score += 5
  if (data.phone && data.phone.length > 0) score += 5
  
  return Math.min(score, 100) // Cap at 100
}

// Get lead score badge info
export function getLeadScoreBadge(score: number): { label: string; color: string } {
  if (score >= 80) return { label: 'Hot', color: 'red' }
  if (score >= 60) return { label: 'Warm', color: 'orange' }
  if (score >= 40) return { label: 'Qualified', color: 'yellow' }
  return { label: 'Cold', color: 'gray' }
}

// Get lead status badge color
export function getStatusBadgeColor(status: string): string {
  const colors: Record<string, string> = {
    'New': 'blue',
    'Contacted': 'yellow',
    'Qualified': 'orange',
    'Demo Scheduled': 'purple',
    'Proposal Sent': 'pink',
    'Won': 'green',
    'Lost': 'red'
  }
  return colors[status] || 'gray'
}