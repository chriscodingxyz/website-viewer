'use client'

import React, { useEffect } from 'react'
import { WebsiteMetadata } from '@/types/metadata'
import { Environment, ExportFormat } from '@/types/export'
import { useExportReport } from './hooks/useExportReport'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  FileText,
  FileDown,
  Settings,
  Globe,
  BarChart3,
  Share2,
  Activity,
  Loader2,
  Info
} from 'lucide-react'

interface ExportReportModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  metadata: WebsiteMetadata | null
}

const ENVIRONMENT_OPTIONS: { value: Environment; label: string; description: string }[] = [
  {
    value: 'local',
    label: 'Local Development',
    description: 'Development environment (localhost, dev servers)'
  },
  {
    value: 'staging',
    label: 'Staging',
    description: 'Testing environment (staging.*, dev.*, test.*)'
  },
  {
    value: 'production',
    label: 'Production',
    description: 'Live production environment'
  },
  {
    value: 'custom',
    label: 'Custom',
    description: 'Custom environment name'
  }
]

const FORMAT_OPTIONS: { value: ExportFormat; label: string; description: string }[] = [
  {
    value: 'pdf',
    label: 'PDF Report',
    description: 'Professional PDF document for sharing'
  },
  {
    value: 'json',
    label: 'JSON Data',
    description: 'Machine-readable data for analysis'
  },
  {
    value: 'both',
    label: 'PDF + JSON',
    description: 'Both formats for comprehensive reporting'
  }
]

export default function ExportReportModal({ open, onOpenChange, metadata }: ExportReportModalProps) {
  const {
    isExporting,
    exportConfig,
    setExportConfig,
    resetConfig,
    exportReport,
    generateDefaultConfig
  } = useExportReport()

  // Auto-generate config when modal opens with new metadata
  useEffect(() => {
    if (open && metadata) {
      const defaultConfig = generateDefaultConfig(metadata.url)
      setExportConfig(defaultConfig)
    }
  }, [open, metadata, generateDefaultConfig, setExportConfig])

  const handleExport = async () => {
    if (!metadata) return

    try {
      await exportReport(metadata)
      onOpenChange(false)
    } catch (error) {
      // Error is handled in the hook
    }
  }

  const handleClose = () => {
    onOpenChange(false)
    setTimeout(() => resetConfig(), 200) // Reset after animation
  }

  if (!metadata) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <FileDown className="h-5 w-5 text-blue-600" />
            Export Website Analysis Report
          </DialogTitle>
          <DialogDescription>
            Generate a professional report for <span className="font-medium">{metadata.url}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Format Selection */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Export Format</Label>
            <Select
              value={exportConfig.format}
              onValueChange={(value: ExportFormat) => setExportConfig({ format: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FORMAT_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    <div>
                      <div className="font-medium">{option.label}</div>
                      <div className="text-xs text-muted-foreground">{option.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Environment Selection */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Environment</Label>
            <Select
              value={exportConfig.environment}
              onValueChange={(value: Environment) => setExportConfig({ environment: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ENVIRONMENT_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    <div>
                      <div className="font-medium">{option.label}</div>
                      <div className="text-xs text-muted-foreground">{option.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {exportConfig.environment === 'custom' && (
              <Input
                placeholder="Enter custom environment name"
                value={exportConfig.customEnvironment || ''}
                onChange={(e) => setExportConfig({ customEnvironment: e.target.value })}
                className="mt-2"
              />
            )}
          </div>

          {/* Filename */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Filename (without extension)</Label>
            <Input
              placeholder="Auto-generated filename"
              value={exportConfig.filename || ''}
              onChange={(e) => setExportConfig({ filename: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Leave empty for auto-generated filename based on environment and URL
            </p>
          </div>

          {/* Sections to Include */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Report Sections
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="seo"
                    checked={exportConfig.includeSections.seo}
                    onCheckedChange={(checked) =>
                      setExportConfig({
                        includeSections: {
                          ...exportConfig.includeSections,
                          seo: !!checked
                        }
                      })
                    }
                  />
                  <Label htmlFor="seo" className="flex items-center gap-2 text-sm">
                    <Globe className="h-3 w-3" />
                    SEO Analysis
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="technical"
                    checked={exportConfig.includeSections.technical}
                    onCheckedChange={(checked) =>
                      setExportConfig({
                        includeSections: {
                          ...exportConfig.includeSections,
                          technical: !!checked
                        }
                      })
                    }
                  />
                  <Label htmlFor="technical" className="flex items-center gap-2 text-sm">
                    <Settings className="h-3 w-3" />
                    Technical
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="performance"
                    checked={exportConfig.includeSections.performance}
                    onCheckedChange={(checked) =>
                      setExportConfig({
                        includeSections: {
                          ...exportConfig.includeSections,
                          performance: !!checked
                        }
                      })
                    }
                  />
                  <Label htmlFor="performance" className="flex items-center gap-2 text-sm">
                    <BarChart3 className="h-3 w-3" />
                    Performance
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="social"
                    checked={exportConfig.includeSections.social}
                    onCheckedChange={(checked) =>
                      setExportConfig({
                        includeSections: {
                          ...exportConfig.includeSections,
                          social: !!checked
                        }
                      })
                    }
                  />
                  <Label htmlFor="social" className="flex items-center gap-2 text-sm">
                    <Share2 className="h-3 w-3" />
                    Social Media
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="analytics"
                    checked={exportConfig.includeSections.analytics}
                    onCheckedChange={(checked) =>
                      setExportConfig({
                        includeSections: {
                          ...exportConfig.includeSections,
                          analytics: !!checked
                        }
                      })
                    }
                  />
                  <Label htmlFor="analytics" className="flex items-center gap-2 text-sm">
                    <Activity className="h-3 w-3" />
                    Analytics
                  </Label>
                </div>
              </div>

              <Separator />

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="analysis"
                  checked={exportConfig.includeAnalysis}
                  onCheckedChange={(checked) => setExportConfig({ includeAnalysis: !!checked })}
                />
                <Label htmlFor="analysis" className="text-sm font-medium">
                  Include analysis scores and recommendations
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Notes (Optional)</Label>
            <Textarea
              placeholder="Add context, testing notes, or other information..."
              value={exportConfig.notes || ''}
              onChange={(e) => setExportConfig({ notes: e.target.value })}
              rows={3}
            />
          </div>

          {/* Report Preview Info */}
          <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-1 flex-shrink-0" />
                <div className="text-sm space-y-2">
                  <div>
                    <p className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                      Environment: {exportConfig.environment === 'custom'
                        ? (exportConfig.customEnvironment || 'Custom')
                        : exportConfig.environment.charAt(0).toUpperCase() + exportConfig.environment.slice(1)}
                    </p>
                    <p className="text-blue-700 dark:text-blue-300">
                      Reports include environment-specific validation, security checks, and tailored recommendations.
                    </p>
                  </div>
                  {exportConfig.includeAnalysis && (
                    <div className="pt-2 border-t border-blue-200 dark:border-blue-800">
                      <p className="font-medium text-blue-900 dark:text-blue-100">
                        ✓ Analysis Included
                      </p>
                      <p className="text-blue-700 dark:text-blue-300 text-xs">
                        SEO scores, technical assessment, critical issues, warnings, and actionable recommendations
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 items-center">
          <div className="flex-1 text-xs text-muted-foreground hidden sm:block">
            {exportConfig.format === 'both' ? 'Both files will be downloaded' : `${exportConfig.format.toUpperCase()} will be downloaded`}
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" onClick={handleClose} disabled={isExporting} className="flex-1 sm:flex-initial">
              Cancel
            </Button>
            <Button
              onClick={handleExport}
              disabled={isExporting || (exportConfig.environment === 'custom' && !exportConfig.customEnvironment?.trim())}
              className="min-w-[140px] flex-1 sm:flex-initial"
            >
              {isExporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileDown className="h-4 w-4 mr-2" />
                  Export {exportConfig.format === 'both' ? 'Reports' : exportConfig.format.toUpperCase()}
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}