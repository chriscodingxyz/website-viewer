'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Globe,
  Monitor,
  Search,
  MessageSquare,
  Settings,
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
      icon: Settings,
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
      <SidebarHeader className="border-b border-border/40 p-0">
        <div className="flex items-center gap-2 px-2 py-2" style={{ height: '60px' }}>
          {state === "collapsed" ? (
            <div className="flex items-center justify-center w-full">
              <SidebarTrigger className="h-9 w-9 flex-shrink-0" />
            </div>
          ) : (
            <>
              <SidebarTrigger className="h-9 w-9 flex-shrink-0" />
              <Globe className="h-5 w-5 text-primary flex-shrink-0" />
              <div className="flex-1 min-w-0 overflow-hidden">
                <h2 className="text-sm font-semibold tracking-tight whitespace-nowrap overflow-hidden text-ellipsis">Website Viewer</h2>
                <p className="text-[11px] text-muted-foreground/70 font-medium whitespace-nowrap overflow-hidden text-ellipsis tracking-wide">Layout Lab</p>
              </div>
            </>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Navigation - Always at top when site is loaded */}
        {currentSite && (
          <SidebarGroup className="px-2">
            <SidebarGroupLabel className="px-2 text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ height: '28px', display: 'flex', alignItems: 'center' }}>
              <BarChart3 className="h-3.5 w-3.5" />
              {state === "expanded" && <span className="text-muted-foreground/60">Analysis</span>}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5">
                {navigationItems.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      onClick={() => handleNavigation(item.id)}
                      isActive={selectedTab === item.id}
                      className={cn(
                        "w-full justify-start h-9 px-2.5 rounded-md transition-all duration-200",
                        "hover:bg-accent/50 active:scale-[0.98]",
                        selectedTab === item.id && "bg-accent font-medium shadow-sm"
                      )}
                      tooltip={state === "collapsed" ? item.description : undefined}
                    >
                      <item.icon className="h-[18px] w-[18px] shrink-0" />
                      {state === "expanded" && <span className="text-[13px] tracking-tight">{item.label}</span>}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Tools - Right after analysis when metadata is available */}
        {currentSite && metadata && (
          <SidebarGroup className="px-2">
            <SidebarGroupLabel className="px-2 text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ height: '28px', display: 'flex', alignItems: 'center' }}>
              <Download className="h-3.5 w-3.5" />
              {state === "expanded" && <span className="text-muted-foreground/60">Tools</span>}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5">
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => setIsExportModalOpen(true)}
                    className="w-full justify-start h-9 px-2.5 rounded-md transition-all duration-200 hover:bg-accent/50 active:scale-[0.98]"
                    tooltip={state === "collapsed" ? "Export data" : undefined}
                  >
                    <Download className="h-[18px] w-[18px] shrink-0" />
                    {state === "expanded" && <span className="text-[13px] tracking-tight">Export Data</span>}
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
                    className="w-full justify-start h-9 px-2.5 rounded-md transition-all duration-200 hover:bg-accent/50 active:scale-[0.98]"
                    tooltip={state === "collapsed" ? "Share results" : undefined}
                  >
                    <Share2 className="h-[18px] w-[18px] shrink-0" />
                    {state === "expanded" && <span className="text-[13px] tracking-tight">Share Results</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {currentSite && <SidebarSeparator className="my-3" />}

        {/* Quick Access Accordion - Collapsed by default */}
        <Collapsible
          open={state === "expanded" && isQuickAccessOpen}
          onOpenChange={(open) => {
            if (state === "expanded") {
              setIsQuickAccessOpen(open)
            }
          }}
        >
          <SidebarGroup className="px-2">
            <CollapsibleTrigger asChild>
              <SidebarGroupLabel className="px-2 cursor-pointer hover:bg-accent/30 rounded-md transition-all duration-200 text-[11px] font-semibold uppercase tracking-wider" style={{ height: '36px', display: 'flex', alignItems: 'center' }}>
                {state === "collapsed" ? (
                  <Bookmark className="h-[18px] w-[18px]" />
                ) : (
                  <div className="flex items-center gap-2 w-full text-muted-foreground/60">
                    <Bookmark className="h-3.5 w-3.5" />
                    <span className="flex-1">Quick Access</span>
                    {isQuickAccessOpen ? (
                      <ChevronDown className="h-3.5 w-3.5 transition-transform duration-200" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 transition-transform duration-200" />
                    )}
                  </div>
                )}
              </SidebarGroupLabel>
            </CollapsibleTrigger>
            <CollapsibleContent className="group-data-[collapsible=icon]:hidden">
              <SidebarGroupContent>
                {/* Favorites */}
                {favorites.length > 0 && (
                  <div className="space-y-1 mt-2">
                    <div className="px-2 py-1.5">
                      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/50">
                        <Star className="h-3 w-3" />
                        Favorites
                      </div>
                    </div>
                    <SidebarMenu className="gap-0.5">
                      {favorites.slice(0, 5).map((fav, index) => (
                        <SidebarMenuItem key={`fav-${index}`}>
                          <SidebarMenuButton
                            onClick={() => handleLoadSite(fav)}
                            className="w-full justify-start pl-7 h-8 rounded-md transition-all duration-200 hover:bg-accent/50 active:scale-[0.98]"
                            size="sm"
                            tooltip={undefined}
                          >
                            <Star className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                            {state === "expanded" && (
                              <span className="truncate text-[12px] tracking-tight">{truncateUrl(fav, 25)}</span>
                            )}
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </div>
                )}

                {/* Recent History */}
                {history.length > 0 && (
                  <div className="space-y-1 mt-4">
                    <div className="px-2 py-1.5">
                      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/50">
                        <History className="h-3 w-3" />
                        Recent
                      </div>
                    </div>
                    <SidebarMenu className="gap-0.5">
                      {history.slice(0, 4).map((item, index) => (
                        <SidebarMenuItem key={`history-${index}`}>
                          <SidebarMenuButton
                            onClick={() => handleLoadSite(item)}
                            className="w-full justify-start pl-7 h-8 rounded-md transition-all duration-200 hover:bg-accent/50 active:scale-[0.98]"
                            size="sm"
                            tooltip={undefined}
                          >
                            <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            {state === "expanded" && (
                              <span className="truncate text-[12px] tracking-tight">{truncateUrl(item, 25)}</span>
                            )}
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </div>
                )}

                {/* Quick Start - Development Ports */}
                <div className="space-y-1 mt-4">
                  <div className="px-2 py-1.5">
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/50">
                      <Zap className="h-3 w-3" />
                      Dev Ports
                    </div>
                  </div>
                  <SidebarMenu className="gap-0.5">
                    {['localhost:3000', 'localhost:3001', 'localhost:5173'].map((port, index) => (
                      <SidebarMenuItem key={`port-${index}`}>
                        <SidebarMenuButton
                          onClick={() => handleLoadSite(port)}
                          className="w-full justify-start pl-7 h-8 rounded-md transition-all duration-200 hover:bg-accent/50 active:scale-[0.98]"
                          size="sm"
                          tooltip={undefined}
                        >
                          <Zap className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                          {state === "expanded" && <span className="text-[12px] tracking-tight font-mono">{port}</span>}
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </div>

                {/* Empty State */}
                {favorites.length === 0 && history.length === 0 && state === "expanded" && (
                  <div className="px-3 py-4 text-center mt-2">
                    <div className="text-[11px] text-muted-foreground/70 leading-relaxed">
                      <Bookmark className="h-5 w-5 mx-auto mb-3 opacity-40" />
                      <p className="font-medium">No favorites or recent sites yet.</p>
                      <p className="mt-1.5 text-muted-foreground/50">Use dev ports to get started!</p>
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
        <SidebarFooter className="border-t border-border/40">
          <SidebarGroup>
            <SidebarGroupContent>
              <div className="px-2 py-3">
                {state === "expanded" ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2.5 px-1">
                      <div className="flex items-center justify-center w-7 h-7 rounded-md bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 flex-shrink-0">
                        <Globe className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <span className="text-[13px] font-medium truncate tracking-tight">
                        {truncateUrl(currentSite, 22)}
                      </span>
                    </div>
                    {viewportStats && (
                      <div className="px-1 py-2 rounded-md bg-muted/30">
                        <div className="text-[11px] space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground font-medium">Loaded:</span>
                            <span className="font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">{viewportStats.loaded}/{viewportStats.total}</span>
                          </div>
                          {viewportStats.blocked > 0 && (
                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground font-medium">Blocked:</span>
                              <span className="font-semibold text-red-600 dark:text-red-400 tabular-nums">{viewportStats.blocked}</span>
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
                      className="w-full h-8 text-[12px] font-medium tracking-tight transition-all duration-200 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
                    >
                      <EyeOff className="h-3.5 w-3.5 mr-1.5" />
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
                      className="h-9 w-9 rounded-md transition-all duration-200 hover:bg-destructive/10 hover:text-destructive"
                      title="Clear site"
                    >
                      <EyeOff className="h-[18px] w-[18px]" />
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