'use client'

import React from 'react'
import { WebsiteMetadata } from '@/types/metadata'
import { Badge } from '@/components/ui/badge'
import { Clock, Zap, FileText, CheckCircle, AlertTriangle, XCircle } from 'lucide-react'

interface PerformanceSectionProps {
  metadata: WebsiteMetadata
}

export default function PerformanceSection({ metadata }: PerformanceSectionProps) {
  const { performance, headers } = metadata

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(2)}s`
  }

  const getLoadTimeColor = (ms: number) => {
    if (ms < 1000) return 'text-green-600'
    if (ms < 3000) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getLoadTimeIcon = (ms: number) => {
    if (ms < 1000) return <CheckCircle className="h-5 w-5 text-green-500" />
    if (ms < 3000) return <AlertTriangle className="h-5 w-5 text-yellow-500" />
    return <XCircle className="h-5 w-5 text-red-500" />
  }

  const getLoadTimeDescription = (ms: number) => {
    if (ms < 1000) return 'Excellent load time'
    if (ms < 3000) return 'Good load time'
    return 'Slow load time - consider optimization'
  }

  const getStatusCodeColor = (code: number) => {
    if (code >= 200 && code < 300) return 'bg-green-100 text-green-800'
    if (code >= 300 && code < 400) return 'bg-blue-100 text-blue-800'
    if (code >= 400 && code < 500) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  const MetricCard = ({ 
    icon, 
    title, 
    value, 
    subtitle, 
    color = 'text-gray-800'
  }: { 
    icon: React.ReactNode
    title: string
    value: string
    subtitle?: string
    color?: string 
  }) => (
    <div className="flex items-center gap-3 p-4 bg-orange-50/50 border border-orange-100 rounded-xl">
      {icon}
      <div>
        <p className="text-sm font-semibold text-gray-800">{title}</p>
        <p className={`text-lg font-bold ${color}`}>{value}</p>
        {subtitle && <p className="text-xs text-orange-600 font-medium">{subtitle}</p>}
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Performance Metrics */}
      <div className="bg-white/50 backdrop-blur-sm border border-orange-200/60 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <Zap className="h-5 w-5 text-orange-600" />
          <h3 className="text-lg font-semibold text-gray-800">Performance Metrics</h3>
        </div>
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {performance?.loadTime && (
              <MetricCard
                icon={getLoadTimeIcon(performance.loadTime)}
                title="Load Time"
                value={formatDuration(performance.loadTime)}
                subtitle={getLoadTimeDescription(performance.loadTime)}
                color={getLoadTimeColor(performance.loadTime)}
              />
            )}
            
            {performance?.statusCode && (
              <MetricCard
                icon={<CheckCircle className="h-5 w-5" />}
                title="Status Code"
                value={performance.statusCode.toString()}
                subtitle={
                  <Badge className={getStatusCodeColor(performance.statusCode)}>
                    {performance.statusCode >= 200 && performance.statusCode < 300 && 'Success'}
                    {performance.statusCode >= 300 && performance.statusCode < 400 && 'Redirect'}
                    {performance.statusCode >= 400 && performance.statusCode < 500 && 'Client Error'}
                    {performance.statusCode >= 500 && 'Server Error'}
                  </Badge>
                }
              />
            )}
            
            {performance?.contentLength && (
              <MetricCard
                icon={<FileText className="h-5 w-5" />}
                title="Content Size"
                value={formatBytes(performance.contentLength)}
                subtitle="HTML document size"
              />
            )}
            
            {performance?.responseTime && (
              <MetricCard
                icon={<Clock className="h-5 w-5" />}
                title="Response Time"
                value={formatDuration(performance.responseTime)}
                subtitle="Server response time"
              />
            )}
          </div>
        </div>
      </div>

      {/* Caching Information */}
      <div className="bg-white/50 backdrop-blur-sm border border-orange-200/60 rounded-2xl p-6 shadow-sm">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800">Caching & Headers</h3>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {headers?.cacheControl && (
              <div className="p-4 bg-orange-50/50 border border-orange-100 rounded-xl">
                <p className="font-semibold text-gray-800 text-sm mb-1">Cache-Control</p>
                <p className="text-sm text-gray-700 font-medium">{headers.cacheControl}</p>
              </div>
            )}
            
            {headers?.lastModified && (
              <div className="p-4 bg-orange-50/50 border border-orange-100 rounded-xl">
                <p className="font-semibold text-gray-800 text-sm mb-1">Last Modified</p>
                <p className="text-sm text-gray-700 font-medium">
                  {new Date(headers.lastModified).toLocaleString()}
                </p>
              </div>
            )}
            
            {headers?.etag && (
              <div className="p-4 bg-orange-50/50 border border-orange-100 rounded-xl">
                <p className="font-semibold text-gray-800 text-sm mb-1">ETag</p>
                <p className="text-sm text-gray-700 font-medium font-mono break-all">
                  {headers.etag}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Performance Recommendations */}
      <div className="bg-white/50 backdrop-blur-sm border border-orange-200/60 rounded-2xl p-6 shadow-sm">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800">Performance Recommendations</h3>
        </div>
        <div>
          <div className="space-y-4">
            {performance?.loadTime && performance.loadTime > 3000 && (
              <div className="flex items-start gap-3 p-4 bg-red-50/80 border border-red-200/60 rounded-xl">
                <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-800">Slow Load Time</p>
                  <p className="text-sm text-red-700 font-medium">
                    Page loads in {formatDuration(performance.loadTime)}. Consider optimizing images, 
                    minifying CSS/JS, enabling compression, and using a CDN.
                  </p>
                </div>
              </div>
            )}
            
            {performance?.contentLength && performance.contentLength > 500000 && (
              <div className="flex items-start gap-3 p-4 bg-yellow-50/80 border border-yellow-200/60 rounded-xl">
                <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                <div>
                  <p className="font-semibold text-yellow-800">Large HTML Document</p>
                  <p className="text-sm text-yellow-700 font-medium">
                    HTML document is {formatBytes(performance.contentLength)}. 
                    Consider code splitting and lazy loading to reduce initial payload.
                  </p>
                </div>
              </div>
            )}
            
            {!headers?.cacheControl && (
              <div className="flex items-start gap-3 p-4 bg-blue-50/80 border border-blue-200/60 rounded-xl">
                <AlertTriangle className="h-5 w-5 text-blue-500 mt-0.5" />
                <div>
                  <p className="font-semibold text-blue-800">No Caching Headers</p>
                  <p className="text-sm text-blue-700 font-medium">
                    No cache-control headers found. Implementing proper caching can 
                    significantly improve performance for returning visitors.
                  </p>
                </div>
              </div>
            )}
            
            {performance?.loadTime && performance.loadTime < 1000 && (
              <div className="flex items-start gap-3 p-4 bg-green-50/80 border border-green-200/60 rounded-xl">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <p className="font-semibold text-green-800">Excellent Performance</p>
                  <p className="text-sm text-green-700 font-medium">
                    Great job! Your page loads in under 1 second, providing an excellent user experience.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}