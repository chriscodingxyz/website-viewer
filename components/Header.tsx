'use client'

import React, { useState } from 'react'
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

  // Function to handle selection from combobox
  const onSelect = (selectedValue: string) => {
    selectSuggestion(selectedValue)
    setOpen(false)
  }

  return (
    <header className='fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b py-3 px-2'>
      <div>
        <div className='flex gap-2 flex-row items-center'>
          <div className='flex-grow relative'>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className={cn(
                    'w-full justify-between text-[16px] h-10 px-3 py-2', 
                    isInputHighlighted && 'highlight-input'
                  )}
                >
                  {url ? url : "example.com or localhost:3000"}
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent 
                className="p-0" 
                align="start" 
                sideOffset={5}
                style={{ width: 'var(--radix-popover-trigger-width)' }}
              >
                <Command className='w-full'>
                  <CommandInput
                    placeholder='Search URL...'
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
                    {filteredSuggestions.length > 0 && (
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
                    )}

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
                      <CommandGroup heading='History'>
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
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          <div className='flex gap-2'>
            <Button
              size='sm'
              disabled={!formatUrl(url)}
              onClick={loadSite}
              className='px-3'
              title='Load site'
            >
              <Globe className='w-4 h-4' />
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
