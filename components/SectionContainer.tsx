'use client'

import React from 'react'
import { useWebsiteViewer } from '@/contexts/WebsiteViewerContext'
import ViewportsSection from './sections/ViewportsSection'
import AnalysisSection from './sections/AnalysisSection'
import SEOSection from './metadata/SEOSection'
import SocialPreview from './metadata/SocialPreview'
import TechnicalSection from './metadata/TechnicalSection'

export default function SectionContainer() {
  const { currentSite, metadata, selectedTab } = useWebsiteViewer()


  // Removed automatic tab switching - let users stay on their chosen tab
  // const prevMetadataLoading = useRef(metadataLoading)
  // const prevLighthouseLoading = useRef(lighthouseLoading)

  // useEffect(() => {
  //   // When metadata analysis finishes, switch to SEO/technical tab
  //   if (prevMetadataLoading.current && !metadataLoading) {
  //     setSelectedTab('seo')
  //   }
  //   prevMetadataLoading.current = metadataLoading
  // }, [metadataLoading])

  // useEffect(() => {
  //   // When lighthouse analysis finishes, switch to performance tab
  //   if (prevLighthouseLoading.current && !lighthouseLoading) {
  //     setSelectedTab('performance')
  //   }
  //   prevLighthouseLoading.current = lighthouseLoading
  // }, [lighthouseLoading])

  if (!currentSite) {
    return null
  }

  return (
    <div className="w-full">
      {/* Tab Content - Keep all tabs mounted but show/hide with absolute positioning to avoid display:none issues */}
      <div className="w-full relative">
        <div className={selectedTab === 'viewports' ? 'block' : 'absolute top-0 left-0 w-full opacity-0 pointer-events-none overflow-hidden'} style={selectedTab !== 'viewports' ? {height: '1px'} : {}}>
          <ViewportsSection expanded={true} onToggle={() => {}} />
        </div>
        <div className={selectedTab === 'seo' ? 'block' : 'absolute top-0 left-0 w-full opacity-0 pointer-events-none overflow-hidden'} style={selectedTab !== 'seo' ? {height: '1px'} : {}}>
          <div className="w-full py-6 px-6">
            <SEOSection metadata={metadata} />
          </div>
        </div>
        <div className={selectedTab === 'social' ? 'block' : 'absolute top-0 left-0 w-full opacity-0 pointer-events-none overflow-hidden'} style={selectedTab !== 'social' ? {height: '1px'} : {}}>
          <div className="w-full py-6 px-6">
            <SocialPreview metadata={metadata} />
          </div>
        </div>
        <div className={selectedTab === 'technical' ? 'block' : 'absolute top-0 left-0 w-full opacity-0 pointer-events-none overflow-hidden'} style={selectedTab !== 'technical' ? {height: '1px'} : {}}>
          <div className="w-full py-6 px-6">
            <TechnicalSection metadata={metadata} />
          </div>
        </div>
      </div>
    </div>
  )
}
