'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Globe, ZoomIn, ZoomOut } from 'lucide-react'
import WebsiteView from './WebsiteView'
import MetadataPanel from './metadata/MetadataPanel'
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
    setUrlWithHighlight,
    metadata,
    metadataLoading,
    metadataError,
    fetchMetadata
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
            box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7), 0 8px 25px rgba(0,0,0,0.1);
            transform: scale(1);
          }
          50% {
            box-shadow: 0 0 0 6px rgba(59, 130, 246, 0.2), 0 12px 35px rgba(59, 130, 246, 0.3);
            transform: scale(1.02);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(59, 130, 246, 0), 0 8px 25px rgba(0,0,0,0.1);
            transform: scale(1);
          }
        }
        .highlight-input {
          animation: highlightInput 1s ease-out;
        }
      `}</style>

      {/* Main Content Area */}
      <div className='pt-24 p-4 min-h-screen'>
        {!currentSite && (
          <div className='flex items-center justify-center min-h-[calc(100vh-6rem)]'>
            <div className='text-center'>
              <div className='max-w-md mx-auto p-6 bg-card/70 backdrop-blur-sm rounded-2xl border shadow-lg'>
                <div className='mb-4'>
                  <Globe className='h-12 w-12 mx-auto text-primary mb-3' />
                  <h1 className='text-xl font-semibold text-foreground mb-2'>
                    Website Viewer
                  </h1>
                  <p className='text-muted-foreground text-sm'>
                    View websites across different device sizes
                  </p>
                </div>
                <div className='text-sm text-muted-foreground p-3 bg-muted/80 rounded-lg'>
                  Click the search bar above or press{' '}
                  <kbd className='px-2 py-1 bg-background border rounded-md text-xs font-mono shadow-sm'>
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

            {/* Metadata Panel */}
            <div className='mt-8 max-w-4xl mx-auto'>
              <MetadataPanel
                metadata={metadata}
                loading={metadataLoading}
                error={metadataError}
                onRefresh={() => fetchMetadata()}
                url={currentSite || ''}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}