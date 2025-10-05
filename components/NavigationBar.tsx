'use client'

import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useWebsiteViewer } from '@/contexts/WebsiteViewerContext'
import { Badge } from '@/components/ui/badge'
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb'
import ShareableLink from '@/components/ShareableLink'
import ExportButton from '@/components/export/ExportButton'
import { Home, Globe, Eye, Share2, Settings, BarChart3, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ButtonGroup } from '@/components/ui/button-group'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'

type TabType = 'viewports' | 'seo' | 'social' | 'technical'

interface Tab {
  id: TabType
  label: string
  color: string
  variant: 'default' | 'secondary' | 'destructive' | 'outline'
}

const tabConfig = {
  viewports: { label: 'Viewports', icon: Eye },
  seo: { label: 'SEO Analysis', icon: BarChart3 },
  social: { label: 'Social Media', icon: Share2 },
  technical: { label: 'Technical', icon: Settings }
}

export default function NavigationBar() {
  const {
    currentSite,
    selectedTab,
    setSelectedTab,
    fetchMetadata,
    isInitialLoad,
    metadata
  } = useWebsiteViewer()
  const router = useRouter()

  // Don't show navigation if no site is loaded
  if (!currentSite) {
    return null
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

  const tabs: Tab[] = [
    {
      id: 'viewports',
      label: 'Viewports',
      color: 'bg-blue-500 text-white',
      variant: 'default'
    },
    {
      id: 'seo',
      label: 'SEO',
      color: 'bg-green-500 text-white',
      variant: 'secondary'
    },
    {
      id: 'social',
      label: 'Social Media',
      color: 'bg-purple-500 text-white',
      variant: 'outline'
    },
    {
      id: 'technical',
      label: 'Technical',
      color: 'bg-orange-500 text-white',
      variant: 'secondary'
    }
  ]

  // Function to handle tab navigation with URL updates
  const handleTabClick = (tabId: TabType) => {
    setSelectedTab(tabId)

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

  const currentTabConfig = tabConfig[selectedTab as keyof typeof tabConfig]
  const IconComponent = currentTabConfig?.icon

  return (
    <div className="bg-background border-b border-border">
      <div className="py-1.5 px-2 sm:px-4">
        <div className="max-w-[1400px] mx-auto px-2 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-2 sm:gap-3">
          {/* Left: Tabs - Dropdown on mobile, horizontal on desktop */}
          {!isInitialLoad && (
            <>
              {/* Mobile Dropdown */}
              <div className="md:hidden">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-7 gap-1 text-xs">
                      {IconComponent && <IconComponent className="h-3 w-3" />}
                      <span>{currentTabConfig?.label}</span>
                      <ChevronDown className="h-3 w-3 ml-0.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-48">
                    {tabs.map(tab => {
                      const Icon = tabConfig[tab.id].icon
                      return (
                        <DropdownMenuItem
                          key={tab.id}
                          onClick={() => handleTabClick(tab.id)}
                          className={cn(
                            'cursor-pointer gap-2',
                            selectedTab === tab.id && 'bg-accent'
                          )}
                        >
                          <Icon className="h-4 w-4" />
                          <span>{tab.label}</span>
                        </DropdownMenuItem>
                      )
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Desktop Tabs */}
              <ButtonGroup className="hidden md:flex overflow-x-auto">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    className={cn(
                      'px-2 sm:px-2.5 py-1 text-xs transition-all duration-200 shrink-0',
                      selectedTab === tab.id
                        ? 'bg-foreground text-background'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    )}
                    onClick={() => handleTabClick(tab.id)}
                  >
                    {tab.label}
                  </button>
                ))}
              </ButtonGroup>
            </>
          )}

          {/* Right: Export and Share buttons - Only show when metadata is loaded */}
          {metadata && (
            <ButtonGroup>
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
            </ButtonGroup>
          )}
          </div>
        </div>
      </div>
    </div>
  )
}