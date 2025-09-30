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
          <div className='flex items-center justify-center min-h-[calc(100vh-6rem)]'>
            <div className='max-w-2xl mx-auto px-6'>
              <div className='text-center space-y-8'>
                {/* Hero Section */}
                <div className='space-y-4'>
                  <div className='inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 mb-2'>
                    <Globe className='h-8 w-8 text-white' />
                  </div>
                  <h1 className='text-4xl font-bold tracking-tight text-foreground'>
                    Website Viewer
                  </h1>
                  <p className='text-lg text-muted-foreground max-w-lg mx-auto leading-relaxed'>
                    View websites across multiple devices, analyze SEO performance, and preview social media cards—all in one place
                  </p>
                </div>

                {/* Feature Cards */}
                <div className='grid grid-cols-1 sm:grid-cols-3 gap-4 mt-12'>
                  <div className='p-6 rounded-lg border border-border/40 bg-card shadow-sm hover:shadow-md transition-all duration-200'>
                    <div className='w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center mb-3'>
                      <Monitor className='h-5 w-5 text-blue-600' />
                    </div>
                    <h3 className='font-semibold text-sm mb-2 text-foreground'>Multi-Device Preview</h3>
                    <p className='text-xs text-muted-foreground leading-relaxed'>Test responsive layouts across desktop, tablet, and mobile viewports simultaneously</p>
                  </div>
                  <div className='p-6 rounded-lg border border-border/40 bg-card shadow-sm hover:shadow-md transition-all duration-200'>
                    <div className='w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center mb-3'>
                      <Search className='h-5 w-5 text-green-600' />
                    </div>
                    <h3 className='font-semibold text-sm mb-2 text-foreground'>SEO Analysis</h3>
                    <p className='text-xs text-muted-foreground leading-relaxed'>Analyze meta tags, titles, descriptions, and optimization opportunities</p>
                  </div>
                  <div className='p-6 rounded-lg border border-border/40 bg-card shadow-sm hover:shadow-md transition-all duration-200'>
                    <div className='w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center mb-3'>
                      <Share2 className='h-5 w-5 text-purple-600' />
                    </div>
                    <h3 className='font-semibold text-sm mb-2 text-foreground'>Social Previews</h3>
                    <p className='text-xs text-muted-foreground leading-relaxed'>Preview how your site appears on Twitter, Facebook, and LinkedIn</p>
                  </div>
                </div>

                {/* Quick Start */}
                <div className='mt-8 p-6 rounded-xl border border-border/40 bg-muted/20'>
                  <h3 className='text-sm font-semibold mb-3 text-foreground'>Quick Start</h3>
                  <div className='flex flex-wrap items-center justify-center gap-3 text-xs text-muted-foreground'>
                    <div className='flex items-center gap-2'>
                      <kbd className='px-2 py-1.5 bg-background border border-border rounded-md font-mono text-[11px]'>⌘K</kbd>
                      <span>Quick search</span>
                    </div>
                    <span className='text-border'>•</span>
                    <div className='flex items-center gap-2'>
                      <kbd className='px-2 py-1.5 bg-background border border-border rounded-md font-mono text-[11px]'>⌘B</kbd>
                      <span>Toggle sidebar</span>
                    </div>
                    <span className='text-border'>•</span>
                    <span>Use dev ports from sidebar for local testing</span>
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