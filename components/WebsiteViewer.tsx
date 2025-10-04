'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Globe, ZoomIn, ZoomOut, Monitor, Search, Share2 } from 'lucide-react'
import { toast } from 'sonner'
import { useWebsiteViewer } from '@/contexts/WebsiteViewerContext'
import SectionContainer from './SectionContainer'
import NavigationBar from './NavigationBar'
import { Kbd } from '@/components/ui/kbd'
import Image from 'next/image'

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
    <div className='pt-[60px]'>
      {/* Main Content Area */}
      <div className='min-h-screen'>
        {!currentSite && (
          <div className='flex items-center justify-center h-[calc(100svh-60px)] max-h-[calc(100svh-60px)] overflow-hidden'>
            <div className='w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
              <div className='flex flex-col lg:flex-row items-center justify-center gap-6 sm:gap-8 lg:gap-16'>
                {/* Logo */}
                <div className='flex-shrink-0 w-32 h-32 sm:w-40 sm:h-40 lg:w-64 lg:h-64'>
                  <Image
                    src='/logo.png'
                    alt='Website Viewer Logo'
                    width={256}
                    height={256}
                    className='w-full h-full object-contain'
                    priority
                  />
                </div>

                {/* Content */}
                <div className='flex-1 text-center lg:text-left max-w-2xl'>
                  <h1 className='text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-3 sm:mb-4'>
                    Website Viewer
                  </h1>
                  <p className='text-sm sm:text-base md:text-lg text-muted-foreground mb-4 sm:mb-6 leading-relaxed'>
                    Preview any website across devices. Analyze SEO, metadata, and social previews—all in one place.
                  </p>

                  {/* Quick Start Hint */}
                  <div className='inline-flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-muted-foreground bg-muted/30 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg border border-border/40'>
                    <div className='flex items-center gap-1.5 sm:gap-2'>
                      <Kbd>⌘K</Kbd>
                      <span>to open</span>
                    </div>
                    <span className='text-muted-foreground/40'>or</span>
                    <span className='hidden sm:inline'>click URL bar above</span>
                    <span className='sm:hidden'>click above</span>
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