import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { HuSigLogo } from '@/components/brand/HuSigLogo'
import { Loader2, Mail, AlertCircle, ArrowRight } from 'lucide-react'
import Link from 'next/link'

const invitationSchema = z.object({
  inviteLink: z.string().url('Please enter a valid invitation link'),
})

type InvitationForm = z.infer<typeof invitationSchema>

export default function InvitationPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<InvitationForm>({
    resolver: zodResolver(invitationSchema),
  })

  const onSubmit = async (data: InvitationForm) => {
    setLoading(true)
    setError('')
    
    try {
      // Extract token from the invitation link
      const url = new URL(data.inviteLink)
      const token = url.searchParams.get('token')
      
      if (!token) {
        throw new Error('Invalid invitation link - missing token')
      }

      // Redirect to signup with the token
      router.push(`/signup?token=${token}`)
    } catch (error: any) {
      console.error('Invitation error:', error)
      setError(error.message || 'Please check the invitation link and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-husig-dark flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <HuSigLogo size="large" showText={true} />
          <h1 className="text-3xl font-bold text-white mt-6 mb-2">
            Complete Your Invitation
          </h1>
          <p className="text-gray-400">
            Enter your invitation link to create your account
          </p>
        </div>

        <Card className="card-husig-glass border-gray-700/50">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-white text-center">
              Invitation Link
            </CardTitle>
          </CardHeader>

          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              {/* Invitation Link */}
              <div className="space-y-2">
                <Label htmlFor="inviteLink" className="text-sm font-medium text-gray-300">
                  Paste Your Invitation Link
                </Label>
                <div className="relative">
                  <Input
                    id="inviteLink"
                    type="url"
                    {...register('inviteLink')}
                    className="husig-input pl-10"
                    placeholder="https://..."
                    disabled={loading}
                  />
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                </div>
                {errors.inviteLink && (
                  <p className="text-sm text-red-400">{errors.inviteLink.message}</p>
                )}
              </div>

              {/* Information */}
              <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="text-blue-200 font-medium mb-2">How to find your invitation link:</p>
                    <ul className="text-blue-100 text-xs space-y-1">
                      <li>• Check your email for an invitation from HuSig</li>
                      <li>• Copy the entire signup link from the email</li>
                      <li>• Paste it in the field above</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
            
            <CardContent className="pt-0">
              <Button 
                type="submit" 
                className="w-full btn-husig-primary h-12 text-base font-semibold"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Continue to Signup'
                )}
              </Button>
              
              <div className="text-center mt-4 space-y-2">
                <Link 
                  href="/login" 
                  className="text-husig-purple-400 hover:text-husig-purple-300 font-medium text-sm block"
                >
                  ← Back to Sign In
                </Link>
                <a 
                  href="mailto:support@husig.ai" 
                  className="text-gray-400 hover:text-gray-300 text-xs block"
                >
                  Need help? Contact support
                </a>
              </div>
            </CardContent>
          </form>
        </Card>
      </div>
    </div>
  )
}