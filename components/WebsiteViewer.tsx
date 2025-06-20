'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Globe, ZoomIn, ZoomOut } from 'lucide-react'
import WebsiteView from './WebsiteView'
import { toast } from 'sonner'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion'
import { useWebsiteViewer, View } from '@/contexts/WebsiteViewerContext'

export default function WebsiteViewer () {
  const [refreshKey] = useState(0)
  const {
    views,
    removeView,
    changeViewType,
    duplicateView,
    openAccordionItems,
    setOpenAccordionItems,
    globalZoom,
    globalZoomStepIndex,
    setGlobalZoomStepIndex,
    zoomSteps
  } = useWebsiteViewer()

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
    setGlobalZoomStepIndex(Math.max(globalZoomStepIndex - 1, 0))
    toast.success(
      `Global zoom: ${Math.round(
        zoomSteps[Math.max(globalZoomStepIndex - 1, 0)] * 100
      )}%`
    )
  }

  const resetGlobalZoom = () => {
    setGlobalZoomStepIndex(2)
    toast.success('Global zoom reset to 100%')
  }

  // Group views by the exact URL loaded
  const groupedViews = views.reduce((acc, view) => {
    const urlKey = view.url
    if (!acc[urlKey]) {
      acc[urlKey] = []
    }
    acc[urlKey].push(view)
    return acc
  }, {} as Record<string, View[]>)

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
      <div className='p-0'>
        {/* Adjusted padding for fixed header */}
        {/* pb-28 for footer clearance, flex-grow to push footer down */}
        {Object.keys(groupedViews).length === 0 && (
          <div className='flex flex-col items-center justify-center min-h-full text-center text-muted-foreground py-4 sm:py-8 max-w-xl mx-auto px-2'>
            <Globe className='w-12 h-12 sm:w-14 sm:h-14 mb-3 sm:mb-4 text-muted-foreground/60' />
            <h2 className='text-xl sm:text-2xl font-medium mb-2 sm:mb-3 text-foreground'>
              Website Viewer
            </h2>
            <p className='text-sm sm:text-base mb-3 sm:mb-4 text-muted-foreground/80 leading-relaxed max-w-md'>
              View any website across different device formats simultaneously.
              Perfect for responsive design testing and development.
            </p>
            <div className='space-y-1 text-xs sm:text-sm text-muted-foreground/70'>
              <p>✓ Desktop, Tablet, and Mobile views</p>
              <p>✓ Real-time responsive testing</p>
              <p>✓ Local development server support</p>
            </div>
            <div className='space-y-1 text-xs text-muted-foreground/60 mt-3 sm:mt-4'>
              <p>⭐ Star button: Quick access to your saved favorites</p>
              <p>🕒 Clock button: Browse your recently visited URLs</p>
            </div>
            <p className='text-xs sm:text-sm mt-3 sm:mt-4 px-3 sm:px-4 py-1.5 sm:py-2 bg-muted/50 rounded-lg'>
              Enter any URL above and press{' '}
              <kbd className='px-1 sm:px-1.5 py-0.5 bg-background border rounded text-xs'>
                Enter
              </kbd>{' '}
              to get started
            </p>
          </div>
        )}
        {/* Website Groups with Clean Accordion */}
        {Object.keys(groupedViews).length > 0 && (
          <Accordion
            type='multiple'
            value={openAccordionItems}
            onValueChange={setOpenAccordionItems}
            className='space-y-1'
          >
            {Object.entries(groupedViews).map(([url, viewsInGroup]) => (
              <AccordionItem
                key={url}
                value={url}
                className='border-b border-muted/30 last:border-b-0'
              >
                <AccordionTrigger className='hover:no-underline py-3 hover:bg-muted/20 px-2 rounded-sm'>
                  <div className='flex items-center justify-between w-full'>
                    <div className='flex items-center gap-2 flex-1 min-w-0'>
                      <div className='w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-green-500/60 flex-shrink-0'></div>
                      <span
                        className='text-sm font-medium text-foreground truncate'
                        title={url}
                      >
                        {url}
                      </span>
                    </div>
                    <div className='flex items-center gap-1 ml-2 flex-shrink-0'>
                      <div className='hidden sm:flex items-center gap-1 px-1.5 py-1 bg-muted/30 rounded text-xs'>
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={e => {
                            e.stopPropagation()
                            globalZoomOut()
                          }}
                          disabled={globalZoomStepIndex === 0}
                          title='Zoom out'
                          className='h-5 w-5 p-0'
                        >
                          <ZoomOut className='h-2.5 w-2.5' />
                        </Button>
                        <span
                          className='text-xs w-8 text-center tabular-nums cursor-pointer'
                          onClick={e => {
                            e.stopPropagation()
                            resetGlobalZoom()
                          }}
                          title='Reset zoom'
                        >
                          {Math.round(globalZoom * 100)}%
                        </span>
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={e => {
                            e.stopPropagation()
                            globalZoomIn()
                          }}
                          disabled={
                            globalZoomStepIndex === zoomSteps.length - 1
                          }
                          title='Zoom in'
                          className='h-5 w-5 p-0'
                        >
                          <ZoomIn className='h-2.5 w-2.5' />
                        </Button>
                      </div>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className='pb-2 sm:pb-3'>
                  <div className='flex flex-wrap gap-2 sm:gap-3 justify-center sm:justify-start px-0 sm:px-1'>
                    {viewsInGroup.map(view => (
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
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>
    </div>
  )
}