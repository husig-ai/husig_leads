'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { DashboardHeader } from '@/components/layout/DashboardHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { 
  User, 
  Mail, 
  Phone, 
  Building, 
  Save,
  Loader2,
  LogOut,
  Calendar
} from 'lucide-react'
import { toast } from '@/components/ui/use-toast'

const profileSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  company: z.string().optional(),
  job_title: z.string().optional(),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  timezone: z.string().optional(),
  theme: z.enum(['light', 'dark', 'system']).optional(),
})

type ProfileFormData = z.infer<typeof profileSchema>

interface UserProfile {
  id: string
  email: string
  full_name?: string
  phone?: string
  company?: string
  job_title?: string
  bio?: string
  avatar_url?: string
  role: string
  created_at: string
  updated_at?: string
  timezone?: string
  theme?: string
}

export default function ProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<UserProfile | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    setValue,
    watch,
    reset
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  })

  const watchedData = watch()

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const supabase = createClient()
      const { data: { user }, error: userError } = await supabase.auth.getUser()

      if (userError) throw userError
      if (!user) {
        router.push('/login')
        return
      }

      // Try to get profile from profiles table
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      let userProfile: UserProfile

      if (profileError && profileError.code === 'PGRST116') {
        // Profile doesn't exist, create one
        const newProfile = {
          id: user.id,
          email: user.email!,
          full_name: user.user_metadata?.full_name || '',
          phone: user.user_metadata?.phone || '',
          company: 'HuSig Analytics',
          job_title: '',
          bio: '',
          role: 'intern',
          timezone: 'America/New_York',
          theme: 'dark'
        }

        const { error: insertError } = await supabase
          .from('profiles')
          .insert([newProfile])

        if (insertError) throw insertError
        userProfile = { ...newProfile, created_at: new Date().toISOString() }
      } else if (profileError) {
        throw profileError
      } else {
        userProfile = profileData
      }

      setProfile(userProfile)

      // Populate form
      const formData: ProfileFormData = {
        full_name: userProfile.full_name || '',
        email: userProfile.email,
        phone: userProfile.phone || '',
        company: userProfile.company || 'HuSig Analytics',
        job_title: userProfile.job_title || '',
        bio: userProfile.bio || '',
        timezone: userProfile.timezone || 'America/New_York',
        theme: (userProfile.theme as 'light' | 'dark' | 'system') || 'dark',
      }

      reset(formData)
    } catch (error) {
      console.error('Error loading profile:', error)
      toast({
        title: "Error",
        description: "Failed to load profile data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: ProfileFormData) => {
    setSaving(true)
    
    try {
      const supabase = createClient()
      
      // Update profiles table
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: data.full_name,
          phone: data.phone,
          company: data.company,
          job_title: data.job_title,
          bio: data.bio,
          timezone: data.timezone,
          theme: data.theme,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile?.id)

      if (updateError) throw updateError

      // Update auth user metadata
      const { error: authUpdateError } = await supabase.auth.updateUser({
        data: {
          full_name: data.full_name,
          phone: data.phone,
        }
      })

      if (authUpdateError) throw authUpdateError

      toast({
        title: "Success!",
        description: "Profile updated successfully",
      })

      // Reload profile data
      await loadProfile()
    } catch (error) {
      console.error('Error updating profile:', error)
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-husig-dark">
        <DashboardHeader />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-husig-purple-500 mx-auto mb-4" />
            <div className="text-lg text-gray-300">Loading profile...</div>
          </div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-husig-dark">
        <DashboardHeader />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-4">Profile Not Found</h1>
            <p className="text-gray-400">Unable to load your profile data.</p>
          </div>
        </div>
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'manager': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'intern': return 'bg-green-500/20 text-green-400 border-green-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  return (
    <div className="min-h-screen bg-husig-dark">
      <DashboardHeader />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            <span className="text-husig-gradient">Profile</span>
          </h1>
          <p className="text-gray-400 text-lg">Manage your account information</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Summary Card */}
          <div className="lg:col-span-1">
            <Card className="card-husig-glass border-gray-700/50">
              <CardContent className="p-6 text-center">
                <div className="w-24 h-24 bg-husig-gradient rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-2xl font-bold">
                    {profile.full_name ? profile.full_name.split(' ').map(n => n[0]).join('') : 'U'}
                  </span>
                </div>
                <h3 className="text-xl font-semibold text-white mb-1">
                  {profile.full_name || 'User'}
                </h3>
                <p className="text-gray-400 mb-3">{profile.job_title || 'Team Member'}</p>
                <Badge className={`${getRoleBadgeClass(profile.role)} border`}>
                  {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
                </Badge>
                
                <Separator className="my-6 bg-gray-700" />
                
                <div className="space-y-3 text-sm">
                  <div className="flex items-center text-gray-400">
                    <Mail className="w-4 h-4 mr-2" />
                    <span className="truncate">{profile.email}</span>
                  </div>
                  <div className="flex items-center text-gray-400">
                    <Building className="w-4 h-4 mr-2" />
                    <span>{profile.company || 'HuSig Analytics'}</span>
                  </div>
                  <div className="flex items-center text-gray-400">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>Joined {formatDate(profile.created_at)}</span>
                  </div>
                </div>

                <Separator className="my-6 bg-gray-700" />

                <Button 
                  variant="outline" 
                  onClick={handleSignOut}
                  className="w-full btn-husig-outline text-red-400 border-red-500/30 hover:bg-red-500/10"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Profile Form */}
          <div className="lg:col-span-2">
            <Card className="card-husig-glass border-gray-700/50">
              <CardHeader>
                <CardTitle className="flex items-center text-white">
                  <User className="w-5 h-5 mr-2 text-husig-purple-400" />
                  Edit Profile
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  {/* Basic Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="full_name" className="text-gray-300">Full Name</Label>
                      <Input
                        id="full_name"
                        {...register('full_name')}
                        className="husig-input"
                        placeholder="Enter your full name"
                      />
                      {errors.full_name && (
                        <p className="text-red-400 text-sm mt-1">{errors.full_name.message}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="email" className="text-gray-300">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        {...register('email')}
                        className="husig-input"
                        placeholder="Enter your email"
                        disabled
                      />
                      <p className="text-gray-500 text-xs mt-1">Email cannot be changed here</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="phone" className="text-gray-300">Phone Number</Label>
                      <Input
                        id="phone"
                        {...register('phone')}
                        className="husig-input"
                        placeholder="Enter your phone number"
                      />
                    </div>

                    <div>
                      <Label htmlFor="job_title" className="text-gray-300">Job Title</Label>
                      <Input
                        id="job_title"
                        {...register('job_title')}
                        className="husig-input"
                        placeholder="Enter your job title"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="company" className="text-gray-300">Company</Label>
                    <Input
                      id="company"
                      {...register('company')}
                      className="husig-input"
                      placeholder="Enter your company"
                    />
                  </div>

                  <div>
                    <Label htmlFor="bio" className="text-gray-300">Bio</Label>
                    <Textarea
                      id="bio"
                      {...register('bio')}
                      className="husig-textarea"
                      placeholder="Tell us about yourself..."
                      rows={3}
                    />
                    <p className="text-gray-500 text-xs mt-1">
                      {watchedData.bio?.length || 0}/500 characters
                    </p>
                  </div>

                  {/* Preferences */}
                  <Separator className="bg-gray-700" />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="timezone" className="text-gray-300">Timezone</Label>
                      <Select value={watchedData.timezone} onValueChange={(value) => setValue('timezone', value)}>
                        <SelectTrigger className="husig-select">
                          <SelectValue placeholder="Select timezone" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="America/New_York">Eastern Time</SelectItem>
                          <SelectItem value="America/Chicago">Central Time</SelectItem>
                          <SelectItem value="America/Denver">Mountain Time</SelectItem>
                          <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                          <SelectItem value="UTC">UTC</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="theme" className="text-gray-300">Theme Preference</Label>
                      <Select value={watchedData.theme} onValueChange={(value) => setValue('theme', value as any)}>
                        <SelectTrigger className="husig-select">
                          <SelectValue placeholder="Select theme" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="light">Light</SelectItem>
                          <SelectItem value="dark">Dark</SelectItem>
                          <SelectItem value="system">System</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="flex justify-end pt-4">
                    <Button
                      type="submit"
                      disabled={!isDirty || saving}
                      className="btn-husig-primary"
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
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}