'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Globe, ZoomIn, ZoomOut, Monitor } from 'lucide-react'
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
          <div className='max-w-5xl mx-auto'>
            {/* Hero Section */}
            <div className='text-center mb-12'>
              <Globe className='w-20 h-20 mb-6 text-primary mx-auto' />
              <h1 className='text-4xl font-bold mb-4 text-foreground'>
                Test responsive designs instantly
              </h1>
              <p className='text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto mb-8'>
                View any website across desktop, tablet, and mobile viewports simultaneously. 
                Perfect for developers, designers, and teams building responsive experiences.
              </p>
              <div className='inline-flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-4 py-2 rounded-full'>
                Press{' '}
                <kbd className='px-2 py-1 bg-background border rounded text-xs font-mono shadow-sm'>
                  ⌘K
                </kbd>{' '}
                to get started
              </div>
            </div>

            {/* Feature Grid */}
            <div className='grid md:grid-cols-3 gap-6 mb-12'>
              <div className='text-center p-6 rounded-2xl bg-card/50 border'>
                <div className='w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                  <Monitor className='w-6 h-6 text-blue-600' />
                </div>
                <h3 className='font-semibold mb-2'>Multi-Viewport Testing</h3>
                <p className='text-sm text-muted-foreground'>
                  See desktop, tablet, and mobile views side-by-side in real-time
                </p>
              </div>
              
              <div className='text-center p-6 rounded-2xl bg-card/50 border'>
                <div className='w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                  <ZoomIn className='w-6 h-6 text-green-600' />
                </div>
                <h3 className='font-semibold mb-2'>Global Zoom Control</h3>
                <p className='text-sm text-muted-foreground'>
                  Zoom all viewports together from 50% to 200% for detailed inspection
                </p>
              </div>
              
              <div className='text-center p-6 rounded-2xl bg-card/50 border'>
                <div className='w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                  <Globe className='w-6 h-6 text-purple-600' />
                </div>
                <h3 className='font-semibold mb-2'>Instant URL Sharing</h3>
                <p className='text-sm text-muted-foreground'>
                  Share specific sites with team members via simple URLs
                </p>
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
          </div>
        )}
      </div>
    </div>
  )
}