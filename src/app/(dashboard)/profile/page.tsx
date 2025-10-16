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
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { 
  User, 
  Mail, 
  Phone, 
  Building, 
  Calendar,
  Settings,
  Bell,
  Shield,
  Download,
  Upload,
  Save,
  Loader2,
  Camera,
  Check,
  X,
  AlertCircle
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
  date_format: z.string().optional(),
  notifications_email: z.boolean(),
  notifications_browser: z.boolean(),
  notifications_lead_assigned: z.boolean(),
  notifications_lead_updated: z.boolean(),
  theme: z.enum(['light', 'dark', 'system']),
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
  last_sign_in_at?: string
  preferences: {
    timezone: string
    date_format: string
    notifications: {
      email: boolean
      browser: boolean
      lead_assigned: boolean
      lead_updated: boolean
    }
    theme: string
  }
}

export default function ProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [activeTab, setActiveTab] = useState('profile')

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

      // Mock profile data - in real app, you'd fetch this from your database
      const mockProfile: UserProfile = {
        id: user.id,
        email: user.email!,
        full_name: user.user_metadata?.full_name || '',
        phone: user.user_metadata?.phone || '',
        company: 'HuSig Analytics',
        job_title: 'Sales Manager',
        bio: 'Passionate about data-driven sales and helping businesses grow through analytics.',
        avatar_url: user.user_metadata?.avatar_url,
        role: 'Manager',
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at,
        preferences: {
          timezone: 'America/New_York',
          date_format: 'MM/DD/YYYY',
          notifications: {
            email: true,
            browser: true,
            lead_assigned: true,
            lead_updated: false
          },
          theme: 'system'
        }
      }

      setProfile(mockProfile)

      // Populate form
      const formData: ProfileFormData = {
        full_name: mockProfile.full_name || '',
        email: mockProfile.email,
        phone: mockProfile.phone || '',
        company: mockProfile.company || '',
        job_title: mockProfile.job_title || '',
        bio: mockProfile.bio || '',
        timezone: mockProfile.preferences.timezone,
        date_format: mockProfile.preferences.date_format,
        notifications_email: mockProfile.preferences.notifications.email,
        notifications_browser: mockProfile.preferences.notifications.browser,
        notifications_lead_assigned: mockProfile.preferences.notifications.lead_assigned,
        notifications_lead_updated: mockProfile.preferences.notifications.lead_updated,
        theme: mockProfile.preferences.theme as 'light' | 'dark' | 'system',
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
      
      // Update auth user metadata
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          full_name: data.full_name,
          phone: data.phone,
        }
      })

      if (updateError) throw updateError

      // In a real app, you'd also update your custom user profile table
      
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

  const handleChangePassword = () => {
    toast({
      title: "Feature Coming Soon",
      description: "Password change functionality will be available soon.",
    })
  }

  const handleChangeEmail = () => {
    toast({
      title: "Feature Coming Soon", 
      description: "Email change functionality will be available soon.",
    })
  }

  const handleDownloadData = () => {
    toast({
      title: "Feature Coming Soon",
      description: "Data download functionality will be available soon.",
    })
  }

  const handleDeleteAccount = () => {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      toast({
        title: "Feature Coming Soon",
        description: "Account deletion functionality will be available soon.",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader />
        <div className="flex items-center justify-center h-96">
          <div className="text-lg text-gray-600">Loading profile...</div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Profile Not Found</h1>
            <p className="text-gray-600">Unable to load your profile data.</p>
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

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
          <p className="text-gray-600 mt-1">Manage your account settings and preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <Card className="shadow-sm border-0 bg-white">
              <CardContent className="p-0">
                <nav className="space-y-1">
                  {[
                    { id: 'profile', label: 'Profile', icon: User },
                    { id: 'account', label: 'Account', icon: Settings },
                    { id: 'notifications', label: 'Notifications', icon: Bell },
                    { id: 'security', label: 'Security', icon: Shield },
                  ].map((item) => {
                    const IconComponent = item.icon
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                          activeTab === item.id
                            ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                        <IconComponent className="w-5 h-5 mr-3" />
                        {item.label}
                      </button>
                    )
                  })}
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            <form onSubmit={handleSubmit(onSubmit)}>
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <Card className="shadow-sm border-0 bg-white">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <User className="w-5 h-5 mr-2" />
                      Profile Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Avatar Section */}
                    <div className="flex items-center space-x-6">
                      <div className="relative">
                        <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center">
                          {profile.avatar_url ? (
                            <img 
                              src={profile.avatar_url} 
                              alt="Profile" 
                              className="w-24 h-24 rounded-full object-cover"
                            />
                          ) : (
                            <User className="w-12 h-12 text-blue-600" />
                          )}
                        </div>
                        <button
                          type="button"
                          className="absolute bottom-0 right-0 p-1.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
                        >
                          <Camera className="w-4 h-4" />
                        </button>
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">{profile.full_name || 'User'}</h3>
                        <p className="text-gray-600">{profile.email}</p>
                        <Badge variant="outline" className="mt-1">
                          {profile.role}
                        </Badge>
                      </div>
                    </div>

                    <Separator />

                    {/* Basic Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="full_name">Full Name *</Label>
                        <Input
                          id="full_name"
                          placeholder="Enter your full name"
                          {...register('full_name')}
                        />
                        {errors.full_name && (
                          <p className="text-sm text-red-500">{errors.full_name.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address *</Label>
                        <Input
                          id="email"
                          type="email"
                          disabled
                          {...register('email')}
                        />
                        <p className="text-xs text-gray-500">Email cannot be changed here</p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="+1 (555) 123-4567"
                          {...register('phone')}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="job_title">Job Title</Label>
                        <Input
                          id="job_title"
                          placeholder="Your job title"
                          {...register('job_title')}
                        />
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="company">Company</Label>
                        <Input
                          id="company"
                          placeholder="Your company name"
                          {...register('company')}
                        />
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="bio">Bio</Label>
                        <Textarea
                          id="bio"
                          placeholder="Tell us about yourself..."
                          rows={3}
                          {...register('bio')}
                        />
                        <p className="text-xs text-gray-500">
                          {watchedData.bio?.length || 0}/500 characters
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Account Tab */}
              {activeTab === 'account' && (
                <Card className="shadow-sm border-0 bg-white">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Settings className="w-5 h-5 mr-2" />
                      Account Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Account Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label className="text-sm font-medium text-gray-900">Account Created</Label>
                        <p className="text-sm text-gray-600 mt-1">{formatDate(profile.created_at)}</p>
                      </div>
                      
                      {profile.last_sign_in_at && (
                        <div>
                          <Label className="text-sm font-medium text-gray-900">Last Sign In</Label>
                          <p className="text-sm text-gray-600 mt-1">{formatDate(profile.last_sign_in_at)}</p>
                        </div>
                      )}
                    </div>

                    <Separator />

                    {/* Preferences */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-gray-900">Preferences</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="timezone">Timezone</Label>
                          <Select 
                            value={watchedData.timezone || ''}
                            onValueChange={(value) => setValue('timezone', value, { shouldDirty: true })}
                          >
                            <SelectTrigger>
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

                        <div className="space-y-2">
                          <Label htmlFor="date_format">Date Format</Label>
                          <Select 
                            value={watchedData.date_format || ''}
                            onValueChange={(value) => setValue('date_format', value, { shouldDirty: true })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select format" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                              <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                              <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="theme">Theme</Label>
                          <Select 
                            value={watchedData.theme || ''}
                            onValueChange={(value) => setValue('theme', value as any, { shouldDirty: true })}
                          >
                            <SelectTrigger>
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
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <Card className="shadow-sm border-0 bg-white">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Bell className="w-5 h-5 mr-2" />
                      Notification Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-sm font-medium text-gray-900">Email Notifications</Label>
                          <p className="text-sm text-gray-600">Receive notifications via email</p>
                        </div>
                        <Switch 
                          checked={watchedData.notifications_email || false}
                          onCheckedChange={(checked) => setValue('notifications_email', checked, { shouldDirty: true })}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-sm font-medium text-gray-900">Browser Notifications</Label>
                          <p className="text-sm text-gray-600">Receive push notifications in your browser</p>
                        </div>
                        <Switch 
                          checked={watchedData.notifications_browser || false}
                          onCheckedChange={(checked) => setValue('notifications_browser', checked, { shouldDirty: true })}
                        />
                      </div>

                      <Separator />

                      <h4 className="text-sm font-medium text-gray-900">Lead Notifications</h4>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-sm font-medium text-gray-900">New Lead Assigned</Label>
                          <p className="text-sm text-gray-600">When a new lead is assigned to you</p>
                        </div>
                        <Switch 
                          checked={watchedData.notifications_lead_assigned || false}
                          onCheckedChange={(checked) => setValue('notifications_lead_assigned', checked, { shouldDirty: true })}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-sm font-medium text-gray-900">Lead Updated</Label>
                          <p className="text-sm text-gray-600">When a lead you're watching is updated</p>
                        </div>
                        <Switch 
                          checked={watchedData.notifications_lead_updated || false}
                          onCheckedChange={(checked) => setValue('notifications_lead_updated', checked, { shouldDirty: true })}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <Card className="shadow-sm border-0 bg-white">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Shield className="w-5 h-5 mr-2" />
                      Security Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center">
                          <Check className="w-5 h-5 text-blue-600 mr-2" />
                          <span className="text-sm font-medium text-blue-900">Account Security</span>
                        </div>
                        <p className="text-sm text-blue-700 mt-1">
                          Your account is protected with modern security practices.
                        </p>
                      </div>

                      <div className="space-y-3">
                        <Button 
                          variant="outline" 
                          className="w-full justify-start" 
                          type="button"
                          onClick={handleChangeEmail}
                        >
                          <Mail className="w-4 h-4 mr-2" />
                          Change Email Address
                        </Button>
                        
                        <Button 
                          variant="outline" 
                          className="w-full justify-start" 
                          type="button"
                          onClick={handleChangePassword}
                        >
                          <Shield className="w-4 h-4 mr-2" />
                          Change Password
                        </Button>
                        
                        <Button 
                          variant="outline" 
                          className="w-full justify-start" 
                          type="button"
                          onClick={handleDownloadData}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download My Data
                        </Button>
                      </div>

                      <Separator />

                      <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                        <h4 className="text-sm font-medium text-red-900 mb-2">Danger Zone</h4>
                        <p className="text-sm text-red-700 mb-3">
                          These actions are permanent and cannot be undone.
                        </p>
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          type="button"
                          onClick={handleDeleteAccount}
                        >
                          Delete Account
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Save Button */}
              {activeTab !== 'security' && (
                <Card className="shadow-sm border-0 bg-white">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-gray-600">
                        {isDirty ? (
                          <div className="flex items-center text-amber-600">
                            <AlertCircle className="w-4 h-4 mr-2" />
                            <span className="font-medium">You have unsaved changes</span>
                          </div>
                        ) : (
                          <div className="flex items-center text-green-600">
                            <Check className="w-4 h-4 mr-2" />
                            <span>All changes saved</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex space-x-3">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleSignOut}
                        >
                          Sign Out
                        </Button>
                        
                        <Button
                          type="submit"
                          disabled={saving || !isDirty}
                          className="bg-blue-600 hover:bg-blue-700"
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
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}