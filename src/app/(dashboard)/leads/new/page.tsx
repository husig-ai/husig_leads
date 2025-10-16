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
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, ChevronRight, CheckCircle2, User, Building2, Target, Loader2 } from 'lucide-react'
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

const STEP_CONFIG = [
  {
    id: 1,
    title: 'Contact Information',
    description: 'Basic contact details and role information',
    icon: User,
    fields: ['first_name', 'last_name', 'email', 'phone', 'job_title', 'seniority_level', 'linkedin_url']
  },
  {
    id: 2,
    title: 'Company Information',
    description: 'Company details and industry information',
    icon: Building2,
    fields: ['company_name', 'company_website', 'company_size', 'industry']
  },
  {
    id: 3,
    title: 'Project Details',
    description: 'Project requirements and timeline',
    icon: Target,
    fields: ['service_interest', 'pain_point', 'project_timeline', 'budget_range', 'lead_source']
  }
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
  const currentStepConfig = STEP_CONFIG.find(s => s.id === step)!
  const progress = (step / STEP_CONFIG.length) * 100

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('leadFormData')
    if (saved) {
      try {
        const data = JSON.parse(saved)
        Object.keys(data).forEach(key => {
          setValue(key as any, data[key])
        })
      } catch (e) {
        console.error('Error loading saved form data:', e)
      }
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
    const isValid = await trigger(currentStepConfig.fields as (keyof LeadFormData)[])
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

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('You must be logged in to create leads')
      }

      // Calculate lead score
      const leadScore = calculateLeadScore(data)

      const leadData = {
        ...data,
        lead_score: leadScore,
        lead_status: 'New' as const,
        created_by: user.id,
      }

      const { error: insertError } = await supabase
        .from('leads')
        .insert([leadData])

      if (insertError) throw insertError

      // Clear saved form data
      localStorage.removeItem('leadFormData')

      toast({
        title: "Success!",
        description: `Lead created with score of ${leadScore}/100`,
      })

      router.push('/leads')
    } catch (err) {
      console.error('Error creating lead:', err)
      setError(err instanceof Error ? err.message : 'Failed to create lead')
      toast({
        title: "Error",
        description: "Failed to create lead. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Add New Lead</h1>
              <p className="text-gray-600 mt-1">Create a new lead in your pipeline</p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => router.push('/leads')}
              className="hover:bg-gray-50"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back to Leads
            </Button>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-700">
                Step {step} of {STEP_CONFIG.length}
              </span>
              <span className="text-sm text-gray-500">{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Step Indicators */}
          <div className="flex items-center justify-between mb-8">
            {STEP_CONFIG.map((stepConfig, index) => {
              const isCompleted = step > stepConfig.id
              const isCurrent = step === stepConfig.id
              const IconComponent = stepConfig.icon

              return (
                <div key={stepConfig.id} className="flex items-center">
                  <div className={`
                    flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-200
                    ${isCompleted ? 'bg-green-100 border-green-500 text-green-700' : 
                      isCurrent ? 'bg-blue-100 border-blue-500 text-blue-700' : 
                      'bg-gray-100 border-gray-300 text-gray-400'}
                  `}>
                    {isCompleted ? (
                      <CheckCircle2 className="w-6 h-6" />
                    ) : (
                      <IconComponent className="w-6 h-6" />
                    )}
                  </div>
                  {index < STEP_CONFIG.length - 1 && (
                    <div className={`
                      w-20 h-0.5 mx-4 transition-all duration-200
                      ${isCompleted ? 'bg-green-500' : 'bg-gray-300'}
                    `} />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Main Form */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <currentStepConfig.icon className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-xl">{currentStepConfig.title}</CardTitle>
                <CardDescription className="text-base">
                  {currentStepConfig.description}
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-0">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {/* Step 1: Contact Information */}
              {step === 1 && (
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
                    <Select onValueChange={(value) => setValue('seniority_level', value as any)}>
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
              )}

              {/* Step 2: Company Information */}
              {step === 2 && (
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
                    <Select onValueChange={(value) => setValue('company_size', value as any)}>
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
                    <Select onValueChange={(value) => setValue('industry', value as any)}>
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
              )}

              {/* Step 3: Project Details */}
              {step === 3 && (
                <div className="space-y-6">
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
                              setValue('service_interest', updated)
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
                      <Select onValueChange={(value) => setValue('project_timeline', value as any)}>
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
                      <Select onValueChange={(value) => setValue('budget_range', value as any)}>
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
                    <Select onValueChange={(value) => setValue('lead_source', value as any)}>
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
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  disabled={step === 1}
                  className="px-6"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>

                {step < STEP_CONFIG.length ? (
                  <Button
                    type="button"
                    onClick={handleNext}
                    className="px-6 bg-blue-600 hover:bg-blue-700"
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={loading}
                    className="px-8 bg-green-600 hover:bg-green-700"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating Lead...
                      </>
                    ) : (
                      'Create Lead'
                    )}
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}