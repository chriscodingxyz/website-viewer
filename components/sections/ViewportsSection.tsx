'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Monitor,
  Loader2,
  CheckCircle,
  XCircle,
  ExternalLink
} from 'lucide-react'
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
    <div className='w-full pb-8'>
      {/* Zoom Control - Show when viewports are loaded */}
      {views.length > 0 && (
        <div className='flex justify-center py-3 border-b border-border/20'>
          <div className='flex items-center gap-2'>
            <span className='text-sm text-muted-foreground'>Zoom:</span>
            <Select
              value={Math.round(globalZoom * 100).toString()}
              onValueChange={(value) => {
                const percentage = parseInt(value)
                const newIndex = zoomSteps.findIndex(step => Math.round(step * 100) === percentage)
                if (newIndex !== -1) {
                  setGlobalZoomStepIndex(newIndex)
                  toast.success(`Zoom: ${percentage}%`)
                }
              }}
            >
              <SelectTrigger className="w-20 h-9 text-xs border border-border/50 hover:border-border transition-all duration-200 bg-card/90 hover:bg-card rounded-md">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {zoomSteps.map((step, index) => {
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

      {/* Content - Always visible */}
      <div className='w-full py-4 relative'>
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
          ) : metadataLoading && views.length > 0 ? (
            // Show single loading state while checking X-Frame-Options
            <div className='w-full'>
              <div className='flex justify-center items-center py-16'>
                <div className='text-center max-w-md'>
                  <div className='mx-auto mb-6'>
                    <div className='w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto'></div>
                  </div>
                  <p className='text-lg text-gray-700 mb-3 font-medium'>Analyzing Website</p>
                  <p className='text-sm text-gray-500'>Extracting metadata, SEO data, social previews, and technical information...</p>
                </div>
              </div>
            </div>
          ) : views.length > 0 && views.every(v => v.iframeStatus === 'blocked') ? (
            // Show informational message when all viewports are blocked
            <div className='w-full'>
              <div className='flex justify-center items-center py-16'>
                <div className='text-center max-w-lg'>
                  <div className='mx-auto mb-6 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center'>
                    <CheckCircle className='w-8 h-8 text-green-600' />
                  </div>
                  <h3 className='text-xl font-semibold text-gray-900 mb-3'>X-Frame-Options Configured</h3>
                  <p className='text-gray-600 mb-4 leading-relaxed'>
                    This website has <code className='bg-gray-100 px-2 py-1 rounded text-sm'>X-Frame-Options: DENY</code> configured,
                    which prevents iframe embedding. This is a good security practice that protects against clickjacking attacks.
                  </p>
                  <div className='bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800'>
                    <strong>Important:</strong> Only the website owner can remove X-Frame-Options. If this is YOUR website, you can modify the server configuration. Otherwise, viewport previews are impossible due to security restrictions.
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className='w-full'>
              {/* All Viewports - Display simultaneously */}
              <div className='flex flex-wrap gap-6 justify-center items-start'>
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
          )}
        </div>
      </div>
    </div>
  )
}
