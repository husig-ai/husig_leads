'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Users, 
  UserPlus, 
  UserCheck, 
  UserX, 
  Send,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Settings,
  RefreshCw,
  Clock
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

interface SystemHealth {
  status: string
  config: {
    service_key_configured: boolean
    supabase_url_configured: boolean
    site_url: string
  }
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
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null)
  const [showHealthCheck, setShowHealthCheck] = useState(false)

  useEffect(() => {
    checkAdminAccess()
    loadUsers()
    checkSystemHealth()
  }, [])

  const checkSystemHealth = async () => {
    try {
      const response = await fetch('/api/admin/invite-user', {
        method: 'GET'
      })
      const health = await response.json()
      setSystemHealth(health)
    } catch (error) {
      console.error('Error checking system health:', error)
    }
  }

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
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      const usersWithNames = await Promise.all(
        data.map(async (user) => {
          let approver_name = null
          let inviter_name = null

          if (user.approved_by) {
            const { data: approver } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', user.approved_by)
              .single()
            approver_name = approver?.full_name
          }

          if (user.invited_by) {
            const { data: inviter } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', user.invited_by)
              .single()
            inviter_name = inviter?.full_name
          }

          return {
            ...user,
            approver_name,
            inviter_name
          }
        })
      )

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

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(inviteForm.email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive",
      })
      return
    }

    setInviting(true)
    try {
      const response = await fetch('/api/admin/invite-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: inviteForm.email,
          full_name: inviteForm.full_name,
          role: inviteForm.role,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send invitation')
      }

      toast({
        title: "Invitation Sent",
        description: `Invitation email sent to ${inviteForm.email}`,
      })

      setInviteForm({ email: '', full_name: '', role: 'intern' })
      setInviteDialogOpen(false)
      
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
    const user = users.find(u => u.id === userId)
    if (!user) return

    if (!confirm(`Are you sure you want to reject ${user.full_name || user.email}? This will permanently delete their account.`)) {
      return
    }

    setProcessingUsers(prev => new Set(prev).add(userId))
    try {
      const response = await fetch('/api/admin/reject-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: userId }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to reject user')
      }

      toast({
        title: "User Rejected",
        description: result.message || "User has been rejected and their account deleted",
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

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'destructive'
      case 'manager': return 'default'
      case 'intern': return 'secondary'
      default: return 'secondary'
    }
  }

  const getStatusIcon = (user: UserProfile) => {
    if (user.is_approved) {
      return <CheckCircle className="h-4 w-4 text-green-500" />
    } else {
      return <Clock className="h-4 w-4 text-yellow-500" />
    }
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

  if (loading) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="grid gap-1">
          <h1 className="font-heading text-3xl md:text-4xl">User Management</h1>
          <p className="text-lg text-muted-foreground">Manage user access and permissions</p>
        </div>
        <div className="flex items-center justify-center h-32">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  const pendingUsers = users.filter(user => !user.is_approved)
  const approvedUsers = users.filter(user => user.is_approved)

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div className="grid gap-1">
          <h1 className="font-heading text-3xl md:text-4xl">User Management</h1>
          <p className="text-lg text-muted-foreground">Manage user access and permissions</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowHealthCheck(!showHealthCheck)}
          >
            <Settings className="h-4 w-4 mr-2" />
            System Check
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadUsers}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Invite User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite New User</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="user@example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    value={inviteForm.full_name}
                    onChange={(e) => setInviteForm(prev => ({ ...prev, full_name: e.target.value }))}
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <Label htmlFor="role">Role</Label>
                  <Select 
                    value={inviteForm.role} 
                    onValueChange={(value: 'admin' | 'manager' | 'intern') => 
                      setInviteForm(prev => ({ ...prev, role: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="intern">Intern</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  onClick={sendInvitation} 
                  disabled={inviting}
                  className="w-full"
                >
                  {inviting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending Invitation...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Invitation
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* System Health Check */}
      {showHealthCheck && (
        <Alert className={systemHealth?.status === 'healthy' ? '' : 'border-red-500'}>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <div className="font-medium">System Configuration Status</div>
              {systemHealth ? (
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    {systemHealth.config.service_key_configured ? (
                      <CheckCircle className="h-3 w-3 text-green-500" />
                    ) : (
                      <XCircle className="h-3 w-3 text-red-500" />
                    )}
                    Service Role Key: {systemHealth.config.service_key_configured ? 'Configured' : 'Missing'}
                  </div>
                  <div className="flex items-center gap-2">
                    {systemHealth.config.supabase_url_configured ? (
                      <CheckCircle className="h-3 w-3 text-green-500" />
                    ) : (
                      <XCircle className="h-3 w-3 text-red-500" />
                    )}
                    Supabase URL: {systemHealth.config.supabase_url_configured ? 'Configured' : 'Missing'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Site URL: {systemHealth.config.site_url}
                  </div>
                </div>
              ) : (
                <div className="text-sm">Loading system status...</div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingUsers.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved Users</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedUsers.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(user => user.role === 'admin').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Approvals */}
      {pendingUsers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Pending Approvals ({pendingUsers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingUsers.map(user => (
                <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{user.full_name || 'No name provided'}</p>
                        <Badge variant={getRoleBadgeVariant(user.role)}>{user.role}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      {user.inviter_name && (
                        <p className="text-xs text-muted-foreground">
                          Invited by {user.inviter_name} on {formatDate(user.created_at)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => approveUser(user.id)}
                      disabled={processingUsers.has(user.id)}
                    >
                      {processingUsers.has(user.id) ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <UserCheck className="h-4 w-4" />
                      )}
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => rejectUser(user.id)}
                      disabled={processingUsers.has(user.id)}
                    >
                      {processingUsers.has(user.id) ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <UserX className="h-4 w-4" />
                      )}
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Users */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            All Users ({users.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.map(user => (
              <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  {getStatusIcon(user)}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{user.full_name || 'No name provided'}</p>
                      <Badge variant={getRoleBadgeVariant(user.role)}>{user.role}</Badge>
                      {user.is_approved ? (
                        <Badge variant="outline">Approved</Badge>
                      ) : (
                        <Badge variant="secondary">Pending</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>Joined: {formatDate(user.created_at)}</p>
                      {user.approver_name && user.approved_at && (
                        <p>Approved by {user.approver_name} on {formatDate(user.approved_at)}</p>
                      )}
                      {user.inviter_name && (
                        <p>Invited by {user.inviter_name}</p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!user.is_approved && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => approveUser(user.id)}
                        disabled={processingUsers.has(user.id)}
                      >
                        {processingUsers.has(user.id) ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <UserCheck className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => rejectUser(user.id)}
                        disabled={processingUsers.has(user.id)}
                      >
                        {processingUsers.has(user.id) ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <UserX className="h-4 w-4" />
                        )}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}