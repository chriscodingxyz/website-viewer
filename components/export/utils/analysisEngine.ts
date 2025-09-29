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
  const maxScore = 12

  // Essential meta tags (weighted heavily)
  if (metadata.seo.title) {
    const titleLength = metadata.seo.title.length
    if (titleLength >= 30 && titleLength <= 60) score += 2.5
    else if (titleLength > 0 && titleLength < 100) score += 1.5
    else if (titleLength > 0) score += 0.5
  }

  if (metadata.seo.description) {
    const descLength = metadata.seo.description.length
    if (descLength >= 120 && descLength <= 160) score += 2.5
    else if (descLength >= 50 && descLength <= 300) score += 1.5
    else if (descLength > 0) score += 0.5
  }

  // Technical SEO fundamentals
  if (metadata.seo.canonical) score += 1
  if (metadata.seo.viewport) score += 1.5 // Critical for mobile
  if (metadata.seo.language) score += 0.5

  // Robots and indexability
  if (metadata.seo.robots) {
    if (!metadata.seo.robots.includes('noindex') && !metadata.seo.robots.includes('nofollow')) {
      score += 1
    }
  }

  // Structured data
  if (metadata.structuredData && metadata.structuredData.length > 0) {
    score += Math.min(metadata.structuredData.length * 0.5, 1.5) // Cap at 1.5 points
  }

  // Social meta tags (basic presence)
  if (metadata.openGraph.title || metadata.openGraph.description) score += 0.5
  if (metadata.openGraph.image) score += 0.5

  // Icons/favicons
  if (metadata.icons && metadata.icons.length > 0) score += 0.5

  return Math.round((score / maxScore) * 100)
}

function calculateTechnicalScore(metadata: WebsiteMetadata): number {
  let score = 0
  const maxScore = 15

  const headers = metadata.headers || {}

  // Security headers (critical for production)
  if (metadata.url.startsWith('https://')) score += 3 // Most important
  else if (metadata.url.includes('localhost') || metadata.url.includes('127.0.0.1')) score += 1 // Local dev is ok

  if (headers.contentSecurityPolicy) score += 2
  if (headers.xFrameOptions) score += 1.5
  if (headers.strictTransportSecurity && metadata.url.startsWith('https://')) score += 1.5
  if (headers.xContentTypeOptions) score += 1

  // Performance headers
  if (headers.contentEncoding) score += 1.5 // Compression is important
  if (headers.cacheControl) score += 1.5
  if (headers.etag || headers.lastModified) score += 0.5

  // Basic configuration
  if (metadata.seo.viewport) score += 1
  if (metadata.technical?.charset) score += 0.5
  if (metadata.technical?.manifestUrl) score += 0.5 // PWA manifest

  // Modern standards
  if (metadata.technical?.themeColor) score += 0.5

  return Math.round((score / maxScore) * 100)
}

function calculatePerformanceScore(metadata: WebsiteMetadata): number | undefined {
  if (!metadata.performance) return undefined

  let score = 0
  const maxScore = 10

  // Page size scoring (more granular)
  if (metadata.performance.contentLength !== undefined) {
    const sizeMB = metadata.performance.contentLength / 1000000
    if (sizeMB < 0.5) score += 3 // Excellent - under 500KB
    else if (sizeMB < 1) score += 2.5 // Good - under 1MB
    else if (sizeMB < 3) score += 1.5 // Acceptable - under 3MB
    else if (sizeMB < 5) score += 0.5 // Poor - under 5MB
    // 0 points for >5MB
  } else {
    score += 1 // Can't measure, give neutral score
  }

  // Load time scoring (more granular)
  if (metadata.performance.loadTime !== undefined) {
    const loadTimeSeconds = metadata.performance.loadTime / 1000
    if (loadTimeSeconds < 0.5) score += 3 // Excellent
    else if (loadTimeSeconds < 1) score += 2.5 // Good
    else if (loadTimeSeconds < 2) score += 2 // Acceptable
    else if (loadTimeSeconds < 3) score += 1 // Slow
    else if (loadTimeSeconds < 5) score += 0.5 // Very slow
    // 0 points for >5s
  } else {
    score += 1 // Can't measure, give neutral score
  }

  // Compression check
  if (metadata.headers?.contentEncoding) {
    score += 2 // Using compression
  }

  // Caching check
  if (metadata.headers?.cacheControl) {
    const cacheControl = metadata.headers.cacheControl.toLowerCase()
    if (cacheControl.includes('max-age') && !cacheControl.includes('no-cache')) {
      score += 2 // Good caching strategy
    } else {
      score += 0.5 // Has cache headers but not optimal
    }
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

  // Priority 1: Critical SEO recommendations
  if (!metadata.seo.canonical) {
    recommendations.push('Add canonical URL to prevent duplicate content issues and consolidate page authority')
  }
  if (!metadata.structuredData || metadata.structuredData.length === 0) {
    recommendations.push('Implement structured data (JSON-LD) for rich search results and improved visibility')
  }
  if (!metadata.openGraph.image) {
    recommendations.push('Add Open Graph image (1200x630px) for better social media sharing appearance')
  }

  // Priority 2: Performance recommendations
  if (!metadata.headers?.contentEncoding) {
    recommendations.push('Enable gzip/brotli compression to reduce file sizes by 60-80%')
  }
  if (!metadata.headers?.cacheControl) {
    recommendations.push('Configure cache-control headers to improve repeat visitor load times')
  }
  if (metadata.performance?.contentLength && metadata.performance.contentLength > 3000000) {
    recommendations.push('Optimize page size (currently >3MB) - consider code splitting and lazy loading')
  }

  // Priority 3: Security recommendations
  if (environment === 'production') {
    if (!metadata.headers?.contentSecurityPolicy) {
      recommendations.push('Implement Content Security Policy to prevent XSS attacks')
    }
    if (!metadata.headers?.strictTransportSecurity && metadata.url.startsWith('https://')) {
      recommendations.push('Add HSTS header to enforce HTTPS connections')
    }
  }

  // Priority 4: Advanced SEO
  if (environment === 'production') {
    if (!metadata.sitemap?.sitemaps.some(s => s.accessible)) {
      recommendations.push('Create and submit XML sitemap for comprehensive search engine crawling')
    }
    if (!metadata.icons || metadata.icons.length === 0) {
      recommendations.push('Add favicons (including apple-touch-icon) for better brand recognition')
    }
    if (!metadata.seo.language) {
      recommendations.push('Add language meta tag to improve international SEO')
    }
  }

  // Mobile optimization
  if (!metadata.technical?.themeColor) {
    recommendations.push('Add theme-color meta tag for better mobile browser integration')
  }
  if (!metadata.technical?.manifestUrl && environment === 'production') {
    recommendations.push('Consider adding a web app manifest for PWA capabilities')
  }

  // Accessibility
  if (metadata.seo.title && metadata.seo.title.length > 60) {
    recommendations.push('Shorten page title to 50-60 characters for optimal display in search results')
  }
  if (metadata.seo.description && metadata.seo.description.length > 160) {
    recommendations.push('Trim meta description to 120-160 characters to avoid truncation in search results')
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