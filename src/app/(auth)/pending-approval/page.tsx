'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Clock, CheckCircle, User, Mail, Shield, Loader2, LogOut, RefreshCw } from 'lucide-react'

interface UserProfile {
  id: string
  email: string
  full_name: string
  role: string
  is_approved: boolean
  created_at: string
  invited_by?: string
  inviter_name?: string
}

export default function PendingApprovalPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [checkingStatus, setCheckingStatus] = useState(false)

  useEffect(() => {
    checkUserStatus()
    
    // Set up polling to check for approval status every 30 seconds
    const interval = setInterval(checkUserStatus, 30000)
    
    return () => clearInterval(interval)
  }, [])

  const checkUserStatus = async () => {
    try {
      setCheckingStatus(true)
      const supabase = createClient()
      const { data: { user }, error: userError } = await supabase.auth.getUser()

      if (userError || !user) {
        router.push('/login')
        return
      }

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select(`
          *,
          inviter:invited_by(full_name)
        `)
        .eq('id', user.id)
        .single()

      if (profileError) {
        console.error('Error fetching profile:', profileError)
        return
      }

      const profileWithInviter = {
        ...profileData,
        inviter_name: profileData.inviter?.full_name
      }

      setProfile(profileWithInviter)

      // If user is approved, redirect to dashboard
      if (profileData.is_approved) {
        router.push('/dashboard')
      }
    } catch (error) {
      console.error('Error checking user status:', error)
    } finally {
      setLoading(false)
      setCheckingStatus(false)
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

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'destructive'
      case 'manager': return 'default'
      case 'intern': return 'secondary'
      default: return 'secondary'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin mb-4" />
            <p className="text-muted-foreground text-center">
              Checking your account status...
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Account Not Found</CardTitle>
            <CardDescription>
              Unable to find your account information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription>
                There was an issue retrieving your account information. Please try signing in again.
              </AlertDescription>
            </Alert>
            <Button onClick={handleSignOut} className="w-full">
              Return to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="relative">
              <Clock className="h-12 w-12 text-yellow-500" />
              <div className="absolute -top-1 -right-1 h-4 w-4 bg-yellow-500 rounded-full animate-pulse"></div>
            </div>
          </div>
          <CardTitle className="text-xl">Account Pending Approval</CardTitle>
          <CardDescription>
            Your account has been created and is awaiting admin approval
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Account Information */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <h3 className="font-medium flex items-center gap-2">
              <User className="h-4 w-4" />
              Account Information
            </h3>
            
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Name:</span>
                <span className="font-medium">{profile.full_name}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Email:</span>
                <span className="font-medium">{profile.email}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Role:</span>
                <Badge variant={getRoleColor(profile.role)}>
                  {profile.role}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Status:</span>
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Pending Approval
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Registered:</span>
                <span className="font-medium text-xs">
                  {formatDate(profile.created_at)}
                </span>
              </div>
              
              {profile.inviter_name && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Invited by:</span>
                  <span className="font-medium">{profile.inviter_name}</span>
                </div>
              )}
            </div>
          </div>

          {/* Status Alert */}
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium">What happens next?</p>
                <ul className="text-sm space-y-1 list-disc list-inside">
                  <li>An administrator will review your account</li>
                  <li>You'll receive an email when approved</li>
                  <li>Once approved, you can access the dashboard</li>
                </ul>
              </div>
            </AlertDescription>
          </Alert>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button 
              onClick={checkUserStatus} 
              disabled={checkingStatus}
              className="w-full"
              variant="outline"
            >
              {checkingStatus ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Checking Status...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Check Approval Status
                </>
              )}
            </Button>
            
            <Button 
              onClick={handleSignOut} 
              variant="outline"
              className="w-full"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>

          {/* Help Information */}
          <div className="text-center text-xs text-muted-foreground space-y-1">
            <p>Need help? Contact your administrator or the person who invited you.</p>
            {profile.inviter_name && (
              <p>Invited by: {profile.inviter_name}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}