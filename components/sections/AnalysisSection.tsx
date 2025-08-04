'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { BarChart3, ChevronDown, ChevronUp, Search, Share2, Globe, Zap, Loader2, AlertCircle, CheckCircle, Copy, Download } from 'lucide-react'
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
    <section className={cn("w-full border-b border-border", expanded ? "bg-gradient-to-b from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/30" : "bg-background")}>
      <div className={cn("w-full border-b border-border/50 cursor-pointer", !expanded && "bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20")} onClick={onToggle}>
        <div className="w-full px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center text-white">
                <BarChart3 className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-1">Website Analysis</h2>
                <p className="text-muted-foreground">SEO, social media, technical details, and performance insights</p>
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
                 <div className="flex items-center gap-2 text-sm font-semibold text-green-600"><CheckCircle className="h-5 w-5" />Analysis Ready</div>
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
        <div className="w-full py-8 px-6">
          {!metadata && !metadataLoading && !metadataError && (
            <div className="flex items-center justify-center h-64 bg-muted/10 rounded-xl">
              <div className="text-center">
                <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">Extract Website Data</h3>
                <p className="text-muted-foreground mb-6 max-w-md">Click the "Extract Data" button in the header to get started.</p>
              </div>
            </div>
          )}

          {metadataLoading && (
            <div className="flex items-center justify-center h-64 bg-orange-50/80 dark:bg-orange-950/40 border border-orange-200/60 dark:border-orange-800/40 rounded-xl">
              <div className="text-center">
                <Loader2 className="h-12 w-12 mx-auto text-orange-600 dark:text-orange-400 animate-spin mb-4" />
                <h3 className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-200">Analyzing Website</h3>
                <p className="text-orange-700 dark:text-orange-300 font-medium">Extracting metadata for {currentSite}...</p>
              </div>
            </div>
          )}

          {metadataError && (
            <div className="flex items-center justify-center h-64 bg-red-50 dark:bg-red-950/10 rounded-xl">
              <div className="text-center">
                <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
                <h3 className="text-xl font-semibold mb-2 text-red-800 dark:text-red-200">Analysis Failed</h3>
                <p className="text-red-600 dark:text-red-400 mb-6">{metadataError}</p>
                <Button onClick={() => fetchMetadata()} variant="outline" size="lg"><Search className="h-5 w-5 mr-2" />Try Again</Button>
              </div>
            </div>
          )}

          {metadata && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">Analysis Results</h3>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={copyMetadata}><Copy className="h-4 w-4 mr-2" />Copy Data</Button>
                  <Button variant="outline" onClick={exportMetadata}><Download className="h-4 w-4 mr-2" />Export JSON</Button>
                </div>
              </div>

              <Accordion type="single" collapsible defaultValue="seo" className="w-full">
                <AccordionItem value="seo">
                  <AccordionTrigger className="text-base font-semibold"><Search className="h-5 w-5 mr-3 text-orange-500"/>SEO Metadata</AccordionTrigger>
                  <AccordionContent className="pt-4"><SEOSection metadata={metadata} /></AccordionContent>
                </AccordionItem>
                <AccordionItem value="social">
                  <AccordionTrigger className="text-base font-semibold"><Share2 className="h-5 w-5 mr-3 text-orange-500"/>Social Media Preview</AccordionTrigger>
                  <AccordionContent className="pt-4"><SocialPreview metadata={metadata} /></AccordionContent>
                </AccordionItem>
                <AccordionItem value="technical">
                  <AccordionTrigger className="text-base font-semibold"><Globe className="h-5 w-5 mr-3 text-orange-500"/>Technical Details</AccordionTrigger>
                  <AccordionContent className="pt-4"><TechnicalSection metadata={metadata} /></AccordionContent>
                </AccordionItem>
                <AccordionItem value="performance">
                  <AccordionTrigger className="text-base font-semibold"><Zap className="h-5 w-5 mr-3 text-orange-500"/>Performance Overview</AccordionTrigger>
                  <AccordionContent className="pt-4"><PerformanceSection metadata={metadata} /></AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          )}
        </div>
      )}
    </section>
  )
}