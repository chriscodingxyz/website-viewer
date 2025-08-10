'use client'

import React from 'react'
import { useWebsiteViewer } from '@/contexts/WebsiteViewerContext'
import ViewportsSection from './sections/ViewportsSection'
import AnalysisSection from './sections/AnalysisSection'
import SEOSection from './metadata/SEOSection'
import SocialPreview from './metadata/SocialPreview'
import TechnicalSection from './metadata/TechnicalSection'
// import PerformanceAnalysisSection from './sections/PerformanceAnalysisSection'

export default function SectionContainer() {
  const { currentSite, metadataLoading, fetchMetadata, metadata, selectedTab } = useWebsiteViewer() // lighthouseLoading


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

  const renderTabContent = () => {
    switch (selectedTab) {
      case 'viewports':
        return <ViewportsSection expanded={true} onToggle={() => {}} />
      case 'seo':
        return (
          <div className="w-full py-6 px-6">
            <SEOSection metadata={metadata} />
          </div>
        )
      case 'social':
        return (
          <div className="w-full py-6 px-6">
            <SocialPreview metadata={metadata} />
          </div>
        )
      case 'technical':
        return (
          <div className="w-full py-6 px-6">
            <TechnicalSection metadata={metadata} />
          </div>
        )
      // case 'performance':
      //   return <PerformanceAnalysisSection expanded={true} onToggle={() => {}} />
      default:
        return <ViewportsSection expanded={true} onToggle={() => {}} />
    }
  }

  return (
    <div className="w-full">
      {/* Tab Content */}
      <div className="w-full">
        {renderTabContent()}
      </div>
    </div>
  )
}
