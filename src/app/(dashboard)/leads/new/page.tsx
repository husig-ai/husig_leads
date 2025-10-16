'use client'

import { useState } from 'react'
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
import { ChevronLeft, ChevronRight, CheckCircle2, User, Building2, Target, Loader2, ArrowLeft } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'
import { DashboardHeader } from '@/components/layout/DashboardHeader'
import Link from 'next/link'

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

  const validateStep = async () => {
    const fieldsToValidate = currentStepConfig.fields
    return await trigger(fieldsToValidate as any)
  }

  const handleNext = async () => {
    const isStepValid = await validateStep()
    if (isStepValid && step < STEP_CONFIG.length) {
      setStep(step + 1)
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  const onSubmit = async (data: LeadFormData) => {
    setLoading(true)
    
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('User not authenticated')
      }

      // Calculate lead score
      const leadScore = calculateLeadScore(data)
      
      const leadData = {
        ...data,
        lead_score: leadScore,
        lead_status: 'new' as const,
        created_by: user.id,
        sourced_by: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('leads')
        .insert([leadData])

      if (error) throw error

      toast({
        title: 'Success!',
        description: `Lead created successfully with score ${leadScore}/100`,
      })

      router.push('/leads')
    } catch (error) {
      console.error('Error creating lead:', error)
      toast({
        title: 'Error',
        description: 'Failed to create lead. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleServiceToggle = (service: string) => {
    const current = serviceInterest || []
    const updated = current.includes(service) 
      ? current.filter(s => s !== service)
      : [...current, service]
    setValue('service_interest', updated)
  }

  return (
    <div className="min-h-screen bg-husig-dark">
      <DashboardHeader />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Link href="/leads">
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white hover:bg-gray-800">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Leads
              </Button>
            </Link>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">
            <span className="text-husig-gradient">Add New Lead</span>
          </h1>
          <p className="text-gray-400 text-lg">Capture a new lead opportunity in 3 simple steps</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {STEP_CONFIG.map((stepConfig, index) => {
              const StepIcon = stepConfig.icon
              const isActive = step === stepConfig.id
              const isCompleted = step > stepConfig.id
              
              return (
                <div key={stepConfig.id} className="flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200 ${
                    isCompleted 
                      ? 'bg-green-500 text-white' 
                      : isActive 
                        ? 'bg-husig-purple-500 text-white' 
                        : 'bg-gray-700 text-gray-400'
                  }`}>
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <StepIcon className="w-5 h-5" />
                    )}
                  </div>
                  {index < STEP_CONFIG.length - 1 && (
                    <div className={`flex-1 h-1 mx-4 rounded transition-all duration-200 ${
                      step > stepConfig.id ? 'bg-green-500' : 'bg-gray-700'
                    }`} />
                  )}
                </div>
              )
            })}
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-300 font-medium">{currentStepConfig.title}</span>
              <span className="text-gray-500">Step {step} of {STEP_CONFIG.length}</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>

        {/* Form Card */}
        <Card className="card-husig-glass border-gray-700/50">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <currentStepConfig.icon className="w-5 h-5 mr-2 text-husig-purple-400" />
              {currentStepConfig.title}
            </CardTitle>
            <CardDescription className="text-gray-400">
              {currentStepConfig.description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Step 1: Contact Information */}
              {step === 1 && (
                <div className="space-y-4">
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
                      <Select onValueChange={(value) => setValue('seniority_level', value as any)}>
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
                </div>
              )}

              {/* Step 2: Company Information */}
              {step === 2 && (
                <div className="space-y-4">
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
                      <Select onValueChange={(value) => setValue('company_size', value as any)}>
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
                      <Select onValueChange={(value) => setValue('industry', value as any)}>
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
                </div>
              )}

              {/* Step 3: Project Details */}
              {step === 3 && (
                <div className="space-y-6">
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
                    {errors.service_interest && (
                      <p className="text-red-400 text-sm mt-1">{errors.service_interest.message}</p>
                    )}
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
                      <Select onValueChange={(value) => setValue('project_timeline', value as any)}>
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
                      <Select onValueChange={(value) => setValue('budget_range', value as any)}>
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
                    <Select onValueChange={(value) => setValue('lead_source', value as any)}>
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
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-6 border-t border-gray-700">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  disabled={step === 1}
                  className="btn-husig-outline px-6"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>

                {step < STEP_CONFIG.length ? (
                  <Button
                    type="button"
                    onClick={handleNext}
                    className="btn-husig-primary px-6"
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={loading}
                    className="btn-husig-primary px-8"
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