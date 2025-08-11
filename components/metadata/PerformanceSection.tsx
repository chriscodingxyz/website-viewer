'use client'

import React from 'react'
import { WebsiteMetadata } from '@/types/metadata'
import { Badge } from '@/components/ui/badge'
import {
  Clock,
  Zap,
  FileText,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Server,
  Shield
} from 'lucide-react'

interface PerformanceSectionProps {
  metadata: WebsiteMetadata
}

export default function PerformanceSection ({
  metadata
}: PerformanceSectionProps) {
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

  const SimpleListItem = ({ icon, label, value, status }: {
    icon: string
    label: string
    value?: string | number
    status: string
  }) => (
    <div className="flex items-center gap-3 py-2 text-sm">
      <span className="text-base">{icon}</span>
      <span className="font-medium text-gray-900 dark:text-gray-100 min-w-[120px]">{label}:</span>
      <span className="flex-1 text-gray-700 dark:text-gray-300">
        {value || 'Not measured'}
      </span>
      <Badge variant="outline" className={`text-xs shrink-0 ${
        status === 'good' ? 'bg-green-50 text-green-700 border-green-300' : 
        status === 'warning' ? 'bg-yellow-50 text-yellow-700 border-yellow-300' : 
        'bg-red-50 text-red-700 border-red-300'
      }`}>
        {status === 'good' ? 'Good' : status === 'warning' ? 'Fair' : 'Poor'}
      </Badge>
    </div>
  )

  const getStatus = (type: string, value?: number) => {
    if (!value) return 'poor'
    switch (type) {
      case 'loadTime':
        return value < 1000 ? 'good' : value < 3000 ? 'warning' : 'poor'
      case 'size':
        return value < 1000000 ? 'good' : value < 5000000 ? 'warning' : 'poor'
      default:
        return 'good'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Performance Metrics</h3>
      </div>
      
      <div className="space-y-1">
        {performance?.loadTime && (
          <SimpleListItem
            icon="⚡"
            label="Load Time"
            value={formatDuration(performance.loadTime)}
            status={getStatus('loadTime', performance.loadTime)}
          />
        )}
        
        {performance?.responseTime && (
          <SimpleListItem
            icon="⏱️"
            label="Response Time"
            value={formatDuration(performance.responseTime)}
            status={getStatus('responseTime', performance.responseTime)}
          />
        )}
        
        {performance?.contentLength && (
          <SimpleListItem
            icon="📦"
            label="Content Length"
            value={formatBytes(performance.contentLength)}
            status={getStatus('contentLength', performance.contentLength)}
          />
        )}
        
        {performance?.statusCode && (
          <SimpleListItem
            icon="🔢"
            label="Status Code"
            value={performance.statusCode.toString()}
            status={performance.statusCode < 300 ? 'good' : performance.statusCode < 400 ? 'warning' : 'poor'}
          />
        )}
        
        {headers?.server && (
          <SimpleListItem
            icon="🖥️"
            label="Server"
            value={headers.server}
            status="good"
          />
        )}
        
        {headers?.contentEncoding && (
          <SimpleListItem
            icon="🗜️"
            label="Compression"
            value={headers.contentEncoding}
            status="good"
          />
        )}
        
        {headers?.cacheControl && (
          <SimpleListItem
            icon="💾"
            label="Cache Control"
            value={headers.cacheControl}
            status="good"
          />
        )}
      </div>
    </div>
  )
}