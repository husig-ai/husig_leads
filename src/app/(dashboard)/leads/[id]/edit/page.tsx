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
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  ArrowLeft, 
  Save, 
  Loader2, 
  User, 
  Building2, 
  Target,
  AlertCircle
} from 'lucide-react'
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
  const [lead, setLead] = useState<Lead | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
      
      // Populate form with lead data
      const formData: LeadFormData = {
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        phone: data.phone || '',
        job_title: data.job_title,
        seniority_level: data.seniority_level,
        linkedin_url: data.linkedin_url || '',
        company_name: data.company_name,
        company_website: data.company_website,
        company_size: data.company_size,
        industry: data.industry,
        service_interest: data.service_interest || [],
        pain_point: data.pain_point,
        project_timeline: data.project_timeline,
        budget_range: data.budget_range,
        lead_source: data.lead_source
      }
      
      reset(formData)
    } catch (err) {
      console.error('Error loading lead:', err)
      setError(err instanceof Error ? err.message : 'Failed to load lead')
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
    setSaving(true)
    
    try {
      const supabase = createClient()
      
      // Calculate new lead score
      const leadScore = calculateLeadScore(data)
      
      const { error } = await supabase
        .from('leads')
        .update({
          ...data,
          lead_score: leadScore,
          updated_at: new Date().toISOString()
        })
        .eq('id', params.id as string)

      if (error) throw error

      toast({
        title: "Success!",
        description: `Lead updated successfully. New score: ${leadScore}/100`,
      })

      router.push(`/leads/${params.id}`)
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

  const handleServiceToggle = (service: string) => {
    const current = serviceInterest || []
    const updated = current.includes(service) 
      ? current.filter(s => s !== service)
      : [...current, service]
    setValue('service_interest', updated, { shouldDirty: true })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-husig-dark">
        <DashboardHeader />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-husig-purple-500 mx-auto mb-4" />
            <div className="text-lg text-gray-300">Loading lead details...</div>
          </div>
        </div>
      </div>
    )
  }

  if (error && !lead) {
    return (
      <div className="min-h-screen bg-husig-dark">
        <DashboardHeader />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-4">Lead Not Found</h1>
            <p className="text-gray-400 mb-6">{error}</p>
            <Link href="/leads">
              <Button className="btn-husig-primary">
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
    <div className="min-h-screen bg-husig-dark">
      <DashboardHeader />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Link href={`/leads/${params.id}`}>
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white hover:bg-gray-800">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Lead
              </Button>
            </Link>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                <span className="text-husig-gradient">Edit Lead</span>
              </h1>
              <p className="text-gray-400 text-lg">
                Update {lead?.first_name} {lead?.last_name}'s information
              </p>
            </div>
            {lead && (
              <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                Score: {lead.lead_score}/100
              </Badge>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Lead Summary Sidebar */}
          <div className="lg:col-span-1">
            <Card className="card-husig-glass border-gray-700/50 sticky top-8">
              <CardHeader>
                <CardTitle className="text-white">Lead Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {lead && (
                  <>
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-husig-gradient rounded-full flex items-center justify-center">
                        <span className="text-white font-medium">
                          {lead.first_name[0]}{lead.last_name[0]}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">
                          {lead.first_name} {lead.last_name}
                        </h3>
                        <p className="text-gray-400 text-sm">{lead.job_title}</p>
                      </div>
                    </div>
                    
                    <Separator className="bg-gray-700" />
                    
                    <div className="space-y-3 text-sm">
                      <div>
                        <span className="text-gray-500">Company:</span>
                        <p className="text-gray-300">{lead.company_name}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Email:</span>
                        <p className="text-gray-300">{lead.email}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Status:</span>
                        <Badge className="ml-2 bg-blue-500/20 text-blue-400 border-blue-500/30">
                          {lead.lead_status.charAt(0).toUpperCase() + lead.lead_status.slice(1)}
                        </Badge>
                      </div>
                      <div>
                        <span className="text-gray-500">Created:</span>
                        <p className="text-gray-300">
                          {new Date(lead.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Edit Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Contact Information */}
              <Card className="card-husig-glass border-gray-700/50">
                <CardHeader>
                  <CardTitle className="flex items-center text-white">
                    <User className="w-5 h-5 mr-2 text-husig-purple-400" />
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="first_name" className="text-gray-300">First Name *</Label>
                      <Input
                        id="first_name"
                        {...register('first_name')}
                        className="husig-input"
                        placeholder="Enter first name"
                      />
                      {errors.first_name && (
                        <p className="text-red-400 text-sm mt-1">{errors.first_name.message}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="last_name" className="text-gray-300">Last Name *</Label>
                      <Input
                        id="last_name"
                        {...register('last_name')}
                        className="husig-input"
                        placeholder="Enter last name"
                      />
                      {errors.last_name && (
                        <p className="text-red-400 text-sm mt-1">{errors.last_name.message}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="email" className="text-gray-300">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      {...register('email')}
                      className="husig-input"
                      placeholder="Enter email address"
                    />
                    {errors.email && (
                      <p className="text-red-400 text-sm mt-1">{errors.email.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="phone" className="text-gray-300">Phone Number</Label>
                      <Input
                        id="phone"
                        {...register('phone')}
                        className="husig-input"
                        placeholder="Enter phone number"
                      />
                    </div>

                    <div>
                      <Label htmlFor="job_title" className="text-gray-300">Job Title *</Label>
                      <Input
                        id="job_title"
                        {...register('job_title')}
                        className="husig-input"
                        placeholder="Enter job title"
                      />
                      {errors.job_title && (
                        <p className="text-red-400 text-sm mt-1">{errors.job_title.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-300">Seniority Level</Label>
                      <Select value={watch('seniority_level')} onValueChange={(value) => setValue('seniority_level', value as any, { shouldDirty: true })}>
                        <SelectTrigger className="husig-select">
                          <SelectValue placeholder="Select seniority level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="C-Level">C-Level</SelectItem>
                          <SelectItem value="VP/Director">VP/Director</SelectItem>
                          <SelectItem value="Manager">Manager</SelectItem>
                          <SelectItem value="Individual Contributor">Individual Contributor</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="linkedin_url" className="text-gray-300">LinkedIn Profile</Label>
                      <Input
                        id="linkedin_url"
                        {...register('linkedin_url')}
                        className="husig-input"
                        placeholder="https://linkedin.com/in/..."
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Company Information */}
              <Card className="card-husig-glass border-gray-700/50">
                <CardHeader>
                  <CardTitle className="flex items-center text-white">
                    <Building2 className="w-5 h-5 mr-2 text-husig-blue-400" />
                    Company Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="company_name" className="text-gray-300">Company Name *</Label>
                    <Input
                      id="company_name"
                      {...register('company_name')}
                      className="husig-input"
                      placeholder="Enter company name"
                    />
                    {errors.company_name && (
                      <p className="text-red-400 text-sm mt-1">{errors.company_name.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="company_website" className="text-gray-300">Company Website *</Label>
                    <Input
                      id="company_website"
                      {...register('company_website')}
                      className="husig-input"
                      placeholder="https://company.com"
                    />
                    {errors.company_website && (
                      <p className="text-red-400 text-sm mt-1">{errors.company_website.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-300">Company Size</Label>
                      <Select value={watch('company_size')} onValueChange={(value) => setValue('company_size', value as any, { shouldDirty: true })}>
                        <SelectTrigger className="husig-select">
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
                    </div>

                    <div>
                      <Label className="text-gray-300">Industry</Label>
                      <Select value={watch('industry')} onValueChange={(value) => setValue('industry', value as any, { shouldDirty: true })}>
                        <SelectTrigger className="husig-select">
                          <SelectValue placeholder="Select industry" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Financial Services">Financial Services</SelectItem>
                          <SelectItem value="Healthcare">Healthcare</SelectItem>
                          <SelectItem value="Government/Public Sector">Government/Public Sector</SelectItem>
                          <SelectItem value="E-commerce">E-commerce</SelectItem>
                          <SelectItem value="Transportation">Transportation</SelectItem>
                          <SelectItem value="Education">Education</SelectItem>
                          <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Project Details */}
              <Card className="card-husig-glass border-gray-700/50">
                <CardHeader>
                  <CardTitle className="flex items-center text-white">
                    <Target className="w-5 h-5 mr-2 text-green-400" />
                    Project Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label className="text-gray-300 mb-3 block">Services of Interest *</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {SERVICE_OPTIONS.map((service) => (
                        <div key={service} className="flex items-center space-x-2">
                          <Checkbox
                            id={service}
                            checked={serviceInterest.includes(service)}
                            onCheckedChange={() => handleServiceToggle(service)}
                            className="border-gray-600 data-[state=checked]:bg-husig-purple-500"
                          />
                          <Label htmlFor={service} className="text-gray-300 text-sm cursor-pointer">
                            {service}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="pain_point" className="text-gray-300">Main Pain Point/Challenge *</Label>
                    <Textarea
                      id="pain_point"
                      {...register('pain_point')}
                      className="husig-textarea"
                      placeholder="Describe the main challenge or pain point this lead is facing..."
                      rows={3}
                    />
                    {errors.pain_point && (
                      <p className="text-red-400 text-sm mt-1">{errors.pain_point.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-300">Project Timeline</Label>
                      <Select value={watch('project_timeline')} onValueChange={(value) => setValue('project_timeline', value as any, { shouldDirty: true })}>
                        <SelectTrigger className="husig-select">
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
                    </div>

                    <div>
                      <Label className="text-gray-300">Budget Range</Label>
                      <Select value={watch('budget_range')} onValueChange={(value) => setValue('budget_range', value as any, { shouldDirty: true })}>
                        <SelectTrigger className="husig-select">
                          <SelectValue placeholder="Select budget range" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="<$10K">&lt;$10K</SelectItem>
                          <SelectItem value="$10K-$50K">$10K-$50K</SelectItem>
                          <SelectItem value="$50K-$100K">$50K-$100K</SelectItem>
                          <SelectItem value="$100K-$250K">$100K-$250K</SelectItem>
                          <SelectItem value="$250K+">$250K+</SelectItem>
                          <SelectItem value="Not Sure">Not Sure</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label className="text-gray-300">Lead Source</Label>
                    <Select value={watch('lead_source')} onValueChange={(value) => setValue('lead_source', value as any, { shouldDirty: true })}>
                      <SelectTrigger className="husig-select">
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

              {/* Submit Button */}
              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={!isDirty || saving}
                  className="btn-husig-primary px-8"
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
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}