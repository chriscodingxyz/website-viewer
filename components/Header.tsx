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
  Monitor,
  Search,
  Share2,
  Code,
  ZoomIn,
  ZoomOut,
  RotateCcw
} from 'lucide-react'
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
    { id: 'seo', label: 'SEO', icon: Search },
    { id: 'social', label: 'Social', icon: Share2 },
    { id: 'technical', label: 'Technical', icon: Code },
    { id: 'viewports', label: 'Viewports', icon: Monitor }
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
    toast.success(`Zoom: ${Math.round(zoomSteps[newIndex] * 100)}%`)
  }

  const globalZoomOut = () => {
    const newIndex = Math.max(globalZoomStepIndex - 1, 0)
    setGlobalZoomStepIndex(newIndex)
    toast.success(`Zoom: ${Math.round(zoomSteps[newIndex] * 100)}%`)
  }

  const resetGlobalZoom = () => {
    setGlobalZoomStepIndex(0)
    toast.success('Zoom reset to 100%')
  }

  return (
    <header className='fixed top-0 left-0 right-0 z-50 bg-background border-b'>
      <div className='px-4 py-3'>
        <div className='max-w-[1600px] mx-auto flex items-center gap-3'>
          {/* Home Button */}
          {currentSite && (
            <Button
              variant='ghost'
              size='icon'
              onClick={() => {
                clearSite()
                router.push('/')
              }}
              className='h-9 w-9 shrink-0 hover:bg-muted rounded-md'
              title='Home'
            >
              <Home className='h-4 w-4' />
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
                    'w-full flex items-center justify-between h-10 px-4 text-sm bg-background border rounded-lg hover:border-foreground/40 transition-colors',
                    isInputHighlighted && 'ring-2 ring-primary ring-offset-2'
                  )}
                >
                  <span className='flex items-center gap-2.5 flex-1 min-w-0'>
                    <Globe className='h-4 w-4 flex-shrink-0 text-muted-foreground' />
                    <span className={cn('truncate', url ? 'text-foreground font-medium' : 'text-muted-foreground')}>
                      {url || 'https://'}
                    </span>
                  </span>
                  <ChevronDown className='h-4 w-4 flex-shrink-0 text-muted-foreground ml-2' />
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
              className='h-10 px-5 shrink-0 rounded-lg font-medium'
            >
              <Eye className='w-4 h-4 mr-2' />
              View
            </Button>
          )}

          {/* Tabs - Only when site loaded */}
          {currentSite && (
            <div className='hidden lg:flex items-center gap-2'>
              {tabs.map(tab => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    className={cn(
                      'h-9 px-4 text-sm font-medium flex items-center gap-2 rounded-lg transition-all',
                      selectedTab === tab.id
                        ? 'bg-foreground text-background'
                        : 'hover:bg-muted text-foreground'
                    )}
                    onClick={() => handleTabClick(tab.id)}
                  >
                    <Icon className='h-4 w-4' />
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
        <div className='lg:hidden border-t px-4 py-2'>
          <div className='flex gap-2 overflow-x-auto'>
            {tabs.map(tab => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  className={cn(
                    'h-8 px-3 text-sm font-medium flex items-center gap-2 rounded-lg whitespace-nowrap transition-all',
                    selectedTab === tab.id ? 'bg-foreground text-background' : 'hover:bg-muted'
                  )}
                  onClick={() => handleTabClick(tab.id)}
                >
                  <Icon className='h-3.5 w-3.5' />
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
