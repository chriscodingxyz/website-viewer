'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Search01Icon, ArrowRight02Icon } from 'hugeicons-react'
import Link from 'next/link'
import { useWebsiteViewer } from '@/contexts/WebsiteViewerContext'
import { useHistory } from '@/contexts/HistoryContext'
import SectionContainer from './SectionContainer'
import { Kbd } from '@/components/ui/kbd'
import SiteCard from './SiteCard'
import PopularSites from './PopularSites'
import FeatureGrid from './FeatureGrid'
import HowItWorks from './HowItWorks'

export default function WebsiteViewer () {
  const {
    currentSite,
    url,
    setUrl,
    loadSite,
  } = useWebsiteViewer()

  const { history, removeFromHistory } = useHistory()

  const recentSites = [...history].reverse().slice(0, 6)

  if (currentSite) {
    return (
      <div className='min-h-screen bg-background font-sans text-foreground'>
        <main>
          <SectionContainer />
        </main>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-background font-sans text-foreground'>
      <main className='container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl py-16 sm:py-24 space-y-24 sm:space-y-28'>

        {/* Hero — centered, editorial */}
        <section className='text-center max-w-3xl mx-auto'>
          <Link
            href='https://github.com/cherrydub/website-viewer'
            target='_blank'
            className='inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-card text-xs font-medium text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors mb-8'
          >
            Free tool · open source
            <ArrowRight02Icon className='w-3 h-3' />
          </Link>

          <h1 className='text-5xl sm:text-6xl md:text-7xl tracking-tight text-foreground leading-[1.05] mb-6'>
            See your site rendered <span className='font-serif italic font-normal'>everywhere</span> — at once.
          </h1>

          <p className='text-base sm:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed mb-10'>
            Preview any URL across desktop, tablet, and mobile. Audit SEO, social cards, and technical setup. Get a grade your team can act on.
          </p>

          <div className='flex flex-col sm:flex-row gap-2 max-w-xl mx-auto'>
            <div className='relative flex-1 group'>
              <Search01Icon className='absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-foreground transition-colors duration-200 pointer-events-none' />
              <input
                type='text'
                placeholder='Enter URL (e.g. apple.com)'
                className='w-full h-12 pl-11 pr-14 rounded-xl border border-border bg-card focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/30 transition-all duration-200 text-foreground placeholder:text-muted-foreground text-[15px]'
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadSite()}
              />
              <div className='absolute right-3 top-1/2 -translate-y-1/2 hidden sm:block pointer-events-none'>
                <Kbd className='bg-muted/60 text-[10px] text-muted-foreground'>↵</Kbd>
              </div>
            </div>
            <Button
              size='lg'
              className='h-12 px-5 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 transition-all duration-200 rounded-xl gap-2'
              onClick={() => loadSite()}
            >
              Preview site
              <ArrowRight02Icon className='w-3.5 h-3.5' />
            </Button>
          </div>

          <div className='flex items-center justify-center gap-6 mt-6 text-xs text-muted-foreground'>
            <span>No sign-up</span>
            <span className='w-1 h-1 rounded-full bg-muted-foreground/30' />
            <span>Works on localhost</span>
            <span className='w-1 h-1 rounded-full bg-muted-foreground/30' />
            <Link href='/compare' className='hover:text-foreground transition-colors'>
              Compare two sites →
            </Link>
          </div>
        </section>

        {/* Popular sites */}
        <PopularSites />

        {/* Features */}
        <FeatureGrid />

        {/* How it works */}
        <HowItWorks />

        {/* Recent sites */}
        {recentSites.length > 0 && (
          <section className='space-y-6'>
            <div className='flex items-baseline justify-between'>
              <h2 className='text-2xl sm:text-3xl text-foreground tracking-tight'>
                Pick up <span className='font-serif italic'>where you left off</span>.
              </h2>
              <span className='text-xs text-muted-foreground'>{recentSites.length} recent</span>
            </div>
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
              {recentSites.map((siteUrl, index) => (
                <SiteCard
                  key={`${siteUrl}-${index}`}
                  url={siteUrl}
                  onView={() => loadSite(siteUrl)}
                  onRemove={() => removeFromHistory(siteUrl)}
                />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
