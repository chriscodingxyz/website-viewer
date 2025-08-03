'use client'

import React, { useState } from 'react'
import { useWebsiteViewer } from '@/contexts/WebsiteViewerContext'
import ViewportsSection from './sections/ViewportsSection'
import AnalysisSection from './sections/AnalysisSection'

interface SectionState {
  viewports: { expanded: boolean }
  analysis: { expanded: boolean }
}

export default function SectionContainer() {
  const { currentSite } = useWebsiteViewer()
  
  const [sectionState, setSectionState] = useState<SectionState>({
    viewports: { expanded: true }, // Start with viewports expanded
    analysis: { expanded: false }
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
      
      {/* Future Section (Coming Soon) - Full Width */}
      <section className="w-full bg-muted/30 border-b border-border">
        <div className="w-full px-6 py-6">
          <div className="flex items-center justify-between opacity-60">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center text-white">
                ⚡
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-1">Performance Analysis</h2>
                <p className="text-muted-foreground">Core Web Vitals, Lighthouse scores, and performance metrics</p>
              </div>
            </div>
            <div className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded-md border">
              Coming Soon
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}