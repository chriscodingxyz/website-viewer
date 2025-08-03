'use client'

import React, { useState, useEffect } from 'react'
import { WebsiteMetadata } from '@/types/metadata'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { 
  Search, 
  Share2, 
  Globe, 
  Zap,
  ChevronUp,
  BarChart3,
  Shield,
  Smartphone,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react'
import SEOSection from './metadata/SEOSection'
import SocialPreview from './metadata/SocialPreview'
import TechnicalSection from './metadata/TechnicalSection'
import PerformanceSection from './metadata/PerformanceSection'

interface AnalysisSheetProps {
  url: string
  metadata: WebsiteMetadata | null
  metadataLoading: boolean
  metadataError: string | null
  onExtractMetadata: () => void
}

export default function AnalysisSheet({
  url,
  metadata,
  metadataLoading,
  metadataError,
  onExtractMetadata
}: AnalysisSheetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('metadata')
  const [hasAutoOpened, setHasAutoOpened] = useState(false)

  // Auto-open sheet when metadata is extracted (only once)
  useEffect(() => {
    if (metadata && !hasAutoOpened) {
      setIsOpen(true)
      setHasAutoOpened(true)
    }
  }, [metadata, hasAutoOpened])

  // Reset auto-open flag when URL changes (new site loaded)
  useEffect(() => {
    setHasAutoOpened(false)
  }, [url])

  const getMetadataStatus = () => {
    if (metadataLoading) return { icon: <Loader2 className="h-4 w-4 animate-spin" />, text: 'Extracting...', color: 'bg-blue-500' }
    if (metadataError) return { icon: <AlertCircle className="h-4 w-4" />, text: 'Error', color: 'bg-red-500' }
    if (metadata) return { icon: <CheckCircle className="h-4 w-4" />, text: 'Ready', color: 'bg-green-500' }
    return { icon: <Search className="h-4 w-4" />, text: 'Extract', color: 'bg-gray-500' }
  }

  const status = getMetadataStatus()

  const TriggerContent = () => (
    <div className="flex items-center justify-between w-full p-4 bg-background border-t border-border shadow-lg rounded-t-lg hover:bg-accent/50 transition-colors">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${status.color}`} />
          <span className="font-medium">Website Analysis</span>
        </div>
        <div className="flex gap-1">
          <Badge variant="outline" className="text-xs">
            {status.text}
          </Badge>
          {metadata && (
            <Badge variant="secondary" className="text-xs">
              4 Tools
            </Badge>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {!metadata && !metadataLoading && url && (
          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onExtractMetadata()
            }}
            className="h-7"
          >
            {status.icon}
            <span className="ml-1">Extract Data</span>
          </Button>
        )}
        <ChevronUp className="h-4 w-4 text-muted-foreground" />
      </div>
    </div>
  )

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <button className="fixed bottom-0 left-0 right-0 z-40">
          <TriggerContent />
        </button>
      </SheetTrigger>
      
      <SheetContent 
        side="bottom" 
        className="h-[90vh] rounded-t-lg border-t"
      >
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Website Analysis Tools
          </SheetTitle>
          <SheetDescription>
            Comprehensive analysis and optimization insights for {url || 'your website'}
          </SheetDescription>
        </SheetHeader>

        {!url && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Globe className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Website Loaded</h3>
              <p className="text-muted-foreground">
                Load a website to start analyzing its metadata, performance, and SEO.
              </p>
            </div>
          </div>
        )}

        {url && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="metadata" className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                <span className="hidden sm:inline">Metadata</span>
              </TabsTrigger>
              <TabsTrigger value="social" className="flex items-center gap-2">
                <Share2 className="h-4 w-4" />
                <span className="hidden sm:inline">Social</span>
              </TabsTrigger>
              <TabsTrigger value="technical" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                <span className="hidden sm:inline">Technical</span>
              </TabsTrigger>
              <TabsTrigger value="performance" className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                <span className="hidden sm:inline">Performance</span>
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto px-1">
              {!metadata && !metadataLoading && !metadataError && (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">Extract Website Data</h3>
                    <p className="text-muted-foreground mb-4">
                      Analyze SEO metadata, social previews, and technical details.
                    </p>
                    <Button onClick={onExtractMetadata}>
                      <Search className="h-4 w-4 mr-2" />
                      Extract Metadata
                    </Button>
                  </div>
                </div>
              )}

              {metadataLoading && (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Loader2 className="h-12 w-12 mx-auto text-blue-500 animate-spin mb-4" />
                    <h3 className="text-lg font-medium mb-2">Analyzing Website</h3>
                    <p className="text-muted-foreground">
                      Extracting metadata and generating insights...
                    </p>
                  </div>
                </div>
              )}

              {metadataError && (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
                    <h3 className="text-lg font-medium mb-2">Analysis Failed</h3>
                    <p className="text-muted-foreground mb-4">{metadataError}</p>
                    <Button onClick={onExtractMetadata} variant="outline">
                      Try Again
                    </Button>
                  </div>
                </div>
              )}

              {metadata && (
                <>
                  <TabsContent value="metadata" className="mt-4 pb-6">
                    <SEOSection metadata={metadata} />
                  </TabsContent>

                  <TabsContent value="social" className="mt-4 pb-6">
                    <SocialPreview metadata={metadata} />
                  </TabsContent>

                  <TabsContent value="technical" className="mt-4 pb-6">
                    <TechnicalSection metadata={metadata} />
                  </TabsContent>

                  <TabsContent value="performance" className="mt-4 pb-6">
                    <PerformanceSection metadata={metadata} />
                  </TabsContent>
                </>
              )}
            </div>
          </Tabs>
        )}
      </SheetContent>
    </Sheet>
  )
}