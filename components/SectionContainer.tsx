'use client'

import React, { useState, useEffect } from 'react'
import { useWebsiteViewer } from '@/contexts/WebsiteViewerContext'
import ViewportsSection from './sections/ViewportsSection'
import AnalysisSection from './sections/AnalysisSection'
import SEOSection from './metadata/SEOSection'
import SocialPreview from './metadata/SocialPreview'
import TechnicalSection from './metadata/TechnicalSection'
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
      {/* Tab Content - Keep all tabs mounted but show/hide with absolute positioning to avoid display:none issues */}
      <div className='w-full relative'>
        <div
          className={
            selectedTab === 'viewports'
              ? 'block'
              : 'absolute top-0 left-0 w-full opacity-0 pointer-events-none overflow-hidden'
          }
          style={selectedTab !== 'viewports' ? { height: '1px' } : {}}
        >
          <ViewportsSection expanded={true} onToggle={() => {}} />
        </div>

        {/* SEO, Social, Technical - With Logo Layout */}
        <div
          className={
            selectedTab === 'seo'
              ? 'block'
              : 'absolute top-0 left-0 w-full opacity-0 pointer-events-none overflow-hidden'
          }
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
          className={
            selectedTab === 'social'
              ? 'block'
              : 'absolute top-0 left-0 w-full opacity-0 pointer-events-none overflow-hidden'
          }
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
          className={
            selectedTab === 'technical'
              ? 'block'
              : 'absolute top-0 left-0 w-full opacity-0 pointer-events-none overflow-hidden'
          }
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
