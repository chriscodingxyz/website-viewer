'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { BarChart3, ChevronDown, ChevronUp, Search, Share2, Globe, Zap, Loader2, AlertCircle, CheckCircle, Copy, Download, XCircle, AlertTriangle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useWebsiteViewer } from '@/contexts/WebsiteViewerContext'
import SEOSection from '../metadata/SEOSection'
import SocialPreview from '../metadata/SocialPreview'
import TechnicalSection from '../metadata/TechnicalSection'
import PerformanceSection from '../metadata/PerformanceSection'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface AnalysisSectionProps {
  expanded: boolean
  onToggle: () => void
}

export default function AnalysisSection({ expanded, onToggle }: AnalysisSectionProps) {
  const { metadata, metadataLoading, metadataError, fetchMetadata, currentSite } = useWebsiteViewer()

  // Helper functions from OverviewDashboard
  const getSEOScore = (metadata: any) => {
    let score = 0
    const maxScore = 5
    const { seo } = metadata
    if (seo.title && seo.title.length >= 30 && seo.title.length <= 60) score += 1
    if (seo.description && seo.description.length >= 120 && seo.description.length <= 160) score += 1
    if (seo.canonical) score += 1
    if (seo.language) score += 1
    if (seo.viewport) score += 1
    return { score, maxScore, percentage: Math.round((score / maxScore) * 100) }
  }

  const getPerformanceScore = (metadata: any) => {
    if (!metadata.performance?.loadTime) return { grade: 'Unknown', color: 'text-gray-500', bgColor: 'bg-gray-100' }
    const loadTime = metadata.performance.loadTime
    if (loadTime < 1000) return { grade: 'Excellent', color: 'text-green-700', bgColor: 'bg-green-100' }
    if (loadTime < 3000) return { grade: 'Good', color: 'text-yellow-700', bgColor: 'bg-yellow-100' }
    return { grade: 'Poor', color: 'text-red-700', bgColor: 'bg-red-100' }
  }

  const getSocialScore = (metadata: any) => {
    let score = 0
    const maxScore = 4
    const { openGraph, twitterCard } = metadata
    if (openGraph.title) score += 1
    if (openGraph.description) score += 1
    if (openGraph.image) score += 1
    if (twitterCard.card) score += 1
    return { score, maxScore, percentage: Math.round((score / maxScore) * 100) }
  }

  const getCriticalIssues = (metadata: any) => {
    const issues = []
    const { seo, performance, openGraph } = metadata
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


  const copyMetadata = () => {
    if (!metadata) return
    try {
      const dataStr = JSON.stringify(metadata, null, 2)
      navigator.clipboard.writeText(dataStr)
      toast.success('Metadata copied to clipboard')
    } catch (err) {
      toast.error('Failed to copy metadata')
    }
  }

  const exportMetadata = () => {
    if (!metadata) return
    try {
      const dataStr = JSON.stringify(metadata, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `metadata-${new URL(metadata.url).hostname}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      toast.success('Metadata exported successfully')
    } catch (error) {
      toast.error('Failed to export metadata')
    }
  }

  return (
    <section className="w-full border-b border-border bg-background">
      <div className="w-full border-b border-border/50 cursor-pointer bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 sticky top-16 z-40" onClick={onToggle}>
        <div className="w-full px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center text-white">
                <BarChart3 className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground mb-1">Website Analysis</h2>
                <p className="text-sm text-muted-foreground">SEO, social media, technical details, and performance insights</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {!metadata && !metadataLoading && (
                <Button size="sm" onClick={(e) => { e.stopPropagation(); fetchMetadata(); }} className="bg-orange-600 hover:bg-orange-700 text-white">
                  <Search className="h-4 w-4 mr-2" />
                  Extract Data
                </Button>
              )}
              {metadataLoading && (
                <div className="flex items-center gap-2 text-sm font-semibold text-orange-600"><Loader2 className="h-5 w-5 animate-spin" />Extracting...</div>
              )}
              {metadata && !metadataLoading && (
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-green-600"><CheckCircle className="h-5 w-5" />Analysis Ready</div>
                  <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                    <Button variant="outline" size="sm" onClick={copyMetadata}><Copy className="h-3 w-3 mr-1" />Copy</Button>
                    <Button variant="outline" size="sm" onClick={exportMetadata}><Download className="h-3 w-3 mr-1" />Export</Button>
                  </div>
                </div>
              )}
               {metadataError && (
                 <div className="flex items-center gap-2 text-sm font-semibold text-red-600"><AlertCircle className="h-5 w-5" />Error</div>
              )}
              <div onClick={(e) => e.stopPropagation()}>{expanded ? <ChevronUp className="h-6 w-6 text-muted-foreground" /> : <ChevronDown className="h-6 w-6 text-muted-foreground" />}</div>
            </div>
          </div>
        </div>
      </div>


      {expanded && (
        <div className="w-full py-6 px-6 relative">
          {!metadata && !metadataLoading && !metadataError && (
            <div className="flex items-center justify-center h-32 bg-muted/10 rounded-xl">
              <div className="text-center">
                <Search className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
                <h3 className="text-lg font-semibold mb-2">Extract Website Data</h3>
                <p className="text-sm text-muted-foreground max-w-md">Click the &quot;Extract Data&quot; button in the header to get started.</p>
              </div>
            </div>
          )}

          {metadataLoading && (
            <div className="flex items-center justify-center h-32 bg-orange-50/80 dark:bg-orange-950/40 border border-orange-200/60 dark:border-orange-800/40 rounded-xl">
              <div className="text-center">
                <Loader2 className="h-8 w-8 mx-auto text-orange-600 dark:text-orange-400 animate-spin mb-3" />
                <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-200">Analyzing Website</h3>
                <p className="text-orange-700 dark:text-orange-300 font-medium">Extracting metadata for {currentSite}...</p>
              </div>
            </div>
          )}

          {metadataError && (
            <div className="flex items-center justify-center h-32 bg-red-50 dark:bg-red-950/10 rounded-xl">
              <div className="text-center">
                <AlertCircle className="h-8 w-8 mx-auto text-red-500 mb-3" />
                <h3 className="text-lg font-semibold mb-2 text-red-800 dark:text-red-200">Analysis Failed</h3>
                <p className="text-sm text-red-600 dark:text-red-400 mb-4">{metadataError}</p>
                <Button onClick={() => fetchMetadata()} variant="outline" size="sm"><Search className="h-4 w-4 mr-2" />Try Again</Button>
              </div>
            </div>
          )}

          {metadata && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* Left column - SEO takes full width */}
              <div className="xl:col-span-1">
                <SEOSection metadata={metadata} />
              </div>
              
              {/* Right column - Performance and other sections */}
              <div className="xl:col-span-2 space-y-6">
                <PerformanceSection metadata={metadata} />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <SocialPreview metadata={metadata} />
                  <TechnicalSection metadata={metadata} />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
