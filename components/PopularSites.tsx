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
    <section className='text-center'>
      <p className='text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-6'>
        Try a popular site
      </p>
      <div className='flex flex-wrap items-center justify-center gap-x-8 gap-y-3'>
        {POPULAR.map(({ domain, label }) => (
          <button
            key={domain}
            onClick={() => loadSite(domain)}
            className='group inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors'
          >
            <Image
              src={faviconUrl(domain)}
              alt={label}
              width={16}
              height={16}
              className='w-4 h-4 object-contain opacity-70 group-hover:opacity-100 transition-opacity'
            />
            <span>{label}</span>
          </button>
        ))}
      </div>
    </section>
  )
}
