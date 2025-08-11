'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { BarChart3, ChevronDown, ChevronUp, Search, Share2, Globe, Zap, Loader2, AlertCircle, CheckCircle, Copy, Download, XCircle, AlertTriangle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useWebsiteViewer } from '@/contexts/WebsiteViewerContext'
import SEOSection from '../metadata/SEOSection'
import SocialPreview from '../metadata/SocialPreview'
import TechnicalSection from '../metadata/TechnicalSection'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { WebsiteMetadata } from '@/types/metadata'

interface AnalysisSectionProps {
  expanded: boolean
  onToggle: () => void
}

export default function AnalysisSection({ expanded, onToggle }: AnalysisSectionProps) {
  const { metadata, metadataLoading, metadataError, fetchMetadata, currentSite } = useWebsiteViewer()

  // Helper functions from OverviewDashboard
  const getSEOScore = (metadata: WebsiteMetadata | null) => {
    if (!metadata) return { score: 0, maxScore: 5, percentage: 0 }
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

  // const getPerformanceScore = (metadata: any) => {
  //   if (!metadata.performance?.loadTime) return { grade: 'Unknown', color: 'text-gray-500', bgColor: 'bg-gray-100' }
  //   const loadTime = metadata.performance.loadTime
  //   if (loadTime < 1000) return { grade: 'Excellent', color: 'text-green-700', bgColor: 'bg-green-100' }
  //   if (loadTime < 3000) return { grade: 'Good', color: 'text-yellow-700', bgColor: 'bg-yellow-100' }
  //   return { grade: 'Poor', color: 'text-red-700', bgColor: 'bg-red-100' }
  // }

  const getSocialScore = (metadata: WebsiteMetadata | null) => {
    if (!metadata) return { score: 0, maxScore: 4, percentage: 0 }
    let score = 0
    const maxScore = 4
    const { openGraph, twitterCard } = metadata
    if (openGraph.title) score += 1
    if (openGraph.description) score += 1
    if (openGraph.image) score += 1
    if (twitterCard.card) score += 1
    return { score, maxScore, percentage: Math.round((score / maxScore) * 100) }
  }

  const getCriticalIssues = (metadata: WebsiteMetadata | null) => {
    if (!metadata) return []
    const issues = []
    const { seo, openGraph } = metadata // performance
    if (!seo.title) issues.push('Missing title')
    if (!seo.description) issues.push('Missing meta description')
    // if (performance?.loadTime && performance.loadTime > 3000) issues.push('Slow loading time')
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
    <div className="w-full">
      {metadata && (
        <div className="flex items-center justify-center gap-3 px-6 py-3 bg-muted/20 border-b border-border/50">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={copyMetadata}>
              <Copy className="h-3 w-3 mr-1" />
              Copy
            </Button>
            <Button variant="outline" size="sm" onClick={exportMetadata}>
              <Download className="h-3 w-3 mr-1" />
              Export
            </Button>
          </div>
        </div>
      )}

      <div className="w-full py-6 px-6 relative">
        {!metadata && !currentSite && (
            <div className="flex items-center justify-center h-32 bg-muted/10 rounded-xl">
              <div className="text-center">
                <Search className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
                <h3 className="text-lg font-semibold mb-2">Website Analysis</h3>
                <p className="text-sm text-muted-foreground max-w-md">Enter a website URL to automatically extract metadata and analyze the site.</p>
              </div>
            </div>
          )}

          {currentSite && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* Left column - SEO takes full width */}
              <div className="xl:col-span-1">
                <SEOSection metadata={metadata} />
              </div>
              
              {/* Right columns - 2 columns for other sections */}
              <div className="xl:col-span-2">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="lg:col-span-1">
                    <SocialPreview metadata={metadata} />
                  </div>
                  <div className="lg:col-span-1">
                    <TechnicalSection metadata={metadata} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
    </div>
  )
}
