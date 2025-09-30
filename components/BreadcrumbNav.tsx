'use client'

import React from 'react'
import Link from 'next/link'
import { useWebsiteViewer } from '@/contexts/WebsiteViewerContext'
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb'
import ShareableLink from '@/components/ShareableLink'
import { Home, Globe, Eye, Share2, Settings, BarChart3 } from 'lucide-react'

const tabConfig = {
  viewports: { label: 'Viewports', icon: Eye },
  seo: { label: 'SEO Analysis', icon: BarChart3 },
  social: { label: 'Social Media', icon: Share2 },
  technical: { label: 'Technical', icon: Settings }
}

export default function BreadcrumbNav() {
  const { currentSite, selectedTab } = useWebsiteViewer()

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

  const currentTabConfig = tabConfig[selectedTab as keyof typeof tabConfig]
  const IconComponent = currentTabConfig?.icon

  return (
    <div className="border-b bg-muted/30 px-6 py-3">
      <div className="flex items-center justify-between">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/" className="flex items-center gap-1.5">
                  <Home className="h-4 w-4" />
                  Website Viewer
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href={`/viewports?site=${encodeURIComponent(getDomainName(currentSite))}`} className="flex items-center gap-1.5">
                  <Globe className="h-4 w-4" />
                  {getDomainName(currentSite)}
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="flex items-center gap-1.5">
                <IconComponent className="h-4 w-4" />
                {currentTabConfig.label}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <ShareableLink
          currentUrl={currentSite}
          section={selectedTab}
          domainName={getDomainName(currentSite)}
        />
      </div>
    </div>
  )
}