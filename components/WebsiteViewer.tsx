'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Globe, ZoomIn, ZoomOut } from 'lucide-react'
import WebsiteView from './WebsiteView'
import { toast } from 'sonner'
import { useWebsiteViewer } from '@/contexts/WebsiteViewerContext'
import { useFavorites } from '@/contexts/FavoritesContext'
import { useHistory } from '@/contexts/HistoryContext'

export default function WebsiteViewer () {
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
    setUrlWithHighlight
  } = useWebsiteViewer()
  
  const { favorites } = useFavorites()
  const { history } = useHistory()

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
    setGlobalZoomStepIndex(Math.max(globalZoomStepIndex - 1, 2))
    toast.success(
      `Global zoom: ${Math.round(
        zoomSteps[Math.max(globalZoomStepIndex - 1, 2)] * 100
      )}%`
    )
  }

  const resetGlobalZoom = () => {
    setGlobalZoomStepIndex(2)
    toast.success('Global zoom reset to 100%')
  }

  // No grouping needed in single-site mode

  return (
    <div>
      <style jsx global>{`
        @keyframes highlightInput {
          0% {
            box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7);
          }
          50% {
            box-shadow: 0 0 0 4px hsl(var(--ring));
          }
          100% {
            box-shadow: 0 0 0 0 rgba(59, 130, 246, 0);
          }
        }
        .highlight-input {
          animation: highlightInput 1s ease-out;
        }
      `}</style>

      {/* Main Content Area */}
      <div className='pt-20 p-4'>
        {!currentSite && (
          <div className='max-w-4xl mx-auto'>
            {/* Homepage Content */}
            <div className='text-center mb-8'>
              <Globe className='w-16 h-16 mb-4 text-muted-foreground/60 mx-auto' />
              <h1 className='text-3xl font-medium mb-3 text-foreground'>
                Website Viewer
              </h1>
              <p className='text-lg text-muted-foreground/80 leading-relaxed max-w-2xl mx-auto'>
                Ready to view websites in multiple formats? Just click the dropdown in the header
                and enter any URL to get started.
              </p>
            </div>

            {/* No Favorites or Recent History sections here - they're in the combobox */}

            {/* Quick Start */}
            <div className='text-center'>
              <p className='text-sm mb-4 px-4 py-2 bg-muted/50 rounded-lg inline-block'>
                Click the dropdown in the header or press{' '}
                <kbd className='px-1.5 py-0.5 bg-background border rounded text-xs'>
                  ⌘K
                </kbd>{' '}
                to enter a website URL
              </p>
            </div>
          </div>
        )}

        {/* Site Views */}
        {currentSite && views.length > 0 && (
          <div>
            {/* Site Header with Zoom Controls */}
            <div className='flex items-center justify-end mb-6 p-4 bg-muted/20 rounded-lg'>
              <div className='flex items-center gap-2 px-3 py-2 bg-background rounded-lg border'>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={globalZoomOut}
                  disabled={globalZoomStepIndex === 2}
                  title='Zoom out'
                  className='h-6 w-6 p-0'
                >
                  <ZoomOut className='h-3 w-3' />
                </Button>
                <span
                  className='text-sm w-12 text-center tabular-nums cursor-pointer'
                  onClick={resetGlobalZoom}
                  title='Reset zoom'
                >
                  {Math.round(globalZoom * 100)}%
                </span>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={globalZoomIn}
                  disabled={globalZoomStepIndex === zoomSteps.length - 1}
                  title='Zoom in'
                  className='h-6 w-6 p-0'
                >
                  <ZoomIn className='h-3 w-3' />
                </Button>
              </div>
            </div>

            {/* Viewport Grid */}
            <div className='flex flex-wrap gap-4 justify-center'>
              {views.map(view => (
                <WebsiteView
                  key={view.id}
                  view={view}
                  refreshKey={refreshKey}
                  globalZoom={globalZoom}
                  onRemove={() => removeView(view.id)}
                  onTypeChange={type => changeViewType(view.id, type)}
                  onDuplicate={duplicateView}
                  index={views.findIndex(v => v.id === view.id)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}