'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, AlertCircle, CheckCircle, Mail } from 'lucide-react'
import Link from 'next/link'

const signupSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type SignupForm = z.infer<typeof signupSchema>

export default function SignupPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [inviteToken, setInviteToken] = useState<string | null>(null)
  const [tokenValid, setTokenValid] = useState<boolean | null>(null)
  const [checkingToken, setCheckingToken] = useState(true)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
  })

  useEffect(() => {
    const token = searchParams.get('token')
    
    if (!token) {
      setError('Invalid invitation link. Please use a valid invitation link.')
      setTokenValid(false)
      setCheckingToken(false)
      setTimeout(() => {
        router.replace('/login')
      }, 3000)
      return
    }

    setInviteToken(token)
    
    // Validate the invitation token
    validateInvitationToken(token)
  }, [searchParams, router])

  const validateInvitationToken = async (token: string) => {
    try {
      setCheckingToken(true)
      const supabase = createClient()
      
      // Check if the token exists in any profile
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('invitation_token, email, full_name, role, is_approved')
        .eq('invitation_token', token)
        .single()

      if (error || !profile) {
        setError('Invalid or expired invitation link. Please contact your administrator for a new invitation.')
        setTokenValid(false)
        return
      }

      if (profile.is_approved) {
        setError('This invitation has already been used. Please try logging in instead.')
        setTokenValid(false)
        setTimeout(() => {
          router.replace('/login')
        }, 3000)
        return
      }

      // Pre-fill the email if available
      if (profile.email) {
        setValue('email', profile.email)
      }
      if (profile.full_name) {
        setValue('full_name', profile.full_name)
      }

      setTokenValid(true)
    } catch (err: any) {
      console.error('Error validating invitation token:', err)
      setError('Unable to validate invitation. Please try again later.')
      setTokenValid(false)
    } finally {
      setCheckingToken(false)
    }
  }

  const onSubmit = async (data: SignupForm) => {
    if (!inviteToken) {
      setError('Invalid invitation link. Please use a valid invitation link.')
      return
    }

    setLoading(true)
    setError('')
    
    try {
      const supabase = createClient()
      
      // Sign up the user with metadata including the invitation token
      const { data: authData, error: signupError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.full_name,
            invitation_token: inviteToken,
          }
        }
      })

      if (signupError) {
        // Handle specific error cases
        if (signupError.message.includes('User already registered')) {
          setError('An account with this email already exists. Please try logging in instead.')
          return
        }
        
        if (signupError.message.includes('Unauthorized signup')) {
          setError('Invalid invitation. Please contact your administrator for a new invitation.')
          return
        }
        
        throw signupError
      }

      if (authData.user) {
        setSuccess(true)
        // Don't redirect immediately, show success message first
        setTimeout(() => {
          router.replace('/pending-approval')
        }, 2000)
      }
    } catch (error: any) {
      console.error('Signup error:', error)
      setError(error.message || 'Failed to create account. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (checkingToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin mb-4" />
            <p className="text-muted-foreground text-center">
              Validating your invitation...
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (tokenValid === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <AlertCircle className="h-6 w-6 text-red-500" />
              Invalid Invitation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="border-red-500">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error}
              </AlertDescription>
            </Alert>
            <div className="text-center">
              <Link href="/login">
                <Button variant="outline" className="w-full">
                  Go to Login
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <CheckCircle className="h-6 w-6 text-green-500" />
              Account Created Successfully
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="border-green-500">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Your account has been created successfully! Please wait for an administrator to approve your access.
              </AlertDescription>
            </Alert>
            <div className="text-center text-sm text-muted-foreground">
              Redirecting to approval status page...
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Create Your Account</CardTitle>
          <CardDescription>
            Complete your registration to join the team
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <Alert className="border-red-500">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                {...register('full_name')}
                placeholder="Enter your full name"
                disabled={loading}
              />
              {errors.full_name && (
                <p className="text-sm text-red-500">{errors.full_name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                placeholder="Enter your email address"
                disabled={loading}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                {...register('password')}
                placeholder="Create a secure password"
                disabled={loading}
              />
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                {...register('confirmPassword')}
                placeholder="Confirm your password"
                disabled={loading}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link href="/login" className="text-primary hover:underline">
                Sign in here
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}