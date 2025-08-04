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


  const CompactMetricCard = ({
    icon: Icon,
    title,
    value,
    subtitle,
    color = 'text-gray-800',
    status
  }: {
    icon: React.ElementType
    title: string
    value: string
    subtitle?: React.ReactNode
    color?: string
    status?: 'good' | 'warning' | 'error'
  }) => {
    const statusColors = {
      good: 'border-green-200 bg-green-50/50 dark:border-green-800/50 dark:bg-green-950/20',
      warning:
        'border-yellow-200 bg-yellow-50/50 dark:border-yellow-800/50 dark:bg-yellow-950/20',
      error:
        'border-red-200 bg-red-50/50 dark:border-red-800/50 dark:bg-red-950/20'
    }

    return (
      <div
        className={`flex items-center gap-3 p-4 border rounded-xl ${
          status
            ? statusColors[status]
            : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900/50'
        }`}
      >
        <div
          className={`p-2 rounded-lg ${
            status === 'good'
              ? 'bg-green-100 dark:bg-green-900/30'
              : status === 'warning'
              ? 'bg-yellow-100 dark:bg-yellow-900/30'
              : status === 'error'
              ? 'bg-red-100 dark:bg-red-900/30'
              : 'bg-gray-100 dark:bg-gray-700'
          }`}
        >
          <Icon className={`h-5 w-5 ${color}`} />
        </div>
        <div className='flex-1'>
          <p className='text-sm font-medium text-gray-600 dark:text-gray-400'>
            {title}
          </p>
          <p className={`text-xl font-bold ${color}`}>{value}</p>
          {subtitle && (
            <div className='text-xs text-gray-500 dark:text-gray-400 font-medium mt-1'>
              {subtitle}
            </div>
          )}
        </div>
      </div>
    )
  }

  const CompactRecommendation = ({
    icon: Icon,
    title,
    description,
    priority
  }: {
    icon: React.ElementType
    title: string
    description: string
    priority: 'high' | 'medium' | 'low'
  }) => {
    const priorityConfig = {
      high: {
        color: 'text-red-600',
        bg: 'bg-red-50/80 border-red-200/60 dark:bg-red-950/20 dark:border-red-800/50',
        badge: 'High'
      },
      medium: {
        color: 'text-yellow-600',
        bg: 'bg-yellow-50/80 border-yellow-200/60 dark:bg-yellow-950/20 dark:border-yellow-800/50',
        badge: 'Medium'
      },
      low: {
        color: 'text-blue-600',
        bg: 'bg-blue-50/80 border-blue-200/60 dark:bg-blue-950/20 dark:border-blue-800/50',
        badge: 'Low'
      }
    }
    const config = priorityConfig[priority]

    return (
      <div
        className={`flex items-start gap-3 p-3 border rounded-lg ${config.bg}`}
      >
        <Icon className={`h-4 w-4 ${config.color} mt-1 shrink-0`} />
        <div className='flex-1'>
          <div className='flex items-center gap-2 mb-1'>
            <p
              className={`font-semibold text-sm ${config.color.replace(
                '600',
                '700'
              )} dark:${config.color.replace('600', '300')}`}
            >
              {title}
            </p>
            <Badge
              variant='outline'
              className={`text-xs ${config.color} bg-transparent`}
            >
              {config.badge}
            </Badge>
          </div>
          <p
            className={`text-xs ${config.color.replace(
              '600',
              '600'
            )} dark:${config.color.replace('600', '400')} font-medium`}
          >
            {description}
          </p>
        </div>
      </div>
    )
  }

  // Generate performance recommendations
  const getPerformanceRecommendations = () => {
    const recommendations = []

    if (performance?.loadTime) {
      if (performance.loadTime > 3000) {
        recommendations.push({
          icon: XCircle,
          title: 'Slow Load Time',
          description: `Page loads in ${formatDuration(
            performance.loadTime
          )}. Optimize images, minify CSS/JS, use CDN.`,
          priority: 'high' as const
        })
      } else if (performance.loadTime < 1000) {
        recommendations.push({
          icon: CheckCircle,
          title: 'Excellent Performance',
          description: `Page loads in under 1 second. Great job!`,
          priority: 'low' as const
        })
      }
    }

    if (performance?.contentLength && performance.contentLength > 500000) {
      recommendations.push({
        icon: AlertTriangle,
        title: 'Large HTML Document',
        description: `HTML is ${formatBytes(
          performance.contentLength
        )}. Consider code splitting and lazy loading.`,
        priority: 'medium' as const
      })
    }

    if (!headers?.cacheControl) {
      recommendations.push({
        icon: AlertTriangle,
        title: 'No Caching Headers',
        description:
          'Implement caching to improve performance for returning visitors.',
        priority: 'medium' as const
      })
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 }
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    })
  }

  const getPerformanceStatus = (loadTime?: number) => {
    if (!loadTime) return undefined
    if (loadTime < 1000) return 'good'
    if (loadTime < 3000) return 'warning'
    return 'error'
  }

  const recommendations = getPerformanceRecommendations()

  return (
    <div className='space-y-8'>
      {/* Core Performance Metrics */}
      <div>
        <div className='flex items-center gap-3 mb-6'>
          <Zap className='h-5 w-5 text-blue-600 dark:text-blue-400' />
          <h3 className='text-lg font-semibold text-gray-800 dark:text-gray-200'>
            Performance Metrics
          </h3>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          {performance?.loadTime && (
            <CompactMetricCard
              icon={Clock}
              title='Load Time'
              value={formatDuration(performance.loadTime)}
              color={getLoadTimeColor(performance.loadTime)}
              status={getPerformanceStatus(performance.loadTime)}
              subtitle={
                performance.loadTime < 1000
                  ? 'Excellent'
                  : performance.loadTime < 3000
                  ? 'Good'
                  : 'Needs improvement'
              }
            />
          )}

          {performance?.statusCode && (
            <CompactMetricCard
              icon={CheckCircle}
              title='Status Code'
              value={performance.statusCode.toString()}
              status={
                performance.statusCode >= 200 && performance.statusCode < 300
                  ? 'good'
                  : 'error'
              }
              subtitle={`HTTP ${performance.statusCode}`}
            />
          )}

          {performance?.contentLength && (
            <CompactMetricCard
              icon={FileText}
              title='Content Size'
              value={formatBytes(performance.contentLength)}
              status={performance.contentLength > 500000 ? 'warning' : 'good'}
              subtitle={
                performance.contentLength > 500000
                  ? 'Consider optimization'
                  : 'Good size'
              }
            />
          )}

          {performance?.responseTime && (
            <CompactMetricCard
              icon={Server}
              title='Response Time'
              value={formatDuration(performance.responseTime)}
              subtitle='Server response'
            />
          )}
        </div>
      </div>

      {/* Caching Information - Only show if there are headers */}
      {(headers?.cacheControl || headers?.lastModified || headers?.etag) && (
        <div>
          <div className='flex items-center gap-3 mb-6'>
            <Shield className='h-5 w-5 text-purple-600 dark:text-purple-400' />
            <h3 className='text-lg font-semibold text-gray-800 dark:text-gray-200'>
              Caching & Headers
            </h3>
          </div>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-3'>
            {headers?.cacheControl && (
              <div className='p-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg'>
                <p className='font-semibold text-gray-800 dark:text-gray-200 text-sm mb-1'>
                  Cache-Control
                </p>
                <p className='text-sm text-gray-700 dark:text-gray-300 font-medium font-mono'>
                  {headers.cacheControl}
                </p>
              </div>
            )}
            {headers?.lastModified && (
              <div className='p-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg'>
                <p className='font-semibold text-gray-800 dark:text-gray-200 text-sm mb-1'>
                  Last Modified
                </p>
                <p className='text-sm text-gray-700 dark:text-gray-300 font-medium'>
                  {new Date(headers.lastModified).toLocaleString()}
                </p>
              </div>
            )}
            {headers?.etag && (
              <div className='p-3 bg-orange-50/30 dark:bg-orange-950/20 border border-orange-100/50 dark:border-orange-900/30 rounded-lg lg:col-span-2'>
                <p className='font-semibold text-gray-800 dark:text-gray-200 text-sm mb-1'>
                  ETag
                </p>
                <p className='text-sm text-gray-700 dark:text-gray-300 font-medium font-mono break-all'>
                  {headers.etag}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Performance Recommendations */}
      {recommendations.length > 0 && (
        <div>
          <div className='flex items-center gap-3 mb-6'>
            <Zap className='h-5 w-5 text-blue-600 dark:text-blue-400' />
            <h3 className='text-lg font-semibold text-gray-800 dark:text-gray-200'>
              Performance Recommendations
            </h3>
          </div>
          <div className='space-y-3'>
            {recommendations.map((rec, index) => (
              <CompactRecommendation
                key={index}
                icon={rec.icon}
                title={rec.title}
                description={rec.description}
                priority={rec.priority}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
