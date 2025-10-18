'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { calculateLeadScore } from '@/lib/validations/lead'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Upload, FileSpreadsheet, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'

interface ImportResult {
  success: number
  failed: number
  errors: Array<{ row: number; error: string }>
}

export default function LeadImporter({ onImportComplete }: { onImportComplete: () => void }) {
  const [isOpen, setIsOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile)
      setResult(null)
    } else {
      toast({
        title: 'Invalid file',
        description: 'Please select a CSV file',
        variant: 'destructive'
      })
    }
  }

  const parseCSV = (text: string): any[] => {
    const lines = text.split('\n').filter(line => line.trim())
    if (lines.length < 2) return []

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/["\s]/g, '_'))
    const rows = []

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''))
      const row: any = {}
      
      headers.forEach((header, index) => {
        row[header] = values[index] || null
      })
      
      rows.push(row)
    }

    return rows
  }

  const validateAndTransformLead = (row: any, rowNumber: number): { valid: boolean; lead?: any; error?: string } => {
    try {
      // Required fields
      if (!row.first_name || !row.last_name || !row.email || !row.company_name) {
        return { valid: false, error: 'Missing required fields' }
      }

      // Email validation
      if (!row.email.includes('@')) {
        return { valid: false, error: 'Invalid email format' }
      }

      // Parse service_interest if it's a string
      let serviceInterest = []
      if (row.service_interest) {
        serviceInterest = row.service_interest.includes(';') 
          ? row.service_interest.split(';').map((s: string) => s.trim())
          : [row.service_interest]
      }

      const lead = {
        first_name: row.first_name,
        last_name: row.last_name,
        email: row.email,
        phone: row.phone || null,
        job_title: row.job_title || 'Not Specified',
        seniority_level: row.seniority_level || 'Individual Contributor',
        linkedin_url: row.linkedin_url || null,
        company_name: row.company_name,
        company_website: row.company_website || `https://${row.company_name.toLowerCase().replace(/\s/g, '')}.com`,
        company_size: row.company_size || '1-10',
        industry: row.industry || 'Other',
        service_interest: serviceInterest.length > 0 ? serviceInterest : ['Not Sure Yet'],
        pain_point: row.pain_point || 'Not specified',
        project_timeline: row.project_timeline || 'Flexible',
        budget_range: row.budget_range || null,
        lead_source: row.lead_source || 'Other',
        lead_status: 'new',
        lead_score: 0,
        notes: row.notes || null,
      }

      // Calculate lead score
      lead.lead_score = calculateLeadScore(lead as any)

      return { valid: true, lead }
    } catch (error) {
      return { valid: false, error: (error as Error).message }
    }
  }

  const handleImport = async () => {
    if (!file) return

    setImporting(true)
    const text = await file.text()
    const rows = parseCSV(text)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to import leads',
        variant: 'destructive'
      })
      setImporting(false)
      return
    }

    const importResult: ImportResult = {
      success: 0,
      failed: 0,
      errors: []
    }

    for (let i = 0; i < rows.length; i++) {
      const validation = validateAndTransformLead(rows[i], i + 2) // +2 because row 1 is header, array is 0-indexed

      if (validation.valid && validation.lead) {
        // Check for duplicate email
        const { data: existing } = await supabase
          .from('leads')
          .select('id')
          .eq('email', validation.lead.email)
          .single()

        if (existing) {
          importResult.failed++
          importResult.errors.push({ row: i + 2, error: 'Email already exists' })
          continue
        }

        // Insert lead
        const { error } = await supabase
          .from('leads')
          .insert({
            ...validation.lead,
            created_by: user.id
          })

        if (error) {
          importResult.failed++
          importResult.errors.push({ row: i + 2, error: error.message })
        } else {
          importResult.success++
        }
      } else {
        importResult.failed++
        importResult.errors.push({ row: i + 2, error: validation.error || 'Unknown error' })
      }
    }

    setResult(importResult)
    setImporting(false)

    if (importResult.success > 0) {
      onImportComplete()
      toast({
        title: 'Import complete',
        description: `Successfully imported ${importResult.success} lead(s)`,
      })
    }
  }

  const downloadTemplate = () => {
    const template = `first_name,last_name,email,phone,job_title,seniority_level,linkedin_url,company_name,company_website,company_size,industry,service_interest,pain_point,project_timeline,budget_range,lead_source,notes
John,Doe,john.doe@example.com,+1234567890,CTO,C-Level,https://linkedin.com/in/johndoe,Acme Corp,https://acmecorp.com,201-500,Financial Services,AI/ML Model Development;Analytics & Dashboarding,Need to improve data processing speed,1-3 months,$100K-$250K,LinkedIn,Hot lead from conference`

    const blob = new Blob([template], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'lead_import_template.csv'
    a.click()
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="h-4 w-4 mr-2" />
          Import CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import Leads from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file to bulk import leads. Download the template for the correct format.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Template Download */}
          <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg space-y-2">
            <div className="flex items-center space-x-2">
              <FileSpreadsheet className="h-5 w-5 text-blue-600" />
              <span className="font-medium text-blue-900 dark:text-blue-100">CSV Template</span>
            </div>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Download the template file to see the required format and field names.
            </p>
            <Button variant="outline" size="sm" onClick={downloadTemplate}>
              Download Template
            </Button>
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Upload CSV File</label>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
            />
            {file && (
              <p className="text-sm text-muted-foreground">
                Selected: {file.name}
              </p>
            )}
          </div>

          {/* Import Results */}
          {result && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-900 dark:text-green-100">
                      {result.success} Successful
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-red-50 dark:bg-red-950 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <XCircle className="h-5 w-5 text-red-600" />
                    <span className="font-medium text-red-900 dark:text-red-100">
                      {result.failed} Failed
                    </span>
                  </div>
                </div>
              </div>

              {result.errors.length > 0 && (
                <div className="max-h-40 overflow-y-auto space-y-1 p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                      Errors
                    </span>
                  </div>
                  {result.errors.map((err, idx) => (
                    <p key={idx} className="text-xs text-yellow-800 dark:text-yellow-200">
                      Row {err.row}: {err.error}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-2">
          <Button
            variant="outline"
            onClick={() => {
              setIsOpen(false)
              setFile(null)
              setResult(null)
            }}
          >
            Close
          </Button>
          <Button
            onClick={handleImport}
            disabled={!file || importing}
          >
            {importing ? 'Importing...' : 'Import Leads'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}