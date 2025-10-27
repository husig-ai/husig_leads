'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { 
  Edit2, 
  Trash2, 
  MessageSquare, 
  Save,
  X,
  Plus,
  Loader2,
  Calendar
} from 'lucide-react'
import { toast } from '@/components/ui/use-toast'

interface Note {
  id: string
  lead_id: string
  content: string
  note_type: string
  is_private: boolean
  created_by: string
  created_at: string
  updated_at: string
  // User info
  user_name?: string
  user_email?: string
}

interface NotesSystemProps {
  leadId: string
}

export default function NotesSystem({ leadId }: NotesSystemProps) {
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [newNoteContent, setNewNoteContent] = useState('')
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    loadNotesAndUser()
  }, [leadId])

  const loadNotesAndUser = async () => {
    const supabase = createClient()
    
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        console.error('No authenticated user')
        setLoading(false)
        return
      }
      setCurrentUser(user)

      // Get notes with user information - simplified approach
      const { data: notesData, error: notesError } = await supabase
        .from('notes')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false })

      if (notesError) {
        console.error('Error loading notes:', notesError)
        toast({
          title: "Error",
          description: "Failed to load notes: " + notesError.message,
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      // Get user names for the notes
      if (notesData && notesData.length > 0) {
        const userIds = [...new Set(notesData.map(note => note.created_by))]
        
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', userIds)

        if (profilesError) {
          console.error('Error loading profiles:', profilesError)
          // Still show notes without user names
        }

        // Map user names to notes
        const notesWithNames = notesData.map(note => ({
          ...note,
          user_name: profilesData?.find(p => p.id === note.created_by)?.full_name || 'Unknown User',
          user_email: profilesData?.find(p => p.id === note.created_by)?.email || ''
        }))

        setNotes(notesWithNames)
      } else {
        setNotes([])
      }

    } catch (error) {
      console.error('Error in loadNotesAndUser:', error)
      toast({
        title: "Error",
        description: "Failed to load notes",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddNote = async () => {
    if (!newNoteContent.trim()) {
      toast({
        title: "Empty Note",
        description: "Please enter some content for the note",
        variant: "destructive",
      })
      return
    }

    if (!currentUser) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to add notes",
        variant: "destructive",
      })
      return
    }

    setSaving(true)
    const supabase = createClient()

    try {
      const { data, error } = await supabase
        .from('notes')
        .insert({
          lead_id: leadId,
          content: newNoteContent,
          note_type: 'general',
          is_private: false,
          created_by: currentUser.id,
        })
        .select()

      if (error) {
        console.error('Insert error:', error)
        throw error
      }

      console.log('Note added successfully:', data)
      setNewNoteContent('')
      loadNotesAndUser()
      
      toast({
        title: "Note Added",
        description: "Your note has been added successfully",
      })
    } catch (error: any) {
      console.error('Error adding note:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to add note",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleStartEdit = (note: Note) => {
    setEditingNoteId(note.id)
    setEditContent(note.content)
  }

  const handleCancelEdit = () => {
    setEditingNoteId(null)
    setEditContent('')
  }

  const handleSaveEdit = async (noteId: string) => {
    if (!editContent.trim()) {
      toast({
        title: "Empty Note",
        description: "Note content cannot be empty",
        variant: "destructive",
      })
      return
    }

    setSaving(true)
    const supabase = createClient()

    try {
      const { error } = await supabase
        .from('notes')
        .update({ content: editContent })
        .eq('id', noteId)

      if (error) throw error

      setEditingNoteId(null)
      setEditContent('')
      loadNotesAndUser()
      
      toast({
        title: "Note Updated",
        description: "Note has been updated successfully",
      })
    } catch (error: any) {
      console.error('Error updating note:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to update note",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note? This action cannot be undone.')) {
      return
    }

    const supabase = createClient()
    
    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', noteId)

      if (error) throw error

      loadNotesAndUser()
      
      toast({
        title: "Note Deleted",
        description: "Note has been deleted successfully",
      })
    } catch (error: any) {
      console.error('Error deleting note:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to delete note",
        variant: "destructive",
      })
    }
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
    return date.toLocaleDateString()
  }

  const wasEdited = (createdAt: string, updatedAt: string) => {
    return new Date(updatedAt).getTime() - new Date(createdAt).getTime() > 1000
  }

  const getInitials = (name: string) => {
    if (!name || name === 'Unknown User') return '?'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const isCurrentUserNote = (noteCreatedBy: string) => {
    return currentUser?.id === noteCreatedBy
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-husig-purple-400" />
        <span className="ml-2 text-gray-400">Loading notes...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-husig-gradient rounded-lg flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Notes & Comments</h3>
            <p className="text-sm text-gray-400">
              {notes.length} {notes.length === 1 ? 'note' : 'notes'} • All team members can view and edit
            </p>
          </div>
        </div>
      </div>

      {/* Add New Note Section */}
      <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/30 rounded-xl p-5 border border-gray-700/50 backdrop-blur-sm">
        <div className="space-y-4">
          <div className="flex items-center space-x-2 mb-3">
            <Plus className="w-4 h-4 text-husig-purple-400" />
            <span className="text-sm font-medium text-husig-purple-400">Add New Note</span>
          </div>
          
          <Textarea
            placeholder="Write a note about this lead... (All team members can see and edit notes)"
            rows={4}
            value={newNoteContent}
            onChange={(e) => setNewNoteContent(e.target.value)}
            className="bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 focus:border-husig-purple-500 focus:ring-husig-purple-500/20 resize-none"
          />
          
          <div className="flex justify-end">
            <Button
              onClick={handleAddNote}
              disabled={saving || !newNoteContent.trim()}
              className="btn-husig-primary"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Note
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Notes List */}
      {notes.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-husig-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-8 h-8 text-husig-purple-400" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">No notes yet</h3>
          <p className="text-gray-400 max-w-sm mx-auto">
            Start by adding your first note about this lead. All team members can view and contribute to the conversation.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {notes.map((note) => (
            <div
              key={note.id}
              className="bg-gradient-to-br from-gray-800/50 to-gray-900/30 rounded-xl p-5 border border-gray-700/50 backdrop-blur-sm hover:border-husig-purple-500/30 transition-all duration-300"
            >
              {editingNoteId === note.id ? (
                // Edit Mode
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <Edit2 className="w-4 h-4 text-yellow-400" />
                    <span className="text-sm font-medium text-yellow-400">Editing Note</span>
                  </div>
                  
                  <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={4}
                    className="bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 focus:border-husig-purple-500 focus:ring-husig-purple-500/20 resize-none"
                  />
                  
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={handleCancelEdit}
                      disabled={saving}
                      className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                    <Button
                      onClick={() => handleSaveEdit(note.id)}
                      disabled={saving || !editContent.trim()}
                      className="btn-husig-primary"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Save
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                // View Mode
                <>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-3">
                      <Avatar className="w-8 h-8 bg-husig-gradient">
                        <AvatarFallback className="bg-husig-gradient text-white text-sm font-medium">
                          {getInitials(note.user_name || 'U')}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium text-white">
                            {note.user_name || 'Unknown User'}
                            {isCurrentUserNote(note.created_by) && (
                              <span className="text-xs text-husig-purple-400 ml-1">(You)</span>
                            )}
                          </span>
                          <span className="text-xs text-gray-500">•</span>
                          <span className="text-xs text-gray-400" title={formatDateTime(note.created_at)}>
                            {formatRelativeTime(note.created_at)}
                          </span>
                          {wasEdited(note.created_at, note.updated_at) && (
                            <>
                              <span className="text-xs text-gray-500">•</span>
                              <span className="text-xs text-gray-400" title={`Edited ${formatDateTime(note.updated_at)}`}>
                                edited
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action buttons - ALL users can edit/delete ANY note */}
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleStartEdit(note)}
                        className="text-gray-400 hover:text-yellow-400 hover:bg-yellow-500/10"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(note.id)}
                        className="text-gray-400 hover:text-red-400 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Note Content */}
                  <div className="prose prose-invert max-w-none">
                    <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                      {note.content}
                    </p>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}