import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function POST(request: NextRequest) {
  try {
    // Get the current user from the request
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
        },
      }
    )

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, is_approved')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin' || !profile.is_approved) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Get request body
    const { email, full_name, role } = await request.json()

    if (!email || !full_name || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Validate role
    if (!['admin', 'manager', 'intern'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role specified' }, { status: 400 })
    }

    // Check if service role key is available
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('SUPABASE_SERVICE_ROLE_KEY not found in environment variables')
      return NextResponse.json({ 
        error: 'Server configuration error: Service role key not configured. Please contact your administrator.' 
      }, { status: 500 })
    }

    // Validate environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      console.error('NEXT_PUBLIC_SUPABASE_URL not found in environment variables')
      return NextResponse.json({ 
        error: 'Server configuration error: Supabase URL not configured.' 
      }, { status: 500 })
    }

    // Create Supabase admin client
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Check if user with this email already exists
    const { data: existingUser, error: checkError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (checkError) {
      console.error('Error checking existing users:', checkError)
      return NextResponse.json({ 
        error: 'Failed to check existing users' 
      }, { status: 500 })
    }

    const userExists = existingUser.users.some(u => u.email === email)
    if (userExists) {
      return NextResponse.json({ 
        error: 'A user with this email already exists' 
      }, { status: 400 })
    }

    // Generate invitation token
    const invitationToken = crypto.randomUUID()

    // Determine redirect URL
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const redirectTo = `${baseUrl}/signup?token=${invitationToken}`

    console.log('Sending invitation to:', email)
    console.log('Redirect URL:', redirectTo)
    
    // Send invitation email through Supabase Auth Admin
    const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: {
        full_name,
        role,
        invitation_token: invitationToken,
        invited_by: user.id
      },
      redirectTo
    })

    if (error) {
      console.error('Invitation error:', error)
      
      // Provide more specific error messages based on the error
      if (error.message.includes('rate limit')) {
        return NextResponse.json({ 
          error: 'Rate limit exceeded. Please wait before sending another invitation.' 
        }, { status: 429 })
      }
      
      if (error.message.includes('email')) {
        return NextResponse.json({ 
          error: 'Invalid email address or email service unavailable.' 
        }, { status: 400 })
      }
      
      return NextResponse.json({ 
        error: `Failed to send invitation: ${error.message}` 
      }, { status: 400 })
    }

    console.log('Invitation sent successfully to:', email)
    return NextResponse.json({ 
      success: true, 
      message: `Invitation sent to ${email}`,
      data: {
        user_id: data.user?.id,
        email: data.user?.email,
        invited_at: data.user?.invited_at
      }
    })

  } catch (error: any) {
    console.error('API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error.message || 'Unknown error')
    }, { status: 500 })
  }
}

// Health check endpoint
export async function GET() {
  try {
    const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY
    const hasSupabaseUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL
    
    return NextResponse.json({
      status: 'healthy',
      config: {
        service_key_configured: hasServiceKey,
        supabase_url_configured: hasSupabaseUrl,
        site_url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
      }
    })
  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      error: error.message
    }, { status: 500 })
  }
}