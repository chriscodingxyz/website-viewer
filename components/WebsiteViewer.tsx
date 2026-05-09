'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Globe02Icon, Search01Icon, Briefcase01Icon, Home01Icon, Layout01Icon, UserIcon } from 'hugeicons-react'
import { useWebsiteViewer } from '@/contexts/WebsiteViewerContext'
import { useHistory } from '@/contexts/HistoryContext'
import SectionContainer from './SectionContainer'
import { Kbd } from '@/components/ui/kbd'
import Image from 'next/image'
import SiteCard from './SiteCard'

export default function WebsiteViewer () {
  const {
    currentSite,
    url,
    setUrl,
    loadSite,
  } = useWebsiteViewer()

  const { history, removeFromHistory } = useHistory()

  // Reverse history to show newest first, take top 6
  const recentSites = [...history].reverse().slice(0, 6)

  return (
    <div className='min-h-screen bg-background font-sans text-foreground selection:bg-primary/30'>

      {/* Main Content Area */}
      <main className=''>
        {!currentSite ? (
          <div className='container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 max-w-7xl'>

            {/* Hero Section */}
            <div className="max-w-2xl mb-10 relative">
              {/* Subtle animated background blobs */}
              <div className="absolute -top-20 -left-20 w-72 h-72 bg-accent/5 rounded-full blur-3xl animate-subtle-pulse pointer-events-none" />
              <div className="absolute -bottom-10 -right-10 w-56 h-56 bg-primary/5 rounded-full blur-3xl animate-subtle-pulse pointer-events-none" style={{ animationDelay: '1.5s' }} />

              <div className="relative">
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-foreground mb-4 leading-[1.1]">
                  Ready to analyze <br/>
                  <span className="text-foreground relative">
                      your next site?
                      <svg className="absolute w-full h-3 -bottom-1 left-0 text-accent/30 -z-10" viewBox="0 0 100 10" preserveAspectRatio="none">
                         <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="8" fill="none" />
                      </svg>
                  </span>
                </h1>

                <p className="text-lg text-muted-foreground mb-6 max-w-lg leading-relaxed">
                  Preview across devices. Analyze SEO, metadata, and social previews. Built for developers who care about the details.
                </p>

                {/* Search Bar */}
                <div className="flex flex-col sm:flex-row gap-3 max-w-xl">
                   <div className="relative flex-1 group z-40">
                      <Search01Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-accent transition-colors duration-200 pointer-events-none" />
                      <input
                        type="text"
                        placeholder="Enter website URL (e.g. apple.com)"
                        className="w-full h-12 pl-12 pr-4 rounded-xl border border-border bg-card/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent/40 transition-all duration-200 shadow-sm hover:shadow-md text-foreground placeholder:text-muted-foreground text-base"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && loadSite()}
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 hidden sm:block pointer-events-none">
                         <Kbd className="bg-muted text-[10px] text-muted-foreground">↵</Kbd>
                      </div>
                   </div>
                   <Button
                      size="sm"
                      className="h-12 px-6 font-semibold text-primary-foreground bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg transition-all duration-200"
                      onClick={() => loadSite()}
                   >
                      Explore now
                   </Button>
                </div>
              </div>
            </div>

            {/* Recent Sites Grid */}
            <div className="space-y-4">
               <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-foreground">Recent sites</h2>
                  {history.length > 0 && (
                     <Button variant="link" className="text-xs text-muted-foreground hover:text-foreground">
                        View all history
                     </Button>
                  )}
               </div>

               {recentSites.length === 0 ? (
                  <div className="bg-muted/30 border border-dashed border-border rounded-xl p-8 text-center">
                     <div className="w-12 h-12 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-2">
                        <Globe02Icon className="w-6 h-6 text-muted-foreground/50" />
                     </div>
                     <h3 className="font-semibold text-sm mb-1">No history yet</h3>
                     <p className="text-xs text-muted-foreground">URL searches will appear here for quick access.</p>
                  </div>
               ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-stagger">
                     {recentSites.map((siteUrl, index) => (
                        <SiteCard
                           key={`${siteUrl}-${index}`}
                           url={siteUrl}
                           onView={() => loadSite(siteUrl)}
                           onRemove={() => removeFromHistory(siteUrl)}
                        />
                     ))}
                  </div>
               )}
            </div>

          </div>
        ) : (
          /* Viewer Mode */
          <SectionContainer />
        )}

      </main>
    </div>
  )
}