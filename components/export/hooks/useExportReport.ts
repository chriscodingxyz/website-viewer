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
        validatePDFConfig(exportConfig)
      }

      if (format === 'json' || format === 'both') {
        await generateJSONReport(metadata, {
          ...exportConfig,
          format: 'json'
        })

        if (format === 'json') {
          toast.success('JSON report exported successfully')
        }
      }

      if (format === 'pdf' || format === 'both') {
        // Use client-side PDF generation with better error handling
        await generatePDFClientSide(metadata, exportConfig)

        if (format === 'pdf') {
          toast.success('PDF report exported successfully')
        }
      }

      if (format === 'both') {
        toast.success('Reports exported successfully (JSON + PDF)')
      }

    } catch (error) {
      console.error('Export failed:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to export report'
      toast.error(errorMessage)
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