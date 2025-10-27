'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/types/database'

export function TopBar() {
  const [profile, setProfile] = useState<Profile | null>(null)

  useEffect(() => {
    const loadProfile = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        
        if (data) setProfile(data)
      }
    }

    loadProfile()
  }, [])

  return (
    <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
          Lead Management
        </h2>
      </div>
      
      <div className="flex items-center space-x-4">
        <div className="text-right">
          <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
            {profile?.full_name || 'User'}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {profile?.email || ''}
          </p>
        </div>
        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-semibold">
          {profile?.full_name?.charAt(0).toUpperCase() || 'U'}
        </div>
      </div>
    </header>
  )
}