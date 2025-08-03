'use client'

import React, { useState } from 'react'
import { useWebsiteViewer } from '@/contexts/WebsiteViewerContext'
import ViewportsSection from './sections/ViewportsSection'
import AnalysisSection from './sections/AnalysisSection'
import PerformanceAnalysisSection from './sections/PerformanceAnalysisSection'

interface SectionState {
  viewports: { expanded: boolean }
  analysis: { expanded: boolean }
  performance: { expanded: boolean }
}

export default function SectionContainer() {
  const { currentSite } = useWebsiteViewer()
  
  const [sectionState, setSectionState] = useState<SectionState>({
    viewports: { expanded: true }, // Start with viewports expanded
    analysis: { expanded: false },
    performance: { expanded: false }
  })

  const toggleSection = (sectionKey: keyof SectionState) => {
    setSectionState(prev => ({
      ...prev,
      [sectionKey]: {
        ...prev[sectionKey],
        expanded: !prev[sectionKey].expanded
      }
    }))
  }

  if (!currentSite) {
    return null
  }

  return (
    <div className="w-full">
      {/* Viewports Section - Full Width */}
      <ViewportsSection 
        expanded={sectionState.viewports.expanded}
        onToggle={() => toggleSection('viewports')}
      />
      
      {/* Analysis Section - Full Width */}
      <AnalysisSection 
        expanded={sectionState.analysis.expanded}
        onToggle={() => toggleSection('analysis')}
      />
      
      {/* Performance Analysis Section - Full Width */}
      <PerformanceAnalysisSection 
        expanded={sectionState.performance.expanded}
        onToggle={() => toggleSection('performance')}
      />
    </div>
  )
}