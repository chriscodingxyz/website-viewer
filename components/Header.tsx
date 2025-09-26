'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Globe,
  Check,
  ChevronDown,
  Star,
  Clock,
  Zap,
  Home,
  Lock,
  Eye,
  EyeOff,
  Menu,
  X
} from 'lucide-react'
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
import ShareableLink from '@/components/ShareableLink'
import ExportButton from '@/components/export/ExportButton'


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
    zoomSteps,
    clearSite,
    fetchMetadata,
    isInitialLoad,
    username,
    password,
    showAuthFields,
    setUsername,
    setPassword,
    setShowAuthFields,
    clearCredentials,
    selectedTab,
    setSelectedTab,
    metadata
  } = useWebsiteViewer()

  const { favorites } = useFavorites()
  const { history } = useHistory()
  const router = useRouter()
  const pathname = usePathname()

  const [open, setOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Tab configuration
  type TabType = 'viewports' | 'seo' | 'social' | 'technical'

  const tabs: { id: TabType; label: string }[] = [
    { id: 'viewports', label: 'Viewports' },
    { id: 'seo', label: 'SEO' },
    { id: 'social', label: 'Social Media' },
    { id: 'technical', label: 'Technical' }
  ]

  // Function to handle tab navigation with URL updates
  const handleTabClick = (tabId: TabType) => {
    setSelectedTab(tabId)
    setMobileMenuOpen(false) // Close mobile menu when tab is selected

    // Update URL to match the section
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search)
      const siteParam = searchParams.get('site')
      const newPath = `/${tabId}${siteParam ? `?site=${siteParam}` : ''}`

      router.push(newPath)
    }

    // If clicking on SEO, Social, or Technical tabs, trigger metadata extraction
    if ((tabId === 'seo' || tabId === 'social' || tabId === 'technical') && currentSite) {
      fetchMetadata()
    }
  }

  // Extract clean domain name from URL
  const getDomainName = (url: string) => {
    try {
      const domain = new URL(url).hostname
      return domain.replace('www.', '')
    } catch {
      return url
    }
  }

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
    <header className='bg-background border-b border-border'>
      <div className='py-2 px-2 sm:px-4'>
        <div className='max-w-[1400px] mx-auto px-2 sm:px-6 lg:px-8'>
          <div className='flex gap-1 sm:gap-2 flex-row items-center'>
            {/* Home Button - Only show when site is loaded */}
            {currentSite && (
              <Button
                variant='outline'
                size='sm'
                onClick={() => {
                  clearSite()
                  router.push('/')
                }}
                className='h-9 w-9 p-0 border border-border/50 hover:border-border transition-all duration-200 bg-card/90 hover:bg-card rounded-md'
                title='Return to homepage'
              >
                🧿
              </Button>
            )}

            {/* URL Input - Extended on mobile when site is loaded */}
            <div className={cn('relative transition-all duration-300', currentSite ? 'flex-1 md:w-64' : 'flex-grow')}>
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant='outline'
                    role='combobox'
                    aria-expanded={open}
                    className={cn(
                      'w-full justify-between text-[16px] h-9 px-3 border border-border/50 hover:border-border transition-all duration-200 bg-card/90 hover:bg-card rounded-md',
                      isInputHighlighted && 'highlight-input'
                    )}
                  >
                    <span
                      className={cn(
                        'truncate',
                        url ? 'text-foreground' : 'text-muted-foreground'
                      )}
                    >
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
                            {[
                              'localhost:3000',
                              'localhost:3001',
                              'localhost:5173'
                            ].map((port, index) => (
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

            {/* Load Button - Only show when no site is loaded */}
            {!currentSite && (
              <div className='flex gap-1'>
                <Button
                  size='sm'
                  disabled={!formatUrl(url)}
                  onClick={() => loadSite()}
                  className={cn(
                    'h-9 px-3 transition-all duration-200 disabled:opacity-40 rounded-md',
                    formatUrl(url)
                      ? 'bg-primary hover:bg-primary/90 text-primary-foreground'
                      : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                  )}
                  title='Load website in all viewports'
                >
                  <Globe className='w-3 h-3' />
                </Button>
              </div>
            )}

            {/* Desktop Navigation Tabs - Show when site is loaded and screen is large enough */}
            {currentSite && !isInitialLoad && (
              <div className='hidden md:flex items-center gap-1 overflow-x-auto flex-1'>
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    className={cn(
                      'px-2 sm:px-2.5 py-1 text-xs rounded-md transition-all duration-200 shrink-0',
                      selectedTab === tab.id
                        ? 'bg-foreground text-background'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    )}
                    onClick={() => handleTabClick(tab.id)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            )}

            {/* Desktop Export and Share buttons - Only show on desktop when metadata is loaded */}
            {currentSite && metadata && (
              <div className="hidden md:flex items-center gap-1 sm:gap-2">
                <ExportButton
                  metadata={metadata}
                  variant="outline"
                  size="sm"
                  showLabel={false}
                />
                <ShareableLink
                  currentUrl={currentSite}
                  section={selectedTab}
                  domainName={getDomainName(currentSite)}
                />
              </div>
            )}

            {/* Mobile Hamburger Menu - Show when site is loaded on small screens */}
            {currentSite && !isInitialLoad && (
              <div className='md:hidden'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className='h-9 w-9 p-0 border border-border/50 hover:border-border transition-all duration-200 bg-card/90 hover:bg-card rounded-md'
                  title='Open navigation menu'
                >
                  {mobileMenuOpen ? <X className='h-4 w-4' /> : <Menu className='h-4 w-4' />}
                </Button>
              </div>
            )}
          </div>

          {/* Mobile Navigation Menu Dropdown */}
          {currentSite && !isInitialLoad && mobileMenuOpen && (
            <div className='md:hidden mt-3 pb-2'>
              <div className='bg-card border border-border rounded-lg p-3 shadow-lg'>
                {/* Navigation Tabs */}
                <div className='mb-3'>
                  <h3 className='text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 px-1'>Navigation</h3>
                  <div className='grid grid-cols-2 gap-2'>
                    {tabs.map(tab => (
                      <button
                        key={tab.id}
                        className={cn(
                          'px-3 py-2.5 text-sm rounded-md transition-all duration-200 text-left font-medium',
                          selectedTab === tab.id
                            ? 'bg-foreground text-background'
                            : 'text-foreground hover:bg-muted/80 border border-border/50'
                        )}
                        onClick={() => handleTabClick(tab.id)}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Export and Share Actions - Only show when metadata is available */}
                {metadata && (
                  <div className='border-t border-border pt-3'>
                    <h3 className='text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 px-1'>Actions</h3>
                    <div className='flex gap-2'>
                      <div className='flex-1'>
                        <ExportButton
                          metadata={metadata}
                          variant="outline"
                          size="sm"
                          showLabel={true}
                          className='w-full justify-start'
                        />
                      </div>
                      <div className='flex-1'>
                        <ShareableLink
                          currentUrl={currentSite}
                          section={selectedTab}
                          domainName={getDomainName(currentSite)}
                          className='w-full'
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
