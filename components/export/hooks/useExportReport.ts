'use client'

import { useState, useCallback } from 'react'
import { WebsiteMetadata } from '@/types/metadata'
import { ExportConfig, Environment } from '@/types/export'
import { generateJSONReport } from '../utils/generateJSON'
import { generatePDFReport, validatePDFConfig } from '../utils/generatePDF'
import { generateSimplePDFReport } from '../utils/generateSimplePDF'
import { generatePDFClientSide } from '../utils/generatePDFClient'
import { generateFileName, extractDomainFromUrl } from '../utils/fileNaming'
import { toast } from 'sonner'

export interface UseExportReportReturn {
  isExporting: boolean
  exportConfig: ExportConfig
  setExportConfig: (config: Partial<ExportConfig>) => void
  resetConfig: () => void
  exportReport: (metadata: WebsiteMetadata) => Promise<void>
  generateDefaultConfig: (url: string) => ExportConfig
}

const DEFAULT_CONFIG: ExportConfig = {
  format: 'both',
  environment: 'local',
  includeAnalysis: true,
  includeSections: {
    seo: true,
    technical: true,
    performance: true,
    social: true,
    analytics: true
  }
}

export function useExportReport(): UseExportReportReturn {
  const [isExporting, setIsExporting] = useState(false)
  const [exportConfig, setExportConfigState] = useState<ExportConfig>(DEFAULT_CONFIG)

  const setExportConfig = useCallback((config: Partial<ExportConfig>) => {
    setExportConfigState(prev => ({ ...prev, ...config }))
  }, [])

  const resetConfig = useCallback(() => {
    setExportConfigState(DEFAULT_CONFIG)
  }, [])

  const generateDefaultConfig = useCallback((url: string): ExportConfig => {
    // Detect environment based on URL
    let detectedEnvironment: Environment = 'local'

    if (url.includes('localhost') || url.includes('127.0.0.1') || url.includes('0.0.0.0')) {
      detectedEnvironment = 'local'
    } else if (url.includes('staging') || url.includes('dev.') || url.includes('test.')) {
      detectedEnvironment = 'staging'
    } else if (url.startsWith('https://') && !url.includes('staging') && !url.includes('dev.')) {
      detectedEnvironment = 'production'
    }

    const domain = extractDomainFromUrl(url)
    const filename = generateFileName(url, detectedEnvironment, undefined, 'pdf')

    return {
      ...DEFAULT_CONFIG,
      environment: detectedEnvironment,
      filename: filename.replace('.pdf', '') // Remove extension, will be added later
    }
  }, [])

  const exportReport = useCallback(async (metadata: WebsiteMetadata) => {
    setIsExporting(true)

    try {
      const { format } = exportConfig

      // Validate configuration
      if (format === 'pdf' || format === 'both') {
        const validation = validatePDFConfig(exportConfig)
        if (!validation.valid) {
          throw new Error(validation.errors.join(', '))
        }
      }

      // Validate metadata
      if (!metadata || !metadata.url) {
        throw new Error('Invalid metadata: URL is required')
      }

      const domain = extractDomainFromUrl(metadata.url)
      const toastId = format === 'both' ? 'export-both' : `export-${format}`

      // Show progress toast
      toast.loading(`Generating ${format === 'both' ? 'reports' : format.toUpperCase()}...`, {
        id: toastId
      })

      if (format === 'json' || format === 'both') {
        await generateJSONReport(metadata, {
          ...exportConfig,
          format: 'json'
        })

        if (format === 'json') {
          toast.success(`JSON report for ${domain} exported successfully`, { id: toastId })
        }
      }

      if (format === 'pdf' || format === 'both') {
        // Use client-side PDF generation with better error handling
        await generatePDFClientSide(metadata, exportConfig)

        if (format === 'pdf') {
          toast.success(`PDF report for ${domain} exported successfully`, { id: toastId })
        }
      }

      if (format === 'both') {
        toast.success(`Reports for ${domain} exported successfully (JSON + PDF)`, { id: toastId })
      }

    } catch (error) {
      console.error('Export failed:', error)
      let errorMessage = 'Failed to export report'

      if (error instanceof Error) {
        errorMessage = error.message
      }

      // Provide more specific error messages
      if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        errorMessage = 'Network error: Please check your connection and try again'
      } else if (errorMessage.includes('timeout')) {
        errorMessage = 'Export timed out: Please try again with fewer sections'
      }

      toast.error(errorMessage, { duration: 5000 })
      throw error // Re-throw to allow parent components to handle if needed
    } finally {
      setIsExporting(false)
    }
  }, [exportConfig])

  return {
    isExporting,
    exportConfig,
    setExportConfig,
    resetConfig,
    exportReport,
    generateDefaultConfig
  }
}