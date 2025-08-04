'use client'

import React from 'react'
import { WebsiteMetadata } from '@/types/metadata'
import { Badge } from '@/components/ui/badge'

interface TechnicalSectionProps {
  metadata: WebsiteMetadata
}

export default function TechnicalSection({ metadata }: TechnicalSectionProps) {
  const { technical, headers, icons, structuredData, performance } = metadata

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const SimpleListItem = ({ icon, label, value, status }: {
    icon: string
    label: string
    value?: string | boolean
    status: 'good' | 'warning' | 'missing'
  }) => {
    const iconEmoji = status === 'good' ? '✅' : status === 'warning' ? '⚠️' : '❌'
    const badgeClass = status === 'good' 
      ? 'bg-green-50 text-green-700 border-green-300' 
      : status === 'warning'
      ? 'bg-yellow-50 text-yellow-700 border-yellow-300'
      : 'bg-red-50 text-red-700 border-red-300'
    
    const statusText = status === 'good' ? 'Good' : status === 'warning' ? 'Warning' : 'Missing'
    
    let displayValue = ''
    if (typeof value === 'boolean') {
      displayValue = value ? 'Yes' : 'No'
    } else if (value) {
      displayValue = value.toString()
    } else {
      displayValue = 'Not set'
    }
    
    return (
      <div className="py-2 text-sm border-b border-gray-100 dark:border-gray-800 last:border-b-0">
        <div className="flex items-start gap-3">
          <span className="text-base mt-0.5">{iconEmoji}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium text-gray-900 dark:text-gray-100">{label}</span>
              <Badge variant="outline" className={`text-xs shrink-0 ${badgeClass}`}>
                {statusText}
              </Badge>
            </div>
            
            <div className="space-y-1">
              <p className="text-gray-700 dark:text-gray-300 break-words">
                {value ? `"${displayValue}"` : 'Not configured'}
              </p>
              {!value && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Consider adding for better user experience
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const getSecurityStatus = () => {
    const isHTTPS = technical?.url?.startsWith('https://') || false
    return isHTTPS ? 'good' : 'warning'
  }

  const getIssueCount = () => {
    let issues = 0
    if (!technical?.url?.startsWith('https://')) issues++
    if (!technical?.responsive) issues++
    if (!headers?.['content-security-policy']) issues++
    return issues
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Performance & Technical</h3>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-bold ${
            getIssueCount() === 0 ? 'text-green-600' : 
            getIssueCount() <= 2 ? 'text-yellow-600' : 'text-red-600'
          }`}>
            {getIssueCount()} issues
          </span>
        </div>
      </div>
      
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        {/* Performance Metrics */}
        {performance?.loadTime && (
          <div className="py-2 text-sm border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-start gap-3">
              <span className="text-base mt-0.5">⚡</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-gray-900 dark:text-gray-100">Load Time</span>
                  <Badge variant="outline" className={`text-xs shrink-0 ${
                    performance.loadTime < 1000 ? 'bg-green-50 text-green-700 border-green-300' : 
                    performance.loadTime < 3000 ? 'bg-yellow-50 text-yellow-700 border-yellow-300' : 
                    'bg-red-50 text-red-700 border-red-300'
                  }`}>
                    {performance.loadTime < 1000 ? 'Good' : performance.loadTime < 3000 ? 'Fair' : 'Poor'}
                  </Badge>
                </div>
                <p className="text-gray-700 dark:text-gray-300">
                  "{performance.loadTime < 1000 ? `${performance.loadTime}ms` : `${(performance.loadTime / 1000).toFixed(2)}s`}"
                </p>
              </div>
            </div>
          </div>
        )}
        
        {performance?.size && (
          <div className="py-2 text-sm border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-start gap-3">
              <span className="text-base mt-0.5">📦</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-gray-900 dark:text-gray-100">Page Size</span>
                  <Badge variant="outline" className={`text-xs shrink-0 ${
                    performance.size < 1000000 ? 'bg-green-50 text-green-700 border-green-300' : 
                    performance.size < 5000000 ? 'bg-yellow-50 text-yellow-700 border-yellow-300' : 
                    'bg-red-50 text-red-700 border-red-300'
                  }`}>
                    {performance.size < 1000000 ? 'Good' : performance.size < 5000000 ? 'Fair' : 'Large'}
                  </Badge>
                </div>
                <p className="text-gray-700 dark:text-gray-300">
                  "{formatBytes(performance.size)}"
                </p>
              </div>
            </div>
          </div>
        )}
        
        {performance?.requests && (
          <div className="py-2 text-sm border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-start gap-3">
              <span className="text-base mt-0.5">🔗</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-gray-900 dark:text-gray-100">HTTP Requests</span>
                  <Badge variant="outline" className={`text-xs shrink-0 ${
                    performance.requests < 50 ? 'bg-green-50 text-green-700 border-green-300' : 
                    performance.requests < 100 ? 'bg-yellow-50 text-yellow-700 border-yellow-300' : 
                    'bg-red-50 text-red-700 border-red-300'
                  }`}>
                    {performance.requests < 50 ? 'Good' : performance.requests < 100 ? 'Fair' : 'Many'}
                  </Badge>
                </div>
                <p className="text-gray-700 dark:text-gray-300">
                  "{performance.requests}"
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Server and Compression */}
        {headers?.server && (
          <div className="py-2 text-sm border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-start gap-3">
              <span className="text-base mt-0.5">🖥️</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-gray-900 dark:text-gray-100">Server</span>
                  <Badge variant="outline" className="text-xs shrink-0 bg-green-50 text-green-700 border-green-300">
                    Good
                  </Badge>
                </div>
                <p className="text-gray-700 dark:text-gray-300">
                  "{headers.server}"
                </p>
              </div>
            </div>
          </div>
        )}
        
        {headers?.['content-encoding'] && (
          <div className="py-2 text-sm border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-start gap-3">
              <span className="text-base mt-0.5">🗜️</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-gray-900 dark:text-gray-100">Compression</span>
                  <Badge variant="outline" className="text-xs shrink-0 bg-green-50 text-green-700 border-green-300">
                    Enabled
                  </Badge>
                </div>
                <p className="text-gray-700 dark:text-gray-300">
                  "{headers['content-encoding']}"
                </p>
              </div>
            </div>
          </div>
        )}
        
        {headers?.['cache-control'] && (
          <div className="py-2 text-sm border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-start gap-3">
              <span className="text-base mt-0.5">💾</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-gray-900 dark:text-gray-100">Cache Control</span>
                  <Badge variant="outline" className="text-xs shrink-0 bg-green-50 text-green-700 border-green-300">
                    Configured
                  </Badge>
                </div>
                <p className="text-gray-700 dark:text-gray-300">
                  "{headers['cache-control']}"
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Technical Details */}
        <SimpleListItem
          icon="🔒"
          label="HTTPS"
          value={technical?.url?.startsWith('https://') ? 'Secure' : 'Insecure'}
          status={getSecurityStatus()}
        />
        
        <SimpleListItem
          icon="📱"
          label="Mobile Responsive"
          value={technical?.responsive}
          status={technical?.responsive ? 'good' : 'warning'}
        />
        
        {technical?.themeColor && (
          <SimpleListItem
            icon="🎨"
            label="Theme Color"
            value={technical.themeColor}
            status="good"
          />
        )}
        
        {headers?.['content-security-policy'] ? (
          <SimpleListItem
            icon="🛡️"
            label="Content Security Policy"
            value="Configured"
            status="good"
          />
        ) : (
          <SimpleListItem
            icon="🛡️"
            label="Content Security Policy"
            value={undefined}
            status="warning"
          />
        )}
        
        {icons && icons.length > 0 ? (
          <div className="py-2 text-sm border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-start gap-3">
              <span className="text-base mt-0.5">✅</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-gray-900 dark:text-gray-100">Favicons</span>
                  <Badge variant="outline" className="text-xs shrink-0 bg-green-50 text-green-700 border-green-300">
                    {icons.length} icons
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  {/* Group icons by type */}
                  {icons.map((icon, index) => (
                    <div key={index} className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-800 rounded border">
                      <div className="flex items-center gap-2">
                        {icon.href && (
                          <img 
                            src={icon.href} 
                            alt={`${icon.sizes || 'favicon'}`}
                            className="w-6 h-6 rounded border bg-white"
                            onError={(e) => {
                              e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik04IDhIMTZWMTZIOFY4WiIgc3Ryb2tlPSIjOUNBM0FGIiBzdHJva2Utd2lkdGg9IjIiIGZpbGw9Im5vbmUiLz4KPC9zdmc+Cg=='
                            }}
                          />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-gray-900 dark:text-gray-100">
                              {icon.rel || 'icon'}
                            </span>
                            {icon.sizes && (
                              <span className="text-xs px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded">
                                {icon.sizes}
                              </span>
                            )}
                            {icon.type && (
                              <span className="text-xs px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
                                {icon.type}
                              </span>
                            )}
                          </div>
                          {icon.href && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 font-mono mt-1 truncate">
                              {icon.href}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Favicons help browsers display your site icon in tabs, bookmarks, and shortcuts
                </p>
              </div>
            </div>
          </div>
        ) : (
          <SimpleListItem
            icon="🖼️"
            label="Favicons"
            value={undefined}
            status="warning"
          />
        )}
        
        {/* Always show Structured Data / JSON-LD section */}
        <div className="py-2 text-sm border-b border-gray-100 dark:border-gray-800 last:border-b-0">
          <div className="flex items-start gap-3">
            <span className="text-base mt-0.5">{structuredData && structuredData.length > 0 ? '✅' : '❌'}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-gray-900 dark:text-gray-100">JSON-LD / Structured Data</span>
                <Badge variant="outline" className={`text-xs shrink-0 ${
                  structuredData && structuredData.length > 0 
                    ? 'bg-green-50 text-green-700 border-green-300' 
                    : 'bg-red-50 text-red-700 border-red-300'
                }`}>
                  {structuredData && structuredData.length > 0 
                    ? `${structuredData.length} schemas` 
                    : 'Missing'}
                </Badge>
              </div>
              
              {structuredData && structuredData.length > 0 ? (
                <>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {structuredData.slice(0, 6).map((schema, index) => (
                      <div key={index} className="text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded border border-blue-200 dark:border-blue-800">
                        {schema['@type'] || schema.type || 'Schema'}
                      </div>
                    ))}
                    {structuredData.length > 6 && (
                      <span className="text-xs text-gray-500 dark:text-gray-400 px-2 py-1">
                        +{structuredData.length - 6} more
                      </span>
                    )}
                  </div>
                  
                  {/* JSON-LD Details */}
                  <details className="mt-2">
                    <summary className="text-xs text-blue-600 dark:text-blue-400 cursor-pointer hover:text-blue-700 dark:hover:text-blue-300">
                      🔍 View JSON-LD Configuration
                    </summary>
                    <div className="mt-2 space-y-2">
                      {structuredData.map((schema, index) => (
                        <div key={index} className="bg-gray-50 dark:bg-gray-800 rounded p-2">
                          <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {schema['@type'] || schema.type || `Schema ${index + 1}`}
                          </div>
                          <pre className="text-xs text-gray-600 dark:text-gray-400 overflow-x-auto whitespace-pre-wrap max-h-40 overflow-y-auto">
                            {JSON.stringify(schema, null, 2)}
                          </pre>
                        </div>
                      ))}
                    </div>
                  </details>
                  
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Structured data helps search engines understand your content
                  </p>
                </>
              ) : (
                <>
                  <p className="text-red-600 dark:text-red-400 text-sm">No structured data found</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Add JSON-LD schemas for better SEO and rich snippets
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
        
        {headers?.['x-frame-options'] && (
          <SimpleListItem
            icon="🔐"
            label="X-Frame-Options"
            value={headers['x-frame-options']}
            status="good"
          />
        )}
        
        {headers?.['x-content-type-options'] && (
          <SimpleListItem
            icon="🛡️"
            label="X-Content-Type-Options"
            value={headers['x-content-type-options']}
            status="good"
          />
        )}
        
        {headers?.['strict-transport-security'] && (
          <SimpleListItem
            icon="🔒"
            label="HSTS"
            value="Enabled"
            status="good"
          />
        )}
        
        {technical?.charset && (
          <SimpleListItem
            icon="📝"
            label="Character Encoding"
            value={technical.charset}
            status="good"
          />
        )}
        
        {technical?.doctype && (
          <SimpleListItem
            icon="📄"
            label="Document Type"
            value={technical.doctype}
            status="good"
          />
        )}
        
        {/* HTTP Headers Details */}
        {Object.keys(headers || {}).length > 0 && (
          <div className="py-2 text-sm border-b border-gray-100 dark:border-gray-800 last:border-b-0">
            <div className="flex items-start gap-3">
              <span className="text-base mt-0.5">📡</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-gray-900 dark:text-gray-100">HTTP Headers</span>
                  <Badge variant="outline" className="text-xs shrink-0 bg-blue-50 text-blue-700 border-blue-300">
                    {Object.keys(headers || {}).length} headers
                  </Badge>
                </div>
                
                <details className="mt-2">
                  <summary className="text-xs text-blue-600 dark:text-blue-400 cursor-pointer hover:text-blue-700 dark:hover:text-blue-300">
                    View All HTTP Headers
                  </summary>
                  <div className="mt-2 bg-gray-50 dark:bg-gray-800 rounded p-2">
                    <pre className="text-xs text-gray-600 dark:text-gray-400 overflow-x-auto whitespace-pre-wrap">
                      {Object.entries(headers || {}).map(([key, value]) => 
                        `${key}: ${value}`
                      ).join('\n')}
                    </pre>
                  </div>
                </details>
                
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Server response headers for debugging and optimization
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}