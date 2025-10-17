'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { HuSigLogo } from '@/components/brand/HuSigLogo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Mail, Lock, User, ArrowRight, Loader2, Eye, EyeOff, CheckCircle2 } from 'lucide-react'

export default function SignupPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setLoading(true)
    const supabase = createClient()
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  const getPasswordStrength = (password: string) => {
    let strength = 0
    if (password.length >= 8) strength++
    if (/[A-Z]/.test(password)) strength++
    if (/[a-z]/.test(password)) strength++
    if (/\d/.test(password)) strength++
    if (/[^A-Za-z0-9]/.test(password)) strength++
    return strength
  }

  const passwordStrength = getPasswordStrength(password)

  const getStrengthColor = (strength: number) => {
    if (strength < 2) return 'bg-red-500'
    if (strength < 3) return 'bg-yellow-500'
    if (strength < 4) return 'bg-orange-500'
    return 'bg-green-500'
  }

  const getStrengthText = (strength: number) => {
    if (strength < 2) return 'Weak'
    if (strength < 3) return 'Fair'
    if (strength < 4) return 'Good'
    return 'Strong'
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-husig-dark p-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-husig-purple-900/20 via-transparent to-husig-blue-900/20"></div>
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-husig-purple-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-husig-blue-500/10 rounded-full blur-3xl"></div>
      
      <div className="w-full max-w-md relative z-10">
        {/* Logo Header */}
        <div className="text-center mb-8">
          <HuSigLogo className="mx-auto mb-6" />
        </div>

        <Card className="card-husig-glass border-gray-700/50 shadow-husig-lg">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl font-bold text-center text-white">
              Create Account
            </CardTitle>
            <CardDescription className="text-center text-gray-400">
              Set up your HuSig account in just a few steps
            </CardDescription>
          </CardHeader>
          
          <form onSubmit={handleSignup}>
            <CardContent className="space-y-6">
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-4 rounded-lg backdrop-blur-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                    <span>{error}</span>
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-gray-300 font-medium">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="John Smith"
                    className="husig-input pl-11 h-12 text-white placeholder-gray-500"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-300 font-medium">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@company.com"
                    className="husig-input pl-11 h-12 text-white placeholder-gray-500"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-300 font-medium">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a strong password"
                    className="husig-input pl-11 pr-11 h-12 text-white placeholder-gray-500"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-400 transition-colors"
                    disabled={loading}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                
                {/* Password Strength Indicator */}
                {password && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">Password strength:</span>
                      <span className={`font-medium ${
                        passwordStrength < 2 ? 'text-red-400' :
                        passwordStrength < 3 ? 'text-yellow-400' :
                        passwordStrength < 4 ? 'text-orange-400' : 'text-green-400'
                      }`}>
                        {getStrengthText(passwordStrength)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-1.5">
                      <div 
                        className={`h-1.5 rounded-full transition-all duration-300 ${getStrengthColor(passwordStrength)}`}
                        style={{ width: `${(passwordStrength / 5) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-gray-300 font-medium">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    className="husig-input pl-11 pr-11 h-12 text-white placeholder-gray-500"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-400 transition-colors"
                    disabled={loading}
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-red-400 text-xs">Passwords do not match</p>
                )}
                {confirmPassword && password === confirmPassword && (
                  <div className="flex items-center text-green-400 text-xs">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Passwords match
                  </div>
                )}
              </div>
            </CardContent>
            
            <CardFooter className="flex flex-col space-y-4 pt-6">
              <Button 
                type="submit" 
                className="w-full btn-husig-primary h-12 text-base font-semibold"
                disabled={loading || password !== confirmPassword || passwordStrength < 2}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  <>
                    Create Account
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>
              
              <div className="relative w-full">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-700" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-gray-800 px-2 text-gray-500">Already have an account?</span>
                </div>
              </div>
              
              <p className="text-center">
                <Link 
                  href="/login" 
                  className="text-husig-purple-400 hover:text-husig-purple-300 font-medium text-base transition-colors"
                >
                  Sign in instead
                </Link>
              </p>
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