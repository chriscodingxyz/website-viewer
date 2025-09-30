'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Globe,
  Monitor,
  Search,
  MessageSquare,
  Wrench,
  Star,
  Clock,
  ExternalLink,
  BarChart3,
  Smartphone,
  Tablet,
  Share2,
  Download,
  Eye,
  EyeOff,
  Zap,
  PanelLeftClose,
  PanelLeft,
  ChevronDown,
  ChevronRight,
  History,
  Bookmark
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar
} from '@/components/ui/sidebar'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { useWebsiteViewer } from '@/contexts/WebsiteViewerContext'
import { useFavorites } from '@/contexts/FavoritesContext'
import ExportReportModal from '@/components/export/ExportReportModal'
import ShareableLink from '@/components/ShareableLink'
import { useHistory } from '@/contexts/HistoryContext'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export default function WebsiteViewerSidebar() {
  const router = useRouter()
  const { state } = useSidebar()
  const [isQuickAccessOpen, setIsQuickAccessOpen] = React.useState(false)
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)
  const [isSharePopoverOpen, setIsSharePopoverOpen] = useState(false)

  const {
    currentSite,
    selectedTab,
    setSelectedTab,
    loadSite,
    clearSite,
    metadata,
    fetchMetadata,
    views
  } = useWebsiteViewer()

  const { favorites } = useFavorites()
  const { history } = useHistory()

  // Helper to get clean domain name
  const getDomainName = (url: string) => {
    try {
      const domain = new URL(url).hostname
      return domain.replace('www.', '')
    } catch {
      return url
    }
  }

  // Navigation items
  const navigationItems = [
    {
      id: 'viewports' as const,
      label: 'Viewports',
      icon: Monitor,
      description: 'View in different device sizes'
    },
    {
      id: 'seo' as const,
      label: 'SEO Analysis',
      icon: Search,
      description: 'Search engine optimization'
    },
    {
      id: 'social' as const,
      label: 'Social Media',
      icon: MessageSquare,
      description: 'Social media previews'
    },
    {
      id: 'technical' as const,
      label: 'Technical',
      icon: Wrench,
      description: 'Technical details & headers'
    }
  ]

  // Handle navigation
  const handleNavigation = (tabId: typeof selectedTab) => {
    setSelectedTab(tabId)

    // Update URL params without changing the route
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search)
      const siteParam = searchParams.get('site')

      // Stay on the main page, just update query params
      const newPath = `/${siteParam ? `?site=${siteParam}` : ''}`
      router.push(newPath, { scroll: false })
    }

    // If clicking on analysis tabs, trigger metadata extraction
    if ((tabId === 'seo' || tabId === 'social' || tabId === 'technical') && currentSite) {
      fetchMetadata()
    }
  }

  // Handle site loading from sidebar
  const handleLoadSite = (url: string) => {
    loadSite(url)
    toast.success(`Loading ${url}`)
  }

  // Get viewport status counts
  const getViewportStats = () => {
    if (!views.length) return null

    const loaded = views.filter(v => v.iframeStatus === 'loaded').length
    const blocked = views.filter(v => v.iframeStatus === 'blocked').length
    const loading = views.filter(v => v.iframeStatus === 'loading').length

    return { loaded, blocked, loading, total: views.length }
  }

  const viewportStats = getViewportStats()

  // Truncate long URLs for display
  const truncateUrl = (url: string, maxLength: number = 30) => {
    if (url.length <= maxLength) return url
    return url.substring(0, maxLength) + '...'
  }

  return (
    <>
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader className="border-b border-border/50 p-0">
        {state === "collapsed" ? (
          <div className="flex items-center justify-center w-full" style={{ height: '52px' }}>
            <SidebarTrigger className="h-8 w-8 flex-shrink-0" />
          </div>
        ) : (
          <div className="flex items-center gap-2 pl-5 pr-3 py-3" style={{ height: '52px' }}>
            <div className="flex items-center gap-2 flex-1 min-w-0 overflow-hidden">
              <Globe className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              <h2 className="text-xs font-semibold whitespace-nowrap overflow-hidden text-ellipsis">Layout Lab</h2>
            </div>
            <SidebarTrigger className="h-7 w-7 flex-shrink-0" />
          </div>
        )}
      </SidebarHeader>

      <SidebarContent>
        {/* Navigation - Always at top when site is loaded */}
        {currentSite && (
          <SidebarGroup className={cn("py-2", state === "expanded" ? "px-3" : "px-2")}>
            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5">
                {navigationItems.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      onClick={() => handleNavigation(item.id)}
                      isActive={selectedTab === item.id}
                      className={cn(
                        "w-full h-8 rounded-md transition-colors",
                        "hover:bg-accent/60",
                        selectedTab === item.id && "bg-accent font-medium",
                        state === "expanded" ? "px-2 justify-start" : "px-0 justify-center"
                      )}
                      tooltip={state === "collapsed" ? item.description : undefined}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {state === "expanded" && <span className="text-xs">{item.label}</span>}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Tools - Right after analysis when metadata is available */}
        {currentSite && metadata && (
          <SidebarGroup className={cn("py-2", state === "expanded" ? "px-3" : "px-2")}>
            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5">
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => setIsExportModalOpen(true)}
                    className={cn(
                      "w-full h-8 rounded-md transition-colors hover:bg-accent/60",
                      state === "expanded" ? "px-2 justify-start" : "px-0 justify-center"
                    )}
                    tooltip={state === "collapsed" ? "Export data" : undefined}
                  >
                    <Download className="h-4 w-4 shrink-0" />
                    {state === "expanded" && <span className="text-xs">Export Data</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => {
                      // Programmatically trigger the hidden share button
                      const shareButton = document.getElementById('hidden-share-trigger')
                      if (shareButton) {
                        shareButton.click()
                      }
                    }}
                    className={cn(
                      "w-full h-8 rounded-md transition-colors hover:bg-accent/60",
                      state === "expanded" ? "px-2 justify-start" : "px-0 justify-center"
                    )}
                    tooltip={state === "collapsed" ? "Share results" : undefined}
                  >
                    <Share2 className="h-4 w-4 shrink-0" />
                    {state === "expanded" && <span className="text-xs">Share Results</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {currentSite && <SidebarSeparator className="my-2" />}

        {/* Quick Access Accordion - Collapsed by default */}
        <Collapsible
          open={state === "expanded" && isQuickAccessOpen}
          onOpenChange={(open) => {
            if (state === "expanded") {
              setIsQuickAccessOpen(open)
            }
          }}
        >
          <SidebarGroup className="px-3 py-2">
            <CollapsibleTrigger asChild>
              <SidebarGroupLabel className="px-2 cursor-pointer hover:bg-accent/40 rounded-md transition-colors text-xs font-medium" style={{ height: '32px', display: 'flex', alignItems: 'center' }}>
                <div className="flex items-center gap-2 w-full text-muted-foreground/80">
                  <Bookmark className="h-3.5 w-3.5" />
                  {state === "expanded" && (
                    <>
                      <span className="flex-1">Quick Access</span>
                      {isQuickAccessOpen ? (
                        <ChevronDown className="h-3.5 w-3.5 transition-transform" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5 transition-transform" />
                      )}
                    </>
                  )}
                </div>
              </SidebarGroupLabel>
            </CollapsibleTrigger>
            <CollapsibleContent className="group-data-[collapsible=icon]:hidden">
              <SidebarGroupContent>
                {/* Favorites */}
                {favorites.length > 0 && (
                  <div className="space-y-1 mt-2">
                    <div className="px-2 py-1">
                      <div className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground/70">
                        <Star className="h-3 w-3" />
                        Favorites
                      </div>
                    </div>
                    <SidebarMenu className="gap-0.5">
                      {favorites.slice(0, 5).map((fav, index) => (
                        <SidebarMenuItem key={`fav-${index}`}>
                          <SidebarMenuButton
                            onClick={() => handleLoadSite(fav)}
                            className="w-full justify-start pl-6 h-7 rounded-md transition-colors hover:bg-accent/60"
                            size="sm"
                            tooltip={undefined}
                          >
                            <Star className="h-3 w-3 text-amber-500 shrink-0" />
                            {state === "expanded" && (
                              <span className="truncate text-xs">{truncateUrl(fav, 25)}</span>
                            )}
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </div>
                )}

                {/* Recent History */}
                {history.length > 0 && (
                  <div className="space-y-1 mt-3">
                    <div className="px-2 py-1">
                      <div className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground/70">
                        <History className="h-3 w-3" />
                        Recent
                      </div>
                    </div>
                    <SidebarMenu className="gap-0.5">
                      {history.slice(0, 4).map((item, index) => (
                        <SidebarMenuItem key={`history-${index}`}>
                          <SidebarMenuButton
                            onClick={() => handleLoadSite(item)}
                            className="w-full justify-start pl-6 h-7 rounded-md transition-colors hover:bg-accent/60"
                            size="sm"
                            tooltip={undefined}
                          >
                            <Clock className="h-3 w-3 text-slate-400 shrink-0" />
                            {state === "expanded" && (
                              <span className="truncate text-xs">{truncateUrl(item, 25)}</span>
                            )}
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </div>
                )}

                {/* Quick Start - Development Ports */}
                <div className="space-y-1 mt-3">
                  <div className="px-2 py-1">
                    <div className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground/70">
                      <Zap className="h-3 w-3" />
                      Dev Ports
                    </div>
                  </div>
                  <SidebarMenu className="gap-0.5">
                    {['localhost:3000', 'localhost:3001', 'localhost:5173'].map((port, index) => (
                      <SidebarMenuItem key={`port-${index}`}>
                        <SidebarMenuButton
                          onClick={() => handleLoadSite(port)}
                          className="w-full justify-start pl-6 h-7 rounded-md transition-colors hover:bg-accent/60"
                          size="sm"
                          tooltip={undefined}
                        >
                          <Zap className="h-3 w-3 text-emerald-500 shrink-0" />
                          {state === "expanded" && <span className="text-xs font-mono">{port}</span>}
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </div>

                {/* Empty State */}
                {favorites.length === 0 && history.length === 0 && state === "expanded" && (
                  <div className="px-3 py-3 text-center mt-2">
                    <div className="text-xs text-muted-foreground/70 leading-relaxed">
                      <Bookmark className="h-5 w-5 mx-auto mb-2 opacity-30" />
                      <p className="font-medium">No favorites or recent sites yet</p>
                      <p className="mt-1 text-muted-foreground/50 text-[11px]">Use dev ports to get started</p>
                    </div>
                  </div>
                )}
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>
      </SidebarContent>

      {/* Footer - Current Site Status */}
      {currentSite && (
        <SidebarFooter className="border-t border-border/50">
          <SidebarGroup>
            <SidebarGroupContent>
              <div className="px-3 py-3">
                {state === "expanded" ? (
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2 px-1">
                      <div className="flex items-center justify-center w-6 h-6 rounded-md bg-gradient-to-br from-blue-500/10 to-blue-600/10 flex-shrink-0">
                        <Globe className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                      </div>
                      <span className="text-xs font-medium truncate">
                        {truncateUrl(currentSite, 22)}
                      </span>
                    </div>
                    {viewportStats && (
                      <div className="px-2 py-1.5 rounded-md bg-muted/40">
                        <div className="text-[11px] space-y-0.5">
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Loaded:</span>
                            <span className="font-medium text-emerald-600 dark:text-emerald-400 tabular-nums">{viewportStats.loaded}/{viewportStats.total}</span>
                          </div>
                          {viewportStats.blocked > 0 && (
                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">Blocked:</span>
                              <span className="font-medium text-red-600 dark:text-red-400 tabular-nums">{viewportStats.blocked}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        clearSite()
                        router.push('/')
                      }}
                      className="w-full h-7 text-xs font-medium transition-colors hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
                    >
                      <EyeOff className="h-3 w-3 mr-1.5" />
                      Clear Site
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        clearSite()
                        router.push('/')
                      }}
                      className="h-8 w-8 rounded-md transition-colors hover:bg-destructive/10 hover:text-destructive"
                      title="Clear site"
                    >
                      <EyeOff className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarFooter>
      )}
    </Sidebar>

    {/* Export Modal */}
    {metadata && (
      <ExportReportModal
        open={isExportModalOpen}
        onOpenChange={setIsExportModalOpen}
        metadata={metadata}
      />
    )}

    {/* Share Popover - Hidden trigger */}
    {currentSite && metadata && (
      <div className="fixed left-0 top-0 pointer-events-none opacity-0">
        <div id="hidden-share-trigger">
          <ShareableLink
            currentUrl={currentSite}
            section={selectedTab}
            domainName={getDomainName(currentSite)}
          />
        </div>
      </div>
    )}
    </>
  )
}