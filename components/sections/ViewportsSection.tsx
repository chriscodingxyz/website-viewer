'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Monitor,
  Loader2,
  CheckCircle,
  ZoomIn,
  ZoomOut,
  XCircle,
  ExternalLink
} from 'lucide-react'
import { useWebsiteViewer } from '@/contexts/WebsiteViewerContext'
import WebsiteView from '../WebsiteView'
import { toast } from 'sonner'

interface ViewportsSectionProps {
  expanded: boolean
  onToggle: () => void
}

export default function ViewportsSection ({
  expanded,
  onToggle
}: ViewportsSectionProps) {
  const [refreshKey] = useState(0)

  const {
    currentSite,
    views,
    removeView,
    changeViewType,
    duplicateView,
    globalZoom,
    globalZoomStepIndex,
    setGlobalZoomStepIndex,
    zoomSteps
  } = useWebsiteViewer()

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
    const loadingCount = views.filter(v => v.iframeStatus === 'loading').length
    const blockedCount = views.filter(v => v.iframeStatus === 'blocked').length
    const errorCount = views.filter(v => v.iframeStatus === 'error').length
    const timeoutCount = views.filter(v => v.iframeStatus === 'timeout').length
    const loadedCount = views.filter(v => v.iframeStatus === 'loaded').length

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

  // Zoom control functions
  const globalZoomIn = () => {
    const newIndex = Math.min(globalZoomStepIndex + 1, zoomSteps.length - 1)
    setGlobalZoomStepIndex(newIndex)
    toast.success(`Zoom: ${Math.round(zoomSteps[newIndex] * 100)}%`)
  }

  const globalZoomOut = () => {
    const newIndex = Math.max(globalZoomStepIndex - 1, 2)
    setGlobalZoomStepIndex(newIndex)
    toast.success(`Zoom: ${Math.round(zoomSteps[newIndex] * 100)}%`)
  }

  const resetGlobalZoom = () => {
    setGlobalZoomStepIndex(2)
    toast.success('Zoom reset to 100%')
  }

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
    <div className='w-full pb-60'>
      {/* Zoom Controls - Positioned Bottom Right */}
      {views.length > 0 && (
        <div className='fixed bottom-4 right-4 sm:bottom-8 sm:right-8 z-40 pointer-events-none'>
          <div className='flex items-center gap-1 px-3 py-2 bg-background/95 backdrop-blur-sm border border-border/60 rounded-lg shadow-lg pointer-events-auto'>
            <Button
              variant='ghost'
              size='sm'
              onClick={globalZoomOut}
              disabled={globalZoomStepIndex === 2}
              title='Zoom out (Min: 100%)'
              className='h-6 w-6 p-0 rounded-full hover:bg-accent disabled:opacity-30'
            >
              <ZoomOut className='h-3 w-3' />
            </Button>
            <span
              className='text-sm font-medium min-w-[2.5rem] text-center tabular-nums cursor-pointer hover:text-primary transition-colors px-2 py-1 rounded-md hover:bg-accent'
              onClick={resetGlobalZoom}
              title='Click to reset zoom to 100%'
            >
              {Math.round(globalZoom * 100)}%
            </span>
            <Button
              variant='ghost'
              size='sm'
              onClick={globalZoomIn}
              disabled={globalZoomStepIndex === zoomSteps.length - 1}
              title='Zoom in (Max: 200%)'
              className='h-6 w-6 p-0 rounded-full hover:bg-accent disabled:opacity-30'
            >
              <ZoomIn className='h-3 w-3' />
            </Button>
          </div>
        </div>
      )}

      {/* Content - Always visible */}
      <div className='w-full py-6 px-6 relative'>
        <div className='w-full'>
          {views.length === 0 ? (
            <div className='flex items-center justify-center h-48'>
              <div className='text-center'>
                <Monitor className='h-12 w-12 mx-auto text-gray-400 mb-4' />
                <h3 className='text-lg font-medium mb-2'>Ready to Load</h3>
                <p className='text-muted-foreground'>
                  Enter a website URL to view in different device sizes
                </p>
              </div>
            </div>
          ) : (
            (() => {
              // Simple logic: check if any iframe loaded successfully
              const anyLoaded = views.some(v => v.iframeStatus === 'loaded')
              const allDenied =
                views.length > 0 && views.every(v => v.iframeStatus === 'error')

              // If all denied, don't show viewports - break out of container for true centering
              if (allDenied) {
                return (
                  <div className='fixed inset-0 top-24 flex items-center justify-center'>
                    <div className='text-center max-w-md mx-auto p-8 bg-card/70 backdrop-blur-sm border border-red-200/50 rounded-2xl shadow-xl'>
                      <XCircle className='h-16 w-16 mx-auto text-red-500 mb-6' />
                      <h3 className='text-2xl font-bold mb-4 text-red-600'>
                        Content Blocked
                      </h3>
                      <p className='text-muted-foreground mb-4 leading-relaxed'>
                        This website uses{' '}
                        <code className='px-2 py-1 bg-muted rounded text-sm font-mono'>
                          X-Frame-Options
                        </code>{' '}
                        security header to prevent iframe embedding, so you
                        can&apos;t view it in different viewports at once.
                      </p>
                      <p className='text-sm text-muted-foreground mb-4 leading-relaxed bg-blue-50/50 dark:bg-blue-950/30 p-3 rounded-lg border border-blue-200/30'>
                        <strong>Good security practice!</strong> Consider
                        disabling this header for development/staging
                        environments to enable responsive testing across
                        desktop, tablet, and mobile viewports simultaneously.
                      </p>
                      <p className='text-sm text-muted-foreground mb-6 leading-relaxed bg-amber-50/50 dark:bg-amber-950/30 p-3 rounded-lg border border-amber-200/30'>
                        <strong>Still useful!</strong> Check out the <strong>SEO</strong>, <strong>Social Media</strong>, and <strong>Technical</strong> tabs above for detailed website analysis, metadata extraction, and performance insights.
                      </p>
                      <Button
                        onClick={openSiteInNewTab}
                        variant='outline'
                        className='gap-2 shadow-sm'
                      >
                        <ExternalLink className='h-4 w-4' />
                        Open in New Tab
                      </Button>
                    </div>
                  </div>
                )
              }

              // If any loaded, show all viewports
              if (anyLoaded) {
                return (
                  <div className='w-full'>
                    <div className='flex flex-wrap gap-6 justify-center items-start px-4'>
                      {views.map((view, index) => (
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
                )
              }

              // Still loading, show loading - centered like blocked content
              return (
                <div className='fixed inset-0 top-24 flex items-center justify-center'>
                  <div className='text-center max-w-md mx-auto p-8 bg-card/70 backdrop-blur-sm border border-border/50 rounded-2xl shadow-xl'>
                    <Loader2 className='h-16 w-16 mx-auto text-blue-500 mb-6 animate-spin' />
                    <h3 className='text-2xl font-bold mb-4'>Loading Website</h3>
                    <p className='text-muted-foreground leading-relaxed'>
                      Checking if content can be displayed across different
                      viewports...
                    </p>
                  </div>
                </div>
              )
            })()
          )}
        </div>
      </div>
    </div>
  )
}
