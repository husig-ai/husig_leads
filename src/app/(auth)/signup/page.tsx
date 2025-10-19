'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Loader2, Eye, EyeOff, AlertCircle, ArrowRight } from 'lucide-react'
import Link from 'next/link'

const signupSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Password must be at least 6 characters'),
  full_name: z.string().min(2, 'Full name is required'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type SignupForm = z.infer<typeof signupSchema>

export default function SignupPage() {
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteToken, setInviteToken] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
  })

  useEffect(() => {
    // Get token from URL params
    const token = searchParams.get('token')
    if (token) {
      setInviteToken(token)
      // If there's an email in the URL, prefill it
      const email = searchParams.get('email')
      if (email) {
        setInviteEmail(email)
        setValue('email', email)
      }
    } else {
      // No token, redirect to login with error
      setError('Invalid invitation link. Please use a valid invitation link.')
      setTimeout(() => {
        router.replace('/login')
      }, 3000)
    }
  }, [searchParams, setValue, router])

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
        throw signupError
      }

      if (authData.user) {
        // Redirect to pending approval or login
        router.replace('/pending-approval')
      }
    } catch (error: any) {
      console.error('Signup error:', error)
      setError(error.message || 'Failed to create account. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-husig-dark flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-husig-blue-500 to-husig-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">H</span>
            </div>
            <span className="ml-3 text-2xl font-bold text-white">HuSig</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Complete Your Signup
          </h1>
          <p className="text-gray-400">
            Create your account to access HuSig Analytics
          </p>
        </div>

        <Card className="card-husig-glass border-gray-700/50">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-white text-center">
              Create Account
            </CardTitle>
          </CardHeader>

          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              {/* Error Display */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="full_name" className="text-sm font-medium text-gray-300">
                  Full Name
                </Label>
                <Input
                  id="full_name"
                  type="text"
                  {...register('full_name')}
                  className="husig-input"
                  placeholder="Enter your full name"
                  disabled={loading}
                />
                {errors.full_name && (
                  <p className="text-sm text-red-400">{errors.full_name.message}</p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-300">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  {...register('email')}
                  className="husig-input"
                  placeholder="Enter your email"
                  disabled={loading || !!inviteEmail}
                />
                {errors.email && (
                  <p className="text-sm text-red-400">{errors.email.message}</p>
                )}
                {inviteEmail && (
                  <p className="text-xs text-blue-400">This email was pre-filled from your invitation</p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-300">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    {...register('password')}
                    className="husig-input pr-12"
                    placeholder="Create a password"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                    disabled={loading}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-400">{errors.password.message}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-300">
                  Confirm Password
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    {...register('confirmPassword')}
                    className="husig-input pr-12"
                    placeholder="Confirm your password"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                    disabled={loading}
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-red-400">{errors.confirmPassword.message}</p>
                )}
              </div>
            </CardContent>
            
            <CardFooter className="flex flex-col space-y-4 pt-6">
              <Button 
                type="submit" 
                className="w-full btn-husig-primary h-12 text-base font-semibold"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    Create Account
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>
              
              {/* Information about account access */}
              <div className="w-full">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-700" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-gray-800 px-2 text-gray-500">Account Status</span>
                  </div>
                </div>
              </div>
              
              {/* Account Information */}
              <div className="w-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="text-blue-200 font-medium mb-1">Account Approval Required</p>
                    <p className="text-blue-100 text-xs mb-2">
                      After creating your account, an administrator will review and approve your access.
                    </p>
                    <div className="space-y-1">
                      <Link 
                        href="/login" 
                        className="text-husig-purple-400 hover:text-husig-purple-300 font-medium text-xs block"
                      >
                        Already have an account? Sign in →
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </CardFooter>
          </form>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>&copy; 2024 HuSig.ai. All rights reserved.</p>
          <p className="mt-1 text-husig-blue-400">Data, LLM & AI Solutions at Scale</p>
        </div>
      </div>
    </div>
  )
}