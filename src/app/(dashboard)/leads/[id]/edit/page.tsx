'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { leadSchema, calculateLeadScore, type LeadFormData } from '@/lib/validations/lead'
import { Lead } from '@/types/database'
import { DashboardHeader } from '@/components/layout/DashboardHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, Save, Loader2, User, Building, Target, AlertCircle } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'

const SERVICE_OPTIONS = [
  'Analytics & Dashboarding',
  'Data Engineering',
  'AI/ML Model Development',
  'LLM Integration',
  'Computer Vision',
  'Fraud Detection',
  'Predictive Analytics',
  'MLOps',
  'AI Strategy & Consulting',
  'Not Sure Yet',
]

export default function EditLeadPage() {
  const router = useRouter()
  const params = useParams()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lead, setLead] = useState<Lead | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    setValue,
    watch,
    reset
  } = useForm<LeadFormData>({
    resolver: zodResolver(leadSchema),
  })

  const serviceInterest = watch('service_interest') || []
  const watchedData = watch()

  useEffect(() => {
    if (params.id) {
      loadLead()
    }
  }, [params.id])

  const loadLead = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('id', params.id as string)
        .single()

      if (error) throw error

      setLead(data)
      
      // Populate form with existing data
      const formData: LeadFormData = {
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        phone: data.phone || '',
        job_title: data.job_title,
        seniority_level: data.seniority_level,
        linkedin_url: data.linkedin_url || '',
        company_name: data.company_name,
        company_website: data.company_website || '',
        company_size: data.company_size,
        industry: data.industry,
        service_interest: Array.isArray(data.service_interest) ? data.service_interest : [data.service_interest],
        pain_point: data.pain_point,
        project_timeline: data.project_timeline,
        budget_range: data.budget_range || '',
        lead_source: data.lead_source || ''
      }

      reset(formData)
    } catch (err) {
      console.error('Error loading lead:', err)
      setError('Failed to load lead details')
      toast({
        title: "Error",
        description: "Failed to load lead details",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: LeadFormData) => {
    if (!lead) return

    setSaving(true)
    setError(null)

    try {
      const supabase = createClient()
      
      // Calculate new lead score
      const leadScore = calculateLeadScore(data)

      const updateData = {
        ...data,
        lead_score: leadScore,
        updated_at: new Date().toISOString()
      }

      const { error: updateError } = await supabase
        .from('leads')
        .update(updateData)
        .eq('id', lead.id)

      if (updateError) throw updateError

      toast({
        title: "Success!",
        description: `Lead updated successfully. New score: ${leadScore}/100`,
      })

      router.push(`/leads/${lead.id}`)
    } catch (err) {
      console.error('Error updating lead:', err)
      setError(err instanceof Error ? err.message : 'Failed to update lead')
      toast({
        title: "Error",
        description: "Failed to update lead. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader />
        <div className="flex items-center justify-center h-96">
          <div className="text-lg text-gray-600">Loading lead details...</div>
        </div>
      </div>
    )
  }

  if (error && !lead) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Lead Not Found</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <Link href="/leads">
              <Button>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Leads
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <DashboardHeader />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href={`/leads/${lead?.id}`}>
                <Button variant="ghost" size="sm" className="hover:bg-gray-100">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Lead
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Edit Lead</h1>
                <p className="text-gray-600 mt-1">
                  Update information for {lead?.first_name} {lead?.last_name}
                </p>
              </div>
            </div>
            {isDirty && (
              <div className="flex items-center text-amber-600 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200">
                <AlertCircle className="w-4 h-4 mr-2" />
                <span className="text-sm font-medium">Unsaved changes</span>
              </div>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            </div>
          )}

          {/* Contact Information */}
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <CardTitle className="text-xl">Contact Information</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="first_name" className="text-sm font-medium">
                    First Name *
                  </Label>
                  <Input
                    id="first_name"
                    placeholder="Enter first name"
                    className="h-11"
                    {...register('first_name')}
                  />
                  {errors.first_name && (
                    <p className="text-sm text-red-500">{errors.first_name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="last_name" className="text-sm font-medium">
                    Last Name *
                  </Label>
                  <Input
                    id="last_name"
                    placeholder="Enter last name"
                    className="h-11"
                    {...register('last_name')}
                  />
                  {errors.last_name && (
                    <p className="text-sm text-red-500">{errors.last_name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email Address *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@company.com"
                    className="h-11"
                    {...register('email')}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-500">{errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium">
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    className="h-11"
                    {...register('phone')}
                  />
                  {errors.phone && (
                    <p className="text-sm text-red-500">{errors.phone.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="job_title" className="text-sm font-medium">
                    Job Title *
                  </Label>
                  <Input
                    id="job_title"
                    placeholder="e.g., Data Scientist, CEO"
                    className="h-11"
                    {...register('job_title')}
                  />
                  {errors.job_title && (
                    <p className="text-sm text-red-500">{errors.job_title.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="seniority_level" className="text-sm font-medium">
                    Seniority Level *
                  </Label>
                  <Select 
                    value={watchedData.seniority_level || ''}
                    onValueChange={(value) => setValue('seniority_level', value as any, { shouldDirty: true })}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select seniority level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="C-Level">C-Level (CEO, CTO, etc.)</SelectItem>
                      <SelectItem value="VP/Director">VP/Director</SelectItem>
                      <SelectItem value="Manager">Manager</SelectItem>
                      <SelectItem value="Individual Contributor">Individual Contributor</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.seniority_level && (
                    <p className="text-sm text-red-500">{errors.seniority_level.message}</p>
                  )}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="linkedin_url" className="text-sm font-medium">
                    LinkedIn Profile
                  </Label>
                  <Input
                    id="linkedin_url"
                    placeholder="https://linkedin.com/in/username"
                    className="h-11"
                    {...register('linkedin_url')}
                  />
                  {errors.linkedin_url && (
                    <p className="text-sm text-red-500">{errors.linkedin_url.message}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Company Information */}
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Building className="w-5 h-5 text-green-600" />
                </div>
                <CardTitle className="text-xl">Company Information</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="company_name" className="text-sm font-medium">
                    Company Name *
                  </Label>
                  <Input
                    id="company_name"
                    placeholder="Enter company name"
                    className="h-11"
                    {...register('company_name')}
                  />
                  {errors.company_name && (
                    <p className="text-sm text-red-500">{errors.company_name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company_website" className="text-sm font-medium">
                    Company Website
                  </Label>
                  <Input
                    id="company_website"
                    placeholder="https://company.com"
                    className="h-11"
                    {...register('company_website')}
                  />
                  {errors.company_website && (
                    <p className="text-sm text-red-500">{errors.company_website.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company_size" className="text-sm font-medium">
                    Company Size *
                  </Label>
                  <Select 
                    value={watchedData.company_size || ''}
                    onValueChange={(value) => setValue('company_size', value as any, { shouldDirty: true })}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select company size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1-10">1-10 employees</SelectItem>
                      <SelectItem value="11-50">11-50 employees</SelectItem>
                      <SelectItem value="51-200">51-200 employees</SelectItem>
                      <SelectItem value="201-500">201-500 employees</SelectItem>
                      <SelectItem value="501-1000">501-1000 employees</SelectItem>
                      <SelectItem value="1000+">1000+ employees</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.company_size && (
                    <p className="text-sm text-red-500">{errors.company_size.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="industry" className="text-sm font-medium">
                    Industry *
                  </Label>
                  <Select 
                    value={watchedData.industry || ''}
                    onValueChange={(value) => setValue('industry', value as any, { shouldDirty: true })}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Technology">Technology</SelectItem>
                      <SelectItem value="Healthcare">Healthcare</SelectItem>
                      <SelectItem value="Finance">Finance</SelectItem>
                      <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                      <SelectItem value="Retail">Retail</SelectItem>
                      <SelectItem value="Education">Education</SelectItem>
                      <SelectItem value="Government">Government</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.industry && (
                    <p className="text-sm text-red-500">{errors.industry.message}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Project Details */}
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Target className="w-5 h-5 text-purple-600" />
                </div>
                <CardTitle className="text-xl">Project Details</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label className="text-sm font-medium">
                  Service Interest * (Select all that apply)
                </Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {SERVICE_OPTIONS.map((service) => (
                    <div key={service} className="flex items-center space-x-2">
                      <Checkbox
                        id={service}
                        checked={serviceInterest.includes(service)}
                        onCheckedChange={(checked) => {
                          const updated = checked
                            ? [...serviceInterest, service]
                            : serviceInterest.filter(s => s !== service)
                          setValue('service_interest', updated, { shouldDirty: true })
                        }}
                      />
                      <Label 
                        htmlFor={service} 
                        className="text-sm font-normal cursor-pointer"
                      >
                        {service}
                      </Label>
                    </div>
                  ))}
                </div>
                {errors.service_interest && (
                  <p className="text-sm text-red-500">{errors.service_interest.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="pain_point" className="text-sm font-medium">
                  Pain Point / Challenge * (min 50 characters)
                </Label>
                <Textarea
                  id="pain_point"
                  placeholder="Describe your main data/AI challenge or what you're trying to achieve..."
                  rows={4}
                  className="resize-none"
                  {...register('pain_point')}
                />
                {errors.pain_point && (
                  <p className="text-sm text-red-500">{errors.pain_point.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="project_timeline" className="text-sm font-medium">
                    Project Timeline *
                  </Label>
                  <Select 
                    value={watchedData.project_timeline || ''}
                    onValueChange={(value) => setValue('project_timeline', value as any, { shouldDirty: true })}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select timeline" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ASAP">ASAP</SelectItem>
                      <SelectItem value="1-3 months">1-3 months</SelectItem>
                      <SelectItem value="3-6 months">3-6 months</SelectItem>
                      <SelectItem value="6-12 months">6-12 months</SelectItem>
                      <SelectItem value="Flexible">Flexible</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.project_timeline && (
                    <p className="text-sm text-red-500">{errors.project_timeline.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="budget_range" className="text-sm font-medium">
                    Budget Range
                  </Label>
                  <Select 
                    value={watchedData.budget_range || ''}
                    onValueChange={(value) => setValue('budget_range', value as any, { shouldDirty: true })}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select budget (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="<$10K">{'<'}$10K</SelectItem>
                      <SelectItem value="$10K-$50K">$10K-$50K</SelectItem>
                      <SelectItem value="$50K-$100K">$50K-$100K</SelectItem>
                      <SelectItem value="$100K-$250K">$100K-$250K</SelectItem>
                      <SelectItem value="$250K+">$250K+</SelectItem>
                      <SelectItem value="Not Sure">Not Sure</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="lead_source" className="text-sm font-medium">
                  How did you hear about us?
                </Label>
                <Select 
                  value={watchedData.lead_source || ''}
                  onValueChange={(value) => setValue('lead_source', value as any, { shouldDirty: true })}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select source (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Website">Website</SelectItem>
                    <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                    <SelectItem value="Referral">Referral</SelectItem>
                    <SelectItem value="Conference">Conference</SelectItem>
                    <SelectItem value="Cold Outreach">Cold Outreach</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  {isDirty ? (
                    <span className="text-amber-600 font-medium">You have unsaved changes</span>
                  ) : (
                    <span>All changes saved</span>
                  )}
                </div>
                
                <div className="flex space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push(`/leads/${lead?.id}`)}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                  
                  <Button
                    type="submit"
                    disabled={saving || !isDirty}
                    className="bg-blue-600 hover:bg-blue-700 min-w-[120px]"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  )
}