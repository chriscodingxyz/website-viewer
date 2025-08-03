'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  BarChart3, 
  ChevronDown, 
  ChevronUp, 
  Search, 
  Share2, 
  Globe, 
  Zap,
  Loader2,
  AlertCircle,
  CheckCircle,
  Copy,
  Download
} from 'lucide-react'
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
  const [activeAnalysisTab, setActiveAnalysisTab] = useState('metadata')
  
  const {
    currentSite,
    metadata,
    metadataLoading,
    metadataError,
    fetchMetadata
  } = useWebsiteViewer()

  const copyMetadata = async () => {
    if (!metadata) return
    
    try {
      await navigator.clipboard.writeText(JSON.stringify(metadata, null, 2))
      toast.success('Metadata copied to clipboard')
    } catch (err) {
      toast.error('Failed to copy metadata')
    }
  }

  const exportMetadata = () => {
    if (!metadata) return
    
    const dataStr = JSON.stringify(metadata, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `metadata-${new Date().toISOString().split('T')[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
    toast.success('Metadata exported successfully')
  }

  const getStatus = () => {
    if (metadataLoading) return { icon: <Loader2 className="h-5 w-5 animate-spin" />, text: 'Extracting...', color: 'bg-blue-500' }
    if (metadataError) return { icon: <AlertCircle className="h-5 w-5" />, text: 'Error', color: 'bg-red-500' }
    if (metadata) return { icon: <CheckCircle className="h-5 w-5" />, text: 'Ready', color: 'bg-green-500' }
    return { icon: <Search className="h-5 w-5" />, text: 'Extract', color: 'bg-gray-500' }
  }

  const status = getStatus()

  return (
    <section className={cn(
      "w-full border-b border-border",
      expanded ? "bg-gradient-to-b from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/30" : "bg-background"
    )}>
      {/* Section Header - Full Width */}
      <div 
        className={cn(
          "w-full border-b border-border/50 cursor-pointer",
          expanded 
            ? "bg-transparent" 
            : "bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20"
        )}
        onClick={onToggle}
      >
        <div className="w-full px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center text-white">
                <BarChart3 className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-1">
                  Website Analysis
                </h2>
                <p className="text-muted-foreground">
                  SEO metadata, social previews, technical details, and performance insights
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${status.color}`} />
                <Badge variant="outline" className="bg-background/80">
                  {status.text}
                </Badge>
              </div>
              
              {!expanded && !metadata && !metadataLoading && (
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    fetchMetadata()
                  }}
                  className="bg-orange-600 hover:bg-orange-700 text-white"
                >
                  <Search className="h-4 w-4 mr-2" />
                  Extract Data
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
            {!metadata && !metadataLoading && !metadataError && (
              <div className="flex items-center justify-center h-64 bg-muted/10 rounded-xl">
                <div className="text-center">
                  <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Extract Website Data</h3>
                  <p className="text-muted-foreground mb-6 max-w-md">
                    Analyze SEO metadata, social media previews, technical details, and performance metrics
                  </p>
                  <Button onClick={() => fetchMetadata()} size="lg" className="bg-orange-600 hover:bg-orange-700">
                    <Search className="h-5 w-5 mr-2" />
                    Extract Metadata
                  </Button>
                </div>
              </div>
            )}

            {metadataLoading && (
              <div className="flex items-center justify-center h-64 bg-orange-50/80 border border-orange-200/60 rounded-xl">
                <div className="text-center">
                  <Loader2 className="h-12 w-12 mx-auto text-orange-600 animate-spin mb-4" />
                  <h3 className="text-xl font-semibold mb-2 text-gray-800">Analyzing Website</h3>
                  <p className="text-orange-700 font-medium">
                    Extracting metadata and generating insights for {currentSite}...
                  </p>
                </div>
              </div>
            )}

            {metadataError && (
              <div className="flex items-center justify-center h-64 bg-red-50 dark:bg-red-950/10 rounded-xl">
                <div className="text-center">
                  <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
                  <h3 className="text-xl font-semibold mb-2 text-red-800 dark:text-red-200">Analysis Failed</h3>
                  <p className="text-red-600 dark:text-red-400 mb-6">{metadataError}</p>
                  <Button onClick={() => fetchMetadata()} variant="outline" size="lg">
                    <Search className="h-5 w-5 mr-2" />
                    Try Again
                  </Button>
                </div>
              </div>
            )}

            {metadata && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold">Analysis Results</h3>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={copyMetadata}
                      title="Copy metadata to clipboard"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Data
                    </Button>
                    <Button
                      variant="outline"
                      onClick={exportMetadata}
                      title="Export metadata as JSON"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export JSON
                    </Button>
                  </div>
                </div>

                <Tabs value={activeAnalysisTab} onValueChange={setActiveAnalysisTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-4 h-12 bg-orange-100/60 border border-orange-200/60 rounded-xl">
                    <TabsTrigger value="metadata" className="flex items-center gap-2 data-[state=active]:bg-white/80 data-[state=active]:text-orange-700 data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-orange-200/60 text-gray-700 font-medium rounded-lg">
                      <Search className="h-4 w-4" />
                      <span>SEO Metadata</span>
                    </TabsTrigger>
                    <TabsTrigger value="social" className="flex items-center gap-2 data-[state=active]:bg-white/80 data-[state=active]:text-orange-700 data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-orange-200/60 text-gray-700 font-medium rounded-lg">
                      <Share2 className="h-4 w-4" />
                      <span>Social Media</span>
                    </TabsTrigger>
                    <TabsTrigger value="technical" className="flex items-center gap-2 data-[state=active]:bg-white/80 data-[state=active]:text-orange-700 data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-orange-200/60 text-gray-700 font-medium rounded-lg">
                      <Globe className="h-4 w-4" />
                      <span>Technical</span>
                    </TabsTrigger>
                    <TabsTrigger value="performance" className="flex items-center gap-2 data-[state=active]:bg-white/80 data-[state=active]:text-orange-700 data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-orange-200/60 text-gray-700 font-medium rounded-lg">
                      <Zap className="h-4 w-4" />
                      <span>Performance</span>
                    </TabsTrigger>
                  </TabsList>

                  <div className="mt-6">
                    <TabsContent value="metadata" className="mt-0">
                      <SEOSection metadata={metadata} />
                    </TabsContent>

                    <TabsContent value="social" className="mt-0">
                      <SocialPreview metadata={metadata} />
                    </TabsContent>

                    <TabsContent value="technical" className="mt-0">
                      <TechnicalSection metadata={metadata} />
                    </TabsContent>

                    <TabsContent value="performance" className="mt-0">
                      <PerformanceSection metadata={metadata} />
                    </TabsContent>
                  </div>
                </Tabs>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  )
}