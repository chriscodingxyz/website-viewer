'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Globe, Check, ChevronDown, Star, Clock, Zap } from 'lucide-react'
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
    loadSite
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

  return (
    <header className='fixed top-0 left-0 right-0 z-50 py-4 px-3' style={{
      background: 'rgba(255,255,255,0.8)',
      backdropFilter: 'blur(20px)'
    }}>
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
                    'w-full justify-between text-[16px] h-12 px-4 py-2 border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]',
                    isInputHighlighted && 'highlight-input'
                  )}
                  style={{
                    background: 'linear-gradient(145deg, rgba(255,255,255,0.9), rgba(248,250,252,0.9))',
                    border: '1px solid rgba(59,130,246,0.2)',
                    borderRadius: '16px'
                  }}
                >
                  <span className={cn(
                    'truncate',
                    url ? 'text-gray-800' : 'text-gray-500'
                  )}>
                    {url ? url : '🌐 Enter website URL to view...'}
                  </span>
                  <ChevronDown className='ml-3 h-4 w-4 shrink-0 text-blue-500/70' />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className='p-0 border-0 shadow-2xl'
                align='start'
                sideOffset={8}
                style={{ 
                  width: 'var(--radix-popover-trigger-width)',
                  background: 'linear-gradient(145deg, rgba(255,255,255,0.95), rgba(248,250,252,0.95))',
                  backdropFilter: 'blur(20px)',
                  borderRadius: '16px',
                  border: '1px solid rgba(59,130,246,0.1)'
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
              className='h-12 px-4 border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-40 disabled:transform-none'
              style={{
                background: formatUrl(url) 
                  ? 'linear-gradient(145deg, rgba(59,130,246,0.9), rgba(37,99,235,0.9))'
                  : 'linear-gradient(145deg, rgba(156,163,175,0.6), rgba(107,114,128,0.6))',
                borderRadius: '16px'
              }}
              title='Load website in all viewports'
            >
              <Globe className='w-5 h-5 text-white' />
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
