'use client'

import React, { useEffect, useState } from 'react'
import { WebsiteMetadata } from '@/types/metadata'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion'
import {
  AlertTriangle,
  Calendar,
  CheckCircle,
  Database,
  ExternalLink,
  FileText,
  Globe,
  Link as LinkIcon,
  Search,
  XCircle
} from 'lucide-react'
import { toast } from 'sonner'
import {
  AuditSection,
  MetadataPill
} from '@/components/metadata/AnalysisPrimitives'

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

export default function SiteDiscovery ({ metadata, onNavigateToPage }: SiteDiscoveryProps) {
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
      if (metadata.sitemap?.sitemaps) {
        for (const sitemap of metadata.sitemap.sitemaps) {
          if (sitemap.accessible) {
            pages.push({
              url: sitemap.url,
              source: 'sitemap',
              title: `Sitemap (${sitemap.source})`,
              lastModified: sitemap.lastModified,
              accessible: sitemap.accessible
            })
          }
        }
      }

      if (metadata.sitemap?.robotsTxt?.accessible && metadata.sitemap.robotsTxt.content) {
        const robotsContent = metadata.sitemap.robotsTxt.content
        const sitemapMatches = robotsContent.match(/^Sitemap:\s*(.+)$/gim)

        if (sitemapMatches) {
          sitemapMatches.forEach(match => {
            const sitemapUrl = match.replace(/^Sitemap:\s*/i, '').trim()
            if (!pages.find(page => page.url === sitemapUrl)) {
              pages.push({
                url: sitemapUrl,
                source: 'robots',
                title: 'Sitemap from robots.txt',
                accessible: true
              })
            }
          })
        }

        const disallowMatches = robotsContent.match(/^Disallow:\s*(.+)$/gim)
        if (disallowMatches) {
          const baseUrl = new URL(metadata.url).origin
          disallowMatches.forEach(match => {
            const path = match.replace(/^Disallow:\s*/i, '').trim()
            if (path && path !== '/' && !path.includes('*')) {
              pages.push({
                url: new URL(path, baseUrl).toString(),
                source: 'robots',
                title: 'Restricted path',
                accessible: false
              })
            }
          })
        }
      }

      const baseUrl = new URL(metadata.url).origin
      const commonPages = [
        { path: '/', title: 'Homepage' },
        { path: '/about', title: 'About' },
        { path: '/contact', title: 'Contact' },
        { path: '/privacy', title: 'Privacy Policy' },
        { path: '/terms', title: 'Terms of Service' },
        { path: '/blog', title: 'Blog' },
        { path: '/products', title: 'Products' },
        { path: '/services', title: 'Services' }
      ]

      commonPages.forEach(({ path, title }) => {
        const fullUrl = new URL(path, baseUrl).toString()
        if (!pages.find(page => page.url === fullUrl)) {
          pages.push({
            url: fullUrl,
            source: 'internal',
            title,
            accessible: undefined
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
    sitemap: filteredPages.filter(page => page.source === 'sitemap'),
    robots: filteredPages.filter(page => page.source === 'robots'),
    internal: filteredPages.filter(page => page.source === 'internal')
  }

  const handleNavigateToPage = (url: string) => {
    if (onNavigateToPage) {
      onNavigateToPage(url)
      return
    }

    window.open(url, '_blank', 'noopener,noreferrer')
    toast.success('Opened page in new tab')
  }

  const getStatusIcon = (accessible?: boolean) => {
    if (accessible === undefined) {
      return <AlertTriangle className='h-3.5 w-3.5 text-amber-600' />
    }

    return accessible
      ? <CheckCircle className='h-3.5 w-3.5 text-emerald-600' />
      : <XCircle className='h-3.5 w-3.5 text-red-600' />
  }

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'sitemap':
        return <FileText className='h-4 w-4 text-muted-foreground' />
      case 'robots':
        return <FileText className='h-4 w-4 text-muted-foreground' />
      case 'internal':
        return <LinkIcon className='h-4 w-4 text-muted-foreground' />
      default:
        return <Globe className='h-4 w-4 text-muted-foreground' />
    }
  }

  const sourceLabels = {
    sitemap: 'Sitemaps',
    robots: 'Robots References',
    internal: 'Common Paths'
  }

  return (
    <AuditSection
      icon={Database}
      title='Site Discovery'
      description='Sitemaps, robots references, and common paths that help reveal site structure.'
      action={<MetadataPill>{filteredPages.length} pages</MetadataPill>}
    >
      <div className='rounded-lg border border-border bg-card p-4 space-y-4'>
        <div className='relative'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
          <Input
            placeholder='Search discovered URLs'
            value={searchTerm}
            onChange={event => setSearchTerm(event.target.value)}
            className='h-10 pl-9 text-sm bg-background'
          />
        </div>

        {loading ? (
          <div className='flex items-center justify-center py-10 text-center'>
            <div>
              <div className='mx-auto mb-3 h-5 w-5 rounded-full border-2 border-foreground border-t-transparent animate-spin' />
              <p className='text-sm text-muted-foreground'>Discovering pages...</p>
            </div>
          </div>
        ) : discoveredPages.length === 0 ? (
          <div className='py-10 text-center text-muted-foreground'>
            <Globe className='h-8 w-8 mx-auto mb-3 opacity-60' />
            <p className='text-sm font-medium text-foreground'>No pages discovered</p>
            <p className='text-sm mt-1'>Try checking whether the site exposes a sitemap.</p>
          </div>
        ) : (
          <Accordion type='multiple' className='w-full'>
            {Object.entries(pagesBySource).map(([source, pages]) => {
              if (pages.length === 0) return null

              return (
                <AccordionItem key={source} value={source} className='border-border'>
                  <AccordionTrigger className='py-3 hover:no-underline'>
                    <div className='flex items-center gap-3 text-left'>
                      {getSourceIcon(source)}
                      <span className='text-sm font-medium text-foreground'>
                        {sourceLabels[source as keyof typeof sourceLabels]}
                      </span>
                      <span className='rounded-md border border-border px-2 py-0.5 text-xs text-muted-foreground'>
                        {pages.length}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <ScrollArea className='h-56 pr-3'>
                      <div className='space-y-2'>
                        {pages.map((page, index) => (
                          <div
                            key={`${page.url}-${index}`}
                            className='flex items-center gap-3 rounded-lg border border-border bg-background p-3 hover:border-foreground/20 transition-colors'
                          >
                            <div className='flex-shrink-0'>
                              {getStatusIcon(page.accessible)}
                            </div>
                            <div className='min-w-0 flex-1'>
                              <p className='text-sm font-medium text-foreground truncate'>
                                {page.title || 'Untitled page'}
                              </p>
                              <p className='text-xs text-muted-foreground truncate mt-0.5'>
                                {page.url}
                              </p>
                              {page.lastModified && (
                                <div className='flex items-center gap-1.5 text-xs text-muted-foreground mt-1.5'>
                                  <Calendar className='h-3 w-3' />
                                  {new Date(page.lastModified).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                            <button
                              onClick={() => handleNavigateToPage(page.url)}
                              className='h-8 w-8 rounded-md border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors'
                              title='Open page'
                            >
                              <ExternalLink className='h-3.5 w-3.5' />
                            </button>
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
      </div>
    </AuditSection>
  )
}
