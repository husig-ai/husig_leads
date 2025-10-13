'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createClient } from '@/lib/supabase/client'
import { leadSchema, calculateLeadScore, type LeadFormData } from '@/lib/validations/lead'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChevronLeft, ChevronRight } from 'lucide-react'

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

export default function NewLeadPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    trigger,
  } = useForm<LeadFormData>({
    resolver: zodResolver(leadSchema),
    mode: 'onChange',
  })

  const serviceInterest = watch('service_interest') || []

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('leadFormData')
    if (saved) {
      const data = JSON.parse(saved)
      Object.keys(data).forEach(key => {
        setValue(key as any, data[key])
      })
    }
  }, [setValue])

  // Save to localStorage on every change
  useEffect(() => {
    const subscription = watch((data) => {
      localStorage.setItem('leadFormData', JSON.stringify(data))
    })
    return () => subscription.unsubscribe()
  }, [watch])

  const handleNext = async () => {
    let fieldsToValidate: (keyof LeadFormData)[] = []
    
    if (step === 1) {
      fieldsToValidate = ['first_name', 'last_name', 'email', 'phone', 'job_title', 'seniority_level', 'linkedin_url']
    } else if (step === 2) {
      fieldsToValidate = ['company_name', 'company_website', 'company_size', 'industry']
    }

    const isValid = await trigger(fieldsToValidate)
    if (isValid) {
      setStep(step + 1)
    }
  }

  const handleBack = () => {
    setStep(step - 1)
  }

  const onSubmit = async (data: LeadFormData) => {
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setError('You must be logged in to create a lead')
      setLoading(false)
      return
    }

    // Check for duplicate email
    const { data: existing } = await supabase
      .from('leads')
      .select('id')
      .eq('email', data.email)
      .single()

    if (existing) {
      setError('A lead with this email already exists')
      setLoading(false)
      return
    }

    // Calculate lead score
    const leadScore = calculateLeadScore(data)

    // Insert lead
    const { error: insertError } = await supabase
      .from('leads')
      .insert({
        ...data,
        lead_score: leadScore,
        created_by: user.id,
      })

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
    } else {
      localStorage.removeItem('leadFormData')
      router.push('/leads')
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Add New Lead</CardTitle>
          <CardDescription>
            Fill in the details to add a new lead to your pipeline
          </CardDescription>
          
          {/* Progress Bar */}
          <div className="flex items-center justify-between mt-6">
            <div className="flex items-center space-x-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-primary text-white' : 'bg-gray-200'}`}>
                1
              </div>
              <span className="text-sm font-medium">Contact</span>
            </div>
            <div className="flex-1 h-1 mx-4 bg-gray-200">
              <div className={`h-full ${step >= 2 ? 'bg-primary' : 'bg-gray-200'}`} style={{ width: step >= 2 ? '100%' : '0%' }} />
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-primary text-white' : 'bg-gray-200'}`}>
                2
              </div>
              <span className="text-sm font-medium">Company</span>
            </div>
            <div className="flex-1 h-1 mx-4 bg-gray-200">
              <div className={`h-full ${step >= 3 ? 'bg-primary' : 'bg-gray-200'}`} style={{ width: step >= 3 ? '100%' : '0%' }} />
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-primary text-white' : 'bg-gray-200'}`}>
                3
              </div>
              <span className="text-sm font-medium">Project</span>
            </div>
          </div>
        </CardHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            {error && (
              <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
                {error}
              </div>
            )}

            {/* Step 1: Contact Information */}
            {step === 1 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Contact Information</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                  <Label htmlFor="company_size">Company Size *</Label>
                  <Select onValueChange={(value) => setValue('company_size', value as any)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1-10">1-10</SelectItem>
                      <SelectItem value="11-50">11-50</SelectItem>
                      <SelectItem value="51-200">51-200</SelectItem>
                      <SelectItem value="201-500">201-500</SelectItem>
                      <SelectItem value="501-1000">501-1000</SelectItem>
                      <SelectItem value="1000+">1000+</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.company_size && (
                    <p className="text-sm text-destructive">{errors.company_size.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="industry">Industry *</Label>
                  <Select onValueChange={(value) => setValue('industry', value as any)}>
                    <SelectTrigger>
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
                  {errors.industry && (
                    <p className="text-sm text-destructive">{errors.industry.message}</p>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Project Details */}
            {step === 3 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Project Details</h3>
                
                <div className="space-y-2">
                  <Label>Service Interest * (select at least one)</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {SERVICE_OPTIONS.map((service) => (
                      <div key={service} className="flex items-center space-x-2">
                        <Checkbox
                          id={service}
                          checked={serviceInterest.includes(service)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setValue('service_interest', [...serviceInterest, service])
                            } else {
                              setValue('service_interest', serviceInterest.filter(s => s !== service))
                            }
                          }}
                        />
                        <label
                          htmlFor={service}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {service}
                        </label>
                      </div>
                    ))}
                  </div>
                  {errors.service_interest && (
                    <p className="text-sm text-destructive">{errors.service_interest.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pain_point">What is your main challenge or goal? * (min 50 characters)</Label>
                  <Textarea
                    id="pain_point"
                    placeholder="Describe your main data/AI challenge or what you're trying to achieve..."
                    rows={5}
                    {...register('pain_point')}
                  />
                  {errors.pain_point && (
                    <p className="text-sm text-destructive">{errors.pain_point.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="project_timeline">Project Timeline *</Label>
                  <Select onValueChange={(value) => setValue('project_timeline', value as any)}>
                    <SelectTrigger>
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
                    <p className="text-sm text-destructive">{errors.project_timeline.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="budget_range">Budget Range</Label>
                  <Select onValueChange={(value) => setValue('budget_range', value as any)}>
                    <SelectTrigger>
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

                <div className="space-y-2">
                  <Label htmlFor="lead_source">How did you hear about us? *</Label>
                  <Select onValueChange={(value) => setValue('lead_source', value as any)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select source" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                      <SelectItem value="Google Search">Google Search</SelectItem>
                      <SelectItem value="Referral">Referral</SelectItem>
                      <SelectItem value="Cold Outreach">Cold Outreach</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.lead_source && (
                    <p className="text-sm text-destructive">{errors.lead_source.message}</p>
                  )}
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6">
              {step > 1 && (
                <Button type="button" variant="outline" onClick={handleBack}>
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              )}
              
              {step < 3 ? (
                <Button type="button" onClick={handleNext} className="ml-auto">
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button type="submit" className="ml-auto" disabled={loading}>
                  {loading ? 'Creating Lead...' : 'Create Lead'}
                </Button>
              )}
            </div>
          </CardContent>
        </form>
      </Card>
    </div>
  )
}
">
                    <Label htmlFor="first_name">First Name *</Label>
                    <Input
                      id="first_name"
                      placeholder="John"
                      {...register('first_name')}
                    />
                    {errors.first_name && (
                      <p className="text-sm text-destructive">{errors.first_name.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="last_name">Last Name *</Label>
                    <Input
                      id="last_name"
                      placeholder="Doe"
                      {...register('last_name')}
                    />
                    {errors.last_name && (
                      <p className="text-sm text-destructive">{errors.last_name.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@company.com"
                    {...register('email')}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    placeholder="+977-9860909101"
                    {...register('phone')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="job_title">Job Title *</Label>
                  <Input
                    id="job_title"
                    placeholder="Head of Data"
                    {...register('job_title')}
                  />
                  {errors.job_title && (
                    <p className="text-sm text-destructive">{errors.job_title.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="seniority_level">Seniority Level *</Label>
                  <Select onValueChange={(value) => setValue('seniority_level', value as any)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="C-Level">C-Level</SelectItem>
                      <SelectItem value="VP/Director">VP/Director</SelectItem>
                      <SelectItem value="Manager">Manager</SelectItem>
                      <SelectItem value="Individual Contributor">Individual Contributor</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.seniority_level && (
                    <p className="text-sm text-destructive">{errors.seniority_level.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="linkedin_url">LinkedIn Profile URL</Label>
                  <Input
                    id="linkedin_url"
                    type="url"
                    placeholder="https://linkedin.com/in/johndoe"
                    {...register('linkedin_url')}
                  />
                  {errors.linkedin_url && (
                    <p className="text-sm text-destructive">{errors.linkedin_url.message}</p>
                  )}
                </div>
              </div>
            )}

            {/* Step 2: Company Information */}
            {step === 2 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Company Information</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="company_name">Company Name *</Label>
                  <Input
                    id="company_name"
                    placeholder="Acme Corp"
                    {...register('company_name')}
                  />
                  {errors.company_name && (
                    <p className="text-sm text-destructive">{errors.company_name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company_website">Company Website *</Label>
                  <Input
                    id="company_website"
                    type="url"
                    placeholder="https://acmecorp.com"
                    {...register('company_website')}
                  />
                  {errors.company_website && (
                    <p className="text-sm text-destructive">{errors.company_website.message}</p>
                  )}
                </div>

                <div className="space-y-2