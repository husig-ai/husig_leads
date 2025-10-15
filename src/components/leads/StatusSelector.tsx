'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Check, X } from 'lucide-react'

interface StatusSelectorProps {
  leadId: string
  currentStatus: string
  onStatusChange: (newStatus: string) => void
}

export default function StatusSelector({ leadId, currentStatus, onStatusChange }: StatusSelectorProps) {
  const [selectedStatus, setSelectedStatus] = useState(currentStatus)
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  const handleStatusSelect = (value: string) => {
    setSelectedStatus(value)
    setHasChanges(value !== currentStatus)
  }

  const handleSave = async () => {
    setSaving(true)
    const supabase = createClient()
    
    const { error } = await supabase
      .from('leads')
      .update({ lead_status: selectedStatus })
      .eq('id', leadId)

    setSaving(false)
    
    if (!error) {
      onStatusChange(selectedStatus)
      setHasChanges(false)
    }
  }

  const handleCancel = () => {
    setSelectedStatus(currentStatus)
    setHasChanges(false)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-2">
        <Select value={selectedStatus} onValueChange={handleStatusSelect}>
          <SelectTrigger className={hasChanges ? 'border-orange-500' : ''}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="New">New</SelectItem>
            <SelectItem value="Contacted">Contacted</SelectItem>
            <SelectItem value="Qualified">Qualified</SelectItem>
            <SelectItem value="Demo Scheduled">Demo Scheduled</SelectItem>
            <SelectItem value="Proposal Sent">Proposal Sent</SelectItem>
            <SelectItem value="Won">Won</SelectItem>
            <SelectItem value="Lost">Lost</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {hasChanges && (
        <div className="flex items-center space-x-2 p-2 bg-orange-50 dark:bg-orange-950 rounded-lg border border-orange-200 dark:border-orange-800">
          <span className="text-xs text-orange-700 dark:text-orange-300 flex-1">
            Unsaved changes
          </span>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCancel}
            disabled={saving}
            className="h-7 px-2"
          >
            <X className="h-3 w-3 mr-1" />
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving}
            className="h-7 px-2"
          >
            <Check className="h-3 w-3 mr-1" />
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      )}
    </div>
  )
}