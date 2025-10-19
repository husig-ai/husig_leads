// Create: src/app/api/test-key/route.ts
// This is just for testing - DELETE after confirming key works

import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    console.log('=== TESTING SERVICE ROLE KEY ===')
    
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return NextResponse.json({ error: 'NEXT_PUBLIC_SUPABASE_URL not found' }, { status: 500 })
    }
    
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Service role key not found' }, { status: 500 })
    }

    console.log('Creating Supabase admin client...')
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    console.log('Testing query...')
    // Fixed query - just get a simple count
    const { count, error } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true })

    console.log('Query result:', { count, error })

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ 
        error: 'Service key test failed', 
        details: error.message,
        code: error.code 
      }, { status: 400 })
    }

    console.log('Success! Service role key is working!')
    return NextResponse.json({ 
      success: true, 
      message: 'Service role key is working!',
      profileCount: count
    })

  } catch (error: any) {
    console.error('Test error:', error)
    return NextResponse.json({ 
      error: 'Test failed', 
      details: error.message
    }, { status: 500 })
  }
}

// Test this by visiting: http://localhost:3000/api/test-key