'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { LeadStatus } from '@/types/database'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, X, Loader2, ArrowRight } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'

interface StatusSelectorProps {
  leadId: string
  currentStatus: LeadStatus
  onStatusChange: (newStatus: LeadStatus) => void
}

const statusConfig = {
  'new': { 
    color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', 
    icon: '🆕', 
    label: 'New',
    description: 'Lead just entered the system'
  },
  'contacted': { 
    color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', 
    icon: '📞', 
    label: 'Contacted',
    description: 'Initial contact has been made'
  },
  'qualified': { 
    color: 'bg-green-500/20 text-green-400 border-green-500/30', 
    icon: '✅', 
    label: 'Qualified',
    description: 'Lead meets our criteria'
  },
  'proposal': { 
    color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', 
    icon: '📋', 
    label: 'Proposal',
    description: 'Proposal has been sent'
  },
  'negotiation': { 
    color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30', 
    icon: '🤝', 
    label: 'Negotiation',
    description: 'In negotiation phase'
  },
  'won': { 
    color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', 
    icon: '🏆', 
    label: 'Won',
    description: 'Successfully converted to client'
  },
  'lost': { 
    color: 'bg-red-500/20 text-red-400 border-red-500/30', 
    icon: '❌', 
    label: 'Lost',
    description: 'Opportunity was lost'
  },
  'archived': { 
    color: 'bg-gray-500/20 text-gray-400 border-gray-500/30', 
    icon: '📁', 
    label: 'Archived',
    description: 'No longer active'
  }
}

export default function StatusSelector({ leadId, currentStatus, onStatusChange }: StatusSelectorProps) {
  const [selectedStatus, setSelectedStatus] = useState<LeadStatus>(currentStatus)
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  const handleStatusSelect = (value: LeadStatus) => {
    setSelectedStatus(value)
    setHasChanges(value !== currentStatus)
  }

  const handleSave = async () => {
    setSaving(true)
    
    try {
      const supabase = createClient()
      
      const { error } = await supabase
        .from('leads')
        .update({ 
          lead_status: selectedStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', leadId)

      if (error) {
        console.error('Error updating status:', error)
        toast({
          title: "Error",
          description: "Failed to update lead status",
          variant: "destructive",
        })
        return
      }

      // Update parent component
      onStatusChange(selectedStatus)
      setHasChanges(false)
      
      toast({
        title: "Status Updated",
        description: `Lead status changed to ${statusConfig[selectedStatus]?.label}`,
      })
      
    } catch (error) {
      console.error('Error updating status:', error)
      toast({
        title: "Error",
        description: "Failed to update lead status",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setSelectedStatus(currentStatus)
    setHasChanges(false)
  }

  return (
    <div className="space-y-4">
      {/* Current Status Display */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="text-sm font-medium text-gray-300">Status:</span>
          <Badge 
            className={`${statusConfig[currentStatus]?.color || 'bg-gray-500/20 text-gray-400'} border px-3 py-1 text-sm font-medium`}
          >
            {statusConfig[currentStatus]?.icon} {statusConfig[currentStatus]?.label}
          </Badge>
        </div>
      </div>

      {/* Status Selector */}
      <div className="space-y-3">
        <div className="flex items-center space-x-3">
          <Select value={selectedStatus} onValueChange={handleStatusSelect}>
            <SelectTrigger 
              className={`bg-gray-800/50 border-gray-600 text-white transition-all duration-200 ${
                hasChanges 
                  ? 'border-husig-purple-500 ring-1 ring-husig-purple-500/20 bg-husig-purple-500/5' 
                  : 'border-gray-600 hover:border-gray-500'
              }`}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              {Object.entries(statusConfig).map(([status, config]) => (
                <SelectItem 
                  key={status} 
                  value={status}
                  className="text-white hover:bg-gray-700 focus:bg-gray-700"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">{config.icon}</span>
                    <div>
                      <div className="font-medium">{config.label}</div>
                      <div className="text-xs text-gray-400">{config.description}</div>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Change Preview and Actions */}
        {hasChanges && (
          <div className="bg-gradient-to-r from-husig-purple-500/10 to-husig-blue-500/10 border border-husig-purple-500/20 rounded-lg p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2 text-sm">
                <span className="text-gray-300">Status change:</span>
                <Badge className={`${statusConfig[currentStatus]?.color || 'bg-gray-500/20 text-gray-400'} border text-xs`}>
                  {statusConfig[currentStatus]?.icon} {statusConfig[currentStatus]?.label}
                </Badge>
                <ArrowRight className="w-4 h-4 text-husig-purple-400" />
                <Badge className={`${statusConfig[selectedStatus]?.color || 'bg-gray-500/20 text-gray-400'} border text-xs`}>
                  {statusConfig[selectedStatus]?.icon} {statusConfig[selectedStatus]?.label}
                </Badge>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleCancel}
                disabled={saving}
                className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
              >
                <X className="w-4 h-4 mr-1" />
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={saving}
                className="btn-husig-primary"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-1" />
                    Update Status
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Status Info */}
        <div className="text-xs text-gray-500">
          Status changes are tracked automatically and will appear in the activity timeline.
        </div>
      </div>
    </div>
  )
}