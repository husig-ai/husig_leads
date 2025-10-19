'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { HuSigLogo } from '@/components/brand/HuSigLogo'
import { 
  Eye, 
  EyeOff, 
  Loader2, 
  ArrowRight,
  AlertCircle
} from 'lucide-react'
import { toast } from '@/components/ui/use-toast'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  useEffect(() => {
    checkExistingAuth()
  }, [router])

  const checkExistingAuth = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // Check if user has approved profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_approved, role')
          .eq('id', user.id)
          .single()
        
        if (profile?.is_approved) {
          router.replace('/dashboard')
          return
        } else {
          router.replace('/pending-approval')
          return
        }
      }
      
      setCheckingAuth(false)
    } catch (error) {
      console.error('Auth check error:', error)
      setCheckingAuth(false)
    }
  }

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true)

    try {
      const supabase = createClient()
      
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (error) {
        toast({
          title: "Login Failed",
          description: error.message,
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      if (authData.user) {
        // Check user approval status
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('is_approved, role')
          .eq('id', authData.user.id)
          .single()

        if (profileError) {
          toast({
            title: "Error",
            description: "Failed to load user profile. Please try again.",
            variant: "destructive",
          })
          setLoading(false)
          return
        }

        // Redirect based on approval status
        if (!profile.is_approved) {
          router.replace('/pending-approval')
        } else {
          router.replace('/dashboard')
        }
      }
    } catch (error: any) {
      console.error('Login error:', error)
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
      setLoading(false)
    }
  }

  // Show loading screen while checking existing auth
  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-husig-dark flex items-center justify-center p-4">
        <Card className="w-full max-w-md card-husig-glass border-gray-700/50">
          <CardContent className="p-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-husig-purple-500 mx-auto mb-4" />
            <p className="text-gray-300">Checking authentication...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-husig-dark flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <HuSigLogo size="large" showText={true} />
          <h1 className="text-3xl font-bold text-white mt-6 mb-2">
            Welcome Back
          </h1>
          <p className="text-gray-400">
            Sign in to your HuSig Analytics account
          </p>
        </div>

        <Card className="card-husig-glass border-gray-700/50">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-white text-center">
              Sign In
            </CardTitle>
          </CardHeader>

          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
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
                  autoComplete="email"
                  disabled={loading}
                />
                {errors.email && (
                  <p className="text-sm text-red-400">{errors.email.message}</p>
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
                    placeholder="Enter your password"
                    autoComplete="current-password"
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
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
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
                    <span className="bg-gray-800 px-2 text-gray-500">Account Access</span>
                  </div>
                </div>
              </div>
              
              {/* Access Information */}
              <div className="w-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="text-blue-200 font-medium mb-1">Invitation Only Platform</p>
                    <p className="text-blue-100 text-xs mb-2">
                      New accounts require an invitation from an administrator.
                    </p>
                    <div className="space-y-1">
                      <Link 
                        href="/invitation" 
                        className="text-husig-purple-400 hover:text-husig-purple-300 font-medium text-xs block"
                      >
                        Have an invitation? Complete signup →
                      </Link>
                      <a 
                        href="mailto:support@husig.ai" 
                        className="text-husig-purple-400 hover:text-husig-purple-300 font-medium text-xs block"
                      >
                        Need access? Contact support →
                      </a>
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