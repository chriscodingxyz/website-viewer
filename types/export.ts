import { WebsiteMetadata } from './metadata'

export type Environment = 'local' | 'staging' | 'production' | 'custom'

export type ExportFormat = 'pdf' | 'json' | 'both'

export interface ExportConfig {
  format: ExportFormat
  environment: Environment
  customEnvironment?: string
  filename?: string
  includeAnalysis: boolean
  includeSections: {
    seo: boolean
    technical: boolean
    performance: boolean
    social: boolean
    analytics: boolean
  }
  notes?: string
}

export interface ReportMetadata {
  generatedAt: string
  environment: Environment
  customEnvironment?: string
  exportVersion: string
  customNotes?: string
  url: string
  userAgent: string
}

export interface AnalysisResults {
  seoScore: number
  technicalScore: number
  performanceScore?: number
  criticalIssues: string[]
  warnings: string[]
  recommendations: string[]
  environmentChecks: {
    productionReady: boolean
    stagingReady: boolean
    developmentReady: boolean
    reasons: string[]
  }
}

export interface EnhancedReportData {
  reportMetadata: ReportMetadata
  websiteData: WebsiteMetadata
  analysis: AnalysisResults
}

export interface EnvironmentValidationRule {
  environment: Environment
  rule: string
  check: (metadata: WebsiteMetadata) => boolean
  severity: 'error' | 'warning' | 'info'
  message: string
  recommendation?: string
}