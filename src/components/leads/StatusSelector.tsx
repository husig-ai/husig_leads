'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { LeadStatus } from '@/types/database'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, X, Loader2, ArrowRight } from 'lucide-react'

interface StatusSelectorProps {
  leadId: string
  currentStatus: LeadStatus
  onStatusChange: (newStatus: LeadStatus) => void
}

const statusConfig = {
  'new': { color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: '🆕', label: 'New' },
  'qualifying': { color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: '📞', label: 'Qualifying' },
  'qualified': { color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: '✅', label: 'Qualified' },
  'nurturing': { color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', icon: '🌱', label: 'Nurturing' },
  'demo_scheduled': { color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30', icon: '📅', label: 'Demo Scheduled' },
  'demo_completed': { color: 'bg-pink-500/20 text-pink-400 border-pink-500/30', icon: '✨', label: 'Demo Completed' },
  'proposal_sent': { color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', icon: '📋', label: 'Proposal Sent' },
  'negotiating': { color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30', icon: '🤝', label: 'Negotiating' },
  'converted': { color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', icon: '🏆', label: 'Converted' },
  'lost': { color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: '❌', label: 'Lost' },
  'disqualified': { color: 'bg-gray-500/20 text-gray-400 border-gray-500/30', icon: '🚫', label: 'Disqualified' }
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
              className={`husig-select transition-all duration-200 ${
                hasChanges 
                  ? 'border-husig-purple-500 ring-1 ring-husig-purple-500/20 bg-husig-purple-500/5' 
                  : 'border-gray-600'
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
                  <div className="flex items-center space-x-2">
                    <span>{config.icon}</span>
                    <span>{config.label}</span>
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
                  {statusConfig[currentStatus]?.label}
                </Badge>
                <ArrowRight className="w-4 h-4 text-husig-purple-400" />
                <Badge className={`${statusConfig[selectedStatus]?.color || 'bg-gray-500/20 text-gray-400'} border text-xs`}>
                  {statusConfig[selectedStatus]?.label}
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