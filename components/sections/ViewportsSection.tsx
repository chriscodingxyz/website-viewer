'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Monitor, ChevronDown, ChevronUp, Loader2, CheckCircle, ZoomIn, ZoomOut } from 'lucide-react'
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
    if (!currentSite) return { icon: <Monitor className="h-5 w-5" />, text: 'No site', color: 'bg-gray-500' }
    
    const hasViews = views.length > 0
    if (!hasViews) return { icon: <Loader2 className="h-5 w-5 animate-spin" />, text: 'Loading...', color: 'bg-blue-500' }
    
    return { icon: <CheckCircle className="h-5 w-5" />, text: 'Ready', color: 'bg-green-500' }
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

  return (
    <section className={cn(
      "w-full border-b border-border",
      expanded ? "bg-gradient-to-b from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30" : "bg-background"
    )}>
      {/* Section Header - Full Width */}
      <div 
        className={cn(
          "w-full border-b border-border/50 cursor-pointer",
          expanded 
            ? "bg-transparent" 
            : "bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20"
        )}
        onClick={onToggle}
      >
        <div className="w-full px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white">
                <Monitor className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-1">
                  Device Viewports
                </h2>
                <p className="text-muted-foreground">
                  Preview {currentSite} across different device sizes and screen resolutions
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${status.color}`} />
                <Badge variant="outline" className="bg-background/80">
                  {status.text}
                </Badge>
              </div>

              {/* Zoom Controls */}
              {views.length > 0 && (
                <div className="flex items-center gap-1 px-3 py-2 bg-background/80 border border-border/40 rounded-xl shadow-sm">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      globalZoomOut()
                    }}
                    disabled={globalZoomStepIndex === 2}
                    title="Zoom out (Min: 100%)"
                    className="h-8 w-8 p-0 rounded-full hover:bg-accent disabled:opacity-30"
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <span
                    className="text-sm font-medium w-12 text-center tabular-nums cursor-pointer hover:text-primary transition-colors px-2 py-1 rounded-md hover:bg-accent"
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
                    className="h-8 w-8 p-0 rounded-full hover:bg-accent disabled:opacity-30"
                  >
                    <ZoomIn className="h-4 w-4" />
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

      {/* Section Content - Full Width */}
      {expanded && (
        <div className="w-full py-8">
          <div className="w-full px-6">
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