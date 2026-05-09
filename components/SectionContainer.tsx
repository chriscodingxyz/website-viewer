'use client'

import React, { useState, useEffect } from 'react'
import { useWebsiteViewer } from '@/contexts/WebsiteViewerContext'
import ViewportsSection from './sections/ViewportsSection'
import AnalysisSection from './sections/AnalysisSection'
import SEOSection from './metadata/SEOSection'
import SocialPreview from './metadata/SocialPreview'
import TechnicalSection from './metadata/TechnicalSection'
import ReportSummary from './metadata/ReportSummary'
import Image from 'next/image'
import { getBestFavicon } from '@/lib/favicon'
import { cn } from '@/lib/utils'

export default function SectionContainer () {
  const { currentSite, metadata, metadataLoading, metadataError, selectedTab } = useWebsiteViewer()
  const [faviconError, setFaviconError] = useState(false)
  const [faviconLoaded, setFaviconLoaded] = useState(false)

  // Reset favicon state when site changes
  useEffect(() => {
    setFaviconError(false)
    setFaviconLoaded(false)
  }, [currentSite])

  if (!currentSite) {
    return null
  }

  // Generate favicon URL
  const faviconUrl = currentSite
    ? getBestFavicon(currentSite, metadata)
    : '/seoseal.png'

  const hostname = (() => {
    try {
      return new URL(currentSite).hostname.replace(/^www\./, '')
    } catch {
      return currentSite
    }
  })()

  const AnalysisShell = ({
    eyebrow,
    title,
    description,
    children
  }: {
    eyebrow: string
    title: string
    description: string
    children: React.ReactNode
  }) => (
    <div className='max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10'>
      <div className='grid grid-cols-1 lg:grid-cols-[164px_minmax(0,1fr)] xl:grid-cols-[188px_minmax(0,1fr)] gap-8 xl:gap-12'>
        <aside className='hidden lg:block'>
          <div className='sticky top-28 rounded-lg border border-border bg-card p-4 text-center'>
            <div className='relative mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-lg border border-border bg-background overflow-hidden'>
              <Image
                src={faviconError ? '/seoseal.png' : faviconUrl}
                alt={`${hostname} favicon`}
                width={64}
                height={64}
                className={cn(
                  'h-10 w-10 object-contain transition-opacity duration-300',
                  faviconLoaded ? 'opacity-100' : 'opacity-0'
                )}
                onLoad={() => setFaviconLoaded(true)}
                onError={() => {
                  setFaviconError(true)
                  setFaviconLoaded(true)
                }}
                priority
              />
              {!faviconLoaded && (
                <div className='absolute h-10 w-10 rounded-md bg-muted animate-pulse' />
              )}
            </div>
            <p className='text-sm font-semibold text-foreground truncate' title={hostname}>
              {hostname}
            </p>
            <p className='mt-1 text-xs text-muted-foreground'>{eyebrow}</p>
          </div>
        </aside>

        <div className='min-w-0 min-h-[calc(100svh-150px)]'>
          <div className='mb-8 max-w-3xl'>
            <p className='text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-3'>
              {eyebrow}
            </p>
            <h1 className='text-3xl sm:text-4xl tracking-tight text-foreground leading-tight'>
              {title}
            </h1>
            <p className='mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed'>
              {description}
            </p>
          </div>
          {children}
        </div>
      </div>
    </div>
  )

  return (
    <div className='w-full'>
      {selectedTab !== 'viewports' && <ReportSummary />}
      {/* Tab Content - Smooth transitions between tabs */}
      <div className='w-full relative'>
        {/*
          Viewports are mounted full-size always so iframes (and the videos
          inside them) start fetching the moment a site is analyzed, not when
          the user opens this tab. When inactive we move the container off
          the visual page with `left: -100vw` and mark it inert — the iframes
          stay rendered at real size, so the browser preloads media.
        */}
        <div
          aria-hidden={selectedTab !== 'viewports'}
          className={cn(
            'transition-opacity duration-300 ease-out',
            selectedTab === 'viewports'
              ? 'opacity-100 relative'
              : 'opacity-0 fixed top-0 pointer-events-none'
          )}
          style={selectedTab !== 'viewports'
            ? { left: '-100vw', width: '100vw', visibility: 'hidden' }
            : {}}
        >
          <ViewportsSection expanded={true} onToggle={() => {}} />
        </div>

        {/* SEO, Social, Technical - With Logo Layout */}
        <div
          aria-hidden={selectedTab !== 'seo'}
          className={cn(
            'transition-all duration-300 ease-out',
            selectedTab === 'seo'
              ? 'opacity-100 translate-y-0 relative'
              : 'opacity-0 translate-y-2 absolute top-0 left-0 w-full pointer-events-none overflow-hidden'
          )}
          style={selectedTab !== 'seo' ? { height: '1px' } : {}}
        >
          <AnalysisShell
            eyebrow='SEO analysis'
            title='Search essentials'
            description='A focused audit of titles, descriptions, crawling signals, brand cues, and discovery files.'
          >
            <SEOSection metadata={metadata} loading={metadataLoading} error={metadataError} />
          </AnalysisShell>
        </div>

        <div
          aria-hidden={selectedTab !== 'social'}
          className={cn(
            'transition-all duration-300 ease-out',
            selectedTab === 'social'
              ? 'opacity-100 translate-y-0 relative'
              : 'opacity-0 translate-y-2 absolute top-0 left-0 w-full pointer-events-none overflow-hidden'
          )}
          style={selectedTab !== 'social' ? { height: '1px' } : {}}
        >
          <AnalysisShell
            eyebrow='Social preview'
            title='Share metadata'
            description='Open Graph and Twitter card coverage, shown through calm preview surfaces that use the page metadata directly.'
          >
            <SocialPreview metadata={metadata} loading={metadataLoading} error={metadataError} />
          </AnalysisShell>
        </div>

        <div
          aria-hidden={selectedTab !== 'technical'}
          className={cn(
            'transition-all duration-300 ease-out',
            selectedTab === 'technical'
              ? 'opacity-100 translate-y-0 relative'
              : 'opacity-0 translate-y-2 absolute top-0 left-0 w-full pointer-events-none overflow-hidden'
          )}
          style={selectedTab !== 'technical' ? { height: '1px' } : {}}
        >
          <AnalysisShell
            eyebrow='Technical audit'
            title='Headers and implementation'
            description='Security headers, response behavior, document setup, structured data, and discoverable URLs.'
          >
            <TechnicalSection metadata={metadata} loading={metadataLoading} error={metadataError} />
          </AnalysisShell>
        </div>
      </div>
    </div>
  )
}
