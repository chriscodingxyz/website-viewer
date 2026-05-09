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
    <section className='space-y-10'>
      <div className='text-center max-w-2xl mx-auto'>
        <p className='text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-3'>
          How it works
        </p>
        <h2 className='text-3xl sm:text-4xl tracking-tight text-foreground'>
          Three steps. <span className='font-serif italic'>That&apos;s it.</span>
        </h2>
      </div>
      <div className='grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto'>
        {STEPS.map(step => (
          <div key={step.num} className='text-center'>
            <p className='font-serif italic text-3xl text-muted-foreground/60 mb-3'>
              {step.num}
            </p>
            <h3 className='text-sm font-semibold text-foreground mb-1'>{step.title}</h3>
            <p className='text-sm text-muted-foreground leading-relaxed'>{step.desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
