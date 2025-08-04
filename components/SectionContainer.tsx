'use client'

import React, { useState, useEffect, useRef } from 'react'
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
  const { currentSite, metadataLoading, lighthouseLoading } = useWebsiteViewer()

  const [sectionState, setSectionState] = useState<SectionState>({
    viewports: { expanded: true },
    analysis: { expanded: false },
    performance: { expanded: false },
  })

  const prevMetadataLoading = useRef(metadataLoading)
  const prevLighthouseLoading = useRef(lighthouseLoading)

  useEffect(() => {
    // When metadata analysis finishes, open the analysis section
    if (prevMetadataLoading.current && !metadataLoading) {
      setSectionState(prev => ({ ...prev, analysis: { ...prev.analysis, expanded: true } }))
    }
    prevMetadataLoading.current = metadataLoading
  }, [metadataLoading])

  useEffect(() => {
    // When lighthouse analysis finishes, open the performance section
    if (prevLighthouseLoading.current && !lighthouseLoading) {
      setSectionState(prev => ({ ...prev, performance: { ...prev.performance, expanded: true } }))
    }
    prevLighthouseLoading.current = lighthouseLoading
  }, [lighthouseLoading])

  const toggleSection = (sectionKey: keyof SectionState) => {
    setSectionState(prev => {
      const isCurrentlyExpanded = prev[sectionKey].expanded
      
      // If clicking on an already expanded section, collapse it
      if (isCurrentlyExpanded) {
        return {
          ...prev,
          [sectionKey]: { expanded: false }
        }
      }
      
      // Otherwise, collapse all sections and expand only the clicked one
      return {
        viewports: { expanded: sectionKey === 'viewports' },
        analysis: { expanded: sectionKey === 'analysis' },
        performance: { expanded: sectionKey === 'performance' }
      }
    })
  }

  if (!currentSite) {
    return null
  }

  return (
    <div className="w-full">
      <ViewportsSection 
        expanded={sectionState.viewports.expanded}
        onToggle={() => toggleSection('viewports')}
      />
      <AnalysisSection 
        expanded={sectionState.analysis.expanded}
        onToggle={() => toggleSection('analysis')}
      />
      <PerformanceAnalysisSection 
        expanded={sectionState.performance.expanded}
        onToggle={() => toggleSection('performance')}
      />
    </div>
  )
}
