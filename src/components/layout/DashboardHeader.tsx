'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { HuSigLogo } from '@/components/brand/HuSigLogo'
import { Button } from '@/components/ui/button'
import { 
  LayoutDashboard, 
  Users, 
  TrendingUp, 
  User, 
  LogOut,
  Menu,
  X,
  Plus,
  Shield,
  Settings
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'

interface UserProfile {
  id: string
  full_name?: string
  email: string
  role: string
  is_approved: boolean
}

export function DashboardHeader() {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    loadUser()
  }, [])

  const loadUser = async () => {
    const supabase = createClient()
    
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      
      if (!authUser) {
        router.push('/login')
        return
      }

      // Get profile data including approval status
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (!profile) {
        router.push('/login')
        return
      }

      setUser({
        id: authUser.id,
        email: authUser.email!,
        full_name: profile.full_name || authUser.user_metadata?.full_name || '',
        role: profile.role || 'intern',
        is_approved: profile.is_approved || false
      })
    } catch (error) {
      console.error('Error loading user:', error)
      router.push('/login')
    }
  }

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const isActivePath = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard'
    }
    return pathname.startsWith(href)
  }

  const getUserInitials = () => {
    if (user?.full_name) {
      return user.full_name.split(' ').map(n => n[0]).join('').toUpperCase()
    }
    return user?.email?.[0]?.toUpperCase() || 'U'
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'text-red-400'
      case 'manager': return 'text-blue-400'
      case 'intern': return 'text-green-400'
      default: return 'text-gray-400'
    }
  }

  // Base navigation items
  const baseNavigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Leads', href: '/leads', icon: Users },
    { name: 'Analytics', href: '/analytics', icon: TrendingUp },
  ]

  // Admin-only navigation items
  const adminNavigation = [
    { name: 'User Management', href: '/admin/users', icon: Shield },
  ]

  // Combine navigation based on user role
  const navigation = user?.role === 'admin' 
    ? [...baseNavigation, ...adminNavigation]
    : baseNavigation

  // Don't render header if user isn't loaded or approved
  if (!user || !user.is_approved) {
    return (
      <header className="bg-gray-900/50 backdrop-blur-sm border-b border-gray-800 sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <Link href="/dashboard" className="flex items-center space-x-3">
                <HuSigLogo size="small" showText={false} />
              </Link>
            </div>
            {user && !user.is_approved && (
              <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 border">
                Pending Approval
              </Badge>
            )}
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-husig-gradient text-white font-medium">
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-gray-800 border-gray-700" align="end" forceMount>
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-red-400 hover:bg-gray-700">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </header>
    )
  }

  return (
    <header className="bg-gray-900/50 backdrop-blur-sm border-b border-gray-800 sticky top-0 z-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/dashboard" className="flex items-center space-x-3">
              <HuSigLogo size="small" showText={false} />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = isActivePath(item.href)
              const isAdminRoute = adminNavigation.some(admin => admin.href === item.href)
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-husig-purple-500/20 text-husig-purple-300 border border-husig-purple-500/30'
                      : 'text-gray-300 hover:text-white hover:bg-gray-800/50'
                  } ${isAdminRoute ? 'relative' : ''}`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {item.name}
                  {isAdminRoute && (
                    <Badge className="ml-2 bg-red-500/20 text-red-400 border-red-500/30 border text-xs">
                      Admin
                    </Badge>
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {/* Add Lead Button */}
            <Link href="/leads/new" className="hidden sm:block">
              <Button className="btn-husig-primary">
                <Plus className="w-4 h-4 mr-2" />
                Add Lead
              </Button>
            </Link>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-husig-gradient text-white font-medium">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-gray-800 border-gray-700" align="end" forceMount>
                <div className="flex flex-col space-y-1 p-2">
                  <p className="text-sm font-medium leading-none text-white">
                    {user?.full_name || 'User'}
                  </p>
                  <p className="text-xs leading-none text-gray-400">
                    {user?.email}
                  </p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`text-xs font-medium ${getRoleBadgeColor(user?.role || 'intern')}`}>
                      {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1) || 'Intern'}
                    </span>
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30 border text-xs">
                      Approved
                    </Badge>
                  </div>
                </div>
                <DropdownMenuSeparator className="bg-gray-700" />
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="cursor-pointer hover:bg-gray-700 text-gray-300">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                {user?.role === 'admin' && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href="/admin/users" className="cursor-pointer hover:bg-gray-700 text-gray-300">
                        <Shield className="mr-2 h-4 w-4" />
                        <span>User Management</span>
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator className="bg-gray-700" />
                <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-red-400 hover:bg-gray-700">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6 text-gray-300" />
              ) : (
                <Menu className="h-6 w-6 text-gray-300" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-800">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon
                const isActive = isActivePath(item.href)
                const isAdminRoute = adminNavigation.some(admin => admin.href === item.href)
                
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-husig-purple-500/20 text-husig-purple-300 border border-husig-purple-500/30'
                        : 'text-gray-300 hover:text-white hover:bg-gray-800/50'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Icon className="w-4 h-4 mr-3" />
                    {item.name}
                    {isAdminRoute && (
                      <Badge className="ml-2 bg-red-500/20 text-red-400 border-red-500/30 border text-xs">
                        Admin
                      </Badge>
                    )}
                  </Link>
                )
              })}
              
              {/* Mobile Add Lead Button */}
              <Link
                href="/leads/new"
                className="flex items-center px-3 py-2 rounded-lg text-sm font-medium bg-husig-purple-500/20 text-husig-purple-300 border border-husig-purple-500/30 mt-4"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Plus className="w-4 h-4 mr-3" />
                Add Lead
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}