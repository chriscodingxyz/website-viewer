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

  // Clean status indicator component - matching sidebar style
  const StatusIndicator = ({ status, label, value, details }: {
    status: 'good' | 'warning' | 'error'
    label: string
    value?: string
    details?: string
  }) => {
    const statusConfig = {
      good: {
        icon: <CheckCircle className="h-4 w-4 text-green-600" />,
        dotClass: "w-2 h-2 bg-green-500 rounded-full"
      },
      warning: {
        icon: <AlertTriangle className="h-4 w-4 text-orange-600" />,
        dotClass: "w-2 h-2 bg-orange-500 rounded-full"
      },
      error: {
        icon: <XCircle className="h-4 w-4 text-red-600" />,
        dotClass: "w-2 h-2 bg-red-500 rounded-full"
      }
    }

    const config = statusConfig[status]

    return (
      <div className="flex items-start gap-3 p-3 bg-card border border-border rounded-lg">
        <div className={config.dotClass} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h4 className="text-sm font-medium text-foreground">{label}</h4>
            {config.icon}
          </div>
          {value && (
            <p className="text-sm text-foreground mb-1 break-words">{value}</p>
          )}
          {details && (
            <p className="text-xs text-muted-foreground">{details}</p>
          )}
        </div>
      </div>
    )
  }

  // Clean Technical Score component - matching sidebar style
  const TechnicalScoreDisplay = () => {
    const getScoreColor = () => {
      if (technicalScore.percentage >= 80) return 'bg-green-500'
      if (technicalScore.percentage >= 60) return 'bg-orange-500'
      return 'bg-red-500'
    }

    return (
      <div className="bg-card border border-border rounded-lg p-3 mb-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-muted rounded-md flex items-center justify-center">
              <Settings className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Technical Health Score</h3>
              <p className="text-xs text-muted-foreground">Security and configuration status</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-foreground">{technicalScore.percentage}%</div>
            <div className="text-xs text-muted-foreground">{technicalScore.score}/{technicalScore.maxScore} checks passed</div>
          </div>
        </div>

        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={getScoreColor()}
            style={{ width: `${technicalScore.percentage}%` }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3 p-3">
      {/* Technical Score Header */}
      <TechnicalScoreDisplay />

      {/* Performance Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-muted-foreground" />
          <div>
            <h2 className="text-sm font-semibold text-foreground">Performance Metrics</h2>
            <p className="text-xs text-muted-foreground">Website speed and optimization indicators</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-3">
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
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-muted-foreground" />
          <div>
            <h2 className="text-sm font-semibold text-foreground">Security & Headers</h2>
            <p className="text-xs text-muted-foreground">Security configuration and HTTP headers</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-3">
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
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Settings className="h-4 w-4 text-muted-foreground" />
          <div>
            <h2 className="text-sm font-semibold text-foreground">Technical Configuration</h2>
            <p className="text-xs text-muted-foreground">Core technical settings and metadata</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-3">
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
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <div>
              <h2 className="text-sm font-semibold text-foreground">Structured Data</h2>
              <p className="text-xs text-muted-foreground">JSON-LD schemas for search engine understanding</p>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-3">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div>
                  <h3 className="text-sm font-medium text-foreground">JSON-LD Schemas</h3>
                  <p className="text-xs text-muted-foreground">
                    {structuredData.length} schema{structuredData.length === 1 ? '' : 's'} detected
                  </p>
                </div>
              </div>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {structuredData.slice(0, 6).map((schema, index) => (
                  <div
                    key={index}
                    className="bg-muted/50 rounded-sm px-3 py-2 border border-border text-sm font-medium text-foreground"
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
              <p className="text-xs text-muted-foreground">
                Structured data helps search engines understand your content for rich snippets and better SEO.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* HTTP Headers Details */}
      {Object.keys(safeHeaders).length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Server className="h-4 w-4 text-muted-foreground" />
            <div>
              <h2 className="text-sm font-semibold text-foreground">HTTP Response Headers</h2>
              <p className="text-xs text-muted-foreground">Server response headers for debugging and optimization</p>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-3">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div>
                  <h3 className="text-sm font-medium text-foreground">Response Headers</h3>
                  <p className="text-xs text-muted-foreground">
                    {Object.keys(safeHeaders).length} headers received
                  </p>
                </div>
              </div>
              <Info className="h-4 w-4 text-blue-600" />
            </div>

            <details className="bg-muted/50 rounded-sm p-3 border border-border">
              <summary className="text-sm font-medium cursor-pointer hover:text-foreground">
                View All HTTP Headers
              </summary>
              <div className="mt-2 bg-muted/30 rounded-sm p-3">
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
