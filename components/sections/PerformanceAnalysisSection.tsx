'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { 
  Zap, 
  ChevronDown, 
  ChevronUp,
  Play,
  Loader2,
  AlertCircle,
  CheckCircle,
  Copy,
  Download
} from 'lucide-react'
import { useWebsiteViewer } from '@/contexts/WebsiteViewerContext'
import LighthouseSection from '../metadata/LighthouseSection'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface PerformanceAnalysisSectionProps {
  expanded: boolean
  onToggle: () => void
}

export default function PerformanceAnalysisSection({ expanded, onToggle }: PerformanceAnalysisSectionProps) {
  const {
    currentSite,
    lighthouseReports: rawLighthouseReports,
    lighthouseLoading,
    lighthouseError,
    fetchAllLighthouseReports
  } = useWebsiteViewer()

  // Additional sanitization layer specifically for UI rendering
  const lighthouseReports = React.useMemo(() => {
    const sanitizeForUI = (data: any): any => {
      if (data === null || data === undefined) return data
      if (typeof data !== 'object') return data
      
      // Return only serializable data for UI
      try {
        return JSON.parse(JSON.stringify(data))
      } catch (error) {
        console.warn('Failed to serialize lighthouse data for UI, returning null:', error)
        return null
      }
    }

    const sanitized: Record<string, any> = {}
    for (const [key, value] of Object.entries(rawLighthouseReports)) {
      sanitized[key] = sanitizeForUI(value)
    }
    return sanitized
  }, [rawLighthouseReports])

  const safeStringify = (obj: any): string => {
    const seen = new Set()
    
    const replacer = (key: string, value: any): any => {
      // Handle null and primitive values
      if (value === null || typeof value !== 'object') {
        return value
      }
      
      // Handle circular references
      if (seen.has(value)) {
        return '[Circular Reference]'
      }
      
      // Skip DOM elements
      if (value instanceof Element || value instanceof Node || value instanceof HTMLElement || value.nodeType) {
        return '[DOM Element]'
      }
      
      // Skip functions
      if (typeof value === 'function') {
        return '[Function]'
      }
      
      // Skip React components and fiber nodes
      if (value.$$typeof || value._owner || value.props || value.type || value.stateNode || value.return || value.child) {
        return '[React Element/Fiber]'
      }
      
      // Skip known problematic constructors
      const constructor = value.constructor
      if (constructor && (
        constructor.name === 'HTMLButtonElement' ||
        constructor.name === 'HTMLDivElement' ||
        constructor.name === 'HTMLElement' ||
        constructor.name === 'FiberNode' ||
        constructor.name.startsWith('HTML') ||
        constructor.name.includes('Element')
      )) {
        return '[HTML/DOM Element]'
      }
      
      // Add to seen set
      seen.add(value)
      
      // For arrays and objects, let JSON.stringify handle them normally
      return value
    }
    
    try {
      return JSON.stringify(obj, replacer, 2)
    } catch (error) {
      console.error('Serialization error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      return JSON.stringify({ error: 'Failed to serialize data', message: errorMessage }, null, 2)
    }
  }

  const exportLighthouseReports = () => {
    const hasReports = Object.values(lighthouseReports).some(report => report !== null)
    if (!hasReports) return
    
    try {
      const exportData = {
        url: currentSite,
        timestamp: new Date().toISOString(),
        reports: lighthouseReports
      }
      
      // Use safe stringify to handle all edge cases
      const dataStr = safeStringify(exportData)
      
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `lighthouse-reports-${new Date().toISOString().split('T')[0]}.json`
      link.click()
      URL.revokeObjectURL(url)
      toast.success('Lighthouse reports exported successfully')
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to export reports: Unexpected error occurred')
    }
  }

  const getStatus = () => {
    const hasLighthouseReports = Object.values(lighthouseReports).some(report => report !== null)
    
    if (lighthouseLoading) return { icon: <Loader2 className="h-5 w-5 animate-spin" />, text: 'Analyzing...', color: 'bg-blue-500' }
    if (lighthouseError) return { icon: <AlertCircle className="h-5 w-5" />, text: 'Error', color: 'bg-red-500' }
    if (hasLighthouseReports) return { icon: <CheckCircle className="h-5 w-5" />, text: 'Ready', color: 'bg-green-500' }
    return { icon: <Play className="h-5 w-5" />, text: 'Run Analysis', color: 'bg-gray-500' }
  }

  const status = getStatus()
  const hasReports = Object.values(lighthouseReports).some(report => report !== null)

  return (
    <section className={cn(
      "w-full border-b border-border",
      expanded ? "bg-gradient-to-b from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30" : "bg-background"
    )}>
      {/* Section Header - Full Width */}
      <div 
        className={cn(
          "w-full border-b border-border/50 cursor-pointer",
          expanded 
            ? "bg-transparent" 
            : "bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20"
        )}
        onClick={onToggle}
      >
        <div className="w-full px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center text-white">
                <Zap className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-1">
                  Performance Analysis
                </h2>
                <p className="text-muted-foreground">
                  Core Web Vitals, Lighthouse scores, and comprehensive performance metrics
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${status.color}`} />
                <div className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded-md border">
                  {status.text}
                </div>
              </div>
              
              {!expanded && !hasReports && !lighthouseLoading && (
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    fetchAllLighthouseReports()
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Run Analysis
                </Button>
              )}
              
              {expanded ? (
                <ChevronUp className="h-6 w-6 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Section Content - Full Width */}
      {expanded && (
        <div className="w-full py-8">
          <div className="w-full px-6">
            {hasReports && (
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold">Performance Analysis Results</h3>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={exportLighthouseReports}
                    title="Export Lighthouse reports as JSON"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export Reports
                  </Button>
                </div>
              </div>
            )}

            <LighthouseSection 
              reports={lighthouseReports}
              onRunAnalysis={fetchAllLighthouseReports}
              loading={lighthouseLoading}
              error={lighthouseError}
            />
          </div>
        </div>
      )}
    </section>
  )
}