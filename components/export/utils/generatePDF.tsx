import React from 'react'
import { pdf } from '@react-pdf/renderer'
import { WebsiteAnalysisReport } from '../pdf/WebsiteAnalysisReport'
import { WebsiteMetadata } from '@/types/metadata'
import { ExportConfig } from '@/types/export'
import { generateFileName, extractDomainFromUrl } from './fileNaming'

/**
 * Generate and download a professional PDF report
 */
export async function generatePDFReport(
  metadata: WebsiteMetadata,
  config: ExportConfig
): Promise<void> {
  try {
    // Generate timestamp
    const now = new Date()
    const generatedAt = now.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

    // Create the PDF document using React PDF
    const doc = (
      <WebsiteAnalysisReport
        metadata={metadata}
        config={config}
        generatedAt={generatedAt}
      />
    )

    // Generate the PDF blob
    const pdfBlob = await pdf(doc).toBlob()

    // Generate filename
    const domain = extractDomainFromUrl(metadata.url)
    const filename = config.filename
      ? `${config.filename}.pdf`
      : generateFileName(metadata.url, config.environment, config.customEnvironment, 'pdf')

    // Create download
    downloadBlob(pdfBlob, filename)

  } catch (error) {
    console.error('PDF generation failed:', error)
    throw new Error('Failed to generate PDF report')
  }
}

/**
 * Generate PDF report for both formats (when format is 'both')
 */
export async function generatePDFReportForBoth(
  metadata: WebsiteMetadata,
  config: ExportConfig
): Promise<void> {
  const pdfConfig = { ...config, format: 'pdf' as const }
  return generatePDFReport(metadata, pdfConfig)
}

/**
 * Download a blob as a file
 */
function downloadBlob(blob: Blob, filename: string): void {
  // Create object URL
  const url = URL.createObjectURL(blob)

  // Create temporary download link
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.style.display = 'none'

  // Trigger download
  document.body.appendChild(link)
  link.click()

  // Cleanup
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Get PDF preview as blob (for future preview functionality)
 */
export async function generatePDFPreview(
  metadata: WebsiteMetadata,
  config: ExportConfig
): Promise<Blob> {
  const now = new Date()
  const generatedAt = now.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  const doc = (
    <WebsiteAnalysisReport
      metadata={metadata}
      config={config}
      generatedAt={generatedAt}
    />
  )

  return await pdf(doc).toBlob()
}

/**
 * Validate config for PDF generation
 */
export function validatePDFConfig(config: ExportConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  // Check if at least one section is included
  const hasAnySections = Object.values(config.includeSections).some(Boolean)
  if (!hasAnySections) {
    errors.push('At least one section must be included in the report')
  }

  // Validate environment
  if (!config.environment) {
    errors.push('Environment must be specified')
  }

  // Validate custom environment if selected
  if (config.environment === 'custom' && !config.customEnvironment?.trim()) {
    errors.push('Custom environment name is required when "Custom" is selected')
  }

  // Validate filename if provided
  if (config.filename) {
    const invalidChars = /[<>:"/\\|?*]/g
    if (invalidChars.test(config.filename)) {
      errors.push('Filename contains invalid characters')
    }
    if (config.filename.length > 200) {
      errors.push('Filename is too long (max 200 characters)')
    }
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Get estimated page count for PDF
 */
export function getEstimatedPageCount(
  metadata: WebsiteMetadata,
  config: ExportConfig
): number {
  let pageCount = 2 // Cover page + Executive summary

  if (config.includeSections.seo) pageCount += 1
  if (config.includeSections.technical) pageCount += 1
  if (config.includeSections.social) pageCount += 1
  if (config.includeSections.performance) pageCount += 1
  if (config.includeSections.analytics) pageCount += 1

  return pageCount
}