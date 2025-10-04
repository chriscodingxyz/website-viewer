'use client'

import React, { useState } from 'react'
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
    zoomSteps,
    metadataLoading
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
    <div className='w-full relative'>
      {/* Content - Always visible */}
      <div className='w-full p-4 relative'>
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
                    toast.success(`Zoom: ${percentage}%`)
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
                      <SelectItem key={index} value={percentage.toString()}>
                        {percentage}%
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
        <div className='w-full'>
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
          ) : views.length > 0 && views.every((v: any) => v.iframeStatus === 'blocked') ? (
            // Show informational message when all viewports are blocked
            <div className='w-full'>
              <div className='flex justify-center items-center py-8'>
                <div className='text-center max-w-lg'>
                  <div className='mx-auto mb-3 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center'>
                    <CheckCircle className='w-5 h-5 text-green-600' />
                  </div>
                  <h3 className='text-sm font-semibold text-foreground mb-2'>X-Frame-Options Configured</h3>
                  <p className='text-xs text-muted-foreground mb-3 leading-relaxed'>
                    This website has <code className='bg-muted px-1.5 py-0.5 rounded text-xs font-mono'>X-Frame-Options: DENY</code> configured,
                    which prevents iframe embedding. This is a good security practice that protects against clickjacking attacks.
                  </p>
                  <div className='bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-xs text-amber-900 dark:text-amber-200'>
                    <strong>Important:</strong> Only the website owner can remove X-Frame-Options. If this is YOUR website, you can modify the server configuration. Otherwise, viewport previews are impossible due to security restrictions.
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
