'use client'

import React from 'react'
import { useWebsiteViewer } from '@/contexts/WebsiteViewerContext'
import ViewportsSection from './sections/ViewportsSection'
import AnalysisSection from './sections/AnalysisSection'
import SEOSection from './metadata/SEOSection'
import SocialPreview from './metadata/SocialPreview'
import TechnicalSection from './metadata/TechnicalSection'
import Image from 'next/image'

export default function SectionContainer () {
  const { currentSite, metadata, selectedTab } = useWebsiteViewer()

  if (!currentSite) {
    return null
  }

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
              <div className='hidden lg:block flex-shrink-0 w-64 xl:w-80'>
                <div className='sticky top-1/2 -translate-y-1/2'>
                  <Image
                    src='/seoseal.png'
                    alt='Website Viewer Logo'
                    width={320}
                    height={320}
                    className='w-full h-auto'
                  />
                </div>
              </div>
              {/* Content with min-height to prevent logo shift */}
              <div className='flex-1 min-w-0 min-h-[calc(100svh-120px)]'>
                <SEOSection metadata={metadata} />
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
              <div className='hidden lg:block flex-shrink-0 w-64 xl:w-80'>
                <div className='sticky top-1/2 -translate-y-1/2'>
                  <Image
                    src='/seoseal.png'
                    alt='Website Viewer Logo'
                    width={320}
                    height={320}
                    className='w-full h-auto'
                  />
                </div>
              </div>
              {/* Content with min-height to prevent logo shift */}
              <div className='flex-1 min-w-0 min-h-[calc(100svh-120px)]'>
                <SocialPreview metadata={metadata} />
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
              <div className='hidden lg:block flex-shrink-0 w-64 xl:w-80'>
                <div className='sticky top-1/2 -translate-y-1/2'>
                  <Image
                    src='/seoseal.png'
                    alt='Website Viewer Logo'
                    width={320}
                    height={320}
                    className='w-full h-auto'
                  />
                </div>
              </div>
              {/* Content with min-height to prevent logo shift */}
              <div className='flex-1 min-w-0 min-h-[calc(100svh-120px)]'>
                <TechnicalSection metadata={metadata} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
