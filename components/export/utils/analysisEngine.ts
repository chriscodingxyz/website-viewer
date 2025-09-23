import { WebsiteMetadata } from '@/types/metadata'
import { AnalysisResults, Environment, EnvironmentValidationRule } from '@/types/export'

export function generateAnalysis(metadata: WebsiteMetadata, environment: Environment): AnalysisResults {
  const seoScore = calculateSEOScore(metadata)
  const technicalScore = calculateTechnicalScore(metadata)
  const performanceScore = calculatePerformanceScore(metadata)

  const criticalIssues = findCriticalIssues(metadata, environment)
  const warnings = findWarnings(metadata, environment)
  const recommendations = generateRecommendations(metadata, environment)
  const environmentChecks = validateEnvironment(metadata)

  return {
    seoScore,
    technicalScore,
    performanceScore,
    criticalIssues,
    warnings,
    recommendations,
    environmentChecks
  }
}

function calculateSEOScore(metadata: WebsiteMetadata): number {
  let score = 0
  const maxScore = 8

  // Essential meta tags
  if (metadata.seo.title && metadata.seo.title.length >= 30 && metadata.seo.title.length <= 60) score += 2
  else if (metadata.seo.title) score += 1

  if (metadata.seo.description && metadata.seo.description.length >= 120 && metadata.seo.description.length <= 160) score += 2
  else if (metadata.seo.description) score += 1

  // Technical SEO
  if (metadata.seo.canonical) score += 1
  if (metadata.seo.viewport) score += 1
  if (metadata.seo.language) score += 1

  // Structured data
  if (metadata.structuredData && metadata.structuredData.length > 0) score += 1

  return Math.round((score / maxScore) * 100)
}

function calculateTechnicalScore(metadata: WebsiteMetadata): number {
  let score = 0
  const maxScore = 10

  const headers = metadata.headers || {}

  // Security headers
  if (metadata.url.startsWith('https://')) score += 2
  if (headers.contentSecurityPolicy) score += 1
  if (headers.xFrameOptions) score += 1
  if (headers.strictTransportSecurity) score += 1
  if (headers.xContentTypeOptions) score += 1

  // Performance headers
  if (headers.contentEncoding) score += 1
  if (headers.cacheControl) score += 1

  // Basic configuration
  if (metadata.seo.viewport) score += 1
  if (metadata.technical?.charset) score += 1

  return Math.round((score / maxScore) * 100)
}

function calculatePerformanceScore(metadata: WebsiteMetadata): number | undefined {
  if (!metadata.performance) return undefined

  let score = 0
  const maxScore = 4

  // Page size scoring
  if (metadata.performance.contentLength) {
    if (metadata.performance.contentLength < 1000000) score += 2 // Under 1MB
    else if (metadata.performance.contentLength < 5000000) score += 1 // Under 5MB
  }

  // Load time scoring
  if (metadata.performance.loadTime) {
    if (metadata.performance.loadTime < 1000) score += 2 // Under 1s
    else if (metadata.performance.loadTime < 3000) score += 1 // Under 3s
  }

  return Math.round((score / maxScore) * 100)
}

function findCriticalIssues(metadata: WebsiteMetadata, environment: Environment): string[] {
  const issues: string[] = []

  // Universal critical issues
  if (!metadata.seo.title) {
    issues.push('Missing page title - critical for SEO')
  }
  if (!metadata.seo.viewport) {
    issues.push('Missing viewport meta tag - breaks mobile experience')
  }

  // Environment-specific critical issues
  if (environment === 'production') {
    if (!metadata.url.startsWith('https://')) {
      issues.push('Production site not using HTTPS - security risk')
    }
    if (!metadata.headers?.strictTransportSecurity) {
      issues.push('Missing HSTS header on production - security vulnerability')
    }
  }

  return issues
}

function findWarnings(metadata: WebsiteMetadata, environment: Environment): string[] {
  const warnings: string[] = []
  const headers = metadata.headers || {}

  // SEO warnings
  if (metadata.seo.title && (metadata.seo.title.length < 30 || metadata.seo.title.length > 60)) {
    warnings.push(`Title length (${metadata.seo.title.length} chars) not optimal (30-60 chars)`)
  }
  if (metadata.seo.description && (metadata.seo.description.length < 120 || metadata.seo.description.length > 160)) {
    warnings.push(`Meta description length (${metadata.seo.description.length} chars) not optimal (120-160 chars)`)
  }

  // Security warnings
  if (!headers.contentSecurityPolicy) {
    warnings.push('Missing Content Security Policy header')
  }
  if (!headers.xFrameOptions) {
    warnings.push('Missing X-Frame-Options header - clickjacking vulnerability')
  }

  // Environment-specific warnings
  if (environment === 'production') {
    if (!metadata.analytics?.googleAnalytics.present && !metadata.analytics?.googleTagManager.present) {
      warnings.push('No analytics tracking detected on production site')
    }
    if (metadata.seo.robots?.includes('noindex')) {
      warnings.push('Production site has noindex directive - blocking search engines')
    }
  }

  if (environment === 'local' || environment === 'staging') {
    if (metadata.analytics?.googleAnalytics.present || metadata.analytics?.googleTagManager.present) {
      warnings.push('Analytics tracking detected on non-production environment')
    }
  }

  return warnings
}

function generateRecommendations(metadata: WebsiteMetadata, environment: Environment): string[] {
  const recommendations: string[] = []

  // SEO recommendations
  if (!metadata.seo.canonical) {
    recommendations.push('Add canonical URL to prevent duplicate content issues')
  }
  if (!metadata.structured

|| metadata.structuredData.length === 0) {
    recommendations.push('Add structured data (JSON-LD) for rich search results')
  }

  // Performance recommendations
  if (!metadata.headers?.contentEncoding) {
    recommendations.push('Enable gzip/brotli compression for faster loading')
  }
  if (!metadata.headers?.cacheControl) {
    recommendations.push('Configure cache headers for better performance')
  }

  // Environment-specific recommendations
  if (environment === 'production') {
    if (!metadata.sitemap?.sitemaps.some(s => s.accessible)) {
      recommendations.push('Add XML sitemap for better search engine discovery')
    }
    if (!metadata.icons || metadata.icons.length === 0) {
      recommendations.push('Add favicons for better brand recognition')
    }
  }

  return recommendations
}

function validateEnvironment(metadata: WebsiteMetadata) {
  const checks = {
    productionReady: true,
    stagingReady: true,
    developmentReady: true,
    reasons: [] as string[]
  }

  // Production readiness checks
  if (!metadata.url.startsWith('https://')) {
    checks.productionReady = false
    checks.reasons.push('Not using HTTPS')
  }
  if (!metadata.seo.title) {
    checks.productionReady = false
    checks.stagingReady = false
    checks.reasons.push('Missing page title')
  }
  if (!metadata.seo.description) {
    checks.productionReady = false
    checks.reasons.push('Missing meta description')
  }
  if (metadata.seo.robots?.includes('noindex')) {
    checks.productionReady = false
    checks.reasons.push('Site blocks search engines')
  }

  // Staging readiness checks
  if (!metadata.seo.viewport) {
    checks.productionReady = false
    checks.stagingReady = false
    checks.developmentReady = false
    checks.reasons.push('Missing viewport meta tag')
  }

  return checks
}

// Environment validation rules for automated checking
export const ENVIRONMENT_RULES: EnvironmentValidationRule[] = [
  {
    environment: 'production',
    rule: 'https_required',
    check: (metadata) => metadata.url.startsWith('https://'),
    severity: 'error',
    message: 'Production sites must use HTTPS',
    recommendation: 'Configure SSL certificate and redirect HTTP to HTTPS'
  },
  {
    environment: 'production',
    rule: 'analytics_present',
    check: (metadata) => !!(metadata.analytics?.googleAnalytics.present || metadata.analytics?.googleTagManager.present),
    severity: 'warning',
    message: 'No analytics tracking detected',
    recommendation: 'Install Google Analytics or Google Tag Manager'
  },
  {
    environment: 'production',
    rule: 'no_noindex',
    check: (metadata) => !metadata.seo.robots?.includes('noindex'),
    severity: 'error',
    message: 'Production site blocks search engines',
    recommendation: 'Remove noindex directive from robots meta tag'
  },
  {
    environment: 'staging',
    rule: 'no_analytics',
    check: (metadata) => !(metadata.analytics?.googleAnalytics.present || metadata.analytics?.googleTagManager.present),
    severity: 'warning',
    message: 'Analytics tracking should be disabled on staging',
    recommendation: 'Remove or disable analytics scripts'
  },
  {
    environment: 'local',
    rule: 'no_analytics',
    check: (metadata) => !(metadata.analytics?.googleAnalytics.present || metadata.analytics?.googleTagManager.present),
    severity: 'warning',
    message: 'Analytics tracking should be disabled in development',
    recommendation: 'Remove or disable analytics scripts'
  }
]