'use client'

import React from 'react'
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
  useSidebar
} from '@/components/ui/sidebar'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { useWebsiteViewer } from '@/contexts/WebsiteViewerContext'
import { useFavorites } from '@/contexts/FavoritesContext'
import { useHistory } from '@/contexts/HistoryContext'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export default function WebsiteViewerSidebar() {
  const router = useRouter()
  const { state } = useSidebar()
  const [isQuickAccessOpen, setIsQuickAccessOpen] = React.useState(false)
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

    // Update URL to match the section
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search)
      const siteParam = searchParams.get('site')
      const newPath = `/${tabId}${siteParam ? `?site=${siteParam}` : ''}`
      router.push(newPath)
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
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader className="border-b border-border/50">
        <div className="flex items-center justify-center px-2 py-1 group-data-[collapsible=icon]:justify-center">
          <div className="flex items-center gap-2 min-w-0 overflow-hidden group-data-[collapsible=icon]:justify-center">
            <Globe className="h-4 w-4 text-primary flex-shrink-0" />
            {state === "expanded" && (
              <div className="min-w-0 overflow-hidden">
                <h2 className="text-sm font-semibold whitespace-nowrap overflow-hidden text-ellipsis">Website Viewer</h2>
                <p className="text-xs text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis">Layout Lab</p>
              </div>
            )}
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Navigation - Always at top when site is loaded */}
        {currentSite && (
          <SidebarGroup>
            <SidebarGroupLabel>
              <BarChart3 className="h-4 w-4" />
              Analysis
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navigationItems.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      onClick={() => handleNavigation(item.id)}
                      isActive={selectedTab === item.id}
                      className="w-full justify-start"
                      tooltip={state === "collapsed" ? item.description : undefined}
                    >
                      <item.icon className="h-4 w-4" />
                      {state === "expanded" && <span>{item.label}</span>}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Tools - Right after analysis when metadata is available */}
        {currentSite && metadata && (
          <SidebarGroup>
            <SidebarGroupLabel>
              <Download className="h-4 w-4" />
              Tools
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => {
                      // TODO: Implement export functionality
                      toast.info('Export feature coming soon!')
                    }}
                    className="w-full justify-start"
                    tooltip={state === "collapsed" ? "Export data" : undefined}
                  >
                    <Download className="h-4 w-4" />
                    {state === "expanded" && <span>Export Data</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => {
                      // TODO: Implement share functionality
                      toast.info('Share feature coming soon!')
                    }}
                    className="w-full justify-start"
                    tooltip={state === "collapsed" ? "Share results" : undefined}
                  >
                    <Share2 className="h-4 w-4" />
                    {state === "expanded" && <span>Share Results</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {currentSite && <SidebarSeparator />}

        {/* Quick Access Accordion - Collapsed by default */}
        <Collapsible
          open={state === "expanded" && isQuickAccessOpen}
          onOpenChange={(open) => {
            if (state === "expanded") {
              setIsQuickAccessOpen(open)
            }
          }}
        >
          <SidebarGroup>
            <CollapsibleTrigger asChild>
              {state === "collapsed" ? (
                <SidebarMenuButton
                  className="w-full justify-start"
                  tooltip="Quick Access - Favorites, Recent & Dev Ports"
                >
                  <Bookmark className="h-4 w-4" />
                </SidebarMenuButton>
              ) : (
                <SidebarGroupLabel className="cursor-pointer hover:bg-muted/50 rounded-md transition-colors">
                  <div className="flex items-center gap-2 w-full">
                    <Bookmark className="h-4 w-4" />
                    <span className="flex-1">Quick Access</span>
                    {isQuickAccessOpen ? (
                      <ChevronDown className="h-4 w-4 transition-transform" />
                    ) : (
                      <ChevronRight className="h-4 w-4 transition-transform" />
                    )}
                  </div>
                </SidebarGroupLabel>
              )}
            </CollapsibleTrigger>
            <CollapsibleContent className="group-data-[collapsible=icon]:hidden">
              <SidebarGroupContent>
                {/* Favorites */}
                {favorites.length > 0 && (
                  <div className="space-y-1">
                    <div className="px-2 py-1">
                      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                        <Star className="h-3 w-3" />
                        Favorites
                      </div>
                    </div>
                    <SidebarMenu>
                      {favorites.slice(0, 5).map((fav, index) => (
                        <SidebarMenuItem key={`fav-${index}`}>
                          <SidebarMenuButton
                            onClick={() => handleLoadSite(fav)}
                            className="w-full justify-start pl-6"
                            size="sm"
                            tooltip={undefined}
                          >
                            <Star className="h-3 w-3 text-yellow-500" />
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
                      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                        <History className="h-3 w-3" />
                        Recent
                      </div>
                    </div>
                    <SidebarMenu>
                      {history.slice(0, 4).map((item, index) => (
                        <SidebarMenuItem key={`history-${index}`}>
                          <SidebarMenuButton
                            onClick={() => handleLoadSite(item)}
                            className="w-full justify-start pl-6"
                            size="sm"
                            tooltip={undefined}
                          >
                            <Clock className="h-3 w-3 text-slate-400" />
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
                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                      <Zap className="h-3 w-3" />
                      Dev Ports
                    </div>
                  </div>
                  <SidebarMenu>
                    {['localhost:3000', 'localhost:3001', 'localhost:5173'].map((port, index) => (
                      <SidebarMenuItem key={`port-${index}`}>
                        <SidebarMenuButton
                          onClick={() => handleLoadSite(port)}
                          className="w-full justify-start pl-6"
                          size="sm"
                          tooltip={undefined}
                        >
                          <Zap className="h-3 w-3 text-emerald-500" />
                          {state === "expanded" && <span className="text-xs">{port}</span>}
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </div>

                {/* Empty State */}
                {favorites.length === 0 && history.length === 0 && state === "expanded" && (
                  <div className="px-2 py-3 text-center">
                    <div className="text-xs text-muted-foreground">
                      <Bookmark className="h-4 w-4 mx-auto mb-2 opacity-50" />
                      <p>No favorites or recent sites yet.</p>
                      <p className="mt-1">Use dev ports to get started!</p>
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
              <div className="px-2 py-1">
                {state === "expanded" ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium truncate">
                        {truncateUrl(currentSite, 25)}
                      </span>
                    </div>
                    {viewportStats && (
                      <div className="text-xs text-muted-foreground">
                        <div className="flex justify-between">
                          <span>Loaded:</span>
                          <span className="text-green-600">{viewportStats.loaded}/{viewportStats.total}</span>
                        </div>
                        {viewportStats.blocked > 0 && (
                          <div className="flex justify-between">
                            <span>Blocked:</span>
                            <span className="text-red-600">{viewportStats.blocked}</span>
                          </div>
                        )}
                      </div>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        clearSite()
                        router.push('/')
                      }}
                      className="w-full"
                    >
                      <EyeOff className="h-4 w-4 mr-2" />
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
                      className="h-8 w-8"
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
  )
}