'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Lead } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { CheckSquare, Trash2, UserPlus, Mail } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'

interface BulkOperationsProps {
  selectedLeads: string[]
  allLeads: Lead[]
  onSelectionChange: (selectedIds: string[]) => void
  onOperationComplete: () => void
}

export default function BulkOperations({
  selectedLeads,
  allLeads,
  onSelectionChange,
  onOperationComplete
}: BulkOperationsProps) {
  const [showDialog, setShowDialog] = useState(false)
  const [operation, setOperation] = useState<'status' | 'assign' | 'delete' | null>(null)
  const [newStatus, setNewStatus] = useState<string>('')
  const [assignTo, setAssignTo] = useState<string>('')
  const [processing, setProcessing] = useState(false)

  const handleBulkStatusChange = async () => {
    if (!newStatus || selectedLeads.length === 0) return

    setProcessing(true)
    const supabase = createClient()
    
    const { error } = await supabase
      .from('leads')
      .update({ lead_status: newStatus })
      .in('id', selectedLeads)

    setProcessing(false)
    
    if (!error) {
      toast({
        title: 'Success',
        description: `Updated ${selectedLeads.length} lead(s) to ${newStatus}`,
      })
      onSelectionChange([])
      onOperationComplete()
      setShowDialog(false)
    } else {
      toast({
        title: 'Error',
        description: 'Failed to update leads',
        variant: 'destructive'
      })
    }
  }

  const handleBulkDelete = async () => {
    if (selectedLeads.length === 0) return
    if (!confirm(`Are you sure you want to delete ${selectedLeads.length} lead(s)?`)) return

    setProcessing(true)
    const supabase = createClient()
    
    const { error } = await supabase
      .from('leads')
      .delete()
      .in('id', selectedLeads)

    setProcessing(false)
    
    if (!error) {
      toast({
        title: 'Success',
        description: `Deleted ${selectedLeads.length} lead(s)`,
      })
      onSelectionChange([])
      onOperationComplete()
      setShowDialog(false)
    } else {
      toast({
        title: 'Error',
        description: 'Failed to delete leads',
        variant: 'destructive'
      })
    }
  }

  const handleSelectAll = () => {
    if (selectedLeads.length === allLeads.length) {
      onSelectionChange([])
    } else {
      onSelectionChange(allLeads.map(lead => lead.id))
    }
  }

  const openStatusDialog = () => {
    setOperation('status')
    setShowDialog(true)
  }

  const openDeleteDialog = () => {
    setOperation('delete')
    setShowDialog(true)
  }

  if (selectedLeads.length === 0) {
    return (
      <div className="flex items-center space-x-2">
        <Checkbox
          id="select-all"
          checked={false}
          onCheckedChange={handleSelectAll}
        />
        <label htmlFor="select-all" className="text-sm text-muted-foreground">
          Select all
        </label>
      </div>
    )
  }

  return (
    <div className="flex items-center space-x-2 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
      <Checkbox
        id="select-all"
        checked={selectedLeads.length === allLeads.length}
        onCheckedChange={handleSelectAll}
      />
      <Badge variant="secondary">
        {selectedLeads.length} selected
      </Badge>

      <div className="flex-1" />

      <Button
        size="sm"
        variant="outline"
        onClick={openStatusDialog}
      >
        <CheckSquare className="h-4 w-4 mr-2" />
        Change Status
      </Button>

      <Button
        size="sm"
        variant="outline"
        onClick={() => onSelectionChange([])}
      >
        Clear
      </Button>

      <Button
        size="sm"
        variant="destructive"
        onClick={openDeleteDialog}
      >
        <Trash2 className="h-4 w-4 mr-2" />
        Delete
      </Button>

      {/* Dialogs */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {operation === 'status' && 'Change Status'}
              {operation === 'delete' && 'Delete Leads'}
            </DialogTitle>
            <DialogDescription>
              {operation === 'status' && `Update ${selectedLeads.length} lead(s)`}
              {operation === 'delete' && `This will permanently delete ${selectedLeads.length} lead(s)`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {operation === 'status' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">New Status</label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
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
            )}

            {operation === 'delete' && (
              <div className="p-4 bg-red-50 dark:bg-red-950 rounded-lg">
                <p className="text-sm text-red-800 dark:text-red-200">
                  ⚠️ This action cannot be undone. All lead data will be permanently deleted.
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setShowDialog(false)}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button
              onClick={operation === 'status' ? handleBulkStatusChange : handleBulkDelete}
              disabled={processing || (operation === 'status' && !newStatus)}
              variant={operation === 'delete' ? 'destructive' : 'default'}
            >
              {processing ? 'Processing...' : operation === 'status' ? 'Update' : 'Delete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}