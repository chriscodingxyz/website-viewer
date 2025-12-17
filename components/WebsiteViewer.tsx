'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Globe02Icon, Search01Icon, Briefcase01Icon, Home01Icon, Layout01Icon, UserIcon } from 'hugeicons-react'
import { toast } from 'sonner'
import { useWebsiteViewer } from '@/contexts/WebsiteViewerContext'
import { useHistory } from '@/contexts/HistoryContext'
import SectionContainer from './SectionContainer'
import { Kbd } from '@/components/ui/kbd'
import Image from 'next/image'
import SiteCard from './SiteCard'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export default function WebsiteViewer () {
  const {
    currentSite,
    url,
    setUrl,
    loadSite,
    metadataNeedsManual,
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
            <div className="max-w-2xl mb-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/30 text-accent text-xs font-semibold mb-3">
                <span className="w-2 h-2 rounded-full bg-accent animate-pulse"></span>
                v2.0 Now Available
              </div>

              <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-foreground mb-4 leading-[1.1]">
                Ready to analyze <br/>
                <span className="text-foreground relative">
                    your next site?
                    <svg className="absolute w-full h-3 -bottom-1 left-0 text-primary/20 -z-10" viewBox="0 0 100 10" preserveAspectRatio="none">
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
                    <Search01Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-foreground transition-colors pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Enter website URL (e.g. apple.com)"
                      className="w-full h-10 pl-12 pr-4 rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/30 transition-all shadow-sm text-foreground placeholder:text-muted-foreground"
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
                    className="h-10 px-6 font-semibold text-white bg-foreground hover:bg-foreground/85 shadow-md hover:shadow-lg transition-all duration-200"
                    onClick={() => loadSite()}
                 >
                    Explore now
                 </Button>
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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

        {/* Localhost Metadata Dialog */}
        <Dialog open={metadataNeedsManual} onOpenChange={() => {}}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Enable Live Preview</DialogTitle>
              <DialogDescription>
                To view localhost metadata in production, add this snippet to your local project.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-4">
                <div className="relative bg-muted/50 p-4 rounded-lg border font-mono text-xs sm:text-sm break-all">
                  <Button 
                      variant="ghost" 
                      size="sm" 
                      className="absolute right-2 top-2 h-6 w-6 p-0"
                      onClick={() => {
                        const code = `<script src="${typeof window !== 'undefined' ? window.location.origin : ''}/live-preview.js"></script>`
                        navigator.clipboard.writeText(code)
                        toast.success('Copied to clipboard')
                      }}
                    >
                      <span className="sr-only">Copy</span>
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                  </Button>
                  <span className="text-blue-500">&lt;script</span> <span className="text-purple-500">src</span>=<span className="text-green-500">&quot;{typeof window !== 'undefined' ? window.location.origin : ''}/live-preview.js&quot;</span><span className="text-blue-500">&gt;&lt;/script&gt;</span>
                </div>
            </div>
            <DialogFooter className="sm:justify-start">
              <Button type="button" variant="secondary" onClick={() => window.location.reload()}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}