'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { HuSigLogo } from '@/components/brand/HuSigLogo'
import { 
  Clock, 
  Mail, 
  User, 
  Calendar,
  LogOut,
  RefreshCw,
  CheckCircle,
  Shield
} from 'lucide-react'

interface UserProfile {
  id: string
  full_name?: string
  email: string
  role: string
  is_approved: boolean
  invited_by?: string
  invited_at?: string
  created_at: string
  inviter_name?: string
}

export default function PendingApprovalPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [checking, setChecking] = useState(false)

  useEffect(() => {
    loadProfile()
    
    // Check approval status every 30 seconds
    const interval = setInterval(checkApprovalStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadProfile = async () => {
    try {
      const supabase = createClient()
      const { data: { user }, error: userError } = await supabase.auth.getUser()

      if (userError || !user) {
        router.push('/login')
        return
      }

      // Get profile with inviter information
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select(`
          *,
          inviter:invited_by(full_name)
        `)
        .eq('id', user.id)
        .single()

      if (profileError) {
        console.error('Profile error:', profileError)
        router.push('/login')
        return
      }

      const userProfile: UserProfile = {
        ...profileData,
        inviter_name: profileData.inviter?.full_name
      }

      setProfile(userProfile)

      // If user is already approved, redirect to dashboard
      if (userProfile.is_approved) {
        router.push('/dashboard')
        return
      }
    } catch (error) {
      console.error('Error loading profile:', error)
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  const checkApprovalStatus = async () => {
    if (!profile) return

    setChecking(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('profiles')
        .select('is_approved')
        .eq('id', profile.id)
        .single()

      if (error) throw error

      if (data.is_approved) {
        // User has been approved! Redirect to dashboard
        router.push('/dashboard')
      }
    } catch (error) {
      console.error('Error checking approval status:', error)
    } finally {
      setChecking(false)
    }
  }

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getDaysSince = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-husig-dark flex items-center justify-center">
        <div className="animate-pulse text-center">
          <HuSigLogo size="large" showText={true} />
          <p className="text-gray-400 mt-4">Loading...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-husig-dark flex items-center justify-center">
        <Card className="w-full max-w-md mx-4 card-husig-glass border-gray-700/50">
          <CardContent className="p-8 text-center">
            <h1 className="text-xl font-bold text-white mb-4">Profile Not Found</h1>
            <p className="text-gray-400 mb-6">Unable to load your profile information.</p>
            <Button onClick={() => router.push('/login')} className="btn-husig-primary">
              Return to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-husig-dark">
      {/* Header */}
      <header className="bg-gray-900/50 backdrop-blur-sm border-b border-gray-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <HuSigLogo size="small" showText={true} />
            <Button 
              variant="outline" 
              onClick={handleSignOut}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] p-4">
        <Card className="w-full max-w-2xl card-husig-glass border-gray-700/50">
          <CardContent className="p-8">
            {/* Status Icon */}
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-yellow-500/30">
                <Clock className="w-10 h-10 text-yellow-400" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Account Pending Approval
              </h1>
              <p className="text-gray-400 text-lg">
                Your account is waiting for administrator approval
              </p>
            </div>

            {/* User Information */}
            <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/30 rounded-xl p-6 mb-6 border border-gray-700/50">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-husig-gradient rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-lg">
                    {profile.full_name ? profile.full_name.charAt(0).toUpperCase() : profile.email.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-1">
                    {profile.full_name || 'New User'}
                  </h3>
                  <div className="space-y-2 text-sm text-gray-400">
                    <div className="flex items-center">
                      <Mail className="w-4 h-4 mr-2" />
                      {profile.email}
                    </div>
                    <div className="flex items-center">
                      <Shield className="w-4 h-4 mr-2" />
                      Role: {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
                    </div>
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      Joined: {formatDate(profile.created_at)}
                    </div>
                    {profile.invited_at && (
                      <div className="flex items-center">
                        <User className="w-4 h-4 mr-2" />
                        Invited: {formatDate(profile.invited_at)}
                        {profile.inviter_name && ` by ${profile.inviter_name}`}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Status Information */}
            <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-lg p-6 mb-6">
              <div className="flex items-start space-x-3">
                <Clock className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-yellow-200 mb-2">What happens next?</h3>
                  <ul className="space-y-2 text-sm text-yellow-100">
                    <li>• An administrator will review your account</li>
                    <li>• You'll receive email notification when approved</li>
                    <li>• Once approved, you'll have full access to the platform</li>
                    <li>• You can check back here anytime for updates</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Waiting Stats */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-800/50 rounded-lg p-4 text-center border border-gray-700/50">
                <div className="text-2xl font-bold text-white mb-1">
                  {getDaysSince(profile.created_at)}
                </div>
                <div className="text-xs text-gray-400">
                  {getDaysSince(profile.created_at) === 1 ? 'Day' : 'Days'} Waiting
                </div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-4 text-center border border-gray-700/50">
                <div className="text-2xl font-bold text-yellow-400 mb-1">
                  <Clock className="w-6 h-6 mx-auto" />
                </div>
                <div className="text-xs text-gray-400">
                  Pending Review
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                onClick={checkApprovalStatus}
                disabled={checking}
                className="flex-1 btn-husig-primary"
              >
                {checking ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Check Status
                  </>
                )}
              </Button>
              <Button 
                variant="outline"
                onClick={handleSignOut}
                className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>

            {/* Help Text */}
            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500">
                Need help? Contact your administrator or{' '}
                <a href="mailto:support@husig.ai" className="text-husig-purple-400 hover:text-husig-purple-300">
                  support@husig.ai
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}