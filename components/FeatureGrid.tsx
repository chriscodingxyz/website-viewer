'use client'

import React from 'react'
import { Devices, MagnifyingGlass, ShareNetwork, Shield } from '@phosphor-icons/react'

const FEATURES = [
  {
    icon: Devices,
    title: 'All viewports',
    desc: 'Desktop, tablet, mobile — rendered side-by-side, in parallel.'
  },
  {
    icon: MagnifyingGlass,
    title: 'SEO insights',
    desc: 'Title, meta, robots, sitemap, analytics — all surfaced at once.'
  },
  {
    icon: ShareNetwork,
    title: 'Social previews',
    desc: 'Open Graph and Twitter cards, exactly how they will share.'
  },
  {
    icon: Shield,
    title: 'X-Frame bypass',
    desc: 'Renders sites that block iframes via our built-in proxy.'
  }
]

export default function FeatureGrid () {
  return (
    <section className='space-y-10'>
      <div className='text-center max-w-2xl mx-auto'>
        <p className='text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-3'>
          What you get
        </p>
        <h2 className='text-3xl sm:text-4xl tracking-tight text-foreground'>
          Everything in <span className='font-serif italic'>one</span> shot.
        </h2>
      </div>
      <div className='grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-10 max-w-3xl mx-auto'>
        {FEATURES.map(({ icon: Icon, title, desc }) => (
          <div key={title} className='flex gap-4'>
            <div className='flex-shrink-0 w-9 h-9 rounded-lg border border-border bg-card flex items-center justify-center'>
              <Icon className='w-4 h-4 text-foreground' weight='regular' />
            </div>
            <div className='flex-1'>
              <h3 className='text-sm font-semibold text-foreground mb-1'>{title}</h3>
              <p className='text-sm text-muted-foreground leading-relaxed'>{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
