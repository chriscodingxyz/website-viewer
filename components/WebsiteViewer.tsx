'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Globe,
  ZoomIn,
  ZoomOut
} from 'lucide-react'
import { Header } from '@/components/Header'
import WebsiteView from './WebsiteView'
import { toast } from 'sonner'
import { useFavorites } from '@/contexts/FavoritesContext'
import { useHistory } from '@/contexts/HistoryContext'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

// export type ViewType = 'desktop' | 'tablet' | 'mobile'

export type ViewType = 'desktop' | 'tablet' | 'mobileLarge' | 'mobile'

export interface View {
  id: number
  url: string
  type: ViewType
  refreshKey?: number
}

const isValidUrl = (url: string): boolean => {
  const urlPattern =
    /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/
  const localhostPattern =
    /^(https?:\/\/)?(localhost|127\.0\.0\.1)(:\d+)?(\/.*)?$/
  return urlPattern.test(url) || localhostPattern.test(url)
}

const formatUrl = (inputUrl: string): string | null => {
  let formattedUrl = inputUrl.trim().toLowerCase()

  if (
    formattedUrl.includes('localhost') ||
    formattedUrl.includes('127.0.0.1')
  ) {
    if (
      !formattedUrl.startsWith('http://') &&
      !formattedUrl.startsWith('https://')
    ) {
      formattedUrl = 'http://' + formattedUrl
    }
    return isValidUrl(formattedUrl) ? formattedUrl : null
  }

  if (
    !formattedUrl.startsWith('http://') &&
    !formattedUrl.startsWith('https://')
  ) {
    formattedUrl = 'https://' + formattedUrl
  }

  return isValidUrl(formattedUrl) ? formattedUrl : null
}

const commonDevPorts = [
  'localhost:3000',
  'localhost:3001',
  'localhost:5173',
  'localhost:8080',
  'localhost:4000',
  'localhost:8000',
  'localhost:8888',
  '127.0.0.1:3000',
  '127.0.0.1:5173'
]

export default function WebsiteViewer () {
  const [url, setUrl] = useState('')
  const [views, setViews] = useState<View[]>([])
  const [nextId, setNextId] = useState(1)
  const [isInputHighlighted, setIsInputHighlighted] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([])
  const [refreshKey] = useState(0)
  const [openAccordionItems, setOpenAccordionItems] = useState<string[]>([])
  const { favorites } = useFavorites()
  const { history, addToHistory } = useHistory()

  // Global zoom state
  const zoomSteps = [0.5, 0.75, 1, 1.25, 1.5, 2]
  const [globalZoomStepIndex, setGlobalZoomStepIndex] = useState(2) // Default to 100%
  const globalZoom = zoomSteps[globalZoomStepIndex]



  const setUrlWithHighlight = (url: string) => {
    setUrl(url)
    setIsInputHighlighted(true)
    setTimeout(() => setIsInputHighlighted(false), 1000)
    toast.success('URL added to the viewer')
  }

  const addView = (viewType: ViewType = 'desktop') => {
    const formattedUrl = formatUrl(url)
    if (formattedUrl) {
      setViews(prevViews => [
        { id: nextId, url: formattedUrl, type: viewType },
        ...prevViews
      ])
      setNextId(nextId + 1)
      addToHistory(formattedUrl)
      setUrl('')
      // Auto-open accordion for this URL
      setOpenAccordionItems(prev => 
        prev.includes(formattedUrl) ? prev : [...prev, formattedUrl]
      )
      toast.success(`New ${viewType} view added`)
    } else {
      toast.error('Please enter a valid URL')
    }
  }

  const addAllViews = () => {
    const formattedUrl = formatUrl(url)
    if (formattedUrl) {
      setViews(prevViews => [
        { id: nextId, url: formattedUrl, type: 'desktop' },
        { id: nextId + 1, url: formattedUrl, type: 'tablet' },
        { id: nextId + 2, url: formattedUrl, type: 'mobileLarge' },
        { id: nextId + 3, url: formattedUrl, type: 'mobile' },
        ...prevViews
      ])
      setNextId(nextId + 4)
      addToHistory(formattedUrl)
      setUrl('')
      // Auto-open accordion for this URL
      setOpenAccordionItems(prev => 
        prev.includes(formattedUrl) ? prev : [...prev, formattedUrl]
      )
    } else {
      toast.error('Please enter a valid URL')
    }
  }

  const removeView = (id: number) => {
    setViews(views.filter(view => view.id !== id))
  }

  const changeViewType = (id: number, type: ViewType) => {
    setViews(views.map(view => (view.id === id ? { ...view, type } : view)))
  }

  const clearAllViews = () => {
    setViews([])
  }


  const duplicateView = (view: View) => {
    setViews(prevViews => [{ ...view, id: nextId }, ...prevViews])
    setNextId(nextId + 1)
    toast.success(`New ${view.type} view added`)
  }

  const handleUrlChange = (value: string) => {
    setUrl(value)

    if (value.length > 0) {
      const allSuggestions = [...commonDevPorts, ...history, ...favorites]
      const filtered = allSuggestions
        .filter(
          suggestion =>
            suggestion.toLowerCase().includes(value.toLowerCase()) &&
            suggestion !== value
        )
        .slice(0, 6)

      setFilteredSuggestions(filtered)
      setShowSuggestions(filtered.length > 0)
    } else {
      setShowSuggestions(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addAllViews()
      setShowSuggestions(false)
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
    }
  }

  const selectSuggestion = (suggestion: string) => {
    setUrl(suggestion)
    setShowSuggestions(false)
    setIsInputHighlighted(true)
    setTimeout(() => setIsInputHighlighted(false), 1000)
  }

  // Global zoom functions
  const globalZoomIn = () => {
    setGlobalZoomStepIndex(prev => Math.min(prev + 1, zoomSteps.length - 1))
    toast.success(
      `Global zoom: ${Math.round(
        zoomSteps[Math.min(globalZoomStepIndex + 1, zoomSteps.length - 1)] * 100
      )}%`
    )
  }

  const globalZoomOut = () => {
    setGlobalZoomStepIndex(prev => Math.max(prev - 1, 0))
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
    <div className='h-full flex flex-col'>
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
      
      <Header
        url={url}
        setUrl={setUrl}
        handleUrlChange={handleUrlChange}
        handleKeyDown={handleKeyDown}
        isInputHighlighted={isInputHighlighted}
        showSuggestions={showSuggestions}
        filteredSuggestions={filteredSuggestions}
        setShowSuggestions={setShowSuggestions}
        selectSuggestion={selectSuggestion}
        formatUrl={formatUrl}
        addAllViews={addAllViews}
        addView={addView}
        setUrlWithHighlight={setUrlWithHighlight}
        clearAllViews={clearAllViews}
        views={views}
      />
      
      {/* Main Content Area */}
      <div className='flex-1 overflow-auto p-4'>
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
              Enter any URL above and press <kbd className='px-1 sm:px-1.5 py-0.5 bg-background border rounded text-xs'>Enter</kbd> to get started
            </p>
          </div>
        )}
        {/* Website Groups with Clean Accordion */}
        {Object.keys(groupedViews).length > 0 && (
          <Accordion 
            type="multiple" 
            value={openAccordionItems}
            onValueChange={setOpenAccordionItems}
            className="space-y-1"
          >
            {Object.entries(groupedViews).map(([url, viewsInGroup]) => (
              <AccordionItem 
                key={url} 
                value={url}
                className="border-b border-muted/30 last:border-b-0"
              >
                <AccordionTrigger className="hover:no-underline py-3 hover:bg-muted/20 px-2 rounded-sm">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-green-500/60 flex-shrink-0"></div>
                      <span className="text-sm font-medium text-foreground truncate" title={url}>
                        {url}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                      <div className="hidden sm:flex items-center gap-1 px-1.5 py-1 bg-muted/30 rounded text-xs">
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={(e) => {
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
                          onClick={(e) => {
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
                          onClick={(e) => {
                            e.stopPropagation()
                            globalZoomIn()
                          }}
                          disabled={globalZoomStepIndex === zoomSteps.length - 1}
                          title='Zoom in'
                          className='h-5 w-5 p-0'
                        >
                          <ZoomIn className='h-2.5 w-2.5' />
                        </Button>
                      </div>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-3">
                  <div className='flex flex-wrap gap-2 sm:gap-3 justify-start px-2'>
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
