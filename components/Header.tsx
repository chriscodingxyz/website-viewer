'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Globe, Check, ChevronDown, Star, Clock, Zap, ZoomIn, ZoomOut } from 'lucide-react'
import { useWebsiteViewer } from '@/contexts/WebsiteViewerContext'
import { useFavorites } from '@/contexts/FavoritesContext'
import { useHistory } from '@/contexts/HistoryContext'
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator
} from '@/components/ui/command'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export function Header () {
  const {
    url,
    handleUrlChange,
    handleKeyDown,
    isInputHighlighted,
    showSuggestions,
    filteredSuggestions,
    setShowSuggestions,
    selectSuggestion,
    formatUrl,
    loadSite,
    currentSite,
    globalZoom,
    globalZoomStepIndex,
    setGlobalZoomStepIndex,
    zoomSteps
  } = useWebsiteViewer()

  const { favorites } = useFavorites()
  const { history } = useHistory()

  const [open, setOpen] = useState(false)

  // Add keyboard shortcut handler (Command+K or Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for Command+K (Mac) or Ctrl+K (Windows/Linux)
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault()
        setOpen(prev => !prev)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Function to handle selection from combobox
  const onSelect = (selectedValue: string) => {
    selectSuggestion(selectedValue)
    setOpen(false)
    // Automatically load the site when selected from dropdown
    // Pass the selected value directly to avoid race condition
    loadSite(selectedValue)
  }

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
    <header className='fixed top-0 left-0 right-0 z-50 py-4 px-3 bg-background/80 backdrop-blur-xl'>
      <div className='max-w-7xl mx-auto'>
        <div className='flex gap-4 flex-row items-center'>
          <div className='flex-grow relative'>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant='outline'
                  role='combobox'
                  aria-expanded={open}
                  className={cn(
                    'w-full justify-between text-[16px] h-12 px-4 py-2 border-2 border-border/50 hover:border-border shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] bg-card/90 hover:bg-card rounded-2xl',
                    isInputHighlighted && 'highlight-input'
                  )}
                >
                  <span className={cn(
                    'truncate',
                    url ? 'text-foreground' : 'text-muted-foreground'
                  )}>
                    {url ? url : '🌐 Enter website URL to view...'}
                  </span>
                  <ChevronDown className='ml-3 h-4 w-4 shrink-0 text-primary/70' />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className='p-0 border border-border/20 shadow-2xl bg-popover/95 backdrop-blur-xl rounded-2xl'
                align='start'
                sideOffset={8}
                style={{ 
                  width: 'var(--radix-popover-trigger-width)'
                }}
              >
                <Command className='w-full'>
                  <CommandInput
                    placeholder='Enter website URL to view...'
                    value={url}
                    onValueChange={handleUrlChange}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && url.trim()) {
                        setOpen(false)
                        loadSite()
                      }
                      handleKeyDown(e)
                    }}
                    className='text-[16px]'
                  />
                  <CommandEmpty className='py-3 text-center'>
                    No URL found.
                  </CommandEmpty>
                  <CommandList>
                    {url.length > 0 ? (
                      // Show filtered suggestions when typing
                      filteredSuggestions.length > 0 && (
                        <CommandGroup heading='Suggestions'>
                          {filteredSuggestions.map((suggestion, index) => (
                            <CommandItem
                              key={`suggestion-${index}`}
                              onSelect={() => onSelect(suggestion)}
                              className='cursor-pointer flex items-center w-full'
                            >
                              <Zap className='mr-2 h-4 w-4 flex-shrink-0' />
                              <span className='truncate'>{suggestion}</span>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      )
                    ) : (
                      // Show categorized lists when input is empty
                      <>
                        {favorites.length > 0 && (
                          <CommandGroup heading='Favorites'>
                            {favorites.map((fav, index) => (
                              <CommandItem
                                key={`favorite-${index}`}
                                onSelect={() => onSelect(fav)}
                                className='cursor-pointer flex items-center w-full'
                              >
                                <Star className='mr-2 h-4 w-4 text-yellow-500 flex-shrink-0' />
                                <span className='truncate'>{fav}</span>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        )}

                        {history.length > 0 && (
                          <CommandGroup heading='Recent'>
                            {history.map((item, index) => (
                              <CommandItem
                                key={`history-${index}`}
                                onSelect={() => onSelect(item)}
                                className='cursor-pointer flex items-center w-full'
                              >
                                <Clock className='mr-2 h-4 w-4 text-slate-400 flex-shrink-0' />
                                <span className='truncate'>{item}</span>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        )}

                        <CommandGroup heading='Quick Start'>
                          {['localhost:3000', 'localhost:3001', 'localhost:5173'].map((port, index) => (
                            <CommandItem
                              key={`port-${index}`}
                              onSelect={() => onSelect(port)}
                              className='cursor-pointer flex items-center w-full'
                            >
                              <Zap className='mr-2 h-4 w-4 flex-shrink-0' />
                              <span className='truncate'>{port}</span>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </>
                    )}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          <div className='flex gap-3'>
            <Button
              size='sm'
              disabled={!formatUrl(url)}
              onClick={() => loadSite()}
              className={cn(
                'h-12 px-4 border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-40 disabled:transform-none rounded-2xl',
                formatUrl(url) 
                  ? 'bg-primary hover:bg-primary/90 text-primary-foreground' 
                  : 'bg-muted hover:bg-muted/80 text-muted-foreground'
              )}
              title='Load website in all viewports'
            >
              <Globe className='w-5 h-5' />
            </Button>
            
            {/* Zoom Controls - Only show when site is loaded and on desktop */}
            {currentSite && (
              <div className='hidden sm:flex items-center gap-1 px-3 py-2 border border-border/20 shadow-lg hover:shadow-xl transition-all duration-300 bg-card/90 hover:bg-card rounded-2xl'
              >
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={globalZoomOut}
                  disabled={globalZoomStepIndex === 2}
                  title='Zoom out (Min: 100%)'
                  className='h-8 w-8 p-0 rounded-full hover:bg-accent disabled:opacity-30 transition-all duration-200'
                >
                  <ZoomOut className='h-4 w-4 text-foreground' />
                </Button>
                <span
                  className='text-sm font-medium w-12 text-center tabular-nums cursor-pointer hover:text-primary transition-colors px-2 py-1 rounded-md hover:bg-accent'
                  onClick={resetGlobalZoom}
                  title='Click to reset zoom to 100%'
                >
                  {Math.round(globalZoom * 100)}%
                </span>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={globalZoomIn}
                  disabled={globalZoomStepIndex === zoomSteps.length - 1}
                  title='Zoom in (Max: 200%)'
                  className='h-8 w-8 p-0 rounded-full hover:bg-accent disabled:opacity-30 transition-all duration-200'
                >
                  <ZoomIn className='h-4 w-4 text-foreground' />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
