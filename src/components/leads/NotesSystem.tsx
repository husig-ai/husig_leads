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
  User,
  Calendar
} from 'lucide-react'

interface Note {
  id: string
  lead_id: string
  content: string
  created_by: string
  created_at: string
  updated_at: string
  user_name?: string
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

  useEffect(() => {
    loadNotes()
  }, [leadId])

  const loadNotes = async () => {
    const supabase = createClient()
    
    try {
      // Get notes
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading notes:', error)
        setLoading(false)
        return
      }

      if (data && data.length > 0) {
        // Get unique user IDs
        const userIds = [...new Set(data.map(note => note.created_by))]
        
        // Fetch user names
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', userIds)

        // Map user names to notes
        const profileMap = new Map(profiles?.map(p => [p.id, p.full_name]) || [])
        
        const notesWithNames = data.map(note => ({
          ...note,
          user_name: profileMap.get(note.created_by) || 'Unknown User'
        }))
        
        setNotes(notesWithNames)
      } else {
        setNotes([])
      }
    } catch (error) {
      console.error('Error loading notes:', error)
      setNotes([])
    } finally {
      setLoading(false)
    }
  }

  const handleAddNote = async () => {
    if (!newNoteContent.trim()) return

    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setSaving(false)
      return
    }

    try {
      const { error } = await supabase
        .from('notes')
        .insert({
          lead_id: leadId,
          content: newNoteContent,
          created_by: user.id,
        })

      if (!error) {
        setNewNoteContent('')
        loadNotes()
      }
    } catch (error) {
      console.error('Error adding note:', error)
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
    if (!editContent.trim()) return

    setSaving(true)
    const supabase = createClient()

    try {
      const { error } = await supabase
        .from('notes')
        .update({ content: editContent })
        .eq('id', noteId)

      if (!error) {
        setEditingNoteId(null)
        setEditContent('')
        loadNotes()
      }
    } catch (error) {
      console.error('Error updating note:', error)
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

      if (!error) {
        loadNotes()
      }
    } catch (error) {
      console.error('Error deleting note:', error)
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
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
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
              {notes.length} {notes.length === 1 ? 'note' : 'notes'}
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
            placeholder="Write a note about this lead..."
            rows={4}
            value={newNoteContent}
            onChange={(e) => setNewNoteContent(e.target.value)}
            className="husig-textarea resize-none bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 focus:border-husig-purple-500 focus:ring-husig-purple-500/20"
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
            Start by adding your first note about this lead. Notes help track important information and conversations.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {notes.map((note, index) => (
            <div
              key={note.id}
              className="bg-gradient-to-br from-gray-800/50 to-gray-900/30 rounded-xl p-5 border border-gray-700/50 backdrop-blur-sm hover:border-husig-purple-500/30 transition-all duration-300 shadow-lg hover:shadow-husig"
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
                    className="husig-textarea resize-none bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 focus:border-husig-purple-500 focus:ring-husig-purple-500/20"
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
                  {/* Note content */}
                  <div className="mb-4">
                    <p className="text-gray-100 leading-relaxed whitespace-pre-wrap bg-gray-800/30 p-4 rounded-lg border border-gray-700/30">
                      {note.content}
                    </p>
                  </div>
                  
                  {/* Note footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-700/50">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8 border-2 border-husig-purple-500/30">
                        <AvatarFallback className="bg-husig-gradient text-white text-sm font-semibold">
                          {getInitials(note.user_name || 'U')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium text-white">
                          {note.user_name || 'Unknown User'}
                        </p>
                        <div className="flex items-center space-x-2 text-xs text-gray-400">
                          <Calendar className="w-3 h-3" />
                          <span>{formatRelativeTime(note.created_at)}</span>
                          {wasEdited(note.created_at, note.updated_at) && (
                            <>
                              <span>•</span>
                              <span className="italic text-yellow-400">edited</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center space-x-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleStartEdit(note)}
                        className="text-gray-400 hover:text-husig-purple-400 hover:bg-husig-purple-500/10"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(note.id)}
                        className="text-gray-400 hover:text-red-400 hover:bg-red-500/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
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