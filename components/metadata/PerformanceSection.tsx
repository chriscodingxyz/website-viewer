'use client'

import React from 'react'
import { WebsiteMetadata } from '@/types/metadata'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
    color = 'text-foreground'
  }: { 
    icon: React.ReactNode
    title: string
    value: string
    subtitle?: string
    color?: string 
  }) => (
    <div className="flex items-center gap-3 p-4 border rounded-lg">
      {icon}
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className={`text-lg font-semibold ${color}`}>{value}</p>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Performance Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>

      {/* Caching Information */}
      <Card>
        <CardHeader>
          <CardTitle>Caching & Headers</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {headers?.cacheControl && (
              <div className="p-3 bg-muted/50 rounded-md">
                <p className="font-medium text-sm mb-1">Cache-Control</p>
                <p className="text-sm text-muted-foreground">{headers.cacheControl}</p>
              </div>
            )}
            
            {headers?.lastModified && (
              <div className="p-3 bg-muted/50 rounded-md">
                <p className="font-medium text-sm mb-1">Last Modified</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(headers.lastModified).toLocaleString()}
                </p>
              </div>
            )}
            
            {headers?.etag && (
              <div className="p-3 bg-muted/50 rounded-md">
                <p className="font-medium text-sm mb-1">ETag</p>
                <p className="text-sm text-muted-foreground font-mono break-all">
                  {headers.etag}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Performance Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {performance?.loadTime && performance.loadTime > 3000 && (
              <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-md">
                <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
                <div>
                  <p className="font-medium text-red-800">Slow Load Time</p>
                  <p className="text-sm text-red-600">
                    Page loads in {formatDuration(performance.loadTime)}. Consider optimizing images, 
                    minifying CSS/JS, enabling compression, and using a CDN.
                  </p>
                </div>
              </div>
            )}
            
            {performance?.contentLength && performance.contentLength > 500000 && (
              <div className="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-800">Large HTML Document</p>
                  <p className="text-sm text-yellow-600">
                    HTML document is {formatBytes(performance.contentLength)}. 
                    Consider code splitting and lazy loading to reduce initial payload.
                  </p>
                </div>
              </div>
            )}
            
            {!headers?.cacheControl && (
              <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <AlertTriangle className="h-5 w-5 text-blue-500 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-800">No Caching Headers</p>
                  <p className="text-sm text-blue-600">
                    No cache-control headers found. Implementing proper caching can 
                    significantly improve performance for returning visitors.
                  </p>
                </div>
              </div>
            )}
            
            {performance?.loadTime && performance.loadTime < 1000 && (
              <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-md">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium text-green-800">Excellent Performance</p>
                  <p className="text-sm text-green-600">
                    Great job! Your page loads in under 1 second, providing an excellent user experience.
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}