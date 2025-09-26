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

  const MetricCard = ({ icon: Icon, title, value, subtitle, status }: {
    icon: React.ElementType
    title: string
    value: string | number
    subtitle?: string
    status: 'good' | 'warning' | 'error' | 'unknown'
  }) => {
    const getStatusConfig = () => {
      switch (status) {
        case 'good':
          return { dotClass: 'status-dot-success', badgeClass: 'pro-badge-success' }
        case 'warning':
          return { dotClass: 'status-dot-warning', badgeClass: 'pro-badge-warning' }
        case 'error':
          return { dotClass: 'status-dot-error', badgeClass: 'pro-badge-error' }
        default:
          return { dotClass: 'status-dot-info', badgeClass: 'pro-badge-info' }
      }
    }

    const config = getStatusConfig()

    return (
      <div className="pro-card-hover">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-muted rounded-sm flex items-center justify-center">
              <Icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <h4 className="font-medium text-foreground">{title}</h4>
            </div>
          </div>
          <div className={config.dotClass}></div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xl font-bold text-foreground">{value}</span>
          {subtitle && <span className="text-xs text-muted-foreground">{subtitle}</span>}
        </div>
      </div>
    )
  }

  return (
    <div className="pro-section">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-muted rounded-sm flex items-center justify-center">
          <TrendingUp className="h-5 w-5 text-muted-foreground" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">Website Health Overview</h3>
          <p className="text-sm text-muted-foreground">Quick assessment of key performance indicators</p>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          icon={Search}
          title="SEO Score"
          value={`${seoScore.percentage}%`}
          subtitle={`${seoScore.score}/${seoScore.maxScore} checks`}
          status={seoScore.percentage >= 80 ? 'good' : seoScore.percentage >= 50 ? 'warning' : 'error'}
        />

        <MetricCard
          icon={Zap}
          title="Performance"
          value={performanceScore.grade}
          subtitle={performance?.loadTime ? formatDuration(performance.loadTime) : 'Not measured'}
          status={performanceScore.grade === 'Excellent' ? 'good' : performanceScore.grade === 'Good' ? 'warning' : performanceScore.grade === 'Poor' ? 'error' : 'unknown'}
        />

        <MetricCard
          icon={Share2}
          title="Social Ready"
          value={`${socialScore.percentage}%`}
          subtitle={`${socialScore.score}/${socialScore.maxScore} platforms`}
          status={socialScore.percentage >= 75 ? 'good' : socialScore.percentage >= 50 ? 'warning' : 'error'}
        />

        <MetricCard
          icon={criticalIssues.length === 0 ? CheckCircle : criticalIssues.length <= 2 ? AlertTriangle : XCircle}
          title="Issues"
          value={criticalIssues.length}
          subtitle={criticalIssues.length === 0 ? 'All good!' : 'Need attention'}
          status={criticalIssues.length === 0 ? 'good' : criticalIssues.length <= 2 ? 'warning' : 'error'}
        />
      </div>

      {/* Critical Issues */}
      {criticalIssues.length > 0 && (
        <div className="pt-4 border-t border-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="status-dot-warning"></div>
            <span className="font-medium text-foreground text-sm">Priority Issues</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {criticalIssues.map((issue, index) => (
              <Badge
                key={index}
                variant="outline"
                className="pro-badge-warning"
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