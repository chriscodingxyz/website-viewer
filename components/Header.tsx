'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Globe,
  ChevronDown,
  Zap,
  Home,
  Eye,
  ZoomIn,
  ZoomOut,
  RotateCcw
} from 'lucide-react'
import {
  MagnifyingGlass,
  ShareNetwork,
  Code as CodeIcon,
  Devices
} from '@phosphor-icons/react'
import { ButtonGroup } from '@/components/ui/button-group'
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
} from '@/components/ui/command'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

function Header () {
  const {
    url,
    handleUrlChange,
    handleKeyDown,
    isInputHighlighted,
    filteredSuggestions,
    selectSuggestion,
    formatUrl,
    loadSite,
    currentSite,
    globalZoomStepIndex,
    setGlobalZoomStepIndex,
    zoomSteps,
    clearSite,
    fetchMetadata,
    selectedTab,
    setSelectedTab,
  } = useWebsiteViewer()

  const router = useRouter()

  const [open, setOpen] = useState(false)

  // Tab configuration
  type TabType = 'viewports' | 'seo' | 'social' | 'technical'

  const tabs: { id: TabType; label: string; icon: any }[] = [
    { id: 'seo', label: 'SEO', icon: MagnifyingGlass },
    { id: 'social', label: 'Social', icon: ShareNetwork },
    { id: 'technical', label: 'Technical', icon: CodeIcon },
    { id: 'viewports', label: 'Viewports', icon: Devices }
  ]

  // Function to handle tab navigation
  const handleTabClick = (tabId: TabType) => {
    setSelectedTab(tabId)

    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search)
      const siteParam = searchParams.get('site')
      const newPath = `/${siteParam ? `?site=${siteParam}` : ''}`
      router.push(newPath, { scroll: false })
    }

    if ((tabId === 'seo' || tabId === 'social' || tabId === 'technical') && currentSite) {
      fetchMetadata()
    }
  }

  // Add keyboard shortcut handler (Command+K or Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
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
    loadSite(selectedValue)
  }

  // Zoom controls
  const globalZoomIn = () => {
    const newIndex = Math.min(globalZoomStepIndex + 1, zoomSteps.length - 1)
    setGlobalZoomStepIndex(newIndex)
  }

  const globalZoomOut = () => {
    const newIndex = Math.max(globalZoomStepIndex - 1, 0)
    setGlobalZoomStepIndex(newIndex)
  }

  const resetGlobalZoom = () => {
    setGlobalZoomStepIndex(0)
  }

  return (
    <header className='fixed top-0 left-0 right-0 z-50 bg-background border-b'>
      <div className='px-4 py-2.5'>
        <div className='max-w-[1600px] mx-auto flex items-center gap-2.5'>
          {/* Home Button */}
          {currentSite && (
            <Button
              variant='ghost'
              size='icon'
              onClick={() => {
                clearSite()
                router.push('/')
              }}
              className='h-8 w-8 shrink-0 hover:bg-muted rounded-md'
              title='Home'
            >
              <Home className='h-3.5 w-3.5' />
            </Button>
          )}

          {/* URL Input */}
          <div className='relative flex-1 max-w-2xl'>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <button
                  role='combobox'
                  aria-expanded={open}
                  className={cn(
                    'w-full flex items-center justify-between h-8 px-3 text-sm bg-background border rounded-lg hover:border-foreground/40 transition-colors',
                    isInputHighlighted && 'ring-2 ring-primary ring-offset-2'
                  )}
                >
                  <span className='flex items-center gap-2 flex-1 min-w-0'>
                    <Globe className='h-3.5 w-3.5 flex-shrink-0 text-muted-foreground' />
                    <span className={cn('truncate text-sm', url ? 'text-foreground' : 'text-muted-foreground')}>
                      {url || 'https://'}
                    </span>
                  </span>
                  <ChevronDown className='h-3.5 w-3.5 flex-shrink-0 text-muted-foreground ml-2' />
                </button>
              </PopoverTrigger>
              <PopoverContent className='p-0' align='start' sideOffset={6} style={{ width: 'var(--radix-popover-trigger-width)' }}>
                <Command>
                  <CommandInput
                    placeholder='Enter website URL...'
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
                  <CommandEmpty>No URL found.</CommandEmpty>
                  <CommandList>
                    {url.length > 0 && filteredSuggestions.length > 0 && (
                      <CommandGroup heading='Suggestions'>
                        {filteredSuggestions.map((suggestion: string, index: number) => (
                          <CommandItem key={`suggestion-${index}`} onSelect={() => onSelect(suggestion)}>
                            <Zap className='mr-2 h-4 w-4' />
                            <span className='truncate'>{suggestion}</span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    )}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* View Button - Only when no site loaded */}
          {!currentSite && (
            <Button
              disabled={!formatUrl(url)}
              onClick={() => loadSite()}
              className='h-8 px-4 shrink-0 rounded-lg text-sm'
            >
              <Eye className='w-3.5 h-3.5 mr-1.5' />
              View
            </Button>
          )}

          {/* Tabs - Only when site loaded */}
          {currentSite && (
            <div className='hidden lg:flex items-center gap-1 bg-muted/50 p-0.5 rounded-lg'>
              {tabs.map(tab => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    className={cn(
                      'h-7 px-2.5 text-xs font-medium flex items-center gap-1.5 rounded-md transition-all',
                      selectedTab === tab.id
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                    )}
                    onClick={() => handleTabClick(tab.id)}
                  >
                    <Icon className='h-3.5 w-3.5' weight={selectedTab === tab.id ? 'fill' : 'regular'} />
                    {tab.label}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Tabs */}
      {currentSite && (
        <div className='lg:hidden border-t px-4 py-1.5'>
          <div className='flex gap-1 overflow-x-auto bg-muted/50 p-0.5 rounded-lg'>
            {tabs.map(tab => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  className={cn(
                    'h-7 px-2.5 text-xs font-medium flex items-center gap-1.5 rounded-md whitespace-nowrap transition-all',
                    selectedTab === tab.id
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                  )}
                  onClick={() => handleTabClick(tab.id)}
                >
                  <Icon className='h-3.5 w-3.5' weight={selectedTab === tab.id ? 'fill' : 'regular'} />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </header>
  )
}

export default Header
