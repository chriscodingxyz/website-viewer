'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Zap, ChevronDown, ChevronUp, Play, Loader2, AlertCircle, CheckCircle, Download } from 'lucide-react'
import { useWebsiteViewer } from '@/contexts/WebsiteViewerContext'
import LighthouseSection from '../metadata/LighthouseSection'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface PerformanceAnalysisSectionProps {
  expanded: boolean
  onToggle: () => void
}

export default function PerformanceAnalysisSection({ expanded, onToggle }: PerformanceAnalysisSectionProps) {
  const { currentSite, lighthouseReports, lighthouseLoading, lighthouseError, fetchAllLighthouseReports } = useWebsiteViewer()

  const exportLighthouseReports = () => {
    if (!Object.values(lighthouseReports).some(report => report !== null)) return
    try {
      const exportData = {
        url: currentSite,
        timestamp: new Date().toISOString(),
        reports: lighthouseReports
      }
      const dataStr = JSON.stringify(exportData, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `lighthouse-reports-${new URL(currentSite).hostname}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      toast.success('Lighthouse reports exported successfully')
    } catch (error) {
      toast.error('Failed to export reports')
    }
  }

  const hasReports = Object.values(lighthouseReports).some(report => report !== null)

  return (
    <section className={cn("w-full border-b border-border", expanded ? "bg-gradient-to-b from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30" : "bg-background")}>
      <div className="w-full border-b border-border/50 cursor-pointer bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 sticky top-16 z-40" onClick={onToggle}>
        <div className="w-full px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center text-white">
                <Zap className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-1">Performance Analysis</h2>
                <p className="text-muted-foreground">Core Web Vitals and Lighthouse scores via Google PageSpeed</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {!hasReports && !lighthouseLoading && (
                <Button size="sm" onClick={(e) => { e.stopPropagation(); fetchAllLighthouseReports(); }} className="bg-green-600 hover:bg-green-700 text-white">
                  <Play className="h-4 w-4 mr-2" />
                  Run Analysis
                </Button>
              )}
              {lighthouseLoading && (
                <div className="flex items-center gap-2 text-sm font-semibold text-green-600"><Loader2 className="h-5 w-5 animate-spin" />Analyzing...</div>
              )}
              {hasReports && !lighthouseLoading && (
                <div className="flex items-center gap-2 text-sm font-semibold text-green-600"><CheckCircle className="h-5 w-5" />Analysis Ready</div>
              )}
              {lighthouseError && (
                <div className="flex items-center gap-2 text-sm font-semibold text-red-600"><AlertCircle className="h-5 w-5" />Error</div>
              )}
              <div onClick={(e) => e.stopPropagation()}>{expanded ? <ChevronUp className="h-6 w-6 text-muted-foreground" /> : <ChevronDown className="h-6 w-6 text-muted-foreground" />}</div>
            </div>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="w-full py-8 px-6">
          {hasReports && (
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold">Performance Analysis Results</h3>
              <div className="flex gap-2">
                <Button variant="outline" onClick={exportLighthouseReports}><Download className="h-4 w-4 mr-2" />Export Reports</Button>
                <Button onClick={() => fetchAllLighthouseReports()} className="bg-green-600 hover:bg-green-700 text-white"><Play className="h-4 w-4 mr-2" />Run Again</Button>
              </div>
            </div>
          )}
          <LighthouseSection reports={lighthouseReports} onRunAnalysis={() => fetchAllLighthouseReports()} loading={lighthouseLoading} error={lighthouseError} />
        </div>
      )}
    </section>
  )
}
