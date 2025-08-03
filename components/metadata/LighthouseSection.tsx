'use client'

import React, { useState } from 'react'
import { LighthouseReport, CoreWebVitals, LighthouseScores } from '@/types/metadata'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Zap, 
  Clock, 
  Eye, 
  Target, 
  TrendingUp, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  Monitor,
  Tablet,
  Smartphone,
  BarChart3,
  Loader2,
  Play
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface LighthouseSectionProps {
  reports: Record<string, LighthouseReport | null>
  onRunAnalysis: () => void
  loading: boolean
  error: string | null
}

export default function LighthouseSection({ reports, onRunAnalysis, loading, error }: LighthouseSectionProps) {
  const [activeViewport, setActiveViewport] = useState<string>('desktop')

  const getViewportIcon = (viewport: string) => {
    switch (viewport) {
      case 'desktop': return <Monitor className="h-4 w-4" />
      case 'tablet': return <Tablet className="h-4 w-4" />
      case 'mobileLarge': 
      case 'mobile': return <Smartphone className="h-4 w-4" />
      default: return <Monitor className="h-4 w-4" />
    }
  }

  const getViewportName = (viewport: string) => {
    switch (viewport) {
      case 'desktop': return 'Desktop'
      case 'tablet': return 'Tablet'
      case 'mobileLarge': return 'Mobile Large'
      case 'mobile': return 'Mobile'
      default: return viewport
    }
  }

  const getScoreColor = (score: number | undefined) => {
    if (score === undefined) return 'text-gray-400'
    if (score >= 90) return 'text-green-600'
    if (score >= 50) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreIcon = (score: number | undefined) => {
    if (score === undefined) return <XCircle className="h-4 w-4 text-gray-400" />
    if (score >= 90) return <CheckCircle className="h-4 w-4 text-green-500" />
    if (score >= 50) return <AlertTriangle className="h-4 w-4 text-yellow-500" />
    return <XCircle className="h-4 w-4 text-red-500" />
  }

  const getCoreWebVitalsGrade = (metric: string, value: number | undefined) => {
    if (value === undefined) return { grade: 'N/A', color: 'text-gray-400' }
    
    switch (metric) {
      case 'lcp': // Largest Contentful Paint (ms)
        if (value <= 2500) return { grade: 'Good', color: 'text-green-600' }
        if (value <= 4000) return { grade: 'Needs Improvement', color: 'text-yellow-600' }
        return { grade: 'Poor', color: 'text-red-600' }
      
      case 'fcp': // First Contentful Paint (ms)
        if (value <= 1800) return { grade: 'Good', color: 'text-green-600' }
        if (value <= 3000) return { grade: 'Needs Improvement', color: 'text-yellow-600' }
        return { grade: 'Poor', color: 'text-red-600' }
      
      case 'cls': // Cumulative Layout Shift (score)
        if (value <= 0.1) return { grade: 'Good', color: 'text-green-600' }
        if (value <= 0.25) return { grade: 'Needs Improvement', color: 'text-yellow-600' }
        return { grade: 'Poor', color: 'text-red-600' }
      
      case 'inp': // Interaction to Next Paint (ms)
        if (value <= 200) return { grade: 'Good', color: 'text-green-600' }
        if (value <= 500) return { grade: 'Needs Improvement', color: 'text-yellow-600' }
        return { grade: 'Poor', color: 'text-red-600' }
      
      case 'ttfb': // Time to First Byte (ms)
        if (value <= 800) return { grade: 'Good', color: 'text-green-600' }
        if (value <= 1800) return { grade: 'Needs Improvement', color: 'text-yellow-600' }
        return { grade: 'Poor', color: 'text-red-600' }
      
      default:
        return { grade: 'N/A', color: 'text-gray-400' }
    }
  }

  const formatDuration = (ms: number | undefined) => {
    if (ms === undefined) return 'N/A'
    if (ms < 1000) return `${Math.round(ms)}ms`
    return `${(ms / 1000).toFixed(2)}s`
  }

  const formatCLS = (cls: number | undefined) => {
    if (cls === undefined) return 'N/A'
    return cls.toFixed(3)
  }

  const ScoreGauge = ({ score, title, icon }: { score: number | undefined, title: string, icon: React.ReactNode }) => {
    const radius = 40
    const circumference = 2 * Math.PI * radius
    const strokeDasharray = circumference
    const strokeDashoffset = score !== undefined ? circumference - (score / 100) * circumference : circumference
    
    return (
      <div className="flex flex-col items-center p-4 bg-white/50 rounded-xl border border-orange-100">
        <div className="relative w-20 h-20 mb-2">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r={radius}
              stroke="rgb(209 213 219)"
              strokeWidth="8"
              fill="none"
            />
            <circle
              cx="50"
              cy="50"
              r={radius}
              stroke={score !== undefined ? (score >= 90 ? '#16a34a' : score >= 50 ? '#ca8a04' : '#dc2626') : '#9ca3af'}
              strokeWidth="8"
              fill="none"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={cn("text-lg font-bold", getScoreColor(score))}>
              {score !== undefined ? score : '--'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
          {icon}
          <span>{title}</span>
        </div>
      </div>
    )
  }

  const CoreWebVitalCard = ({ 
    title, 
    value, 
    unit, 
    metric, 
    icon,
    description 
  }: { 
    title: string
    value: number | undefined
    unit: string
    metric: string
    icon: React.ReactNode
    description: string
  }) => {
    const grade = getCoreWebVitalsGrade(metric, value)
    
    return (
      <div className="p-4 bg-white/50 rounded-xl border border-orange-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {icon}
            <h4 className="font-semibold text-gray-800">{title}</h4>
          </div>
          <Badge className={cn("text-xs", grade.color === 'text-green-600' ? 'bg-green-100 text-green-800' : grade.color === 'text-yellow-600' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800')}>
            {grade.grade}
          </Badge>
        </div>
        <div className="mb-2">
          <span className={cn("text-2xl font-bold", grade.color)}>
            {metric === 'cls' ? formatCLS(value) : formatDuration(value)}
          </span>
          {unit && <span className="text-sm text-gray-500 ml-1">{unit}</span>}
        </div>
        <p className="text-xs text-gray-600">{description}</p>
      </div>
    )
  }

  const hasAnyReports = Object.values(reports).some(report => report !== null)
  const activeReport = reports[activeViewport]

  if (!hasAnyReports && !loading && !error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64 bg-orange-50/50 border border-orange-100 rounded-xl">
          <div className="text-center">
            <Zap className="h-12 w-12 mx-auto text-orange-500 mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-gray-800">Lighthouse Performance Analysis</h3>
            <p className="text-gray-600 mb-6 max-w-md">
              Run a comprehensive performance analysis to get Core Web Vitals, Lighthouse scores, 
              and actionable optimization recommendations for all viewports.
            </p>
            <Button 
              onClick={onRunAnalysis} 
              size="lg" 
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              <Play className="h-5 w-5 mr-2" />
              Run Analysis
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-orange-50/80 border border-orange-200/60 rounded-xl">
        <div className="text-center">
          <Loader2 className="h-12 w-12 mx-auto text-orange-600 animate-spin mb-4" />
          <h3 className="text-xl font-semibold mb-2 text-gray-800">Running Performance Analysis</h3>
          <p className="text-orange-700 font-medium">
            Analyzing performance across all viewports... This may take a few minutes.
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 bg-red-50 dark:bg-red-950/10 rounded-xl">
        <div className="text-center">
          <XCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
          <h3 className="text-xl font-semibold mb-2 text-red-800 dark:text-red-200">Analysis Failed</h3>
          <p className="text-red-600 dark:text-red-400 mb-6">{error}</p>
          <Button onClick={onRunAnalysis} variant="outline" size="lg">
            <Play className="h-5 w-5 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Viewport Tabs */}
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-gray-800">Performance Analysis Results</h3>
        <Button onClick={onRunAnalysis} variant="outline" size="sm">
          <Play className="h-4 w-4 mr-2" />
          Run Analysis
        </Button>
      </div>

      <Tabs value={activeViewport} onValueChange={setActiveViewport} className="w-full">
        <TabsList className="grid w-full grid-cols-4 h-12 bg-orange-100/60 border border-orange-200/60 rounded-xl">
          {Object.keys(reports).map(viewport => (
            <TabsTrigger 
              key={viewport}
              value={viewport} 
              className="flex items-center gap-2 data-[state=active]:bg-white/80 data-[state=active]:text-orange-700 data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-orange-200/60 text-gray-700 font-medium rounded-lg"
            >
              {getViewportIcon(viewport)}
              <span className="hidden sm:inline">{getViewportName(viewport)}</span>
              {reports[viewport] && (
                <div className="w-2 h-2 bg-green-500 rounded-full ml-1" />
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {Object.entries(reports).map(([viewport, report]) => (
          <TabsContent key={viewport} value={viewport} className="mt-6">
            {report ? (
              <div className="space-y-6">
                {/* Lighthouse Scores */}
                <div className="bg-white/50 backdrop-blur-sm border border-orange-200/60 rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <BarChart3 className="h-5 w-5 text-orange-600" />
                    <h4 className="text-lg font-semibold text-gray-800">Lighthouse Scores</h4>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <ScoreGauge 
                      score={report.scores.performance} 
                      title="Performance" 
                      icon={<Zap className="h-4 w-4" />} 
                    />
                    <ScoreGauge 
                      score={report.scores.accessibility} 
                      title="Accessibility" 
                      icon={<Eye className="h-4 w-4" />} 
                    />
                    <ScoreGauge 
                      score={report.scores.bestPractices} 
                      title="Best Practices" 
                      icon={<CheckCircle className="h-4 w-4" />} 
                    />
                    <ScoreGauge 
                      score={report.scores.seo} 
                      title="SEO" 
                      icon={<Target className="h-4 w-4" />} 
                    />
                  </div>
                </div>

                {/* Core Web Vitals */}
                <div className="bg-white/50 backdrop-blur-sm border border-orange-200/60 rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <TrendingUp className="h-5 w-5 text-orange-600" />
                    <h4 className="text-lg font-semibold text-gray-800">Core Web Vitals</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    <CoreWebVitalCard
                      title="Largest Contentful Paint"
                      value={report.coreWebVitals.lcp}
                      unit=""
                      metric="lcp"
                      icon={<Clock className="h-4 w-4 text-blue-500" />}
                      description="How quickly the main content loads"
                    />
                    <CoreWebVitalCard
                      title="Cumulative Layout Shift"
                      value={report.coreWebVitals.cls}
                      unit=""
                      metric="cls"
                      icon={<Target className="h-4 w-4 text-purple-500" />}
                      description="Visual stability of the page"
                    />
                    <CoreWebVitalCard
                      title="Interaction to Next Paint"
                      value={report.coreWebVitals.inp}
                      unit=""
                      metric="inp"
                      icon={<Zap className="h-4 w-4 text-green-500" />}
                      description="Responsiveness to user interactions"
                    />
                    <CoreWebVitalCard
                      title="First Contentful Paint"
                      value={report.coreWebVitals.fcp}
                      unit=""
                      metric="fcp"
                      icon={<Eye className="h-4 w-4 text-orange-500" />}
                      description="When first content appears"
                    />
                    <CoreWebVitalCard
                      title="Time to First Byte"
                      value={report.coreWebVitals.ttfb}
                      unit=""
                      metric="ttfb"
                      icon={<Clock className="h-4 w-4 text-red-500" />}
                      description="Server response time"
                    />
                    <CoreWebVitalCard
                      title="Total Blocking Time"
                      value={report.coreWebVitals.tbt}
                      unit=""
                      metric="tbt"
                      icon={<AlertTriangle className="h-4 w-4 text-yellow-500" />}
                      description="Time blocked by long tasks"
                    />
                  </div>
                </div>

                {/* Performance Opportunities */}
                {report.opportunities.length > 0 && (
                  <div className="bg-white/50 backdrop-blur-sm border border-orange-200/60 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                      <TrendingUp className="h-5 w-5 text-orange-600" />
                      <h4 className="text-lg font-semibold text-gray-800">Performance Opportunities</h4>
                    </div>
                    <div className="space-y-3">
                      {report.opportunities.slice(0, 5).map((opportunity, index) => (
                        <div key={index} className="flex items-start gap-3 p-3 bg-blue-50/50 border border-blue-100 rounded-lg">
                          <TrendingUp className="h-4 w-4 text-blue-500 mt-0.5" />
                          <div className="flex-1">
                            <p className="font-medium text-blue-800">{opportunity.title}</p>
                            <p className="text-sm text-blue-600 mt-1">{opportunity.description}</p>
                            {opportunity.displayValue && (
                              <p className="text-xs text-blue-500 mt-1">Potential savings: {opportunity.displayValue}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Performance Diagnostics */}
                {report.diagnostics.length > 0 && (
                  <div className="bg-white/50 backdrop-blur-sm border border-orange-200/60 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                      <CheckCircle className="h-5 w-5 text-orange-600" />
                      <h4 className="text-lg font-semibold text-gray-800">Diagnostics</h4>
                    </div>
                    <div className="space-y-3">
                      {report.diagnostics.slice(0, 5).map((diagnostic, index) => (
                        <div key={index} className="flex items-start gap-3 p-3 bg-gray-50/50 border border-gray-100 rounded-lg">
                          {getScoreIcon(diagnostic.score ?? undefined)}
                          <div className="flex-1">
                            <p className="font-medium text-gray-800">{diagnostic.title}</p>
                            <p className="text-sm text-gray-600 mt-1">{diagnostic.description}</p>
                            {diagnostic.displayValue && (
                              <p className="text-xs text-gray-500 mt-1">{diagnostic.displayValue}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-32 bg-gray-50 rounded-xl">
                <p className="text-gray-500">No performance data available for {getViewportName(viewport)}</p>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}