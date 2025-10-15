// src/components/leads/EmailComposer.tsx
'use client'

import { useState } from 'react'
import { Lead } from '@/types/database'
import { EMAIL_TEMPLATES, interpolateTemplate, getLeadVariables } from '@/lib/email-templates'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Mail, Send, Copy, Check } from 'lucide-react'

interface EmailComposerProps {
  lead: Lead
}

export default function EmailComposer({ lead }: EmailComposerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [senderName, setSenderName] = useState('Your Name')
  const [copied, setCopied] = useState(false)

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplateId(templateId)
    const template = EMAIL_TEMPLATES.find(t => t.id === templateId)
    
    if (template) {
      const variables = getLeadVariables(lead, senderName)
      const interpolated = interpolateTemplate(template, variables)
      setSubject(interpolated.subject)
      setBody(interpolated.body)
    }
  }

  const handleCopyAll = () => {
    const emailContent = `To: ${lead.email}\nSubject: ${subject}\n\n${body}`
    navigator.clipboard.writeText(emailContent)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSendEmail = () => {
    // Open default email client with pre-filled content
    const mailtoLink = `mailto:${lead.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    window.location.href = mailtoLink
    
    // TODO: Log activity in database
    // You can add code here to create an activity record
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Mail className="h-4 w-4 mr-2" />
          Send Email
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Compose Email</DialogTitle>
          <DialogDescription>
            Send a personalized email to {lead.first_name} {lead.last_name} at {lead.company_name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Template Selection */}
          <div className="space-y-2">
            <Label htmlFor="template">Email Template</Label>
            <Select value={selectedTemplateId} onValueChange={handleTemplateChange}>
              <SelectTrigger id="template">
                <SelectValue placeholder="Choose a template..." />
              </SelectTrigger>
              <SelectContent>
                {EMAIL_TEMPLATES.map(template => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Sender Name */}
          <div className="space-y-2">
            <Label htmlFor="sender_name">Your Name</Label>
            <Input
              id="sender_name"
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              placeholder="Your full name"
            />
          </div>

          {/* Recipient */}
          <div className="space-y-2">
            <Label htmlFor="to">To</Label>
            <Input
              id="to"
              value={`${lead.first_name} ${lead.last_name} <${lead.email}>`}
              disabled
              className="bg-gray-50"
            />
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject..."
            />
          </div>

          {/* Body */}
          <div className="space-y-2">
            <Label htmlFor="body">Message</Label>
            <Textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={15}
              placeholder="Email body..."
              className="font-mono text-sm"
            />
          </div>

          {/* Lead Context Info */}
          <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg text-xs space-y-1">
            <p className="font-semibold text-blue-900 dark:text-blue-100">Lead Context:</p>
            <p className="text-blue-700 dark:text-blue-300">
              <strong>Company:</strong> {lead.company_name} ({lead.industry})
            </p>
            <p className="text-blue-700 dark:text-blue-300">
              <strong>Interest:</strong> {Array.isArray(lead.service_interest) ? lead.service_interest.join(', ') : lead.service_interest}
            </p>
            <p className="text-blue-700 dark:text-blue-300">
              <strong>Timeline:</strong> {lead.project_timeline}
            </p>
            <p className="text-blue-700 dark:text-blue-300">
              <strong>Score:</strong> {lead.lead_score}/100
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleCopyAll}
              disabled={!subject || !body}
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy All
                </>
              )}
            </Button>

            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSendEmail}
                disabled={!subject || !body}
              >
                <Send className="h-4 w-4 mr-2" />
                Send via Email Client
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}