'use client'

import React from 'react'
import { WebsiteMetadata } from '@/types/metadata'
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  Settings,
  Zap,
  Shield,
  Info,
  BarChart3,
  Server,
  Lock,
  Globe
} from 'lucide-react'
import SiteDiscovery from '@/components/SiteDiscovery'

interface TechnicalSectionProps {
  metadata?: WebsiteMetadata | null
}

export default function TechnicalSection ({ metadata }: TechnicalSectionProps) {
  if (!metadata) {
    return (
      <div className='w-full min-h-[400px] flex items-center justify-center'>
        <div className='text-center'>
          <div className='text-xl font-medium text-muted-foreground mb-2'>Loading Technical Analysis...</div>
          <div className='text-sm text-muted-foreground'>Analyzing technical configuration and security</div>
        </div>
      </div>
    )
  }

  const { technical, headers, structuredData, performance } = metadata

  // Ensure headers object exists to prevent rendering issues
  const safeHeaders = headers || {}

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getSecurityStatus = () => {
    const isHTTPS = metadata.url.startsWith('https://') || false
    return isHTTPS ? 'good' : 'warning'
  }

  const getTechnicalScore = () => {
    let score = 0
    const maxScore = 8

    // Security checks
    if (metadata.url.startsWith('https://')) score += 1
    if (safeHeaders.contentSecurityPolicy) score += 1
    if (safeHeaders.xFrameOptions) score += 1
    if (safeHeaders.strictTransportSecurity) score += 1

    // Performance checks
    if (safeHeaders.contentEncoding) score += 1
    if (safeHeaders.cacheControl) score += 1

    // Configuration checks
    if (metadata.seo.viewport) score += 1
    if (technical?.charset) score += 1

    return { score, maxScore, percentage: Math.round((score / maxScore) * 100) }
  }

  const technicalScore = getTechnicalScore()

  // Status indicator component matching SEO section
  const StatusIndicator = ({ status, label, value, details }: {
    status: 'good' | 'warning' | 'error'
    label: string
    value?: string
    details?: string
  }) => {
    const styles = {
      good: {
        icon: <CheckCircle className="h-5 w-5 text-emerald-600" />,
        bg: "bg-emerald-50 dark:bg-emerald-950/20",
        border: "border-l-emerald-500",
        text: "text-emerald-800 dark:text-emerald-200"
      },
      warning: {
        icon: <AlertTriangle className="h-5 w-5 text-amber-600" />,
        bg: "bg-amber-50 dark:bg-amber-950/20",
        border: "border-l-amber-500",
        text: "text-amber-800 dark:text-amber-200"
      },
      error: {
        icon: <XCircle className="h-5 w-5 text-red-600" />,
        bg: "bg-red-50 dark:bg-red-950/20",
        border: "border-l-red-500",
        text: "text-red-800 dark:text-red-200"
      }
    }

    const style = styles[status]

    return (
      <div className={`border-l-4 ${style.border} ${style.bg} p-4 space-y-2`}>
        <div className="flex items-center gap-3">
          {style.icon}
          <div className="flex-1">
            <h4 className={`font-semibold ${style.text}`}>{label}</h4>
            {value && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{value}</p>
            )}
          </div>
        </div>
        {details && (
          <p className="text-xs text-muted-foreground ml-8">{details}</p>
        )}
      </div>
    )
  }

  // Technical Score component matching SEO section
  const TechnicalScoreDisplay = () => (
    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20 border-l-4 border-l-purple-500 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
            <Settings className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-foreground">Technical Health Score</h3>
            <p className="text-sm text-muted-foreground">Security and configuration status</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-purple-600">{technicalScore.percentage}%</div>
          <div className="text-sm text-muted-foreground">{technicalScore.score}/{technicalScore.maxScore} checks passed</div>
        </div>
      </div>

      <div className="w-full bg-gray-200 dark:bg-gray-700 h-2">
        <div
          className="h-2 bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-300"
          style={{ width: `${technicalScore.percentage}%` }}
        />
      </div>
    </div>
  )

  return (
    <div className="w-full space-y-8">
      {/* Technical Score Header */}
      <TechnicalScoreDisplay />

      {/* Performance Section */}
      <div className="space-y-6">
        <div className="border-b border-border pb-4">
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <Zap className="h-7 w-7 text-blue-600" />
            Performance Metrics
          </h2>
          <p className="text-muted-foreground mt-2">Website speed and optimization indicators</p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {performance?.contentLength && (
            <StatusIndicator
              status={
                performance.contentLength < 1000000
                  ? 'good'
                  : performance.contentLength < 5000000
                  ? 'warning'
                  : 'error'
              }
              label="Page Size"
              value={formatBytes(performance.contentLength)}
              details={
                performance.contentLength < 1000000
                  ? 'Optimized size for fast loading'
                  : performance.contentLength < 5000000
                  ? 'Acceptable but could be optimized'
                  : 'Large page size may impact loading speed'
              }
            />
          )}

          {performance?.loadTime && (
            <StatusIndicator
              status={
                performance.loadTime < 1000
                  ? 'good'
                  : performance.loadTime < 3000
                  ? 'warning'
                  : 'error'
              }
              label="Load Time"
              value={`${performance.loadTime}ms`}
              details={
                performance.loadTime < 1000
                  ? 'Excellent loading performance'
                  : performance.loadTime < 3000
                  ? 'Good loading time'
                  : 'Slow loading may affect user experience'
              }
            />
          )}

          <StatusIndicator
            status={safeHeaders.contentEncoding ? 'good' : 'warning'}
            label="Content Compression"
            value={safeHeaders.contentEncoding || 'Not enabled'}
            details={safeHeaders.contentEncoding ? 'Content compression is active for faster transfers' : 'Enable gzip or brotli compression to reduce bandwidth usage'}
          />

          <StatusIndicator
            status={safeHeaders.cacheControl ? 'good' : 'warning'}
            label="Cache Control"
            value={safeHeaders.cacheControl || 'Not configured'}
            details={safeHeaders.cacheControl ? 'Caching headers configured for better performance' : 'Configure cache headers to improve repeat visit performance'}
          />
        </div>
      </div>

      {/* Security & Headers Section */}
      <div className="space-y-6">
        <div className="border-b border-border pb-4">
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <Shield className="h-7 w-7 text-green-600" />
            Security & Headers
          </h2>
          <p className="text-muted-foreground mt-2">Security configuration and HTTP headers</p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <StatusIndicator
            status={metadata.url.startsWith('https://') ? 'good' : 'error'}
            label="HTTPS Security"
            value={metadata.url.startsWith('https://') ? 'Secure (HTTPS)' : 'Insecure (HTTP)'}
            details={metadata.url.startsWith('https://') ? 'Site uses encrypted HTTPS connection' : 'Critical - switch to HTTPS for security and SEO benefits'}
          />

          <StatusIndicator
            status={safeHeaders.contentSecurityPolicy ? 'good' : 'warning'}
            label="Content Security Policy"
            value={safeHeaders.contentSecurityPolicy ? 'Configured' : 'Not configured'}
            details={safeHeaders.contentSecurityPolicy ? 'CSP helps prevent XSS and injection attacks' : 'Consider adding CSP header to prevent code injection attacks'}
          />

          <StatusIndicator
            status={safeHeaders.xFrameOptions ? 'good' : 'warning'}
            label="X-Frame-Options"
            value={safeHeaders.xFrameOptions || 'Not set'}
            details={safeHeaders.xFrameOptions ? 'Protection against clickjacking attacks' : 'Add X-Frame-Options header to prevent clickjacking'}
          />

          <StatusIndicator
            status={safeHeaders.strictTransportSecurity ? 'good' : 'warning'}
            label="HSTS"
            value={safeHeaders.strictTransportSecurity ? 'Enabled' : 'Not enabled'}
            details={safeHeaders.strictTransportSecurity ? 'HTTP Strict Transport Security enforces HTTPS' : 'Enable HSTS to force HTTPS connections'}
          />

          <StatusIndicator
            status={safeHeaders.xContentTypeOptions ? 'good' : 'warning'}
            label="X-Content-Type-Options"
            value={safeHeaders.xContentTypeOptions || 'Not set'}
            details={safeHeaders.xContentTypeOptions ? 'Prevents MIME type sniffing attacks' : 'Add header to prevent MIME type confusion attacks'}
          />

          <StatusIndicator
            status={safeHeaders.server ? 'good' : 'warning'}
            label="Server Information"
            value={safeHeaders.server || 'Not disclosed'}
            details={safeHeaders.server ? 'Server type identified' : 'Server information not disclosed (security by obscurity)'}
          />
        </div>
      </div>

      {/* Technical Configuration */}
      <div className="space-y-6">
        <div className="border-b border-border pb-4">
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <Settings className="h-7 w-7 text-purple-600" />
            Technical Configuration
          </h2>
          <p className="text-muted-foreground mt-2">Core technical settings and metadata</p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <StatusIndicator
            status={metadata.seo.viewport ? 'good' : 'error'}
            label="Mobile Viewport"
            value={metadata.seo.viewport || 'Not configured'}
            details={metadata.seo.viewport ? 'Mobile-responsive viewport meta tag detected' : 'Critical - add viewport meta tag for mobile compatibility'}
          />

          {technical?.charset && (
            <StatusIndicator
              status="good"
              label="Character Encoding"
              value={technical.charset}
              details="Character encoding properly declared"
            />
          )}

          {technical?.doctype && (
            <StatusIndicator
              status="good"
              label="Document Type"
              value={technical.doctype}
              details="HTML document type declared"
            />
          )}

          {technical?.themeColor && (
            <StatusIndicator
              status="good"
              label="Theme Color"
              value={technical.themeColor}
              details="Browser theme color configured"
            />
          )}
        </div>
      </div>

      {/* Structured Data */}
      {structuredData && structuredData.length > 0 && (
        <div className="space-y-6">
          <div className="border-b border-border pb-4">
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
              <Globe className="h-7 w-7 text-indigo-600" />
              Structured Data
            </h2>
            <p className="text-muted-foreground mt-2">JSON-LD schemas for search engine understanding</p>
          </div>

          <div className="border-l-4 border-l-indigo-500 bg-indigo-50 dark:bg-indigo-950/20 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-6 w-6 text-emerald-600" />
                <div>
                  <h3 className="text-lg font-semibold text-foreground">JSON-LD Schemas</h3>
                  <p className="text-sm text-muted-foreground">
                    {structuredData.length} schema{structuredData.length === 1 ? '' : 's'} detected
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {structuredData.slice(0, 6).map((schema, index) => (
                  <div
                    key={index}
                    className="bg-white/70 dark:bg-black/30 rounded-lg px-3 py-2 border text-sm font-medium"
                  >
                    {schema.type || 'Schema'}
                  </div>
                ))}
                {structuredData.length > 6 && (
                  <div className="text-sm text-muted-foreground px-3 py-2">
                    +{structuredData.length - 6} more
                  </div>
                )}
              </div>
              <p className="text-sm text-indigo-700 dark:text-indigo-300">
                Structured data helps search engines understand your content for rich snippets and better SEO.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* HTTP Headers Details */}
      {Object.keys(safeHeaders).length > 0 && (
        <div className="space-y-6">
          <div className="border-b border-border pb-4">
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
              <Server className="h-7 w-7 text-gray-600" />
              HTTP Response Headers
            </h2>
            <p className="text-muted-foreground mt-2">Server response headers for debugging and optimization</p>
          </div>

          <div className="border-l-4 border-l-gray-500 bg-gray-50 dark:bg-gray-950/20 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <BarChart3 className="h-6 w-6 text-gray-600" />
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Response Headers</h3>
                  <p className="text-sm text-muted-foreground">
                    {Object.keys(safeHeaders).length} headers received
                  </p>
                </div>
              </div>
            </div>

            <details className="bg-white/70 dark:bg-black/30 rounded-lg p-4 border">
              <summary className="text-sm font-medium cursor-pointer hover:text-blue-600 dark:hover:text-blue-400">
                View All HTTP Headers
              </summary>
              <div className="mt-3 bg-muted/30 rounded p-3">
                <pre className="text-xs text-muted-foreground overflow-x-auto whitespace-pre-wrap max-h-40 overflow-y-auto font-mono">
                  {Object.entries(safeHeaders)
                    .map(([key, value]) => `${key}: ${value}`)
                    .join('\n')}
                </pre>
              </div>
            </details>
          </div>
        </div>
      )}

      {/* Site Discovery */}
      <SiteDiscovery metadata={metadata} />
    </div>
  )
}
