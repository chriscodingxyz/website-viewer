'use client'

import React, { useState, useEffect } from 'react'
import { WebsiteMetadata } from '@/types/metadata'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  Globe,
  ExternalLink,
  Search,
  FileText,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Link as LinkIcon,
  Calendar,
  Database
} from 'lucide-react'
import { toast } from 'sonner'

interface SiteDiscoveryProps {
  metadata: WebsiteMetadata
  onNavigateToPage?: (url: string) => void
}

interface DiscoveredPage {
  url: string
  source: 'sitemap' | 'robots' | 'internal'
  title?: string
  lastModified?: string
  priority?: number
  changeFreq?: string
  accessible?: boolean
}

export default function SiteDiscovery({ metadata, onNavigateToPage }: SiteDiscoveryProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [discoveredPages, setDiscoveredPages] = useState<DiscoveredPage[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    discoverPages()
  }, [metadata]) // eslint-disable-line react-hooks/exhaustive-deps

  const discoverPages = async () => {
    setLoading(true)
    const pages: DiscoveredPage[] = []

    try {
      // Extract pages from sitemaps
      if (metadata.sitemap?.sitemaps) {
        for (const sitemap of metadata.sitemap.sitemaps) {
          if (sitemap.accessible) {
            try {
              // In a real implementation, you'd fetch and parse the sitemap XML
              // For now, we'll show the sitemap URL itself as a discoverable page
              pages.push({
                url: sitemap.url,
                source: 'sitemap',
                title: `Sitemap (${sitemap.source})`,
                lastModified: sitemap.lastModified,
                accessible: sitemap.accessible
              })
            } catch (error) {
              console.error('Error processing sitemap:', error)
            }
          }
        }
      }

      // Extract pages from robots.txt references
      if (metadata.sitemap?.robotsTxt?.accessible && metadata.sitemap.robotsTxt.content) {
        const robotsContent = metadata.sitemap.robotsTxt.content

        // Look for sitemap URLs in robots.txt
        const sitemapMatches = robotsContent.match(/^Sitemap:\s*(.+)$/gim)
        if (sitemapMatches) {
          sitemapMatches.forEach((match) => {
            const sitemapUrl = match.replace(/^Sitemap:\s*/i, '').trim()
            if (!pages.find(p => p.url === sitemapUrl)) {
              pages.push({
                url: sitemapUrl,
                source: 'robots',
                title: 'Sitemap (from robots.txt)',
                accessible: true
              })
            }
          })
        }

        // Look for disallowed paths (which indicates page existence)
        const disallowMatches = robotsContent.match(/^Disallow:\s*(.+)$/gim)
        if (disallowMatches) {
          const baseUrl = new URL(metadata.url).origin
          disallowMatches.forEach((match) => {
            const path = match.replace(/^Disallow:\s*/i, '').trim()
            if (path && path !== '/' && !path.includes('*')) {
              const fullUrl = new URL(path, baseUrl).toString()
              pages.push({
                url: fullUrl,
                source: 'robots',
                title: `Page (restricted in robots.txt)`,
                accessible: false
              })
            }
          })
        }
      }

      // Add common pages that are likely to exist
      const baseUrl = new URL(metadata.url).origin
      const commonPages = [
        { path: '/', title: 'Homepage' },
        { path: '/about', title: 'About Page' },
        { path: '/contact', title: 'Contact Page' },
        { path: '/privacy', title: 'Privacy Policy' },
        { path: '/terms', title: 'Terms of Service' },
        { path: '/blog', title: 'Blog' },
        { path: '/products', title: 'Products' },
        { path: '/services', title: 'Services' }
      ]

      commonPages.forEach(({ path, title }) => {
        const fullUrl = new URL(path, baseUrl).toString()
        if (!pages.find(p => p.url === fullUrl)) {
          pages.push({
            url: fullUrl,
            source: 'internal',
            title: title,
            accessible: undefined // Unknown, would need to check
          })
        }
      })

      setDiscoveredPages(pages)
    } catch (error) {
      console.error('Error discovering pages:', error)
      toast.error('Failed to discover pages')
    } finally {
      setLoading(false)
    }
  }

  const filteredPages = discoveredPages.filter(page =>
    page.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
    page.title?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const pagesBySource = {
    sitemap: filteredPages.filter(p => p.source === 'sitemap'),
    robots: filteredPages.filter(p => p.source === 'robots'),
    internal: filteredPages.filter(p => p.source === 'internal')
  }

  const handleNavigateToPage = (url: string) => {
    if (onNavigateToPage) {
      onNavigateToPage(url)
    } else {
      window.open(url, '_blank', 'noopener,noreferrer')
      toast.success('Opened page in new tab')
    }
  }

  const getStatusIcon = (accessible?: boolean) => {
    if (accessible === undefined) {
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />
    }
    return accessible ?
      <CheckCircle className="h-4 w-4 text-green-500" /> :
      <XCircle className="h-4 w-4 text-red-500" />
  }

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'sitemap':
        return <FileText className="h-4 w-4 text-blue-500" />
      case 'robots':
        return <FileText className="h-4 w-4 text-purple-500" />
      case 'internal':
        return <LinkIcon className="h-4 w-4 text-gray-500" />
      default:
        return <Globe className="h-4 w-4" />
    }
  }

  const sourceLabels = {
    sitemap: 'Sitemap Pages',
    robots: 'Robots.txt References',
    internal: 'Common Pages'
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Site Discovery
          </CardTitle>
          <Badge variant="outline">
            {discoveredPages.length} pages found
          </Badge>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search pages..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">Discovering pages...</p>
            </div>
          </div>
        ) : discoveredPages.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Globe className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No pages discovered</p>
            <p className="text-xs">Try checking if the site has a sitemap.xml</p>
          </div>
        ) : (
          <Accordion type="multiple" className="w-full" defaultValue={['sitemap', 'robots', 'internal']}>
            {Object.entries(pagesBySource).map(([source, pages]) => {
              if (pages.length === 0) return null

              return (
                <AccordionItem key={source} value={source}>
                  <AccordionTrigger className="text-left">
                    <div className="flex items-center gap-2">
                      {getSourceIcon(source)}
                      <span>{sourceLabels[source as keyof typeof sourceLabels]}</span>
                      <Badge variant="outline" className="ml-auto mr-2">
                        {pages.length}
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <ScrollArea className="h-64">
                      <div className="space-y-2">
                        {pages.map((page, index) => (
                          <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              {getStatusIcon(page.accessible)}
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{page.title || 'Untitled Page'}</p>
                                <p className="text-xs text-muted-foreground truncate">{page.url}</p>
                                {page.lastModified && (
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                    <Calendar className="h-3 w-3" />
                                    {new Date(page.lastModified).toLocaleDateString()}
                                  </div>
                                )}
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleNavigateToPage(page.url)}
                              className="shrink-0"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </AccordionContent>
                </AccordionItem>
              )
            })}
          </Accordion>
        )}
      </CardContent>
    </Card>
  )
}