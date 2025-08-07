'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Monitor, ChevronDown, ChevronUp, Loader2, CheckCircle, ZoomIn, ZoomOut, XCircle, ExternalLink } from 'lucide-react'
import { useWebsiteViewer } from '@/contexts/WebsiteViewerContext'
import WebsiteView from '../WebsiteView'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface ViewportsSectionProps {
  expanded: boolean
  onToggle: () => void
}

export default function ViewportsSection({ expanded, onToggle }: ViewportsSectionProps) {
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
    if (!currentSite) return { icon: <Monitor className="h-5 w-5" />, text: 'No site', color: 'bg-gray-500', blocked: false }
    
    const hasViews = views.length > 0
    if (!hasViews) return { icon: <Monitor className="h-5 w-5" />, text: 'Ready', color: 'bg-gray-500', blocked: false }
    
    // Check actual iframe statuses
    const loadingCount = views.filter(v => v.iframeStatus === 'loading').length
    const blockedCount = views.filter(v => v.iframeStatus === 'blocked').length
    const errorCount = views.filter(v => v.iframeStatus === 'error').length
    const loadedCount = views.filter(v => v.iframeStatus === 'loaded').length
    
    // If any are still loading, show loading status
    if (loadingCount > 0) {
      return { icon: <Loader2 className="h-5 w-5 animate-spin" />, text: 'Checking...', color: 'bg-blue-500', blocked: false }
    }
    
    // If any are blocked or errored, show red status
    if (blockedCount > 0 || errorCount > 0) {
      return { icon: <XCircle className="h-5 w-5" />, text: 'Blocked', color: 'bg-red-500', blocked: true }
    }
    
    // If loaded, show green status
    if (loadedCount > 0) {
      return { icon: <CheckCircle className="h-5 w-5" />, text: 'Available', color: 'bg-green-500', blocked: false }
    }
    
    // Default fallback
    return { icon: <Monitor className="h-5 w-5" />, text: 'Ready', color: 'bg-gray-500', blocked: false }
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

  const handleSectionClick = () => {
    if (status.blocked) {
      // Don't allow expansion when blocked, show user feedback
      toast.error('Cannot preview - website blocks iframe embedding')
      return
    }
    onToggle()
  }

  return (
    <section className="w-full border-b border-border bg-background">
      {/* Section Header - Full Width */}
      <div 
        className={cn(
          "w-full border-b border-border/50 sticky top-16 z-40 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20",
          status.blocked ? "cursor-not-allowed" : "cursor-pointer"
        )}
        onClick={handleSectionClick}
      >
        <div className="w-full px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white">
                <Monitor className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground mb-1">
                  Device Viewports
                </h2>
                <p className="text-sm text-muted-foreground">
                  Preview {currentSite} across different device sizes and screen resolutions
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Status Badge */}
              {status.blocked && (
                <div className="bg-red-600 text-white px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm font-semibold opacity-90 cursor-not-allowed">
                  <XCircle className="h-4 w-4" />
                  Blocked
                </div>
              )}
              {!status.blocked && views.length > 0 && views.every(v => v.iframeStatus === 'loaded') && (
                <div className="flex items-center gap-2 text-sm font-semibold text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  Available
                </div>
              )}
              {views.length > 0 && views.some(v => v.iframeStatus === 'loading') && (
                <div className="flex items-center gap-2 text-sm font-semibold text-blue-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Checking...
                </div>
              )}
              
              {/* Zoom Controls - only show when loaded and expanded */}
              {views.length > 0 && expanded && !status.blocked && (
                <div className="flex items-center gap-1 px-2 py-1 bg-background/80 border border-border/40 rounded-lg shadow-sm h-6">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      globalZoomOut()
                    }}
                    disabled={globalZoomStepIndex === 2}
                    title="Zoom out (Min: 100%)"
                    className="h-5 w-5 p-0 rounded-full hover:bg-accent disabled:opacity-30"
                  >
                    <ZoomOut className="h-3 w-3" />
                  </Button>
                  <span
                    className="text-xs font-medium w-10 text-center tabular-nums cursor-pointer hover:text-primary transition-colors px-1 py-0.5 rounded-md hover:bg-accent"
                    onClick={(e) => {
                      e.stopPropagation()
                      resetGlobalZoom()
                    }}
                    title="Click to reset zoom to 100%"
                  >
                    {Math.round(globalZoom * 100)}%
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      globalZoomIn()
                    }}
                    disabled={globalZoomStepIndex === zoomSteps.length - 1}
                    title="Zoom in (Max: 200%)"
                    className="h-5 w-5 p-0 rounded-full hover:bg-accent disabled:opacity-30"
                  >
                    <ZoomIn className="h-3 w-3" />
                  </Button>
                </div>
              )}
              
              {expanded ? (
                <ChevronUp className="h-6 w-6 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Section Content - Full Width - Only show when not blocked */}
      {expanded && !status.blocked && (
        <div className="w-full py-6 px-6 relative">
          <div className="w-full">
            {views.length === 0 ? (
              <div className="flex items-center justify-center h-48">
                <div className="text-center">
                  <Loader2 className="h-12 w-12 mx-auto text-blue-500 animate-spin mb-4" />
                  <h3 className="text-lg font-medium mb-2">Loading Viewports</h3>
                  <p className="text-muted-foreground">
                    Setting up device previews for {currentSite}
                  </p>
                </div>
              </div>
            ) : (
              <div className="w-full">
                <div className="flex flex-wrap gap-6 justify-center items-start px-4">
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
      )}


    </section>
  )
}