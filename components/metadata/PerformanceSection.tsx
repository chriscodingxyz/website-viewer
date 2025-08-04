'use client'

import React from 'react'
import { WebsiteMetadata } from '@/types/metadata'
import { Badge } from '@/components/ui/badge'
import { Clock, Zap, FileText, CheckCircle, AlertTriangle, XCircle, Server, Shield } from 'lucide-react'

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

  const getStatusCodeColor = (code: number) => {
    if (code >= 200 && code < 300) return 'bg-green-100 text-green-800'
    if (code >= 300 && code < 400) return 'bg-blue-100 text-blue-800'
    if (code >= 400 && code < 500) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  const MetricCard = ({ icon: Icon, title, value, subtitle, color = 'text-gray-800' }: { icon: React.ElementType; title: string; value: string; subtitle?: React.ReactNode; color?: string }) => (
    <div className="flex items-center gap-3 p-3 bg-orange-50/50 dark:bg-orange-950/30 border border-orange-100 dark:border-orange-900/50 rounded-lg">
      <Icon className={`h-5 w-5 ${color}`} />
      <div>
        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{title}</p>
        <p className={`text-lg font-bold ${color}`}>{value}</p>
        {subtitle && <div className="text-xs text-orange-600 dark:text-orange-400 font-medium">{subtitle}</div>}
      </div>
    </div>
  )

  const Recommendation = ({ icon: Icon, title, description, color }: { icon: React.ElementType; title: string; description: string; color: string }) => (
    <div className={`flex items-start gap-3 p-3 bg-${color}-50/80 border border-${color}-200/60 rounded-lg`}>
      <Icon className={`h-5 w-5 text-${color}-500 mt-0.5`} />
      <div>
        <p className={`font-semibold text-${color}-800`}>{title}</p>
        <p className={`text-sm text-${color}-700 font-medium`}>{description}</p>
      </div>
    </div>
  )

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-6">
        <div className="bg-white/50 dark:bg-gray-900/30 backdrop-blur-sm border border-orange-200/60 dark:border-orange-800/40 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <Zap className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Core Metrics</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {performance?.loadTime && <MetricCard icon={Clock} title="Load Time" value={formatDuration(performance.loadTime)} color={getLoadTimeColor(performance.loadTime)} />}
            {performance?.statusCode && <MetricCard icon={CheckCircle} title="Status Code" value={performance.statusCode.toString()} subtitle={<Badge className={getStatusCodeColor(performance.statusCode)}>HTTP {performance.statusCode}</Badge>} />}
            {performance?.contentLength && <MetricCard icon={FileText} title="Content Size" value={formatBytes(performance.contentLength)} />}
            {performance?.responseTime && <MetricCard icon={Server} title="Response Time" value={formatDuration(performance.responseTime)} />}
          </div>
        </div>
        <div className="bg-white/50 dark:bg-gray-900/30 backdrop-blur-sm border border-orange-200/60 dark:border-orange-800/40 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Caching & Headers</h3>
          </div>
          <div className="space-y-3">
            {headers?.cacheControl && <div className="p-3 bg-orange-50/50 dark:bg-orange-950/30 border border-orange-100 dark:border-orange-900/50 rounded-lg"><p className="font-semibold text-gray-800 dark:text-gray-200 text-sm mb-1">Cache-Control</p><p className="text-sm text-gray-700 dark:text-gray-300 font-medium">{headers.cacheControl}</p></div>}
            {headers?.lastModified && <div className="p-3 bg-orange-50/50 dark:bg-orange-950/30 border border-orange-100 dark:border-orange-900/50 rounded-lg"><p className="font-semibold text-gray-800 dark:text-gray-200 text-sm mb-1">Last Modified</p><p className="text-sm text-gray-700 dark:text-gray-300 font-medium">{new Date(headers.lastModified).toLocaleString()}</p></div>}
            {headers?.etag && <div className="p-3 bg-orange-50/50 dark:bg-orange-950/30 border border-orange-100 dark:border-orange-900/50 rounded-lg"><p className="font-semibold text-gray-800 dark:text-gray-200 text-sm mb-1">ETag</p><p className="text-sm text-gray-700 dark:text-gray-300 font-medium font-mono break-all">{headers.etag}</p></div>}
          </div>
        </div>
      </div>
      <div className="bg-white/50 dark:bg-gray-900/30 backdrop-blur-sm border border-orange-200/60 dark:border-orange-800/40 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <Zap className="h-5 w-5 text-orange-600 dark:text-orange-400" />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Recommendations</h3>
        </div>
        <div className="space-y-3">
          {performance?.loadTime && performance.loadTime > 3000 && <Recommendation icon={XCircle} title="Slow Load Time" description={`Page loads in ${formatDuration(performance.loadTime)}. Consider optimizing images, minifying CSS/JS, and using a CDN.`} color="red" />}
          {performance?.contentLength && performance.contentLength > 500000 && <Recommendation icon={AlertTriangle} title="Large HTML Document" description={`HTML is ${formatBytes(performance.contentLength)}. Consider code splitting and lazy loading.`} color="yellow" />}
          {!headers?.cacheControl && <Recommendation icon={AlertTriangle} title="No Caching Headers" description="Implement caching to improve performance for returning visitors." color="blue" />}
          {performance?.loadTime && performance.loadTime < 1000 && <Recommendation icon={CheckCircle} title="Excellent Performance" description={`Page loads in under 1 second. Great job!`} color="green" />}
        </div>
      </div>
    </div>
  )
}
