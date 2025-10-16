'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { 
  LayoutDashboard, 
  Users, 
  TrendingUp, 
  User, 
  LogOut,
  Menu,
  X,
  Plus
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

interface UserProfile {
  id: string
  full_name?: string
  email: string
  role: string
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Leads', href: '/leads', icon: Users },
  { name: 'Analytics', href: '/analytics', icon: TrendingUp },
]

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

      // Try to get profile data
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single()

      setUser({
        id: authUser.id,
        email: authUser.email!,
        full_name: profile?.full_name || authUser.user_metadata?.full_name || '',
        role: profile?.role || 'intern'
      })
    } catch (error) {
      console.error('Error loading user:', error)
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

  return (
    <header className="bg-gray-900/50 backdrop-blur-sm border-b border-gray-800 sticky top-0 z-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/dashboard" className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-husig-gradient rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">H</span>
              </div>
              <div>
                <span className="text-xl font-bold text-white">HuSig</span>
                <span className="text-sm text-gray-400 ml-2">Leads</span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = isActivePath(item.href)
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-husig-purple-500/20 text-husig-purple-300 border border-husig-purple-500/30'
                      : 'text-gray-300 hover:text-white hover:bg-gray-800/50'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {item.name}
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
              <DropdownMenuContent className="w-64 bg-gray-800 border-gray-700" align="end">
                <div className="px-4 py-3">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-husig-gradient text-white font-medium">
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {user?.full_name || 'User'}
                      </p>
                      <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                      <p className={`text-xs ${getRoleBadgeColor(user?.role || '')} capitalize`}>
                        {user?.role}
                      </p>
                    </div>
                  </div>
                </div>
                <DropdownMenuSeparator className="bg-gray-700" />
                <Link href="/profile">
                  <DropdownMenuItem className="text-gray-300 hover:text-white hover:bg-gray-700 cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    Profile Settings
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuSeparator className="bg-gray-700" />
                <DropdownMenuItem 
                  onClick={handleSignOut}
                  className="text-red-400 hover:text-red-300 hover:bg-red-950/20 cursor-pointer"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
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