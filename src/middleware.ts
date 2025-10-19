import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/signup', '/pending-approval', '/invitation']
  const isPublicRoute = publicRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  )

  // Static files and API routes
  const isStaticFile = request.nextUrl.pathname.match(/\.(css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/)
  const isApiRoute = request.nextUrl.pathname.startsWith('/api')
  
  if (isStaticFile || isApiRoute) {
    return response
  }

  // If no user and trying to access protected route, redirect to login
  if (!user && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // If user exists, check their approval status
  if (user) {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('is_approved, role')
        .eq('id', user.id)
        .single()

      // If there's an error getting profile or no profile exists
      if (error || !profile) {
        // If trying to access auth pages, allow it
        if (isPublicRoute) {
          return response
        }
        // Otherwise redirect to login
        return NextResponse.redirect(new URL('/login', request.url))
      }

      // User is not approved
      if (!profile.is_approved) {
        // Allow access to pending approval page
        if (request.nextUrl.pathname === '/pending-approval') {
          return response
        }
        // Allow access to logout/auth pages
        if (isPublicRoute) {
          return response
        }
        // Redirect to pending approval page
        return NextResponse.redirect(new URL('/pending-approval', request.url))
      }

      // User is approved - handle normal routing
      
      // Redirect to dashboard if already logged in and trying to access auth pages
      if (isPublicRoute && request.nextUrl.pathname !== '/pending-approval') {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }

      // Admin-only routes
      const adminOnlyRoutes = ['/admin']
      const isAdminRoute = adminOnlyRoutes.some(route => 
        request.nextUrl.pathname.startsWith(route)
      )

      if (isAdminRoute && profile.role !== 'admin') {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }

      // Redirect root to dashboard for approved users
      if (request.nextUrl.pathname === '/') {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }

    } catch (error) {
      console.error('Middleware error:', error)
      // On error, redirect to login to be safe
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}