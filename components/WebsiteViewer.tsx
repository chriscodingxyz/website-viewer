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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

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
    metadataNeedsManual,
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
                    src='/seoseal.png'
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

        {/* Localhost Metadata Dialog */}
        <Dialog open={metadataNeedsManual} onOpenChange={() => {}}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Enable Live Preview</DialogTitle>
              <DialogDescription>
                To view localhost metadata in production, add this snippet to your local project.
                It automatically syncs your metadata to the viewer.
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex flex-col gap-4 py-4">
              <div className="space-y-3">
                <div className="relative bg-muted/50 p-4 rounded-lg border font-mono text-xs sm:text-sm break-all">
                  <div className="absolute right-2 top-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 w-6 p-0"
                      onClick={() => {
                        const code = `<script src="${typeof window !== 'undefined' ? window.location.origin : ''}/live-preview.js"></script>`
                        navigator.clipboard.writeText(code)
                        toast.success('Copied to clipboard')
                      }}
                    >
                      <span className="sr-only">Copy</span>
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                    </Button>
                  </div>
                  <span className="text-blue-500">&lt;script</span> <span className="text-purple-500">src</span>=<span className="text-green-500">&quot;{typeof window !== 'undefined' ? window.location.origin : ''}/live-preview.js&quot;</span><span className="text-blue-500">&gt;&lt;/script&gt;</span>
                </div>
                
                <div className="text-sm text-muted-foreground space-y-2">
                  <p><strong>Instructions:</strong></p>
                  <ol className="list-decimal list-inside space-y-1 ml-1">
                    <li>Copy the code snippet above.</li>
                    <li>Paste it into your local project&apos;s <code className="bg-muted px-1 py-0.5 rounded">index.html</code> or root layout.</li>
                    <li>Reload your localhost page.</li>
                  </ol>
                  <p className="text-xs pt-2 text-muted-foreground/80">
                    This script is safe, lightweight, and only runs in the browser. It sends metadata to the viewer via secure postMessage.
                  </p>
                </div>
              </div>
            </div>

            <DialogFooter className="sm:justify-start">
              <Button
                type="button"
                variant="secondary"
                onClick={() => window.location.reload()}
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}