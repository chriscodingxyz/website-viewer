'use client'

import React from 'react'
import { Devices, MagnifyingGlass, ShareNetwork, Shield } from '@phosphor-icons/react'

const FEATURES = [
  {
    icon: Devices,
    title: 'All viewports',
    desc: 'Desktop, tablet, mobile rendered side-by-side.',
    tint: 'bg-accent/10 text-accent'
  },
  {
    icon: MagnifyingGlass,
    title: 'SEO insights',
    desc: 'Title, meta, robots, sitemap — surfaced instantly.',
    tint: 'bg-blue-500/10 text-blue-600'
  },
  {
    icon: ShareNetwork,
    title: 'Social previews',
    desc: 'OG and Twitter cards, exactly how they will share.',
    tint: 'bg-violet-500/10 text-violet-600'
  },
  {
    icon: Shield,
    title: 'X-Frame bypass',
    desc: 'Renders sites that block iframes via our proxy.',
    tint: 'bg-emerald-500/10 text-emerald-600'
  }
]

export default function FeatureGrid () {
  return (
    <section className='space-y-4'>
      <div className='flex items-baseline justify-between'>
        <h2 className='text-2xl sm:text-3xl font-black tracking-tight text-foreground'>
          Everything in one shot.
        </h2>
        <span className='text-xs text-muted-foreground hidden sm:inline'>No extension. No sign-up.</span>
      </div>
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3'>
        {FEATURES.map(({ icon: Icon, title, desc, tint }) => (
          <div
            key={title}
            className='group relative bg-card rounded-2xl p-5 border border-border hover:border-foreground/20 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg'
          >
            <div className={`w-11 h-11 rounded-xl ${tint} flex items-center justify-center mb-4`}>
              <Icon className='w-6 h-6' weight='fill' />
            </div>
            <h3 className='font-bold text-base text-foreground mb-1'>{title}</h3>
            <p className='text-sm text-muted-foreground leading-relaxed'>{desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
