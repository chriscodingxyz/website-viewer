'use client'

import React, { useState } from 'react'
import { WebsiteMetadata } from '@/types/metadata'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  ChevronDown,
  ChevronUp,
  Copy,
  Search,
  Share2,
  Globe,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'
import { toast } from 'sonner'
import SEOSection from './SEOSection'
import SocialPreview from './SocialPreview'
import TechnicalSection from './TechnicalSection'
import PerformanceSection from './PerformanceSection'
import ExportButton from '@/components/export/ExportButton'

interface MetadataPanelProps {
  metadata: WebsiteMetadata | null
  loading: boolean
  error: string | null
  onRefresh: () => void
  url: string
}

export default function MetadataPanel({ 
  metadata, 
  loading, 
  error, 
  onRefresh, 
  url 
}: MetadataPanelProps) {
  const [isOpen, setIsOpen] = useState(false)

  const copyMetadata = async () => {
    if (!metadata) return
    
    try {
      await navigator.clipboard.writeText(JSON.stringify(metadata, null, 2))
      toast.success('Metadata copied to clipboard')
    } catch (err) {
      toast.error('Failed to copy metadata')
    }
  }


  const getStatusIcon = () => {
    if (loading) return <Spinner className="h-4 w-4 text-blue-500" />
    if (error) return <AlertCircle className="h-4 w-4 text-red-500" />
    if (metadata) return <CheckCircle className="h-4 w-4 text-green-500" />
    return <Globe className="h-4 w-4 text-gray-500" />
  }

  const getStatusText = () => {
    if (loading) return 'Extracting metadata...'
    if (error) return `Error: ${error}`
    if (metadata) return 'Metadata extracted successfully'
    return 'Click to extract metadata'
  }

  return (
    <div className="w-full">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Card 
            className="cursor-pointer hover:bg-accent/50 transition-colors"
            onClick={() => {
              if (!metadata && !loading && !error && url) {
                onRefresh()
              }
            }}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getStatusIcon()}
                  <div>
                    <CardTitle className="text-lg">Website Metadata</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {getStatusText()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!metadata && !loading && url && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        onRefresh()
                      }}
                      title="Extract metadata"
                    >
                      Extract
                    </Button>
                  )}
                  {metadata && (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          copyMetadata()
                        }}
                        title="Copy metadata"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <div onClick={(e) => e.stopPropagation()}>
                        <ExportButton metadata={metadata} />
                      </div>
                    </div>
                  )}
                  {isOpen ? (
                    <ChevronUp className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              </div>
            </CardHeader>
          </Card>
        </CollapsibleTrigger>

        <CollapsibleContent className="mt-4">
          {error && (
            <Card className="mb-4 border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  <div>
                    <p className="font-medium text-red-800">Failed to extract metadata</p>
                    <p className="text-sm text-red-600 mt-1">{error}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onRefresh}
                    className="ml-auto border-red-200 text-red-600 hover:bg-red-50"
                  >
                    Retry
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {loading && (
            <Card>
              <CardContent className="py-12">
                <div className="flex flex-col items-center gap-4">
                  <Spinner className="h-8 w-8 text-blue-500" />
                  <div className="text-center">
                    <p className="font-medium">Extracting metadata...</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Analyzing {url}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {metadata && !loading && (
            <Tabs defaultValue="seo" className="w-full">
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="seo" className="flex items-center gap-1 text-xs">
                  <Search className="h-3 w-3" />
                  SEO
                </TabsTrigger>
                <TabsTrigger value="social" className="flex items-center gap-1 text-xs">
                  <Share2 className="h-3 w-3" />
                  Social
                </TabsTrigger>
                <TabsTrigger value="technical" className="flex items-center gap-1 text-xs">
                  <Globe className="h-3 w-3" />
                  Technical
                </TabsTrigger>
                <TabsTrigger value="performance" className="flex items-center gap-1 text-xs">
                  <CheckCircle className="h-3 w-3" />
                  Performance
                </TabsTrigger>
              </TabsList>

              <TabsContent value="seo">
                <SEOSection metadata={metadata} />
              </TabsContent>

              <TabsContent value="social">
                <SocialPreview metadata={metadata} />
              </TabsContent>

              <TabsContent value="technical">
                <TechnicalSection metadata={metadata} />
              </TabsContent>

              <TabsContent value="performance">
                <PerformanceSection metadata={metadata} />
              </TabsContent>

            </Tabs>
          )}
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}