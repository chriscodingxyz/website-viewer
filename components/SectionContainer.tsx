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

  // Determine if we should show the logo layout (for SEO, Social, Technical tabs)
  const showLogoLayout =
    selectedTab === 'seo' ||
    selectedTab === 'social' ||
    selectedTab === 'technical'

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
          className={cn(
            'transition-all duration-300 ease-out',
            selectedTab === 'seo'
              ? 'opacity-100 translate-y-0 relative'
              : 'opacity-0 translate-y-2 absolute top-0 left-0 w-full pointer-events-none overflow-hidden'
          )}
          style={selectedTab !== 'seo' ? { height: '1px' } : {}}
        >
          <div className='max-w-[1600px] mx-auto px-4 lg:px-8 py-6'>
            <div className='flex gap-8 lg:gap-16'>
              {/* Sticky Logo - Hidden on mobile */}
              <div className='hidden lg:block flex-shrink-0'>
                <div className='sticky top-1/2 -translate-y-1/2'>
                  {/* Container for favicon */}
                  <div className='flex items-center justify-center relative overflow-hidden'>
                    {/* Dynamic favicon image */}
                    <Image
                      src={faviconError ? '/seoseal.png' : faviconUrl}
                      alt={currentSite ? `${currentSite} favicon` : 'Website Viewer Logo'}
                      width={96}
                      height={96}
                      className={cn(
                        'w-24 h-24 object-contain transition-opacity duration-300',
                        faviconLoaded ? 'opacity-100' : 'opacity-0'
                      )}
                      onLoad={() => setFaviconLoaded(true)}
                      onError={() => {
                        setFaviconError(true)
                        setFaviconLoaded(true)
                      }}
                      priority
                    />

                    {/* Loading skeleton */}
                    {!faviconLoaded && (
                      <div className='absolute flex items-center justify-center'>
                        <div className='w-24 h-24 bg-muted/50 rounded-lg animate-pulse' />
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {/* Content with min-height to prevent logo shift */}
              <div className='flex-1 min-w-0 min-h-[calc(100svh-120px)]'>
                <SEOSection metadata={metadata} loading={metadataLoading} error={metadataError} />
              </div>
            </div>
          </div>
        </div>

        <div
          className={cn(
            'transition-all duration-300 ease-out',
            selectedTab === 'social'
              ? 'opacity-100 translate-y-0 relative'
              : 'opacity-0 translate-y-2 absolute top-0 left-0 w-full pointer-events-none overflow-hidden'
          )}
          style={selectedTab !== 'social' ? { height: '1px' } : {}}
        >
          <div className='max-w-[1600px] mx-auto px-4 lg:px-8 py-6'>
            <div className='flex gap-8 lg:gap-16'>
              {/* Sticky Logo - Hidden on mobile */}
              <div className='hidden lg:block flex-shrink-0'>
                <div className='sticky top-1/2 -translate-y-1/2'>
                  {/* Container for favicon */}
                  <div className='flex items-center justify-center relative overflow-hidden'>
                    {/* Dynamic favicon image */}
                    <Image
                      src={faviconError ? '/seoseal.png' : faviconUrl}
                      alt={currentSite ? `${currentSite} favicon` : 'Website Viewer Logo'}
                      width={96}
                      height={96}
                      className={cn(
                        'w-24 h-24 object-contain transition-opacity duration-300',
                        faviconLoaded ? 'opacity-100' : 'opacity-0'
                      )}
                      onLoad={() => setFaviconLoaded(true)}
                      onError={() => {
                        setFaviconError(true)
                        setFaviconLoaded(true)
                      }}
                      priority
                    />

                    {/* Loading skeleton */}
                    {!faviconLoaded && (
                      <div className='absolute flex items-center justify-center'>
                        <div className='w-24 h-24 bg-muted/50 rounded-lg animate-pulse' />
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {/* Content with min-height to prevent logo shift */}
              <div className='flex-1 min-w-0 min-h-[calc(100svh-120px)]'>
                <SocialPreview metadata={metadata} loading={metadataLoading} error={metadataError} />
              </div>
            </div>
          </div>
        </div>

        <div
          className={cn(
            'transition-all duration-300 ease-out',
            selectedTab === 'technical'
              ? 'opacity-100 translate-y-0 relative'
              : 'opacity-0 translate-y-2 absolute top-0 left-0 w-full pointer-events-none overflow-hidden'
          )}
          style={selectedTab !== 'technical' ? { height: '1px' } : {}}
        >
          <div className='max-w-[1600px] mx-auto px-4 lg:px-8 py-6'>
            <div className='flex gap-8 lg:gap-16'>
              {/* Sticky Logo - Hidden on mobile */}
              <div className='hidden lg:block flex-shrink-0'>
                <div className='sticky top-1/2 -translate-y-1/2'>
                  {/* Container for favicon */}
                  <div className='flex items-center justify-center relative overflow-hidden'>
                    {/* Dynamic favicon image */}
                    <Image
                      src={faviconError ? '/seoseal.png' : faviconUrl}
                      alt={currentSite ? `${currentSite} favicon` : 'Website Viewer Logo'}
                      width={96}
                      height={96}
                      className={cn(
                        'w-24 h-24 object-contain transition-opacity duration-300',
                        faviconLoaded ? 'opacity-100' : 'opacity-0'
                      )}
                      onLoad={() => setFaviconLoaded(true)}
                      onError={() => {
                        setFaviconError(true)
                        setFaviconLoaded(true)
                      }}
                      priority
                    />

                    {/* Loading skeleton */}
                    {!faviconLoaded && (
                      <div className='absolute flex items-center justify-center'>
                        <div className='w-24 h-24 bg-muted/50 rounded-lg animate-pulse' />
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {/* Content with min-height to prevent logo shift */}
              <div className='flex-1 min-w-0 min-h-[calc(100svh-120px)]'>
                <TechnicalSection metadata={metadata} loading={metadataLoading} error={metadataError} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
