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
      <div className='pt-20 p-4 min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30'>
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
              <div className='max-w-md mx-auto p-6 bg-white/70 backdrop-blur-sm rounded-2xl border shadow-lg'>
                <div className='mb-4'>
                  <Globe className='h-12 w-12 mx-auto text-blue-500 mb-3' />
                  <h2 className='text-xl font-semibold text-gray-800 mb-2'>
                    Website Viewer
                  </h2>
                  <p className='text-gray-600 text-sm'>
                    View websites across different device sizes
                  </p>
                </div>
                <div className='text-sm text-gray-500 p-3 bg-gray-50/80 rounded-lg'>
                  Click the search bar above or press{' '}
                  <kbd className='px-2 py-1 bg-white border rounded-md text-xs font-mono shadow-sm'>
                    ⌘K
                  </kbd>{' '}
                  to get started
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Site Views */}
        {currentSite && views.length > 0 && (
          <div>
            {/* Enhanced Zoom Controls */}
            <div className='flex items-center justify-center mb-8'>
              <div className='flex items-center gap-1 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full border shadow-lg hover:shadow-xl transition-all duration-300'>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={globalZoomOut}
                  disabled={globalZoomStepIndex === 2}
                  title='Zoom out (Min: 100%)'
                  className='h-8 w-8 p-0 rounded-full hover:bg-gray-100 disabled:opacity-30 transition-all duration-200'
                >
                  <ZoomOut className='h-4 w-4' />
                </Button>
                <div className='flex items-center gap-1 mx-2'>
                  <span
                    className='text-sm font-medium w-14 text-center tabular-nums cursor-pointer hover:text-blue-600 transition-colors px-2 py-1 rounded-md hover:bg-blue-50'
                    onClick={resetGlobalZoom}
                    title='Click to reset zoom to 100%'
                  >
                    {Math.round(globalZoom * 100)}%
                  </span>
                </div>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={globalZoomIn}
                  disabled={globalZoomStepIndex === zoomSteps.length - 1}
                  title='Zoom in (Max: 200%)'
                  className='h-8 w-8 p-0 rounded-full hover:bg-gray-100 disabled:opacity-30 transition-all duration-200'
                >
                  <ZoomIn className='h-4 w-4' />
                </Button>
              </div>
            </div>

            {/* Viewport Grid */}
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
  )
}