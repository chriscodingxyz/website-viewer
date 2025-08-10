'use client'

import React from 'react'
import { WebsiteMetadata } from '@/types/metadata'
import { Badge } from '@/components/ui/badge'
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

  const { technical, headers, icons, structuredData, performance, analytics } =
    metadata

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const SimpleListItem = ({
    icon,
    label,
    value,
    status,
    customStatusText
  }: {
    icon: string
    label: string
    value?: string | boolean
    status: 'good' | 'warning' | 'missing' | 'error'
    customStatusText?: string
  }) => {
    const statusIcon =
      status === 'good' ? (
        <CheckCircle className='h-4 w-4' />
      ) : status === 'warning' ? (
        <AlertTriangle className='h-4 w-4' />
      ) : (
        <XCircle className='h-4 w-4' />
      )

    const badgeClass =
      status === 'good'
        ? 'analysis-badge-success'
        : status === 'warning'
        ? 'analysis-badge-warning'
        : 'analysis-badge-error'

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

    return (
      <div className='analysis-list-item'>
        <div className='flex items-start gap-4'>
          <div
            className={`mt-0.5 ${
              status === 'good'
                ? 'text-emerald-600'
                : status === 'warning'
                ? 'text-amber-600'
                : 'text-red-600'
            }`}
          >
            {statusIcon}
          </div>
          <div className='flex-1 min-w-0'>
            <div className='flex items-center justify-between mb-2'>
              <span className='font-semibold text-foreground analysis-text-sm'>
                {label}
              </span>
              <div className={badgeClass}>{statusText}</div>
            </div>

            <div className='space-y-2'>
              <p className='text-muted-foreground analysis-text-sm leading-relaxed break-words'>
                {displayValue}
              </p>
              {!value && (
                <p className='analysis-text-xs text-muted-foreground pl-3 border-l-2 border-border/40'>
                  Consider configuring for better performance and security
                </p>
              )}
            </div>
          </div>
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
    if (!metadata.url.startsWith('https://')) issues++
    if (!metadata.seo.viewport) issues++
    if (!headers?.['content-security-policy']) issues++
    return issues
  }

  return (
    <div className='w-full space-y-10'>
      {/* Header */}
      <div className='flex items-center justify-end'>
        <div className='flex items-center gap-3'>
          <div className='flex items-center gap-2'>
            <Settings className='h-4 w-4 text-purple-600' />
            <Badge
              variant='outline'
              className='text-xs bg-blue-50 text-blue-700 border-blue-200'
            >
              Performance
            </Badge>
            <Badge
              variant='outline'
              className='text-xs bg-green-50 text-green-700 border-green-200'
            >
              Security
            </Badge>
            <Badge
              variant='outline'
              className='text-xs bg-purple-50 text-purple-700 border-purple-200'
            >
              Config
            </Badge>
          </div>
        </div>
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

      {/* Technical Analysis */}
      <div className='max-w-2xl mx-auto space-y-8'>
        {performance?.size && (
          <div className='analysis-list-item'>
            <div className='flex items-start gap-4'>
              <div
                className={`mt-0.5 ${
                  performance.size < 1000000
                    ? 'text-emerald-600'
                    : performance.size < 5000000
                    ? 'text-amber-600'
                    : 'text-red-600'
                }`}
              >
                <Settings className='h-4 w-4' />
              </div>
              <div className='flex-1 min-w-0'>
                <div className='flex items-center justify-between mb-2'>
                  <span className='font-semibold text-foreground analysis-text-sm'>
                    Page Size
                  </span>
                  <div
                    className={`analysis-badge ${
                      performance.size < 1000000
                        ? 'analysis-badge-success'
                        : performance.size < 5000000
                        ? 'analysis-badge-warning'
                        : 'analysis-badge-error'
                    }`}
                  >
                    {performance.size < 1000000
                      ? 'Optimized'
                      : performance.size < 5000000
                      ? 'Acceptable'
                      : 'Large'}
                  </div>
                </div>
                <p className='text-muted-foreground analysis-text-sm leading-relaxed'>
                  {formatBytes(performance.size)}
                </p>
              </div>
            </div>
          </div>
        )}

        {performance?.requests && (
          <div className='py-3 text-sm'>
            <div className='flex items-start gap-3'>
              <span className='text-base mt-0.5'>🔗</span>
              <div className='flex-1 min-w-0'>
                <div className='flex items-center justify-between mb-1'>
                  <span className='font-bold text-gray-900 dark:text-gray-100'>
                    HTTP Requests
                  </span>
                  <Badge
                    variant='outline'
                    className={`text-xs shrink-0 ${
                      performance.requests < 50
                        ? 'bg-green-50 text-green-700 border-green-300'
                        : performance.requests < 100
                        ? 'bg-yellow-50 text-yellow-700 border-yellow-300'
                        : 'bg-red-50 text-red-700 border-red-300'
                    }`}
                  >
                    {performance.requests < 50
                      ? 'Good'
                      : performance.requests < 100
                      ? 'Fair'
                      : 'Many'}
                  </Badge>
                </div>
                <p className='text-gray-700 dark:text-gray-300'>
                  &quot;{performance.requests}&quot;
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Performance Section */}
        <div className='space-y-6 bg-gradient-to-r from-blue-50 to-transparent dark:from-blue-900/20 rounded-lg p-4'>
          <div className='flex items-center gap-3'>
            <div className='p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg'>
              <Zap className='h-5 w-5 text-blue-600 dark:text-blue-400' />
            </div>
            <h3 className='text-xl font-semibold text-foreground'>
              Performance
            </h3>
          </div>
          <div className='space-y-4'>
            {performance?.loadTime && (
              <SimpleListItem
                icon='⚡'
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
        </div>

        {/* Security Section */}
        <div className='space-y-6 bg-gradient-to-r from-green-50 to-transparent dark:from-green-900/20 rounded-lg p-4'>
          <div className='flex items-center gap-3'>
            <div className='p-2 bg-green-100 dark:bg-green-900/40 rounded-lg'>
              <Shield className='h-5 w-5 text-green-600 dark:text-green-400' />
            </div>
            <h3 className='text-xl font-semibold text-foreground'>
              Security & Headers
            </h3>
          </div>
          <div className='space-y-4'>
            {/* Server and Compression */}
            {headers?.server && (
              <div className='py-3 text-sm'>
                <div className='flex items-start gap-3'>
                  <span className='text-base mt-0.5'>🖥️</span>
                  <div className='flex-1 min-w-0'>
                    <div className='flex items-center justify-between mb-1'>
                      <span className='font-bold text-gray-900 dark:text-gray-100'>
                        Server
                      </span>
                      <Badge
                        variant='outline'
                        className='text-xs shrink-0 bg-green-50 text-green-700 border-green-300'
                      >
                        Good
                      </Badge>
                    </div>
                    <p className='text-gray-700 dark:text-gray-300'>
                      &quot;{headers.server}&quot;
                    </p>
                  </div>
                </div>
              </div>
            )}

            {headers?.['content-encoding'] && (
              <div className='py-3 text-sm'>
                <div className='flex items-start gap-3'>
                  <span className='text-base mt-0.5'>🗜️</span>
                  <div className='flex-1 min-w-0'>
                    <div className='flex items-center justify-between mb-1'>
                      <span className='font-bold text-gray-900 dark:text-gray-100'>
                        Compression
                      </span>
                      <Badge
                        variant='outline'
                        className='text-xs shrink-0 bg-green-50 text-green-700 border-green-300'
                      >
                        Enabled
                      </Badge>
                    </div>
                    <p className='text-gray-700 dark:text-gray-300'>
                      &quot;{headers['content-encoding']}&quot;
                    </p>
                  </div>
                </div>
              </div>
            )}

            {headers?.['cache-control'] && (
              <div className='py-3 text-sm'>
                <div className='flex items-start gap-3'>
                  <span className='text-base mt-0.5'>💾</span>
                  <div className='flex-1 min-w-0'>
                    <div className='flex items-center justify-between mb-1'>
                      <span className='font-bold text-gray-900 dark:text-gray-100'>
                        Cache Control
                      </span>
                      <Badge
                        variant='outline'
                        className='text-xs shrink-0 bg-green-50 text-green-700 border-green-300'
                      >
                        Configured
                      </Badge>
                    </div>
                    <p className='text-gray-700 dark:text-gray-300'>
                      &quot;{headers['cache-control']}&quot;
                    </p>
                  </div>
                </div>
              </div>
            )}

            <SimpleListItem
              icon='🔒'
              label='HTTPS'
              value={
                metadata.url.startsWith('https://') ? 'Secure' : 'Insecure'
              }
              status={getSecurityStatus()}
            />

            {headers?.['content-security-policy'] ? (
              <SimpleListItem
                icon='🛡️'
                label='Content Security Policy'
                value='Configured'
                status='good'
              />
            ) : (
              <SimpleListItem
                icon='🛡️'
                label='Content Security Policy'
                value={undefined}
                status='warning'
              />
            )}
          </div>
        </div>

        {/* Technical Configuration */}
        <div className='space-y-6 bg-gradient-to-r from-purple-50 to-transparent dark:from-purple-900/20 rounded-lg p-4'>
          <div className='flex items-center gap-3'>
            <div className='p-2 bg-purple-100 dark:bg-purple-900/40 rounded-lg'>
              <Settings className='h-5 w-5 text-purple-600 dark:text-purple-400' />
            </div>
            <h3 className='text-xl font-semibold text-foreground'>
              Technical Configuration
            </h3>
          </div>
          <div className='space-y-4'>
            <SimpleListItem
              icon='📱'
              label='Mobile Responsive'
              value={metadata.seo.viewport}
              status={metadata.seo.viewport ? 'good' : 'warning'}
            />

            {technical?.themeColor && (
              <SimpleListItem
                icon='🎨'
                label='Theme Color'
                value={technical.themeColor}
                status='good'
              />
            )}

            {icons && icons.length > 0 ? (
              <div className='analysis-list-item'>
                <div className='flex items-start gap-4'>
                  <div className='mt-0.5 text-emerald-600'>
                    <CheckCircle className='h-4 w-4' />
                  </div>
                  <div className='flex-1 min-w-0'>
                    <div className='flex items-center justify-between mb-2'>
                      <span className='font-semibold text-foreground analysis-text-sm'>
                        Favicons
                      </span>
                      <div className='analysis-badge-success'>
                        {icons.length} {icons.length === 1 ? 'icon' : 'icons'}
                      </div>
                    </div>

                    <div className='space-y-3'>
                      {icons.slice(0, 4).map((icon, index) => (
                        <div
                          key={index}
                          className='flex items-center gap-3 p-3 bg-muted/30 rounded-lg border border-border/30'
                        >
                          <div className='flex items-center gap-3'>
                            {icon.href && (
                              <img
                                src={icon.href}
                                alt={`${icon.sizes || 'favicon'}`}
                                className='w-8 h-8 rounded border bg-background shadow-sm'
                                onError={e => {
                                  e.currentTarget.src =
                                    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik04IDhIMTZWMTZIOFY4WiIgc3Ryb2tlPSIjOUNBM0FGIiBzdHJva2Utd2lkdGg9IjIiIGZpbGw9Im5vbmUiLz4KPC9zdmc+Cg=='
                                }}
                              />
                            )}
                            <div className='flex-1 min-w-0'>
                              <div className='flex items-center gap-2 mb-1'>
                                <span className='analysis-text-sm font-medium text-foreground'>
                                  {icon.rel || 'icon'}
                                </span>
                                {icon.sizes && (
                                  <span className='analysis-text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded border border-blue-200 dark:border-blue-800/30'>
                                    {icon.sizes}
                                  </span>
                                )}
                              </div>
                              {icon.type && (
                                <span className='analysis-text-xs text-muted-foreground'>
                                  {icon.type}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      {icons.length > 4 && (
                        <p className='analysis-text-xs text-muted-foreground text-center py-2'>
                          +{icons.length - 4} more{' '}
                          {icons.length - 4 === 1 ? 'icon' : 'icons'}
                        </p>
                      )}
                    </div>

                    <p className='analysis-text-xs text-muted-foreground mt-3 pl-3 border-l-2 border-border/40'>
                      Icons help browsers display your site in tabs, bookmarks,
                      and shortcuts
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <SimpleListItem
                icon='favicon'
                label='Favicons'
                value={undefined}
                status='warning'
              />
            )}

            <div className='analysis-list-item'>
              <div className='flex items-start gap-4'>
                <div
                  className={`mt-0.5 ${
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
                  <div className='flex items-center justify-between mb-2'>
                    <span className='font-semibold text-foreground analysis-text-sm'>
                      JSON-LD / Structured Data
                    </span>
                    <div
                      className={`analysis-badge ${
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
                            {schema['@type'] || schema.type || 'Schema'}
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
                                {schema['@type'] ||
                                  schema.type ||
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

            {headers?.['x-frame-options'] && (
              <SimpleListItem
                icon='🔐'
                label='X-Frame-Options'
                value={headers['x-frame-options']}
                status='good'
              />
            )}

            {headers?.['x-content-type-options'] && (
              <SimpleListItem
                icon='🛡️'
                label='X-Content-Type-Options'
                value={headers['x-content-type-options']}
                status='good'
              />
            )}

            {headers?.['strict-transport-security'] && (
              <SimpleListItem
                icon='🔒'
                label='HSTS'
                value='Enabled'
                status='good'
              />
            )}

            {technical?.charset && (
              <SimpleListItem
                icon='📝'
                label='Character Encoding'
                value={technical.charset}
                status='good'
              />
            )}

            {technical?.doctype && (
              <SimpleListItem
                icon='📄'
                label='Document Type'
                value={technical.doctype}
                status='good'
              />
            )}

            {/* HTTP Headers Details */}
            {Object.keys(headers || {}).length > 0 && (
              <div className='py-3 text-sm'>
                <div className='flex items-start gap-3'>
                  <span className='text-base mt-0.5'>📡</span>
                  <div className='flex-1 min-w-0'>
                    <div className='flex items-center justify-between mb-1'>
                      <span className='font-bold text-gray-900 dark:text-gray-100'>
                        HTTP Headers
                      </span>
                      <Badge
                        variant='outline'
                        className='text-xs shrink-0 bg-blue-50 text-blue-700 border-blue-300'
                      >
                        {Object.keys(headers || {}).length} headers
                      </Badge>
                    </div>

                    <details className='mt-2'>
                      <summary className='text-xs text-blue-600 dark:text-blue-400 cursor-pointer hover:text-blue-700 dark:hover:text-blue-300'>
                        View All HTTP Headers
                      </summary>
                      <div className='mt-2 bg-gray-50 dark:bg-gray-800 rounded p-2'>
                        <pre className='text-xs text-gray-600 dark:text-gray-400 overflow-x-auto whitespace-pre-wrap'>
                          {Object.entries(headers || {})
                            .map(([key, value]) => `${key}: ${value}`)
                            .join('\n')}
                        </pre>
                      </div>
                    </details>

                    <p className='text-xs text-gray-500 dark:text-gray-400 mt-1'>
                      Server response headers for debugging and optimization
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Analytics Section */}
            {analytics && (
              <div className='analysis-list-item'>
                <div className='flex items-start gap-4'>
                  <div
                    className={`mt-0.5 ${
                      analytics.googleAnalytics.present ||
                      analytics.googleTagManager.present ||
                      analytics.otherAnalytics.some(a => a.detected)
                        ? 'text-emerald-600'
                        : 'text-red-600'
                    }`}
                  >
                    {analytics.googleAnalytics.present ||
                    analytics.googleTagManager.present ||
                    analytics.otherAnalytics.some(a => a.detected) ? (
                      <CheckCircle className='h-4 w-4' />
                    ) : (
                      <XCircle className='h-4 w-4' />
                    )}
                  </div>
                  <div className='flex-1 min-w-0'>
                    <div className='flex items-center justify-between mb-2'>
                      <span className='font-semibold text-foreground analysis-text-sm'>
                        Analytics
                      </span>
                      <div
                        className={`analysis-badge ${
                          analytics.googleAnalytics.present ||
                          analytics.googleTagManager.present ||
                          analytics.otherAnalytics.some(a => a.detected)
                            ? 'analysis-badge-success'
                            : 'analysis-badge-error'
                        }`}
                      >
                        {(() => {
                          const totalTools = [
                            analytics.googleAnalytics.present,
                            analytics.googleTagManager.present,
                            ...analytics.otherAnalytics.map(
                              tool => tool.detected
                            )
                          ].filter(Boolean).length
                          return totalTools > 0
                            ? `${totalTools} ${
                                totalTools === 1 ? 'tool' : 'tools'
                              }`
                            : 'None'
                        })()}
                      </div>
                    </div>

                    <div className='space-y-3'>
                      {/* Google Analytics */}
                      <div className='flex items-center gap-3'>
                        <div
                          className={`w-2 h-2 rounded-full ${
                            analytics.googleAnalytics.present
                              ? 'bg-green-500'
                              : 'bg-gray-300'
                          }`}
                        ></div>
                        <span className='analysis-text-sm font-medium text-foreground'>
                          Google Analytics
                        </span>
                        {analytics.googleAnalytics.present &&
                          analytics.googleAnalytics.trackingIds.length > 0 && (
                            <div className='flex gap-1'>
                              {analytics.googleAnalytics.trackingIds
                                .slice(0, 2)
                                .map((id, index) => (
                                  <Badge
                                    key={index}
                                    variant='outline'
                                    className='text-xs font-mono'
                                  >
                                    {id}
                                  </Badge>
                                ))}
                              {analytics.googleAnalytics.trackingIds.length >
                                2 && (
                                <Badge variant='outline' className='text-xs'>
                                  +
                                  {analytics.googleAnalytics.trackingIds
                                    .length - 2}
                                </Badge>
                              )}
                            </div>
                          )}
                      </div>

                      {/* Google Tag Manager */}
                      <div className='flex items-center gap-3'>
                        <div
                          className={`w-2 h-2 rounded-full ${
                            analytics.googleTagManager.present
                              ? 'bg-green-500'
                              : 'bg-gray-300'
                          }`}
                        ></div>
                        <span className='analysis-text-sm font-medium text-foreground'>
                          Google Tag Manager
                        </span>
                        {analytics.googleTagManager.present &&
                          analytics.googleTagManager.containerIds.length >
                            0 && (
                            <div className='flex gap-1'>
                              {analytics.googleTagManager.containerIds
                                .slice(0, 2)
                                .map((id, index) => (
                                  <Badge
                                    key={index}
                                    variant='outline'
                                    className='text-xs font-mono'
                                  >
                                    {id}
                                  </Badge>
                                ))}
                              {analytics.googleTagManager.containerIds.length >
                                2 && (
                                <Badge variant='outline' className='text-xs'>
                                  +
                                  {analytics.googleTagManager.containerIds
                                    .length - 2}
                                </Badge>
                              )}
                            </div>
                          )}
                      </div>

                      {/* Other Analytics Tools */}
                      {analytics.otherAnalytics.filter(tool => tool.detected)
                        .length > 0 && (
                        <div className='space-y-2'>
                          <div className='analysis-text-xs text-muted-foreground font-medium'>
                            Other Tools:
                          </div>
                          <div className='flex flex-wrap gap-2'>
                            {analytics.otherAnalytics
                              .filter(tool => tool.detected)
                              .slice(0, 4)
                              .map((tool, index) => (
                                <div
                                  key={index}
                                  className='flex items-center gap-1 px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded border border-blue-200 dark:border-blue-800/30'
                                >
                                  <div className='w-1.5 h-1.5 rounded-full bg-green-500'></div>
                                  <span className='analysis-text-xs font-medium'>
                                    {tool.name}
                                  </span>
                                </div>
                              ))}
                            {analytics.otherAnalytics.filter(
                              tool => tool.detected
                            ).length > 4 && (
                              <div className='px-2 py-1 text-xs text-muted-foreground'>
                                +
                                {analytics.otherAnalytics.filter(
                                  tool => tool.detected
                                ).length - 4}{' '}
                                more
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Implementation Details */}
                      {analytics.googleAnalytics.present && (
                        <div className='analysis-text-xs text-muted-foreground pl-3 border-l-2 border-border/40'>
                          <div className='space-y-1'>
                            {analytics.googleAnalytics.ga4 && (
                              <div>• GA4 implementation detected</div>
                            )}
                            {analytics.googleAnalytics.universalAnalytics && (
                              <div>• Universal Analytics detected</div>
                            )}
                            {analytics.googleAnalytics.gtag && (
                              <div>• Global Site Tag (gtag) implementation</div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* No Analytics Found */}
                      {!analytics.googleAnalytics.present &&
                        !analytics.googleTagManager.present &&
                        analytics.otherAnalytics.filter(tool => tool.detected)
                          .length === 0 && (
                          <div className='space-y-2'>
                            <p className='text-red-600 dark:text-red-400 analysis-text-sm font-medium'>
                              No analytics tools detected
                            </p>
                            <p className='analysis-text-xs text-muted-foreground pl-3 border-l-2 border-border/40'>
                              Consider implementing Google Analytics 4 or other
                              analytics tools to track website performance
                            </p>
                          </div>
                        )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
