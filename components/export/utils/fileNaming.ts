import { format } from 'date-fns'
import { Environment, ExportFormat } from '@/types/export'

export function generateFileName(
  url: string,
  environment: Environment,
  customEnvironment?: string,
  fileFormat: 'pdf' | 'json' = 'pdf',
  timestamp?: Date
): string {
  // Clean the URL to create a safe filename
  const cleanUrl = url
    .replace(/^https?:\/\//, '') // Remove protocol
    .replace(/www\./, '') // Remove www
    .replace(/\/$/, '') // Remove trailing slash
    .replace(/[^a-zA-Z0-9.-]/g, '-') // Replace special chars with dash
    .replace(/-+/g, '-') // Replace multiple dashes with single
    .replace(/^-|-$/g, '') // Remove leading/trailing dashes
    .toLowerCase()

  // Use provided timestamp or current time
  const now = timestamp || new Date()
  const dateStr = format(now, 'yyyy-MM-dd')
  const timeStr = format(now, 'HH-mm')

  // Use custom environment name if provided
  const envName = environment === 'custom' && customEnvironment
    ? customEnvironment.toLowerCase().replace(/[^a-zA-Z0-9]/g, '-')
    : environment

  const extension = fileFormat === 'pdf' ? 'pdf' : 'json'

  return `${envName}-${cleanUrl}-${dateStr}-${timeStr}.${extension}`
}

export function generateBatchFileName(
  urls: string[],
  environment: Environment,
  customEnvironment?: string,
  fileFormat: 'pdf' | 'json' = 'pdf',
  timestamp?: Date
): string {
  const now = timestamp || new Date()
  const dateStr = format(now, 'yyyy-MM-dd')
  const timeStr = format(now, 'HH-mm')

  const envName = environment === 'custom' && customEnvironment
    ? customEnvironment.toLowerCase().replace(/[^a-zA-Z0-9]/g, '-')
    : environment

  const extension = fileFormat === 'pdf' ? 'pdf' : 'json'
  const urlCount = urls.length

  return `${envName}-batch-${urlCount}sites-${dateStr}-${timeStr}.${extension}`
}

export function sanitizeCustomFileName(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '-') // Replace special chars with dash
    .replace(/-+/g, '-') // Replace multiple dashes with single
    .replace(/^-|-$/g, '') // Remove leading/trailing dashes
    .toLowerCase()
}

export function extractDomainFromUrl(url: string): string {
  try {
    const urlObj = new URL(url)
    return urlObj.hostname.replace(/^www\./, '')
  } catch {
    // Fallback for invalid URLs
    return url
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .split('/')[0]
      .split('?')[0]
      .split('#')[0]
  }
}