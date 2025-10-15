'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { leadSchema, calculateLeadScore, type LeadFormData } from '@/lib/validations/lead'
import { Lead } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'

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

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
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
    const supabase = createClient()
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('id', params.id as string)
      .single()

    if (data) {
      // Pre-populate form with existing lead data
      Object.keys(data).forEach((key) => {
        if (key in leadSchema.shape) {
          setValue(key as keyof LeadFormData, data[key as keyof Lead])
        }
      })
    } else if (error) {
      console.error(error)
      router.push('/leads')
    }
    setLoading(false)
  }

  const onSubmit = async (data: LeadFormData) => {
    setSaving(true)
    setError(null)

    const supabase = createClient()
    const leadScore = calculateLeadScore(data)

    const { error: updateError } = await supabase
      .from('leads')
      .update({
        ...data,
        lead_score: leadScore,
      })
      .eq('id', params.id as string)

    if (updateError) {
      setError(updateError.message)
      setSaving(false)
    } else {
      router.push(`/leads/${params.id}`)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-lg text-muted-foreground">Loading lead...</div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <Link href={`/leads/${params.id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Edit Lead</h1>
          <p className="text-muted-foreground">Update lead information</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive rounded-lg">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name *</Label>
                <Input id="first_name" {...register('first_name')} />
                {errors.first_name && (
                  <p className="text-sm text-destructive">{errors.first_name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name *</Label>
                <Input id="last_name" {...register('last_name')} />
                {errors.last_name && (
                  <p className="text-sm text-destructive">{errors.last_name.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input id="email" type="email" {...register('email')} />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" {...register('phone')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="job_title">Job Title *</Label>
              <Input id="job_title" {...register('job_title')} />
              {errors.job_title && (
                <p className="text-sm text-destructive">{errors.job_title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="seniority_level">Seniority Level *</Label>
              <Select onValueChange={(value) => setValue('seniority_level', value as any)}>
                <SelectTrigger>
                  <SelectValue />
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
              <Label htmlFor="linkedin_url">LinkedIn URL</Label>
              <Input id="linkedin_url" type="url" {...register('linkedin_url')} />
            </div>
          </CardContent>
        </Card>

        {/* Company Information */}
        <Card>
          <CardHeader>
            <CardTitle>Company Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="company_name">Company Name *</Label>
              <Input id="company_name" {...register('company_name')} />
              {errors.company_name && (
                <p className="text-sm text-destructive">{errors.company_name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="company_website">Company Website *</Label>
              <Input id="company_website" type="url" {...register('company_website')} />
              {errors.company_website && (
                <p className="text-sm text-destructive">{errors.company_website.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="company_size">Company Size *</Label>
              <Select onValueChange={(value) => setValue('company_size', value as any)}>
                <SelectTrigger>
                  <SelectValue />
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
                  <SelectValue />
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
          </CardContent>
        </Card>

        {/* Project Details */}
        <Card>
          <CardHeader>
            <CardTitle>Project Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Service Interest *</Label>
              <div className="grid grid-cols-2 gap-3">
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
                    <label htmlFor={service} className="text-sm">
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
              <Label htmlFor="pain_point">Main Challenge/Goal *</Label>
              <Textarea id="pain_point" rows={5} {...register('pain_point')} />
              {errors.pain_point && (
                <p className="text-sm text-destructive">{errors.pain_point.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="project_timeline">Project Timeline *</Label>
              <Select onValueChange={(value) => setValue('project_timeline', value as any)}>
                <SelectTrigger>
                  <SelectValue />
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
                  <SelectValue />
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
              <Label htmlFor="lead_source">Lead Source *</Label>
              <Select onValueChange={(value) => setValue('lead_source', value as any)}>
                <SelectTrigger>
                  <SelectValue />
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
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-4">
          <Link href={`/leads/${params.id}`}>
            <Button type="button" variant="outline">Cancel</Button>
          </Link>
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  )
}