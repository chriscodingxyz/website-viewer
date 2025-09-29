import { saveAs } from 'file-saver'
import { WebsiteMetadata } from '@/types/metadata'
import { ExportConfig, EnhancedReportData, ReportMetadata, Environment } from '@/types/export'
import { generateAnalysis } from './analysisEngine'
import { generateFileName } from './fileNaming'

export async function generateJSONReport(
  metadata: WebsiteMetadata,
  config: ExportConfig
): Promise<void> {
  try {
    const reportData = createEnhancedReportData(metadata, config)
    const jsonString = JSON.stringify(reportData, null, 2)
    const blob = new Blob([jsonString], { type: 'application/json' })

    const filename = config.filename || generateFileName(
      metadata.url,
      config.environment,
      config.customEnvironment,
      'json'
    )

    saveAs(blob, filename)
  } catch (error) {
    console.error('Failed to generate JSON report:', error)
    throw new Error('Failed to generate JSON report')
  }
}

export function createEnhancedReportData(
  metadata: WebsiteMetadata,
  config: ExportConfig
): EnhancedReportData {
  const now = new Date()

  const reportMetadata: ReportMetadata = {
    generatedAt: now.toISOString(),
    environment: config.environment,
    customEnvironment: config.customEnvironment,
    exportVersion: '2.0.0',
    customNotes: config.notes,
    url: metadata.url,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Server-side export',
    generatedTimestamp: now.getTime(),
    generatedDate: now.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    })
  }

  // Filter website data based on included sections
  const filteredWebsiteData = filterWebsiteData(metadata, config.includeSections)

  const analysis = config.includeAnalysis
    ? generateAnalysis(metadata, config.environment)
    : undefined

  return {
    reportMetadata,
    websiteData: filteredWebsiteData,
    analysis: analysis || {
      seoScore: 0,
      technicalScore: 0,
      performanceScore: undefined,
      criticalIssues: [],
      warnings: [],
      recommendations: [],
      environmentChecks: {
        productionReady: false,
        stagingReady: false,
        developmentReady: false,
        reasons: ['Analysis not included in export']
      }
    }
  }
}

function filterWebsiteData(
  metadata: WebsiteMetadata,
  includeSections: ExportConfig['includeSections']
): WebsiteMetadata {
  const filtered: WebsiteMetadata = {
    url: metadata.url,
    extractedAt: metadata.extractedAt,
    error: metadata.error,
    seo: includeSections.seo ? metadata.seo : {
      title: undefined,
      description: undefined,
      keywords: undefined,
      canonical: undefined,
      language: undefined,
      viewport: undefined,
      robots: undefined,
      author: undefined
    },
    openGraph: includeSections.social ? metadata.openGraph : {
      title: undefined,
      description: undefined,
      image: undefined,
      imageAlt: undefined,
      imageWidth: undefined,
      imageHeight: undefined,
      url: undefined,
      type: undefined,
      siteName: undefined,
      locale: undefined
    },
    twitterCard: includeSections.social ? metadata.twitterCard : {
      card: undefined,
      title: undefined,
      description: undefined,
      image: undefined,
      imageAlt: undefined,
      site: undefined,
      creator: undefined
    },
    icons: includeSections.seo ? metadata.icons : [],
    technical: includeSections.technical ? metadata.technical : {
      charset: undefined,
      themeColor: undefined,
      manifestUrl: undefined,
      generator: undefined,
      referrer: undefined,
      appleTouchIcon: undefined,
      appleItunes: undefined,
      msapplicationConfig: undefined,
      doctype: undefined
    },
    performance: includeSections.performance ? metadata.performance : undefined,
    headers: includeSections.technical ? metadata.headers : undefined,
    structuredData: includeSections.seo ? metadata.structuredData : [],
    sitemap: includeSections.seo ? metadata.sitemap : undefined,
    analytics: includeSections.analytics ? metadata.analytics : undefined
  }

  return filtered
}

export async function generateQuickJSONExport(metadata: WebsiteMetadata): Promise<void> {
  const config: ExportConfig = {
    format: 'json',
    environment: 'local',
    includeAnalysis: false,
    includeSections: {
      seo: true,
      technical: true,
      performance: true,
      social: true,
      analytics: true
    }
  }

  await generateJSONReport(metadata, config)
}

export function createJSONForComparison(
  metadataArray: WebsiteMetadata[],
  environment: Environment[]
): string {
  const comparison = metadataArray.map((metadata, index) => ({
    environment: environment[index] || 'unknown',
    url: metadata.url,
    analysis: generateAnalysis(metadata, environment[index] || 'local'),
    extractedAt: metadata.extractedAt
  }))

  return JSON.stringify({
    comparisonType: 'environment',
    generatedAt: new Date().toISOString(),
    sites: comparison
  }, null, 2)
}