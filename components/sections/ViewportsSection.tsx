'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Monitor,
  CheckCircle,
  XCircle,
  ExternalLink
} from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from '@/components/ui/empty'
import { useWebsiteViewer } from '@/contexts/WebsiteViewerContext'
import WebsiteView from '../WebsiteView'
import { toast } from 'sonner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import Image from 'next/image'
import { getBestFavicon } from '@/lib/favicon'
import { cn } from '@/lib/utils'

interface ViewportsSectionProps {
  expanded: boolean
  onToggle: () => void
}

export default function ViewportsSection ({
  expanded,
  onToggle
}: ViewportsSectionProps) {
  const [refreshKey] = useState(0)
  const [faviconError, setFaviconError] = useState(false)
  const [faviconLoaded, setFaviconLoaded] = useState(false)

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
    metadataLoading,
    metadata
  } = useWebsiteViewer()

  // Reset favicon state when site changes
  useEffect(() => {
    setFaviconError(false)
    setFaviconLoaded(false)
  }, [currentSite])

  // Generate favicon URL
  const faviconUrl = currentSite
    ? getBestFavicon(currentSite, metadata)
    : '/seoseal.png'

  const getStatus = () => {
    if (!currentSite)
      return {
        icon: <Monitor className='h-5 w-5' />,
        text: 'No site',
        color: 'bg-gray-500',
        blocked: false
      }

    const hasViews = views.length > 0
    if (!hasViews)
      return {
        icon: <Monitor className='h-5 w-5' />,
        text: 'Ready',
        color: 'bg-gray-500',
        blocked: false
      }

    // Check actual iframe statuses
    const loadingCount = views.filter((v: any) => v.iframeStatus === 'loading').length
    const blockedCount = views.filter((v: any) => v.iframeStatus === 'blocked').length
    const errorCount = views.filter((v: any) => v.iframeStatus === 'error').length
    const timeoutCount = views.filter((v: any) => v.iframeStatus === 'timeout').length
    const loadedCount = views.filter((v: any) => v.iframeStatus === 'loaded').length

    // Skip loading status - just show ready
    // if (loadingCount > 0) {
    //   return { icon: <Loader2 className="h-5 w-5 animate-spin" />, text: 'Checking...', color: 'bg-blue-500', blocked: false }
    // }

    // If any are explicitly blocked, show blocked status
    if (blockedCount > 0) {
      return {
        icon: <XCircle className='h-5 w-5' />,
        text: 'Blocked',
        color: 'bg-red-500',
        blocked: true
      }
    }

    // If loaded, show green status
    if (loadedCount > 0) {
      return {
        icon: <CheckCircle className='h-5 w-5' />,
        text: 'Available',
        color: 'bg-green-500',
        blocked: false
      }
    }

    // Handle timeouts and errors separately - don't block the UI
    if (timeoutCount > 0 || errorCount > 0) {
      return {
        icon: <Monitor className='h-5 w-5' />,
        text: 'Slow/Issues',
        color: 'bg-yellow-500',
        blocked: false
      }
    }

    // Default fallback
    return {
      icon: <Monitor className='h-5 w-5' />,
      text: 'Ready',
      color: 'bg-gray-500',
      blocked: false
    }
  }

  const status = getStatus()

  const openSiteInNewTab = () => {
    if (currentSite) {
      window.open(currentSite, '_blank', 'noopener,noreferrer')
      toast.success('Opened in new tab')
    }
  }

  // Removed test iframe functionality

  const handleSectionClick = () => {
    // Always allow expansion - no more blocking logic
    onToggle()
  }

  return (
    <div className='max-w-[1600px] mx-auto px-6 lg:px-8 py-6'>
      <div className='flex gap-8 lg:gap-16'>
        {/* Sticky Logo - Hidden on mobile */}
        <div className='hidden lg:block flex-shrink-0'>
          <div className='sticky top-1/2 -translate-y-1/2'>
            {/* Container for favicon */}
            <div className='flex items-center justify-center relative overflow-hidden'>
              {/* Dynamic favicon image */}
              <Image
                src={faviconError ? '/seoseal.png' : faviconUrl}
                alt={currentSite ? `${currentSite} favicon` : 'Website Viewer Logo'}
                width={96}
                height={96}
                className={cn(
                  'w-24 h-24 object-contain transition-opacity duration-300',
                  faviconLoaded ? 'opacity-100' : 'opacity-0'
                )}
                onLoad={() => setFaviconLoaded(true)}
                onError={() => {
                  setFaviconError(true)
                  setFaviconLoaded(true)
                }}
                priority
              />

              {/* Loading skeleton */}
              {!faviconLoaded && (
                <div className='absolute flex items-center justify-center'>
                  <div className='w-24 h-24 bg-muted/50 rounded-lg animate-pulse' />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content with min-height to prevent logo shift */}
        <div className='flex-1 min-w-0 min-h-[calc(100svh-120px)] relative'>
          {/* Zoom Control - Fixed bottom right corner (hidden on mobile) */}
          {views.length > 0 && !metadataLoading && (
            <div className='hidden sm:block fixed bottom-6 right-6 z-40'>
              <div className='flex items-center gap-2 bg-card/95 backdrop-blur-sm border border-border/50 rounded-lg px-3 py-2 shadow-lg'>
                <span className='text-xs text-muted-foreground'>Zoom:</span>
                <Select
                  value={Math.round(globalZoom * 100).toString()}
                  onValueChange={(value) => {
                    const percentage = parseInt(value)
                    const newIndex = zoomSteps.findIndex((step: number) => Math.round(step * 100) === percentage)
                    if (newIndex !== -1) {
                      setGlobalZoomStepIndex(newIndex)
                    }
                  }}
                >
                  <SelectTrigger className="w-20 h-7 text-xs border border-border/50 hover:border-border transition-all duration-200 bg-background hover:bg-muted/50 rounded-md">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="w-20">
                    {zoomSteps.map((step: number, index: number) => {
                      const percentage = Math.round(step * 100)
                      return (
                        <SelectItem key={index} value={percentage.toString()} className="text-xs">
                          {percentage}%
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {views.length === 0 ? (
            <Empty className="border-0">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Monitor />
                </EmptyMedia>
                <EmptyTitle>Ready to Load</EmptyTitle>
                <EmptyDescription>
                  Enter a website URL to view in different device sizes
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : metadataLoading && views.length > 0 ? (
            // Show single loading state while checking X-Frame-Options
            <div className='w-full'>
              <div className='flex justify-center items-center py-16'>
                <div className='text-center max-w-md'>
                  {/* Clean spinner */}
                  <div className='mx-auto mb-8'>
                    <Spinner className='w-12 h-12' />
                  </div>

                  <h3 className='text-base font-semibold mb-6 text-foreground'>
                    Analyzing Website
                  </h3>

                  {/* Clean animated list */}
                  <div className='space-y-3 text-sm text-muted-foreground'>
                    <div className='flex items-center justify-center gap-3 opacity-0 animate-[fadeIn_0.5s_ease-in-out_0.1s_forwards]'>
                      <div className='w-1 h-1 rounded-full bg-foreground'></div>
                      <span>Extracting metadata & SEO data</span>
                    </div>
                    <div className='flex items-center justify-center gap-3 opacity-0 animate-[fadeIn_0.5s_ease-in-out_0.3s_forwards]'>
                      <div className='w-1 h-1 rounded-full bg-foreground'></div>
                      <span>Analyzing social media previews</span>
                    </div>
                    <div className='flex items-center justify-center gap-3 opacity-0 animate-[fadeIn_0.5s_ease-in-out_0.5s_forwards]'>
                      <div className='w-1 h-1 rounded-full bg-foreground'></div>
                      <span>Checking technical information</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className='w-full'>
              {/* All Viewports - Display simultaneously */}
              <div className='flex flex-wrap gap-4 justify-center items-start'>
                {views.map((view: any, index: number) => (
                  <WebsiteView
                    key={view.id}
                    view={view}
                    refreshKey={refreshKey}
                    globalZoom={globalZoom}
                    onRemove={() => removeView(view.id)}
                    onTypeChange={type => changeViewType(view.id, type)}
                    onDuplicate={duplicateView}
                    index={index}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
