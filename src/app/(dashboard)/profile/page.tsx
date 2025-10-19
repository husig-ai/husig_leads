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
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  Shield,
  UserCheck
} from 'lucide-react'
import { toast } from '@/components/ui/use-toast'

const profileSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  phone: z.string().optional(),
  job_title: z.string().optional(),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
})

type ProfileFormData = z.infer<typeof profileSchema>

interface UserProfile {
  id: string
  email: string
  full_name?: string
  phone?: string
  job_title?: string
  bio?: string
  avatar_url?: string
  role: string
  is_approved: boolean
  approved_by?: string
  approved_at?: string
  invited_by?: string
  invited_at?: string
  created_at: string
  updated_at?: string
  // Related data
  approver_name?: string
  inviter_name?: string
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

      // Get profile with related user information
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select(`
          *,
          approver:approved_by(full_name),
          inviter:invited_by(full_name)
        `)
        .eq('id', user.id)
        .single()

      if (profileError) throw profileError

      const userProfile: UserProfile = {
        ...profileData,
        approver_name: profileData.approver?.full_name,
        inviter_name: profileData.inviter?.full_name
      }

      setProfile(userProfile)

      // Populate form with current data
      const formData: ProfileFormData = {
        full_name: userProfile.full_name || '',
        phone: userProfile.phone || '',
        job_title: userProfile.job_title || '',
        bio: userProfile.bio || '',
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
    if (!profile) return

    setSaving(true)
    
    try {
      const supabase = createClient()
      
      // Update profiles table
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: data.full_name,
          phone: data.phone,
          job_title: data.job_title,
          bio: data.bio,
        })
        .eq('id', profile.id)

      if (updateError) throw updateError

      // Update auth user metadata for full_name
      const { error: authUpdateError } = await supabase.auth.updateUser({
        data: {
          full_name: data.full_name,
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

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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

  const getApprovalStatusBadge = () => {
    if (profile.is_approved) {
      return (
        <Badge className="bg-green-500/20 text-green-400 border-green-500/30 border">
          <CheckCircle className="w-3 h-3 mr-1" />
          Approved
        </Badge>
      )
    }
    return (
      <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 border">
        <Clock className="w-3 h-3 mr-1" />
        Pending Approval
      </Badge>
    )
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
          <p className="text-gray-400 text-lg">Manage your account information and view approval status</p>
        </div>

        {!profile.is_approved && (
          <div className="mb-8 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-lg p-4 flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-yellow-400 mt-0.5 flex-shrink-0" />
            <div className="text-yellow-200">
              Your account is pending admin approval. You have limited access until an administrator approves your account.
            </div>
          </div>
        )}

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
                
                <div className="flex flex-col items-center space-y-2 mb-4">
                  <Badge className={`${getRoleBadgeClass(profile.role)} border`}>
                    <Shield className="w-3 h-3 mr-1" />
                    {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
                  </Badge>
                  {getApprovalStatusBadge()}
                </div>
                
                <Separator className="my-6 bg-gray-700" />
                
                <div className="space-y-3 text-sm">
                  <div className="flex items-center text-gray-400">
                    <Mail className="w-4 h-4 mr-2" />
                    <span className="truncate">{profile.email}</span>
                  </div>
                  <div className="flex items-center text-gray-400">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>Joined {formatDate(profile.created_at)}</span>
                  </div>
                  {profile.phone && (
                    <div className="flex items-center text-gray-400">
                      <Phone className="w-4 h-4 mr-2" />
                      <span>{profile.phone}</span>
                    </div>
                  )}
                </div>

                {/* Approval Information */}
                {(profile.approved_at || profile.invited_at) && (
                  <>
                    <Separator className="my-6 bg-gray-700" />
                    <div className="space-y-2 text-xs text-gray-500">
                      {profile.invited_at && (
                        <div className="flex items-center justify-between">
                          <span>Invited:</span>
                          <span>{formatDate(profile.invited_at)}</span>
                        </div>
                      )}
                      {profile.inviter_name && (
                        <div className="flex items-center justify-between">
                          <span>Invited by:</span>
                          <span className="text-gray-400">{profile.inviter_name}</span>
                        </div>
                      )}
                      {profile.approved_at && (
                        <div className="flex items-center justify-between">
                          <span>Approved:</span>
                          <span>{formatDate(profile.approved_at)}</span>
                        </div>
                      )}
                      {profile.approver_name && (
                        <div className="flex items-center justify-between">
                          <span>Approved by:</span>
                          <span className="text-gray-400">{profile.approver_name}</span>
                        </div>
                      )}
                    </div>
                  </>
                )}

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
                <CardTitle className="text-xl font-semibold text-white flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Profile Information
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  {/* Full Name */}
                  <div className="space-y-2">
                    <Label htmlFor="full_name" className="text-sm font-medium text-gray-300">
                      Full Name *
                    </Label>
                    <Input
                      id="full_name"
                      {...register('full_name')}
                      className="husig-input"
                      placeholder="Enter your full name"
                    />
                    {errors.full_name && (
                      <p className="text-sm text-red-400">{errors.full_name.message}</p>
                    )}
                  </div>

                  {/* Email (Read-only) */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-gray-300">
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      value={profile.email}
                      disabled
                      className="husig-input bg-gray-800/50 text-gray-400 cursor-not-allowed"
                    />
                    <p className="text-xs text-gray-500">Email cannot be changed</p>
                  </div>

                  {/* Phone */}
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-medium text-gray-300">
                      Phone Number
                    </Label>
                    <Input
                      id="phone"
                      {...register('phone')}
                      className="husig-input"
                      placeholder="Enter your phone number"
                    />
                    {errors.phone && (
                      <p className="text-sm text-red-400">{errors.phone.message}</p>
                    )}
                  </div>

                  {/* Job Title */}
                  <div className="space-y-2">
                    <Label htmlFor="job_title" className="text-sm font-medium text-gray-300">
                      Job Title
                    </Label>
                    <Input
                      id="job_title"
                      {...register('job_title')}
                      className="husig-input"
                      placeholder="e.g., Data Analyst, Account Manager"
                    />
                    {errors.job_title && (
                      <p className="text-sm text-red-400">{errors.job_title.message}</p>
                    )}
                  </div>

                  {/* Bio */}
                  <div className="space-y-2">
                    <Label htmlFor="bio" className="text-sm font-medium text-gray-300">
                      Bio
                    </Label>
                    <Textarea
                      id="bio"
                      {...register('bio')}
                      rows={4}
                      className="husig-textarea resize-none"
                      placeholder="Tell us a bit about yourself..."
                    />
                    {errors.bio && (
                      <p className="text-sm text-red-400">{errors.bio.message}</p>
                    )}
                    <p className="text-xs text-gray-500">
                      {watchedData.bio?.length || 0} / 500 characters
                    </p>
                  </div>

                  {/* Role (Read-only) */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-300">
                      Role
                    </Label>
                    <div className="flex items-center space-x-2">
                      <Badge className={`${getRoleBadgeClass(profile.role)} border`}>
                        <Shield className="w-3 h-3 mr-1" />
                        {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        Role can only be changed by administrators
                      </span>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="flex justify-end pt-6">
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