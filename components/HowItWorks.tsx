'use client'

import React from 'react'

const STEPS = [
  {
    num: '01',
    title: 'Paste a URL',
    desc: 'Any public site or localhost dev server.'
  },
  {
    num: '02',
    title: 'See it everywhere',
    desc: 'All viewports render in parallel.'
  },
  {
    num: '03',
    title: 'Dig into details',
    desc: 'Open SEO, social, and technical tabs.'
  }
]

export default function HowItWorks () {
  return (
    <section className='space-y-4'>
      <h2 className='text-2xl sm:text-3xl font-black tracking-tight text-foreground'>
        Three steps. That&apos;s it.
      </h2>
      <div className='grid grid-cols-1 md:grid-cols-3 gap-3 relative'>
        {STEPS.map((step, i) => (
          <div
            key={step.num}
            className='relative bg-card border border-border rounded-2xl p-6 overflow-hidden group hover:border-foreground/20 transition-colors'
          >
            <span className='absolute -top-3 -right-2 text-7xl sm:text-8xl font-black text-accent/15 select-none pointer-events-none leading-none'>
              {step.num}
            </span>
            <div className='relative'>
              <div className='inline-flex items-center justify-center w-9 h-9 rounded-full bg-accent text-accent-foreground font-bold text-sm mb-4 shadow-md shadow-accent/30'>
                {i + 1}
              </div>
              <h3 className='font-bold text-lg text-foreground mb-1'>{step.title}</h3>
              <p className='text-sm text-muted-foreground leading-relaxed'>{step.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
