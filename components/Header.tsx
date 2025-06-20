'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Globe,
  Trash2,
  Star,
  Clock,
  Monitor,
  Tablet,
  Smartphone,
  PlusCircle
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from './ui/dropdown-menu'
import { useFavorites } from '@/contexts/FavoritesContext'
import { useHistory } from '@/contexts/HistoryContext'
import { ScrollArea } from './ui/scroll-area'
import { useWebsiteViewer } from '@/contexts/WebsiteViewerContext'

export function Header () {
  const { favorites } = useFavorites()
  const { history } = useHistory()
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
    addAllViews,
    addView,
    setUrlWithHighlight,
    clearAllViews,
    views
  } = useWebsiteViewer()

  return (
    <header className='bg-background border-b py-3 px-2 flex-shrink-0'>
      <div>
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
              onBlur={() => setTimeout(() => setShowSuggestions(false), 100)}
              placeholder='example.com or localhost:3000'
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
          <div className='flex gap-2'>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size='sm'
                  disabled={!formatUrl(url)}
                  className='font-medium'
                >
                  <Globe className='w-4 h-4 mr-2' />
                  Load
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className='w-56 border-muted'>
                <DropdownMenuItem
                  onClick={addAllViews}
                  disabled={!formatUrl(url)}
                  className='focus:bg-muted/50'
                >
                  <PlusCircle className='mr-2 h-4 w-4' /> All Views
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => addView('desktop')}
                  className='bg-purple-50 hover:bg-purple-100 text-purple-700 focus:bg-purple-100 focus:text-purple-800'
                >
                  <Monitor className='mr-2 h-4 w-4 text-purple-600' /> Desktop
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => addView('tablet')}
                  className='bg-blue-50 hover:bg-blue-100 text-blue-700 focus:bg-blue-100 focus:text-blue-800'
                >
                  <Tablet className='mr-2 h-4 w-4 text-blue-600' /> Tablet
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => addView('mobileLarge')}
                  className='bg-green-50 hover:bg-green-100 text-green-700 focus:bg-green-100 focus:text-green-800'
                >
                  <Smartphone className='mr-2 h-4 w-4 text-green-600' /> Large
                  Mobile
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => addView('mobile')}
                  className='bg-orange-50 hover:bg-orange-100 text-orange-700 focus:bg-orange-100 focus:text-orange-800'
                >
                  <Smartphone className='mr-2 h-4 w-4 text-orange-600' /> Mobile
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size='sm' variant='ghost' className='border-0'>
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
                <Button size='sm' variant='ghost' className='border-0'>
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
              <Button
                size={'sm'}
                onClick={clearAllViews}
                variant='ghost'
                className='text-destructive hover:text-destructive hover:bg-destructive/10'
              >
                <Trash2 size={18} />
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
