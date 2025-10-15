// src/components/leads/NotesSystem.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Edit2, Trash2, MessageSquare } from 'lucide-react'

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
    const { data, error } = await supabase
      .from('notes')
      .select(`
        *,
        profiles:created_by (full_name)
      `)
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false })

    if (data) {
      const notesWithNames = data.map((note: any) => ({
        ...note,
        user_name: note.profiles?.full_name || 'Unknown User'
      }))
      setNotes(notesWithNames)
    }
    setLoading(false)
  }

  const handleAddNote = async () => {
    if (!newNoteContent.trim()) return

    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return

    const { error } = await supabase
      .from('notes')
      .insert({
        lead_id: leadId,
        content: newNoteContent,
        created_by: user.id,
      })

    setSaving(false)
    if (!error) {
      setNewNoteContent('')
      loadNotes()
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

    const { error } = await supabase
      .from('notes')
      .update({ content: editContent })
      .eq('id', noteId)

    setSaving(false)
    if (!error) {
      setEditingNoteId(null)
      setEditContent('')
      loadNotes()
    }
  }

  const handleDelete = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return

    const supabase = createClient()
    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', noteId)

    if (!error) {
      loadNotes()
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

  const wasEdited = (createdAt: string, updatedAt: string) => {
    return new Date(updatedAt).getTime() - new Date(createdAt).getTime() > 1000
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add New Note */}
        <div className="space-y-2">
          <Textarea
            placeholder="Add a note..."
            rows={3}
            value={newNoteContent}
            onChange={(e) => setNewNoteContent(e.target.value)}
          />
          <Button
            onClick={handleAddNote}
            disabled={saving || !newNoteContent.trim()}
            size="sm"
          >
            {saving ? 'Adding...' : 'Add Note'}
          </Button>
        </div>

        {/* Notes List */}
        {loading ? (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">Loading notes...</p>
          </div>
        ) : notes.length === 0 ? (
          <div className="text-center py-8 border rounded-lg border-dashed">
            <MessageSquare className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No notes yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notes.map((note) => (
              <div
                key={note.id}
                className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-900 space-y-2"
              >
                {editingNoteId === note.id ? (
                  // Edit Mode
                  <div className="space-y-2">
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows={3}
                    />
                    <div className="flex justify-end space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCancelEdit}
                        disabled={saving}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleSaveEdit(note.id)}
                        disabled={saving || !editContent.trim()}
                      >
                        {saving ? 'Saving...' : 'Save'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <>
                    <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                    
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="font-medium">{note.user_name}</span>
                        <span>•</span>
                        <span>{formatDateTime(note.created_at)}</span>
                        {wasEdited(note.created_at, note.updated_at) && (
                          <>
                            <span>•</span>
                            <span className="italic">edited</span>
                          </>
                        )}
                      </div>

                      <div className="flex items-center space-x-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleStartEdit(note)}
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(note.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}