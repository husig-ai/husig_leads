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
    const { user_id } = await request.json()

    if (!user_id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Check if service role key is available
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('SUPABASE_SERVICE_ROLE_KEY not found in environment variables')
      return NextResponse.json({ 
        error: 'Server configuration error: Service role key not configured.' 
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

    // First check if the user exists and is not approved
    const { data: targetProfile } = await supabase
      .from('profiles')
      .select('id, email, is_approved, full_name')
      .eq('id', user_id)
      .single()

    if (!targetProfile) {
      return NextResponse.json({ 
        error: 'User not found' 
      }, { status: 404 })
    }

    if (targetProfile.is_approved) {
      return NextResponse.json({ 
        error: 'Cannot reject an already approved user' 
      }, { status: 400 })
    }

    // Prevent admin from rejecting themselves
    if (user_id === user.id) {
      return NextResponse.json({ 
        error: 'Cannot reject yourself' 
      }, { status: 400 })
    }

    console.log('Rejecting user:', targetProfile.email)

    // Delete the user from auth (this will cascade to profiles via foreign key)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user_id)

    if (deleteError) {
      console.error('Error deleting user:', deleteError)
      return NextResponse.json({ 
        error: `Failed to reject user: ${deleteError.message}` 
      }, { status: 500 })
    }

    console.log('User rejected successfully:', targetProfile.email)
    
    return NextResponse.json({ 
      success: true, 
      message: `User ${targetProfile.email} has been rejected and removed from the system`
    })

  } catch (error: any) {
    console.error('API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error.message || 'Unknown error')
    }, { status: 500 })
  }
}