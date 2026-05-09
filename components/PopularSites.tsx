'use client'

import React from 'react'
import Image from 'next/image'
import { useWebsiteViewer } from '@/contexts/WebsiteViewerContext'

const POPULAR = [
  { domain: 'apple.com', label: 'Apple' },
  { domain: 'stripe.com', label: 'Stripe' },
  { domain: 'vercel.com', label: 'Vercel' },
  { domain: 'github.com', label: 'GitHub' },
  { domain: 'linear.app', label: 'Linear' },
  { domain: 'notion.so', label: 'Notion' }
]

const faviconUrl = (domain: string) =>
  `https://www.google.com/s2/favicons?domain=${domain}&sz=64`

export default function PopularSites () {
  const { loadSite } = useWebsiteViewer()

  return (
    <section className='space-y-3'>
      <div className='flex items-baseline gap-3'>
        <h2 className='text-sm font-semibold text-muted-foreground uppercase tracking-wider'>
          Try a popular site
        </h2>
        <span className='text-xs text-muted-foreground/60'>or paste your own above</span>
      </div>
      <div className='flex flex-wrap gap-2'>
        {POPULAR.map(({ domain, label }) => (
          <button
            key={domain}
            onClick={() => loadSite(domain)}
            className='group flex items-center gap-2 h-10 pl-2 pr-4 rounded-full bg-card border border-border hover:border-accent/60 hover:bg-accent/5 transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-0.5'
          >
            <span className='w-6 h-6 rounded-full bg-muted/60 flex items-center justify-center overflow-hidden flex-shrink-0'>
              <Image
                src={faviconUrl(domain)}
                alt={label}
                width={24}
                height={24}
                className='w-5 h-5 object-contain'
              />
            </span>
            <span className='text-sm font-medium text-foreground'>{label}</span>
            <span className='text-xs text-muted-foreground hidden sm:inline'>{domain}</span>
          </button>
        ))}
      </div>
    </section>
  )
}
