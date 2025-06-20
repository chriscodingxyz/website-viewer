'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Globe,
  Trash2,
  Heart,
  Clock,
  Monitor,
  Tablet,
  Smartphone,
  PlusCircle,
  Star,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff
} from 'lucide-react'
import ThemeToggle from '@/components/ThemeToggle'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible'
import WebsiteView from './WebsiteView'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from './ui/dropdown-menu'
import { useFavorites } from '@/contexts/FavoritesContext'
import { useHistory } from '@/contexts/HistoryContext'
import { ScrollArea } from './ui/scroll-area'

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
  const [refreshKey, setRefreshKey] = useState(0)
  const { favorites } = useFavorites()
  const { history, addToHistory, removeFromHistory } = useHistory()

  // Global zoom state
  const zoomSteps = [0.5, 0.75, 1, 1.25, 1.5, 2]
  const [globalZoomStepIndex, setGlobalZoomStepIndex] = useState(2) // Default to 100%
  const globalZoom = zoomSteps[globalZoomStepIndex]

  // State for collapsed groups
  const [collapsedGroups, setCollapsedGroups] = useState<
    Record<string, boolean>
  >({})

  const highlightInput = () => {
    setIsInputHighlighted(true)
    setTimeout(() => setIsInputHighlighted(false), 1000)
  }

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

  const refreshAllViews = () => {
    setRefreshKey(prev => prev + 1)
    toast.success('Refreshing all views')
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
      if (e.metaKey || e.ctrlKey) {
        addAllViews()
      } else {
        addView('desktop')
      }
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

  const toggleGroupCollapse = (urlToToggle: string) => {
    setCollapsedGroups(prev => {
      const isCurrentlyCollapsed = prev[urlToToggle]
      const newCollapsedGroups: { [key: string]: boolean } = {}

      if (isCurrentlyCollapsed) {
        Object.keys(prev).forEach(key => {
          newCollapsedGroups[key] = true
        })
        newCollapsedGroups[urlToToggle] = false
      } else {
        Object.keys(prev).forEach(key => {
          newCollapsedGroups[key] = prev[key]
        })
        newCollapsedGroups[urlToToggle] = true
      }
      return newCollapsedGroups
    })
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
    <div className='relative min-h-screen flex flex-col'>
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
      <main className='flex-grow p-4 pt-32'>
        {/* Adjusted padding for fixed header */}
        {/* pb-28 for footer clearance, flex-grow to push footer down */}
        {Object.keys(groupedViews).length === 0 && (
          <div className='flex flex-col items-center justify-center h-full text-center text-muted-foreground pt-20'>
            <Globe className='w-16 h-16 mb-4 text-gray-400' />
            <h2 className='text-2xl font-semibold mb-2'>
              Welcome to Website Viewer
            </h2>
            <p className='mb-6'>
              Enter a URL in the bar below to start viewing websites in multiple
              device formats.
            </p>
            <p className='text-sm'>
              Tip: Use ⌘⏎ (or Ctrl⏎) to load in all device types at once.
            </p>
          </div>
        )}
        {/* Grouped Views - This part is moved inside main and wrapped with container */}
        {Object.keys(groupedViews).length > 0 && (
          <>
            {Object.entries(groupedViews).map(([url, viewsInGroup]) => {
              const isCollapsed = collapsedGroups[url]
              return (
                <Collapsible
                  key={url}
                  open={!isCollapsed}
                  onOpenChange={() => toggleGroupCollapse(url)}
                  className='border rounded-lg bg-card p-3 shadow-md space-y-1'
                >
                  <CollapsibleContent className='pt-1'>
                    {/* Apply pt-1 here for spacing when open */}
                    <div className='flex flex-wrap gap-4 justify-start'>
                      {viewsInGroup.map(view => (
                        <WebsiteView
                          key={view.id}
                          view={view}
                          refreshKey={refreshKey}
                          globalZoom={globalZoom}
                          onRemove={() => removeView(view.id)}
                          onTypeChange={type => changeViewType(view.id, type)}
                          onDuplicate={duplicateView}
                          index={views.findIndex(v => v.id === view.id)} // Use original index for numbering
                        />
                      ))}
                    </div>
                  </CollapsibleContent>
                  {/* Group Footer: URL, Zoom, Collapse Controls */}
                  <div
                    className={`flex justify-between items-center mt-2 pt-2 border-t ${
                      isCollapsed ? '' : '' // Retain for potential future conditional styling, though less relevant now
                    }`}
                  >
                    <h2
                      className='text-sm font-semibold text-primary truncate flex-1 mr-2'
                      title={url}
                    >
                      {url}
                    </h2>
                    <div className='flex items-center gap-2 flex-shrink-0 bg-muted p-1 rounded-md'>
                      {!isCollapsed && (
                        <div className='flex items-center gap-1'>
                          <Button
                            variant='ghost'
                            size='icon'
                            onClick={globalZoomOut}
                            disabled={globalZoomStepIndex === 0}
                            title='Zoom out (global)'
                          >
                            <ZoomOut className='h-4 w-4' />
                          </Button>
                          <span
                            className='text-xs w-10 text-center tabular-nums cursor-pointer'
                            onClick={resetGlobalZoom}
                            title='Reset zoom (global)'
                          >
                            {Math.round(globalZoom * 100)}%
                          </span>
                          <Button
                            variant='ghost'
                            size='icon'
                            onClick={globalZoomIn}
                            disabled={
                              globalZoomStepIndex === zoomSteps.length - 1
                            }
                            title='Zoom in (global)'
                          >
                            <ZoomIn className='h-4 w-4' />
                          </Button>
                        </div>
                      )}
                      {!isCollapsed && (
                        <div className='w-px self-stretch bg-border mx-1'></div>
                      )} {/* Vertical Separator */}
                      <CollapsibleTrigger asChild>
                        <Button
                          size='icon'
                          variant='ghost'
                          title={isCollapsed ? 'Show views' : 'Hide views'}
                        >
                          {isCollapsed ? (
                            <Eye className='h-4 w-4' />
                          ) : (
                            <EyeOff className='h-4 w-4' />
                          )}
                        </Button>
                      </CollapsibleTrigger>
                    </div>
                  </div>
                </Collapsible>
              )
            })}
          </>
        )}
      </main>
      {/* Footer - Fixed at the bottom */}
      <header className='fixed top-0 left-0 right-0 bg-background border-b p-3 shadow-md z-40'>
        <div className='container mx-auto'>
          <div className='flex gap-2 flex-col lg:flex-row'>
            <div className='flex-grow relative w-full lg:w-auto'>
              <Input
                id='url-input'
                type='text'
                value={url}
                onChange={e => handleUrlChange(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() =>
                  url.length > 0 &&
                  setShowSuggestions(filteredSuggestions.length > 0)
                }
                onBlur={() =>
                  setTimeout(() => setShowSuggestions(false), 100)
                }
                placeholder='example.com or localhost:3000 (⏎ for desktop, ⌘⏎ for all)'
                className={`text-[16px] bg-background ${
                  isInputHighlighted ? 'highlight-input' : ''
                }`}
              />
              {showSuggestions && (
                <div className='absolute top-full left-0 right-0 z-50 mt-1 bg-popover border rounded-md shadow-lg max-h-48 overflow-y-auto'>
                  {filteredSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => selectSuggestion(suggestion)}
                      className='w-full px-3 py-2 text-left hover:bg-accent hover:text-accent-foreground text-sm border-b last:border-b-0'
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className='flex gap-1'>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size='sm' disabled={!formatUrl(url)}>
                    <Globe className='w-4 h-4 mr-2' />
                    Load
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className='w-56'>
                  <DropdownMenuItem
                    onClick={addAllViews}
                    disabled={!formatUrl(url)}
                    className='hover:bg-muted focus:bg-muted text-foreground'
                  >
                    <PlusCircle className='mr-2 h-4 w-4' /> All Views
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => addView('desktop')}
                    className='bg-purple-50 hover:bg-purple-100 text-purple-700 focus:bg-purple-100 focus:text-purple-800'
                  >
                    <Monitor className='mr-2 h-4 w-4' /> Desktop
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => addView('tablet')}
                    className='bg-blue-50 hover:bg-blue-100 text-blue-700 focus:bg-blue-100 focus:text-blue-800'
                  >
                    <Tablet className='mr-2 h-4 w-4' /> Tablet
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => addView('mobileLarge')}
                    className='bg-green-50 hover:bg-green-100 text-green-700 focus:bg-green-100 focus:text-green-800'
                  >
                    <Smartphone className='mr-2 h-4 w-4' /> Large Mobile
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => addView('mobile')}
                    className='bg-orange-50 hover:bg-orange-100 text-orange-700 focus:bg-orange-100 focus:text-orange-800'
                  >
                    <Smartphone className='mr-2 h-4 w-4' /> Mobile
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size='sm' variant='outline'>
                    <Star
                      className='w-4 h-4 text-yellow-500'
                      fill={favorites.length > 0 ? 'yellow' : 'transparent'}
                    />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className='w-72'>
                  <ScrollArea className='max-h-[300px]'>
                    {favorites.map((item, index) => (
                      <DropdownMenuItem
                        key={index}
                        onSelect={() => setUrlWithHighlight(item)}
                      >
                        {item}
                      </DropdownMenuItem>
                    ))}
                  </ScrollArea>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size='sm' variant='outline'>
                    <Clock className='w-4 h-4' />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className='w-72'>
                  <ScrollArea className='max-h-[300px]'>
                    {history.map((item, index) => (
                      <DropdownMenuItem
                        key={index}
                        onSelect={() => setUrlWithHighlight(item)}
                      >
                        {item}
                      </DropdownMenuItem>
                    ))}
                  </ScrollArea>
                </DropdownMenuContent>
              </DropdownMenu>

              {views.length > 0 && (
                <>
                  {/* Refresh All button removed */}
                  <Button
                    size={'sm'}
                    onClick={clearAllViews}
                    variant='destructive'
                  >
                    <Trash2 size={18} />
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>
    </div>
  )
}
