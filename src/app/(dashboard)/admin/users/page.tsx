'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { DashboardHeader } from '@/components/layout/DashboardHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Users, 
  UserPlus, 
  UserCheck, 
  UserX, 
  Mail, 
  Calendar,
  Shield,
  Clock,
  Send,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react'
import { toast } from '@/components/ui/use-toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface UserProfile {
  id: string
  email: string
  full_name?: string
  role: 'admin' | 'manager' | 'intern'
  is_approved: boolean
  approved_by?: string
  approved_at?: string
  invited_by?: string
  invited_at?: string
  created_at: string
  approver_name?: string
  inviter_name?: string
}

interface InviteForm {
  email: string
  full_name: string
  role: 'admin' | 'manager' | 'intern'
}

export default function AdminUsersPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<UserProfile[]>([])
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null)
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [inviteForm, setInviteForm] = useState<InviteForm>({
    email: '',
    full_name: '',
    role: 'intern'
  })
  const [inviting, setInviting] = useState(false)
  const [processingUsers, setProcessingUsers] = useState<Set<string>>(new Set())

  useEffect(() => {
    checkAdminAccess()
    loadUsers()
  }, [])

  const checkAdminAccess = async () => {
    const supabase = createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      router.push('/login')
      return
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || profile.role !== 'admin' || !profile.is_approved) {
      router.push('/dashboard')
      toast({
        title: "Access Denied",
        description: "You don't have permission to access this page",
        variant: "destructive",
      })
      return
    }

    setCurrentUser(profile)
  }

  const loadUsers = async () => {
    try {
      const supabase = createClient()
      
      // Get all users with their approver and inviter names
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          approver:approved_by(full_name),
          inviter:invited_by(full_name)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      const usersWithNames = data.map(user => ({
        ...user,
        approver_name: user.approver?.full_name,
        inviter_name: user.inviter?.full_name
      }))

      setUsers(usersWithNames)
    } catch (error) {
      console.error('Error loading users:', error)
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const sendInvitation = async () => {
    if (!inviteForm.email || !inviteForm.full_name) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    setInviting(true)
    try {
      const supabase = createClient()
      
      // Generate invitation token
      const invitationToken = crypto.randomUUID()
      
      // Create invitation record (this would typically be a separate invitations table)
      // For now, we'll use the auth.users metadata approach
      
      // Send invitation email through Supabase Auth
      const { error } = await supabase.auth.admin.inviteUserByEmail(inviteForm.email, {
        data: {
          full_name: inviteForm.full_name,
          role: inviteForm.role,
          invitation_token: invitationToken,
          invited_by: currentUser?.id
        },
        redirectTo: `${window.location.origin}/signup?token=${invitationToken}`
      })

      if (error) throw error

      toast({
        title: "Invitation Sent",
        description: `Invitation email sent to ${inviteForm.email}`,
      })

      setInviteForm({ email: '', full_name: '', role: 'intern' })
      setInviteDialogOpen(false)
      
      // Refresh users list
      setTimeout(loadUsers, 1000)
      
    } catch (error: any) {
      console.error('Error sending invitation:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to send invitation",
        variant: "destructive",
      })
    } finally {
      setInviting(false)
    }
  }

  const approveUser = async (userId: string) => {
    setProcessingUsers(prev => new Set(prev).add(userId))
    try {
      const supabase = createClient()
      
      const { error } = await supabase.rpc('approve_user', {
        user_id: userId
      })

      if (error) throw error

      toast({
        title: "User Approved",
        description: "User has been approved and can now access the system",
      })

      loadUsers()
    } catch (error: any) {
      console.error('Error approving user:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to approve user",
        variant: "destructive",
      })
    } finally {
      setProcessingUsers(prev => {
        const newSet = new Set(prev)
        newSet.delete(userId)
        return newSet
      })
    }
  }

  const rejectUser = async (userId: string) => {
    if (!confirm('Are you sure you want to reject this user? This will delete their account.')) {
      return
    }

    setProcessingUsers(prev => new Set(prev).add(userId))
    try {
      const supabase = createClient()
      
      // Delete the user (this will cascade to profile via foreign key)
      const { error } = await supabase.auth.admin.deleteUser(userId)

      if (error) throw error

      toast({
        title: "User Rejected",
        description: "User has been rejected and their account deleted",
      })

      loadUsers()
    } catch (error: any) {
      console.error('Error rejecting user:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to reject user",
        variant: "destructive",
      })
    } finally {
      setProcessingUsers(prev => {
        const newSet = new Set(prev)
        newSet.delete(userId)
        return newSet
      })
    }
  }

  const updateUserRole = async (userId: string, newRole: 'admin' | 'manager' | 'intern') => {
    setProcessingUsers(prev => new Set(prev).add(userId))
    try {
      const supabase = createClient()
      
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId)

      if (error) throw error

      toast({
        title: "Role Updated",
        description: "User role has been updated successfully",
      })

      loadUsers()
    } catch (error: any) {
      console.error('Error updating role:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to update user role",
        variant: "destructive",
      })
    } finally {
      setProcessingUsers(prev => {
        const newSet = new Set(prev)
        newSet.delete(userId)
        return newSet
      })
    }
  }

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'manager': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'intern': return 'bg-green-500/20 text-green-400 border-green-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const getStatusBadge = (user: UserProfile) => {
    if (user.is_approved) {
      return (
        <Badge className="bg-green-500/20 text-green-400 border-green-500/30 border">
          <CheckCircle className="w-3 h-3 mr-1" />
          Approved
        </Badge>
      )
    }
    return (
      <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 border">
        <Clock className="w-3 h-3 mr-1" />
        Pending
      </Badge>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const pendingUsers = users.filter(user => !user.is_approved)
  const approvedUsers = users.filter(user => user.is_approved)

  if (loading) {
    return (
      <div className="min-h-screen bg-husig-dark">
        <DashboardHeader />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-husig-purple-500 mx-auto mb-4" />
            <div className="text-lg text-gray-300">Loading users...</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-husig-dark">
      <DashboardHeader />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              <span className="text-husig-gradient">User Management</span>
            </h1>
            <p className="text-gray-400 text-lg">Manage user access and permissions</p>
          </div>

          <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
            <DialogTrigger asChild>
              <Button className="btn-husig-primary">
                <UserPlus className="w-5 h-5 mr-2" />
                Invite User
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-800 border-gray-700 text-white">
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold text-white">
                  Invite New User
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
                    className="husig-input"
                    placeholder="user@example.com"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    value={inviteForm.full_name}
                    onChange={(e) => setInviteForm(prev => ({ ...prev, full_name: e.target.value }))}
                    className="husig-input"
                    placeholder="John Doe"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select
                    value={inviteForm.role}
                    onValueChange={(value: 'admin' | 'manager' | 'intern') => 
                      setInviteForm(prev => ({ ...prev, role: value }))
                    }
                  >
                    <SelectTrigger className="husig-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-600">
                      <SelectItem value="intern">Intern</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setInviteDialogOpen(false)}
                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={sendInvitation}
                    disabled={inviting}
                    className="btn-husig-primary"
                  >
                    {inviting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Send Invitation
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="card-husig-glass border-gray-700/50">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Users className="w-8 h-8 text-blue-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-400">Total Users</p>
                  <p className="text-2xl font-bold text-white">{users.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-husig-glass border-gray-700/50">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-500/20 rounded-lg">
                  <Clock className="w-8 h-8 text-yellow-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-400">Pending Approval</p>
                  <p className="text-2xl font-bold text-white">{pendingUsers.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-husig-glass border-gray-700/50">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <UserCheck className="w-8 h-8 text-green-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-400">Approved Users</p>
                  <p className="text-2xl font-bold text-white">{approvedUsers.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Users */}
        {pendingUsers.length > 0 && (
          <Card className="card-husig-glass border-gray-700/50 mb-8">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-white flex items-center">
                <AlertCircle className="w-5 h-5 mr-2 text-yellow-400" />
                Pending Approval ({pendingUsers.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingUsers.map((user) => (
                  <div
                    key={user.id}
                    className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-lg p-4 border border-yellow-500/20"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-husig-gradient rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold">
                            {user.full_name ? user.full_name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-white">
                            {user.full_name || 'No name provided'}
                          </h3>
                          <div className="flex items-center text-sm text-gray-400 space-x-4">
                            <span className="flex items-center">
                              <Mail className="w-4 h-4 mr-1" />
                              {user.email}
                            </span>
                            <span className="flex items-center">
                              <Calendar className="w-4 h-4 mr-1" />
                              {formatDate(user.created_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Badge className={getRoleBadgeClass(user.role)} variant="outline">
                          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </Badge>
                        <Button
                          size="sm"
                          onClick={() => approveUser(user.id)}
                          disabled={processingUsers.has(user.id)}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          {processingUsers.has(user.id) ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <UserCheck className="w-4 h-4 mr-1" />
                              Approve
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => rejectUser(user.id)}
                          disabled={processingUsers.has(user.id)}
                          className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                        >
                          {processingUsers.has(user.id) ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <UserX className="w-4 h-4 mr-1" />
                              Reject
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* All Users */}
        <Card className="card-husig-glass border-gray-700/50">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-white flex items-center">
              <Users className="w-5 h-5 mr-2" />
              All Users ({users.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="bg-gradient-to-br from-gray-800/50 to-gray-900/30 rounded-lg p-4 border border-gray-700/50"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-husig-gradient rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold text-lg">
                          {user.full_name ? user.full_name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-semibold text-white">
                            {user.full_name || 'No name provided'}
                          </h3>
                          {getStatusBadge(user)}
                        </div>
                        <div className="flex items-center text-sm text-gray-400 space-x-4">
                          <span className="flex items-center">
                            <Mail className="w-4 h-4 mr-1" />
                            {user.email}
                          </span>
                          <span className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            Joined {formatDate(user.created_at)}
                          </span>
                          {user.approved_at && (
                            <span className="text-xs text-green-400">
                              Approved {formatDate(user.approved_at)} by {user.approver_name || 'System'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Select
                        value={user.role}
                        onValueChange={(value: 'admin' | 'manager' | 'intern') => 
                          updateUserRole(user.id, value)
                        }
                        disabled={processingUsers.has(user.id) || user.id === currentUser?.id}
                      >
                        <SelectTrigger className="w-32 husig-select">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-600">
                          <SelectItem value="intern">Intern</SelectItem>
                          <SelectItem value="manager">Manager</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      {user.id === currentUser?.id && (
                        <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 border">
                          <Shield className="w-3 h-3 mr-1" />
                          You
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}