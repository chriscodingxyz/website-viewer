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
  RotateCcw,
  Menu,
  Search,
  ArrowRight,
  ArrowLeft,
  X
} from 'lucide-react'
import {
  MagnifyingGlass,
  ShareNetwork,
  Code as CodeIcon,
  Devices
} from '@phosphor-icons/react'
import { Clock } from 'lucide-react'
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import ExportReportButton from './ExportReportButton'
import ShareableLink from './ShareableLink'

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
    views,
  } = useWebsiteViewer()

  const router = useRouter()
  const pathname = usePathname()
  const { history } = useHistory()

  const [open, setOpen] = useState(false)

  // Tab configuration
  type TabType = 'viewports' | 'seo' | 'social' | 'technical'

  // Check if all viewports are blocked
  const areViewportsBlocked = views.length > 0 && views.every((v: any) => v.iframeStatus === 'blocked')

  const allTabs: { id: TabType; label: string; icon: any }[] = [
    { id: 'seo', label: 'SEO', icon: MagnifyingGlass },
    { id: 'social', label: 'Social', icon: ShareNetwork },
    { id: 'technical', label: 'Technical', icon: CodeIcon },
    { id: 'viewports', label: 'Viewports', icon: Devices }
  ]

  // Filter out viewports tab if blocked
  const tabs = areViewportsBlocked ? allTabs.filter(tab => tab.id !== 'viewports') : allTabs

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

  // Add keyboard shortcut handler (Command+K or Ctrl+K, and number keys for tabs)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in an input
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return
      }

      // Command+K or Ctrl+K to toggle search
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault()
        setOpen(prev => !prev)
        return
      }

      // Number keys 1-4 to switch tabs (when viewing a site)
      if (currentSite && !event.metaKey && !event.ctrlKey && !event.altKey) {
        const num = parseInt(event.key)
        if (num >= 1 && num <= tabs.length) {
          event.preventDefault()
          handleTabClick(tabs[num - 1].id)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSite, tabs, selectedTab])

  if (pathname?.startsWith('/report')) return null

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
      <div className='px-2 sm:px-4 py-2.5'>
        <div className='max-w-[1600px] flex items-center justify-start gap-1.5 sm:gap-2.5'>
          {/* Globe Icon and WebViewer Text - Home Link */}
          <button
            onClick={() => {
              if (currentSite) {
                clearSite()
              }
              router.push('/')
            }}
            className='flex items-center gap-2 hover:opacity-80 transition-opacity'
            title='Go to home'
          >
            <Globe className='h-4 w-4 shrink-0' />
            <span className='hidden sm:inline text-sm font-semibold text-foreground'>
              WebViewer
            </span>
          </button>

          {/* Back/Clear Button - Only show on desktop when viewing a site */}
          {currentSite && (
            <Button
              variant='ghost'
              size='icon'
              onClick={() => {
                clearSite()
                router.push('/')
              }}
              className='h-8 w-8 shrink-0 hover:bg-muted rounded-md hidden sm:flex'
              title='Clear and go back'
            >
              <ArrowLeft className='h-4 w-4' />
            </Button>
          )}

          {/* URL Input - Only show when viewing a site */}
          {currentSite && (
            <>
              <div className='relative flex-1 min-w-0 max-w-2xl'>
                <Popover open={open} onOpenChange={setOpen}>
                  <PopoverTrigger asChild>
                    <button
                      role='combobox'
                      aria-expanded={open}
                      aria-controls='url-suggestions'
                      className={cn(
                        'w-full flex items-center justify-between h-8 px-3 text-sm bg-background border rounded-lg hover:border-foreground/40 transition-colors',
                        isInputHighlighted && 'ring-2 ring-primary ring-offset-2'
                      )}
                    >
                      <span className='flex items-center gap-2 flex-1 min-w-0'>
                        <Globe className='h-2.5 w-2.5 flex-shrink-0 text-muted-foreground' />
                        <span className={cn('truncate text-sm', url ? 'text-foreground' : 'text-muted-foreground')}>
                          {url || 'https://'}
                        </span>
                      </span>
                      <ChevronDown className='h-3.5 w-3.5 flex-shrink-0 text-muted-foreground ml-2' />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className='p-0' align='start' sideOffset={6} style={{ width: 'var(--radix-popover-trigger-width)' }}>
                    <Command id='url-suggestions'>
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
                        {/* Recently Viewed - Show when no search input */}
                        {url.length === 0 && history.length > 0 && (
                          <CommandGroup heading='Recently Viewed'>
                            {history.slice(0, 5).map((item: string, index: number) => (
                              <CommandItem key={`history-${index}`} onSelect={() => onSelect(item)}>
                                <Clock className='mr-2 h-4 w-4 text-muted-foreground' />
                                <span className='truncate'>{item}</span>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        )}

                        {/* Suggestions - Show when typing */}
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

              {/* Search Button - Show when viewing a site */}
              <Button
                disabled={!formatUrl(url)}
                onClick={() => loadSite()}
                size='icon'
                className='h-8 w-8 shrink-0 rounded-lg'
              >
                <Search className='w-3.5 h-3.5 sm:w-4 sm:h-4' />
              </Button>

              {/* Commercial actions */}
              <div className='hidden sm:flex items-center gap-1.5 ml-1'>
                <ShareableLink
                  currentUrl={currentSite}
                  section={(selectedTab as 'viewports' | 'seo' | 'social' | 'technical')}
                  domainName={(() => {
                    try { return new URL(currentSite).hostname.replace(/^www\./, '') } catch { return currentSite }
                  })()}
                  className='h-8 w-8'
                />
                <ExportReportButton />
              </div>
            </>
          )}


          {/* Tabs - Desktop: horizontal tabs, Mobile: dropdown */}
          {currentSite && (
            <>
              {/* Desktop Tabs - Hide on smaller screens when needed */}
              <div className='hidden xl:flex items-center gap-1 bg-muted/50 p-0.5 rounded-lg'>
                {tabs.map((tab, index) => {
                  const Icon = tab.icon
                  const isSelected = selectedTab === tab.id
                  return (
                    <button
                      key={tab.id}
                      className={cn(
                        'h-7 px-3 text-xs font-medium flex items-center gap-2 rounded-md transition-all duration-200 group',
                        isSelected
                          ? 'bg-background text-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                      )}
                      onClick={() => handleTabClick(tab.id)}
                      title={`${tab.label} (Press ${index + 1})`}
                    >
                      <Icon className='h-3.5 w-3.5' weight={isSelected ? 'fill' : 'regular'} />
                      {tab.label}
                      <span className={cn(
                        'text-[10px] opacity-0 group-hover:opacity-50 transition-opacity duration-200 -ml-0.5',
                        isSelected && 'opacity-30'
                      )}>
                        {index + 1}
                      </span>
                    </button>
                  )
                })}
              </div>

              {/* Mobile Dropdown - Show on all non-XL screens */}
              <div className='xl:hidden'>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant='outline' size='sm' className='h-9 gap-1.5 text-xs px-3'>
                      {(() => {
                        const currentTab = tabs.find(t => t.id === selectedTab)
                        const CurrentIcon = currentTab?.icon
                        return CurrentIcon ? <CurrentIcon className='h-4 w-4' weight='fill' /> : null
                      })()}
                      <ChevronDown className='h-3.5 w-3.5' />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='end' className='w-48'>
                    <div className='px-2 py-1.5 text-xs font-medium text-muted-foreground'>
                      Switch View
                    </div>
                    {tabs.map((tab, index) => {
                      const Icon = tab.icon
                      const isSelected = selectedTab === tab.id
                      return (
                        <DropdownMenuItem
                          key={tab.id}
                          onClick={() => handleTabClick(tab.id)}
                          className={cn(
                            'cursor-pointer gap-3 py-2.5',
                            isSelected && 'bg-accent/10'
                          )}
                        >
                          <Icon className='h-4 w-4' weight={isSelected ? 'fill' : 'regular'} />
                          <span className='flex-1'>{tab.label}</span>
                          <span className='text-[10px] text-muted-foreground'>{index + 1}</span>
                          {isSelected && (
                            <div className='w-1.5 h-1.5 rounded-full bg-accent' />
                          )}
                        </DropdownMenuItem>
                      )
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </>
          )}
        </div>
      </div>

    </header>
  )
}

export default Header
