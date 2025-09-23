'use client'

import React from 'react'
import { WebsiteMetadata } from '@/types/metadata'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  Settings,
  Zap,
  Shield,
  Info,
  BarChart3
} from 'lucide-react'
import SiteDiscovery from '@/components/SiteDiscovery'

interface TechnicalSectionProps {
  metadata?: WebsiteMetadata | null
}

export default function TechnicalSection ({ metadata }: TechnicalSectionProps) {
  if (!metadata) {
    return (
      <div className='w-full'>
        <div className='text-center py-16 text-gray-500 dark:text-gray-400'>
          <div className='text-xl'>Loading technical data...</div>
        </div>
      </div>
    )
  }

  const { technical, headers, structuredData, performance } =
    metadata

  // Ensure headers object exists to prevent rendering issues
  const safeHeaders = headers || {}

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const SimpleListItem = ({
    label,
    value,
    status,
    customStatusText
  }: {
    label: string
    value?: string | boolean
    status: 'good' | 'warning' | 'missing' | 'error'
    customStatusText?: string
  }) => {
    const statusText =
      customStatusText ||
      (status === 'good'
        ? 'Good'
        : status === 'warning'
        ? 'Warning'
        : status === 'error'
        ? 'Poor'
        : 'Missing')

    let displayValue = ''
    if (typeof value === 'boolean') {
      displayValue = value ? 'Enabled' : 'Disabled'
    } else if (value) {
      displayValue = value.toString()
    } else {
      displayValue = 'Not configured'
    }

    const getBgColor = () => {
      switch (status) {
        case 'good':
          return 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800/30'
        case 'warning':
          return 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-800/30'
        default:
          return 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800/30'
      }
    }

    const getStatusColor = () => {
      switch (status) {
        case 'good':
          return 'text-green-700 dark:text-green-300'
        case 'warning':
          return 'text-yellow-700 dark:text-yellow-300'
        default:
          return 'text-red-700 dark:text-red-300'
      }
    }

    const getStatusIcon = () => {
      switch (status) {
        case 'good':
          return <CheckCircle className='h-4 w-4 text-green-600' />
        case 'warning':
          return <AlertTriangle className='h-4 w-4 text-yellow-600' />
        default:
          return <XCircle className='h-4 w-4 text-red-600' />
      }
    }

    return (
      <div className={`border rounded-lg p-3 ${getBgColor()}`}>
        <div className='flex items-center justify-between mb-2'>
          <div className='flex items-center gap-2'>
            {getStatusIcon()}
            <h4 className='font-medium text-foreground text-sm'>{label}</h4>
          </div>
          <span className={`text-xs font-medium px-2 py-1 rounded ${getStatusColor()}`}>
            {statusText}
          </span>
        </div>

        <div className='space-y-2'>
          <p className='text-sm text-muted-foreground line-clamp-2'>
            {displayValue}
          </p>
          {!value && (
            <p className={`text-xs ${getStatusColor()}`}>
              Consider configuring for better performance and security
            </p>
          )}
        </div>
      </div>
    )
  }

  const getSecurityStatus = () => {
    const isHTTPS = metadata.url.startsWith('https://') || false
    return isHTTPS ? 'good' : 'warning'
  }

  const getIssueCount = () => {
    let issues = 0
    // HTTPS check
    if (!metadata.url.startsWith('https://')) issues++
    // Viewport check
    if (!metadata.seo.viewport) issues++
    // Essential security headers checks
    if (!safeHeaders.contentSecurityPolicy) issues++
    if (!safeHeaders.xFrameOptions) issues++
    if (!safeHeaders.xContentTypeOptions) issues++
    if (!safeHeaders.strictTransportSecurity) issues++
    return issues
  }

  return (
    <div className='w-full space-y-10'>
      {/* Header */}
      <div className='flex items-center justify-end'>
        <div className='flex items-center gap-3'>
          <Settings className='h-4 w-4 text-purple-600' />
          <div className='text-right'>
            <div
              className={`text-2xl font-bold ${
                getIssueCount() === 0
                  ? 'text-emerald-600'
                  : getIssueCount() <= 2
                  ? 'text-amber-600'
                  : 'text-red-600'
              }`}
            >
              {getIssueCount()}
            </div>
            <div className='text-sm text-gray-500'>
              {getIssueCount() === 1 ? 'issue found' : 'issues found'}
            </div>
          </div>
        </div>
      </div>

      {/* Technical Analysis */}
      <div className='max-w-2xl mx-auto'>
        <Accordion type="multiple" className="w-full space-y-4" defaultValue={["performance", "security", "configuration"]}>


          {/* Performance Section */}
          <AccordionItem value="performance" className="border border-border/50 rounded-lg bg-card/30">
            <AccordionTrigger className="px-4 py-3 hover:no-underline">
              <div className='flex items-center gap-3'>
                <Zap className='h-5 w-5 text-blue-600' />
                <span className='font-medium text-foreground'>Performance</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className='space-y-4'>
            {performance?.contentLength && (
              <SimpleListItem
                label='Page Size'
                value={formatBytes(performance.contentLength)}
                status={
                  performance.contentLength < 1000000
                    ? 'good'
                    : performance.contentLength < 5000000
                    ? 'warning'
                    : 'error'
                }
                customStatusText={
                  performance.contentLength < 1000000
                    ? 'Optimized'
                    : performance.contentLength < 5000000
                    ? 'Acceptable'
                    : 'Large'
                }
              />
            )}
            {performance?.loadTime && (
              <SimpleListItem
                label='Load Time'
                value={`${performance.loadTime}ms`}
                status={
                  performance.loadTime < 1000
                    ? 'good'
                    : performance.loadTime < 3000
                    ? 'warning'
                    : 'error'
                }
                customStatusText={
                  performance.loadTime < 1000
                    ? 'Excellent'
                    : performance.loadTime < 3000
                    ? 'Good'
                    : 'Slow'
                }
              />
            )}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Security Section */}
          <AccordionItem value="security" className="border border-border/50 rounded-lg bg-card/30">
            <AccordionTrigger className="px-4 py-3 hover:no-underline">
              <div className='flex items-center gap-3'>
                <Shield className='h-5 w-5 text-green-600' />
                <span className='font-medium text-foreground'>Security & Headers</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className='space-y-4'>
            <SimpleListItem
              label='Server'
              value={safeHeaders.server}
              status={safeHeaders.server ? 'good' : 'warning'}
              customStatusText={safeHeaders.server ? 'Good' : 'Missing'}
            />

            <SimpleListItem
              label='Compression'
              value={safeHeaders.contentEncoding}
              status={safeHeaders.contentEncoding ? 'good' : 'warning'}
              customStatusText={safeHeaders.contentEncoding ? 'Enabled' : 'Not Enabled'}
            />

            <SimpleListItem
              label='Cache Control'
              value={safeHeaders.cacheControl}
              status={safeHeaders.cacheControl ? 'good' : 'warning'}
              customStatusText={safeHeaders.cacheControl ? 'Configured' : 'Not Configured'}
            />

            <SimpleListItem
              label='HTTPS'
              value={
                metadata.url.startsWith('https://') ? 'Secure' : 'Insecure'
              }
              status={getSecurityStatus()}
            />

              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Technical Configuration */}
          <AccordionItem value="configuration" className="border border-border/50 rounded-lg bg-card/30">
            <AccordionTrigger className="px-4 py-3 hover:no-underline">
              <div className='flex items-center gap-3'>
                <Settings className='h-5 w-5 text-purple-600' />
                <span className='font-medium text-foreground'>Technical Configuration</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className='space-y-4'>
            <SimpleListItem
              label='Mobile Responsive'
              value={metadata.seo.viewport}
              status={metadata.seo.viewport ? 'good' : 'warning'}
            />

            <SimpleListItem
              label='Content Security Policy'
              value={safeHeaders.contentSecurityPolicy ? 'Configured' : undefined}
              status={safeHeaders.contentSecurityPolicy ? 'good' : 'warning'}
              customStatusText={safeHeaders.contentSecurityPolicy ? 'Configured' : 'Missing'}
            />

            <SimpleListItem
              label='X-Frame-Options'
              value={safeHeaders.xFrameOptions}
              status={safeHeaders.xFrameOptions ? 'good' : 'warning'}
              customStatusText={safeHeaders.xFrameOptions ? 'Configured' : 'Missing'}
            />

            <SimpleListItem
              label='X-Content-Type-Options'
              value={safeHeaders.xContentTypeOptions}
              status={safeHeaders.xContentTypeOptions ? 'good' : 'warning'}
              customStatusText={safeHeaders.xContentTypeOptions ? 'Configured' : 'Missing'}
            />

            <SimpleListItem
              label='HSTS (Strict-Transport-Security)'
              value={safeHeaders.strictTransportSecurity ? 'Enabled' : undefined}
              status={safeHeaders.strictTransportSecurity ? 'good' : 'warning'}
              customStatusText={safeHeaders.strictTransportSecurity ? 'Enabled' : 'Missing'}
            />

            {technical?.themeColor && (
              <SimpleListItem
                label='Theme Color'
                value={technical.themeColor}
                status='good'
              />
            )}


            <div className='bg-card/30 border border-border/50 rounded-lg p-4 hover:bg-card/50 transition-colors'>
              <div className='flex items-start gap-3'>
                <div
                  className={`flex-shrink-0 ${
                    structuredData && structuredData.length > 0
                      ? 'text-emerald-600'
                      : 'text-red-600'
                  }`}
                >
                  {structuredData && structuredData.length > 0 ? (
                    <CheckCircle className='h-4 w-4' />
                  ) : (
                    <XCircle className='h-4 w-4' />
                  )}
                </div>
                <div className='flex-1 min-w-0'>
                  <div className='flex items-start justify-between mb-3'>
                    <div className='flex-1'>
                      <h4 className='font-medium text-foreground text-sm'>
                        JSON-LD / Structured Data
                      </h4>
                    </div>
                    <div
                      className={`ml-3 flex-shrink-0 ${
                        structuredData && structuredData.length > 0
                          ? 'analysis-badge-success'
                          : 'analysis-badge-error'
                      }`}
                    >
                      {structuredData && structuredData.length > 0
                        ? `${structuredData.length} ${
                            structuredData.length === 1 ? 'schema' : 'schemas'
                          }`
                        : 'Missing'}
                    </div>
                  </div>

                  {structuredData && structuredData.length > 0 ? (
                    <div className='space-y-3'>
                      <div className='flex flex-wrap gap-2'>
                        {structuredData.slice(0, 4).map((schema, index) => (
                          <div
                            key={index}
                            className='analysis-text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1.5 rounded-md border border-blue-200 dark:border-blue-800/30 font-medium'
                          >
                            {schema.type || 'Schema'}
                          </div>
                        ))}
                        {structuredData.length > 4 && (
                          <span className='analysis-text-xs text-muted-foreground px-3 py-1.5'>
                            +{structuredData.length - 4} more
                          </span>
                        )}
                      </div>

                      <details className='mt-3'>
                        <summary className='analysis-text-xs text-blue-600 dark:text-blue-400 cursor-pointer hover:text-blue-700 dark:hover:text-blue-300 font-medium flex items-center gap-2'>
                          <Info className='h-3 w-3' /> View JSON-LD
                          Configuration
                        </summary>
                        <div className='mt-3 space-y-3'>
                          {structuredData.slice(0, 2).map((schema, index) => (
                            <div
                              key={index}
                              className='bg-muted/30 rounded-lg p-3 border border-border/30'
                            >
                              <div className='analysis-text-xs font-semibold text-foreground mb-2'>
                                {schema.type ||
                                  `Schema ${index + 1}`}
                              </div>
                              <pre className='analysis-text-xs text-muted-foreground overflow-x-auto whitespace-pre-wrap max-h-32 overflow-y-auto font-mono'>
                                {JSON.stringify(schema, null, 2)}
                              </pre>
                            </div>
                          ))}
                        </div>
                      </details>

                      <p className='analysis-text-xs text-muted-foreground mt-3 pl-3 border-l-2 border-border/40'>
                        Structured data helps search engines understand your
                        content for rich snippets
                      </p>
                    </div>
                  ) : (
                    <div className='space-y-2'>
                      <p className='text-red-600 dark:text-red-400 analysis-text-sm font-medium'>
                        No structured data found
                      </p>
                      <p className='analysis-text-xs text-muted-foreground pl-3 border-l-2 border-border/40'>
                        Add JSON-LD schemas for better SEO and rich snippets in
                        search results
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {technical?.charset && (
              <SimpleListItem
                label='Character Encoding'
                value={technical.charset}
                status='good'
              />
            )}

            {technical?.doctype && (
              <SimpleListItem
                label='Document Type'
                value={technical.doctype}
                status='good'
              />
            )}

            {/* HTTP Headers Details */}
            {Object.keys(safeHeaders).length > 0 && (
              <div className='bg-card/30 border border-border/50 rounded-lg p-4 hover:bg-card/50 transition-colors'>
                <div className='flex items-start gap-3'>
                  <div className='flex-shrink-0 text-blue-600'>
                    <BarChart3 className='h-4 w-4' />
                  </div>
                  <div className='flex-1 min-w-0'>
                    <div className='flex items-start justify-between mb-3'>
                      <div className='flex-1'>
                        <h4 className='font-medium text-foreground text-sm'>
                          HTTP Headers
                        </h4>
                      </div>
                      <div className='ml-3 flex-shrink-0 analysis-badge-success'>
                        {Object.keys(safeHeaders).length} headers
                      </div>
                    </div>

                    <div className='space-y-3'>
                      <details className='bg-muted/30 rounded-md p-3'>
                        <summary className='text-xs text-blue-600 dark:text-blue-400 cursor-pointer hover:text-blue-700 dark:hover:text-blue-300 font-medium'>
                          View All HTTP Headers
                        </summary>
                        <div className='mt-3 bg-background/50 rounded p-2'>
                          <pre className='text-xs text-muted-foreground overflow-x-auto whitespace-pre-wrap max-h-40 overflow-y-auto font-mono'>
                            {Object.entries(safeHeaders)
                              .map(([key, value]) => `${key}: ${value}`)
                              .join('\n')}
                          </pre>
                        </div>
                      </details>
                      <div className='bg-muted/30 rounded-md p-3 text-xs text-muted-foreground'>
                        Server response headers for debugging and optimization
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      {/* Site Discovery */}
      <SiteDiscovery metadata={metadata} />
    </div>
  )
}
