'use client'

import React, { useState } from 'react'
import { LighthouseReport } from '@/types/metadata'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Zap, Clock, Eye, Target, TrendingUp, CheckCircle, AlertTriangle, XCircle, Monitor, Tablet, Smartphone, BarChart3, Loader2, Play } from 'lucide-react'
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
    const icons = { desktop: Monitor, tablet: Tablet, mobileLarge: Smartphone, mobile: Smartphone };
    return React.createElement(icons[viewport] || Monitor, { className: "h-4 w-4" });
  };

  const getViewportName = (viewport: string) => {
    const names = { desktop: 'Desktop', tablet: 'Tablet', mobileLarge: 'Mobile Large', mobile: 'Mobile' };
    return names[viewport] || viewport;
  };

  const getScoreColor = (score?: number) => {
    if (score === undefined) return 'text-gray-400'
    if (score >= 90) return 'text-green-600'
    if (score >= 50) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getCoreWebVitalsGrade = (metric: string, value?: number) => {
    if (value === undefined) return { grade: 'N/A', color: 'text-gray-400' }
    const thresholds = {
      lcp: [2500, 4000],
      fcp: [1800, 3000],
      cls: [0.1, 0.25],
      inp: [200, 500],
      ttfb: [800, 1800],
    };
    const [good, needsImprovement] = thresholds[metric];
    if (value <= good) return { grade: 'Good', color: 'text-green-600' };
    if (value <= needsImprovement) return { grade: 'Needs Improvement', color: 'text-yellow-600' };
    return { grade: 'Poor', color: 'text-red-600' };
  }

  const formatDuration = (ms?: number) => ms === undefined ? 'N/A' : ms < 1000 ? `${Math.round(ms)}ms` : `${(ms / 1000).toFixed(2)}s`;
  const formatCLS = (cls?: number) => cls === undefined ? 'N/A' : cls.toFixed(3);

  const ScoreGauge = ({ score, title, icon }: { score?: number, title: string, icon: React.ReactNode }) => {
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = score !== undefined ? circumference - (score / 100) * circumference : circumference;
    return (
      <div className="flex flex-col items-center p-4 bg-white/50 dark:bg-gray-900/30 rounded-xl border border-green-100 dark:border-green-900/50">
        <div className="relative w-20 h-20 mb-2">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r={radius} stroke="rgb(209 213 219)" strokeWidth="8" fill="none" />
            <circle cx="50" cy="50" r={radius} stroke={score !== undefined ? (score >= 90 ? '#16a34a' : score >= 50 ? '#ca8a04' : '#dc2626') : '#9ca3af'} strokeWidth="8" fill="none" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" className="transition-all duration-1000 ease-out" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center"><span className={cn("text-lg font-bold", getScoreColor(score))}>{score !== undefined ? score : '--'}</span></div>
        </div>
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">{icon}<span>{title}</span></div>
      </div>
    )
  }

  const CoreWebVitalCard = ({ title, value, metric, icon, description }: { title: string; value?: number; metric: string; icon: React.ReactNode; description: string; }) => {
    const { grade, color } = getCoreWebVitalsGrade(metric, value);
    return (
      <div className="p-4 bg-white/50 dark:bg-gray-900/30 rounded-xl border border-green-100 dark:border-green-900/50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2"><h4 className="font-semibold text-gray-800 dark:text-gray-200">{title}</h4></div>
          <Badge className={cn("text-xs", color === 'text-green-600' ? 'bg-green-100 text-green-800' : color === 'text-yellow-600' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800')}>{grade}</Badge>
        </div>
        <div className="mb-2"><span className={cn("text-2xl font-bold", color)}>{metric === 'cls' ? formatCLS(value) : formatDuration(value)}</span></div>
        <p className="text-xs text-gray-600 dark:text-gray-400">{description}</p>
      </div>
    )
  }

  const hasAnyReports = Object.values(reports).some(report => report !== null)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-green-50/80 dark:bg-green-950/40 border border-green-200/60 dark:border-green-800/40 rounded-xl">
        <div className="text-center">
          <Loader2 className="h-12 w-12 mx-auto text-green-600 dark:text-green-400 animate-spin mb-4" />
          <h3 className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-200">Running Performance Analysis...</h3>
          <p className="text-green-700 dark:text-green-300 font-medium">This may take a few moments.</p>
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
        </div>
      </div>
    )
  }

  if (!hasAnyReports) {
    return (
      <div className="flex items-center justify-center h-64 bg-green-50/50 dark:bg-green-950/30 border border-green-100 dark:border-green-900/50 rounded-xl">
        <div className="text-center">
          <Zap className="h-12 w-12 mx-auto text-green-500 mb-4" />
          <h3 className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-200">Ready to Analyze</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">Click the "Run Analysis" button above to get started.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeViewport} onValueChange={setActiveViewport} className="w-full">
        <TabsList className="grid w-full grid-cols-4 h-12 bg-green-100/60 dark:bg-green-950/40 border border-green-200/60 dark:border-green-800/40 rounded-xl">
          {Object.keys(reports).map(viewport => (
            <TabsTrigger key={viewport} value={viewport} className="flex items-center gap-2 data-[state=active]:bg-white/80 dark:data-[state=active]:bg-green-900/50 data-[state=active]:text-green-700 dark:data-[state=active]:text-green-300 data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-green-200/60 dark:data-[state=active]:border-green-800/50 text-gray-700 dark:text-gray-300 font-medium rounded-lg">
              {getViewportIcon(viewport)}<span className="hidden sm:inline">{getViewportName(viewport)}</span>
            </TabsTrigger>
          ))}
        </TabsList>
        {Object.entries(reports).map(([viewport, report]) => (
          <TabsContent key={viewport} value={viewport} className="mt-6">
            {report ? (
              <div className="space-y-6">
                <div className="bg-white/50 dark:bg-gray-900/30 backdrop-blur-sm border border-green-200/60 dark:border-green-800/40 rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-6"><BarChart3 className="h-5 w-5 text-green-600 dark:text-green-400" /><h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Lighthouse Scores</h4></div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <ScoreGauge score={report.scores.performance} title="Performance" icon={<Zap className="h-4 w-4" />} />
                    <ScoreGauge score={report.scores.accessibility} title="Accessibility" icon={<Eye className="h-4 w-4" />} />
                    <ScoreGauge score={report.scores.bestPractices} title="Best Practices" icon={<CheckCircle className="h-4 w-4" />} />
                    <ScoreGauge score={report.scores.seo} title="SEO" icon={<Target className="h-4 w-4" />} />
                  </div>
                </div>
                <div className="bg-white/50 dark:bg-gray-900/30 backdrop-blur-sm border border-green-200/60 dark:border-green-800/40 rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-6"><TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" /><h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Core Web Vitals</h4></div>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    <CoreWebVitalCard title="Largest Contentful Paint" value={report.coreWebVitals.lcp} metric="lcp" icon={<Clock className="h-4 w-4 text-blue-500" />} description="How quickly the main content loads" />
                    <CoreWebVitalCard title="Cumulative Layout Shift" value={report.coreWebVitals.cls} metric="cls" icon={<Target className="h-4 w-4 text-purple-500" />} description="Visual stability of the page" />
                    <CoreWebVitalCard title="Interaction to Next Paint" value={report.coreWebVitals.inp} metric="inp" icon={<Zap className="h-4 w-4 text-green-500" />} description="Responsiveness to user interactions" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-32 bg-gray-50 dark:bg-gray-800 rounded-xl"><p className="text-gray-500 dark:text-gray-400">No performance data available for {getViewportName(viewport)}.</p></div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
