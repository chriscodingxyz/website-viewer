'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Globe, ZoomIn, ZoomOut, Monitor, Search, Share2 } from 'lucide-react'
import { toast } from 'sonner'
import { useWebsiteViewer } from '@/contexts/WebsiteViewerContext'
import SectionContainer from './SectionContainer'
import NavigationBar from './NavigationBar'

export default function WebsiteViewer () {
  
  const {
    currentSite,
    views,
    removeView,
    changeViewType,
    duplicateView,
    globalZoom,
    globalZoomStepIndex,
    setGlobalZoomStepIndex,
    zoomSteps,
    setUrlWithHighlight,
    metadata,
    metadataLoading,
    metadataError,
  } = useWebsiteViewer()

  // Global zoom functions
  const globalZoomIn = () => {
    setGlobalZoomStepIndex(Math.min(globalZoomStepIndex + 1, zoomSteps.length - 1))
    toast.success(
      `Global zoom: ${Math.round(
        zoomSteps[Math.min(globalZoomStepIndex + 1, zoomSteps.length - 1)] * 100
      )}%`
    )
  }

  const globalZoomOut = () => {
    setGlobalZoomStepIndex(Math.max(globalZoomStepIndex - 1, 0))
    toast.success(
      `Global zoom: ${Math.round(
        zoomSteps[Math.max(globalZoomStepIndex - 1, 0)] * 100
      )}%`
    )
  }

  const resetGlobalZoom = () => {
    setGlobalZoomStepIndex(0)
    toast.success('Global zoom reset to 100%')
  }

  // No grouping needed in single-site mode

  return (
    <div>
      {/* Main Content Area */}
      <div className='min-h-screen'>
        {!currentSite && (
          <div className='flex items-center justify-center min-h-[calc(100vh-4rem)] py-12'>
            <div className='max-w-4xl mx-auto px-6 w-full'>
              <div className='text-center space-y-12'>
                {/* Hero Section */}
                <div className='space-y-6'>
                  <div className='inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg mb-4'>
                    <Globe className='h-10 w-10 text-white' />
                  </div>
                  <div className='space-y-3'>
                    <h1 className='text-5xl md:text-6xl font-bold tracking-tight text-foreground'>
                      Website Viewer
                    </h1>
                    <p className='text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto'>
                      View websites across multiple devices, analyze SEO, and preview social cards
                    </p>
                  </div>
                </div>

                {/* Feature Cards */}
                <div className='grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto'>
                  <div className='group p-8 rounded-2xl border border-border/50 bg-gradient-to-br from-card to-card/50 hover:border-blue-500/50 transition-all duration-300 hover:shadow-lg text-center'>
                    <div className='w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform mx-auto'>
                      <Monitor className='h-6 w-6 text-blue-600' />
                    </div>
                    <h3 className='font-bold text-base mb-2 text-foreground'>Multi-Device Preview</h3>
                    <p className='text-sm text-muted-foreground leading-relaxed'>Test responsive layouts across desktop, tablet, and mobile viewports</p>
                  </div>
                  <div className='group p-8 rounded-2xl border border-border/50 bg-gradient-to-br from-card to-card/50 hover:border-green-500/50 transition-all duration-300 hover:shadow-lg text-center'>
                    <div className='w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform mx-auto'>
                      <Search className='h-6 w-6 text-green-600' />
                    </div>
                    <h3 className='font-bold text-base mb-2 text-foreground'>SEO Analysis</h3>
                    <p className='text-sm text-muted-foreground leading-relaxed'>Analyze meta tags, titles, and optimization opportunities</p>
                  </div>
                  <div className='group p-8 rounded-2xl border border-border/50 bg-gradient-to-br from-card to-card/50 hover:border-purple-500/50 transition-all duration-300 hover:shadow-lg text-center'>
                    <div className='w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform mx-auto'>
                      <Share2 className='h-6 w-6 text-purple-600' />
                    </div>
                    <h3 className='font-bold text-base mb-2 text-foreground'>Social Previews</h3>
                    <p className='text-sm text-muted-foreground leading-relaxed'>Preview how your site appears on Twitter, Facebook, and LinkedIn</p>
                  </div>
                </div>

                {/* Quick Start */}
                <div className='max-w-2xl mx-auto'>
                  <div className='p-6 rounded-2xl bg-muted/30 border border-border/50'>
                    <h3 className='text-sm font-semibold mb-4 text-foreground'>Quick Start</h3>
                    <div className='flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground'>
                      <div className='flex items-center gap-2'>
                        <kbd className='px-3 py-1.5 bg-background border border-border rounded-lg font-mono text-xs shadow-sm'>⌘K</kbd>
                        <span className='text-xs'>Quick search</span>
                      </div>
                      <span className='text-muted-foreground/40'>•</span>
                      <div className='flex items-center gap-2'>
                        <kbd className='px-3 py-1.5 bg-background border border-border rounded-lg font-mono text-xs shadow-sm'>⌘B</kbd>
                        <span className='text-xs'>Toggle sidebar</span>
                      </div>
                      <span className='text-muted-foreground/40'>•</span>
                      <span className='text-xs'>Use dev ports from sidebar for local testing</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Section Layout Content */}
        {currentSite && (
          <SectionContainer />
        )}
      </div>
    </div>
  )
}