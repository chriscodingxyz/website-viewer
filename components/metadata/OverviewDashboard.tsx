'use client'

import React from 'react'
import { WebsiteMetadata } from '@/types/metadata'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, AlertTriangle, XCircle, Clock, Search, Zap, Share2, TrendingUp } from 'lucide-react'

interface OverviewDashboardProps {
  metadata: WebsiteMetadata
}

export default function OverviewDashboard({ metadata }: OverviewDashboardProps) {
  const { seo, performance, openGraph, twitterCard } = metadata

  // Calculate SEO score
  const getSEOScore = () => {
    let score = 0
    const maxScore = 5
    if (seo.title && seo.title.length >= 30 && seo.title.length <= 60) score += 1
    if (seo.description && seo.description.length >= 120 && seo.description.length <= 160) score += 1
    if (seo.canonical) score += 1
    if (seo.language) score += 1
    if (seo.viewport) score += 1
    return { score, maxScore, percentage: Math.round((score / maxScore) * 100) }
  }

  // Calculate performance score
  const getPerformanceScore = () => {
    if (!performance?.loadTime) return { grade: 'Unknown', color: 'text-gray-500', bgColor: 'bg-gray-100' }
    const loadTime = performance.loadTime
    if (loadTime < 1000) return { grade: 'Excellent', color: 'text-green-700', bgColor: 'bg-green-100' }
    if (loadTime < 3000) return { grade: 'Good', color: 'text-yellow-700', bgColor: 'bg-yellow-100' }
    return { grade: 'Poor', color: 'text-red-700', bgColor: 'bg-red-100' }
  }

  // Check social media readiness
  const getSocialScore = () => {
    let score = 0
    const maxScore = 4
    if (openGraph.title) score += 1
    if (openGraph.description) score += 1
    if (openGraph.image) score += 1
    if (twitterCard.card) score += 1
    return { score, maxScore, percentage: Math.round((score / maxScore) * 100) }
  }

  // Get critical issues
  const getCriticalIssues = () => {
    const issues = []
    if (!seo.title) issues.push('Missing title')
    if (!seo.description) issues.push('Missing meta description')
    if (performance?.loadTime && performance.loadTime > 3000) issues.push('Slow loading time')
    if (!openGraph.image) issues.push('Missing social image')
    return issues
  }

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(2)}s`
  }

  const seoScore = getSEOScore()
  const performanceScore = getPerformanceScore()
  const socialScore = getSocialScore()
  const criticalIssues = getCriticalIssues()

  const MetricCard = ({ icon: Icon, title, value, subtitle, color, bgColor }: {
    icon: React.ElementType
    title: string
    value: string | number
    subtitle?: string
    color: string
    bgColor: string
  }) => (
    <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl p-4 flex items-center gap-3">
      <div className={`p-2 rounded-lg ${bgColor === 'bg-green-100' ? 'bg-green-100 dark:bg-green-900/30' : bgColor === 'bg-yellow-100' ? 'bg-yellow-100 dark:bg-yellow-900/30' : bgColor === 'bg-red-100' ? 'bg-red-100 dark:bg-red-900/30' : 'bg-gray-100 dark:bg-gray-700'}`}>
        <Icon className={`h-5 w-5 ${color}`} />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className={`text-lg font-bold ${color}`}>{value}</span>
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</span>
        </div>
        {subtitle && <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{subtitle}</p>}
      </div>
    </div>
  )

  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center text-white">
          <TrendingUp className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">Website Health Overview</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Quick assessment of key performance indicators</p>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          icon={Search}
          title="SEO Score"
          value={`${seoScore.percentage}%`}
          subtitle={`${seoScore.score}/${seoScore.maxScore} checks`}
          color={seoScore.percentage >= 80 ? 'text-green-700' : seoScore.percentage >= 50 ? 'text-yellow-700' : 'text-red-700'}
          bgColor={seoScore.percentage >= 80 ? 'bg-green-100' : seoScore.percentage >= 50 ? 'bg-yellow-100' : 'bg-red-100'}
        />
        
        <MetricCard
          icon={Zap}
          title="Performance"
          value={performanceScore.grade}
          subtitle={performance?.loadTime ? formatDuration(performance.loadTime) : 'Not measured'}
          color={performanceScore.color}
          bgColor={performanceScore.bgColor}
        />
        
        <MetricCard
          icon={Share2}
          title="Social Ready"
          value={`${socialScore.percentage}%`}
          subtitle={`${socialScore.score}/${socialScore.maxScore} platforms`}
          color={socialScore.percentage >= 75 ? 'text-green-700' : socialScore.percentage >= 50 ? 'text-yellow-700' : 'text-red-700'}
          bgColor={socialScore.percentage >= 75 ? 'bg-green-100' : socialScore.percentage >= 50 ? 'bg-yellow-100' : 'bg-red-100'}
        />
        
        <MetricCard
          icon={criticalIssues.length === 0 ? CheckCircle : criticalIssues.length <= 2 ? AlertTriangle : XCircle}
          title="Issues"
          value={criticalIssues.length}
          subtitle={criticalIssues.length === 0 ? 'All good!' : 'Need attention'}
          color={criticalIssues.length === 0 ? 'text-green-700' : criticalIssues.length <= 2 ? 'text-yellow-700' : 'text-red-700'}
          bgColor={criticalIssues.length === 0 ? 'bg-green-100' : criticalIssues.length <= 2 ? 'bg-yellow-100' : 'bg-red-100'}
        />
      </div>

      {/* Critical Issues */}
      {criticalIssues.length > 0 && (
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <span className="font-semibold text-gray-800 dark:text-gray-200 text-sm">Priority Issues</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {criticalIssues.map((issue, index) => (
              <Badge
                key={index}
                variant="outline"
                className="bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700/50"
              >
                {issue}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}