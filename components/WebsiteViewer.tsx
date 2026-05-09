'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Search01Icon, ArrowRight02Icon } from 'hugeicons-react'
import Link from 'next/link'
import { GitCompareArrows } from 'lucide-react'
import { useWebsiteViewer } from '@/contexts/WebsiteViewerContext'
import { useHistory } from '@/contexts/HistoryContext'
import SectionContainer from './SectionContainer'
import { Kbd } from '@/components/ui/kbd'
import SiteCard from './SiteCard'
import HeroPreview from './HeroPreview'
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
      <div className='min-h-screen bg-background font-sans text-foreground selection:bg-primary/30'>
        <main>
          <SectionContainer />
        </main>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-background font-sans text-foreground selection:bg-primary/30'>
      <main className='container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl py-8 sm:py-12 space-y-16 sm:space-y-20'>

        {/* Hero */}
        <section className='grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center pt-4 sm:pt-8'>
          <div className='lg:col-span-7 relative'>
            <span className='inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold tracking-wide mb-6'>
              <span className='w-1.5 h-1.5 rounded-full bg-accent animate-subtle-pulse' />
              MULTI-VIEWPORT · SEO · SOCIAL
            </span>

            <h1 className='text-5xl sm:text-6xl md:text-7xl font-black tracking-tight text-foreground mb-5 leading-[1.05]'>
              See your site
              <br />
              <span className='relative inline-block'>
                <span className='relative z-10'>everywhere</span>
                <svg
                  className='absolute left-0 -bottom-2 w-full h-3 text-accent/60 z-0'
                  viewBox='0 0 100 10'
                  preserveAspectRatio='none'
                >
                  <path d='M0 5 Q 25 0 50 5 T 100 5' stroke='currentColor' strokeWidth='6' fill='none' strokeLinecap='round' />
                </svg>
              </span>
              {' '}at once.
            </h1>

            <p className='text-lg sm:text-xl text-muted-foreground mb-7 max-w-xl leading-relaxed'>
              Preview any URL across desktop, tablet, and mobile in parallel. Inspect SEO, social cards, and technical metadata — all in one tab.
            </p>

            <div className='flex flex-col sm:flex-row gap-3 max-w-xl'>
              <div className='relative flex-1 group'>
                <Search01Icon className='absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-accent transition-colors duration-200 pointer-events-none' />
                <input
                  type='text'
                  placeholder='Enter URL (e.g. apple.com)'
                  className='w-full h-14 pl-12 pr-16 rounded-2xl border border-border bg-card focus:outline-none focus:ring-4 focus:ring-accent/20 focus:border-accent/60 transition-all duration-200 shadow-sm hover:shadow-md text-foreground placeholder:text-muted-foreground text-base'
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && loadSite()}
                />
                <div className='absolute right-4 top-1/2 -translate-y-1/2 hidden sm:block pointer-events-none'>
                  <Kbd className='bg-muted text-[10px] text-muted-foreground'>↵</Kbd>
                </div>
              </div>
              <Button
                size='lg'
                className='h-14 px-7 font-semibold text-base text-primary-foreground bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-200 rounded-2xl gap-2'
                onClick={() => loadSite()}
              >
                Preview site
                <ArrowRight02Icon className='w-4 h-4' />
              </Button>
            </div>

            <div className='flex flex-wrap items-center gap-x-5 gap-y-2 mt-5 text-xs text-muted-foreground'>
              <span className='flex items-center gap-1.5'>
                <span className='w-1.5 h-1.5 rounded-full bg-emerald-500' />
                No sign-up
              </span>
              <span className='flex items-center gap-1.5'>
                <span className='w-1.5 h-1.5 rounded-full bg-emerald-500' />
                Free forever
              </span>
              <span className='flex items-center gap-1.5'>
                <span className='w-1.5 h-1.5 rounded-full bg-emerald-500' />
                Works on localhost
              </span>
              <span className='flex items-center gap-1.5'>
                <span className='w-1.5 h-1.5 rounded-full bg-emerald-500' />
                Bypasses X-Frame blocks
              </span>
            </div>

            <Link
              href='/compare'
              className='inline-flex items-center gap-2 mt-4 text-sm font-semibold text-foreground hover:text-accent transition-colors group'
            >
              <GitCompareArrows className='w-4 h-4 text-accent' />
              Or compare two sites side-by-side
              <ArrowRight02Icon className='w-4 h-4 transition-transform group-hover:translate-x-0.5' />
            </Link>
          </div>

          <div className='lg:col-span-5 relative'>
            <HeroPreview />
          </div>
        </section>

        {/* Popular sites */}
        <PopularSites />

        {/* Features */}
        <FeatureGrid />

        {/* How it works */}
        <HowItWorks />

        {/* Recent sites — only when history exists */}
        {recentSites.length > 0 && (
          <section className='space-y-4'>
            <div className='flex items-baseline justify-between'>
              <h2 className='text-2xl sm:text-3xl font-black tracking-tight text-foreground'>
                Pick up where you left off.
              </h2>
              <span className='text-xs text-muted-foreground'>{recentSites.length} recent</span>
            </div>
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-stagger'>
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
