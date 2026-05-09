'use client'

import React from 'react'

function DeviceFrame ({
  className,
  barColor = 'bg-muted',
  gradient,
  style
}: {
  className?: string
  barColor?: string
  gradient: string
  style?: React.CSSProperties
}) {
  return (
    <div
      className={`rounded-2xl border border-border bg-card shadow-xl overflow-hidden ${className || ''}`}
      style={style}
    >
      <div className={`flex items-center gap-1.5 px-3 py-2 border-b border-border/60 ${barColor}`}>
        <span className='w-2 h-2 rounded-full bg-red-400/70' />
        <span className='w-2 h-2 rounded-full bg-yellow-400/70' />
        <span className='w-2 h-2 rounded-full bg-green-400/70' />
        <div className='ml-2 flex-1 h-3 rounded-full bg-background/70' />
      </div>
      <div className={`relative w-full h-full ${gradient}`}>
        <div className='absolute top-3 left-3 right-3 h-2 rounded-full bg-white/30' />
        <div className='absolute top-7 left-3 w-1/2 h-2 rounded-full bg-white/20' />
        <div className='absolute bottom-6 left-3 right-3 h-12 rounded-lg bg-white/15' />
        <div className='absolute bottom-3 left-3 w-1/3 h-2 rounded-full bg-white/20' />
      </div>
    </div>
  )
}

export default function HeroPreview () {
  return (
    <div className='relative w-full aspect-[4/3] sm:aspect-[5/4] lg:aspect-square'>
      <div className='absolute -top-10 -left-10 w-72 h-72 bg-accent/15 rounded-full blur-3xl pointer-events-none animate-subtle-pulse' />
      <div
        className='absolute -bottom-10 -right-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl pointer-events-none animate-subtle-pulse'
        style={{ animationDelay: '1.5s' }}
      />

      {/* Desktop frame — back layer */}
      <DeviceFrame
        className='absolute top-0 left-0 w-[78%] h-[62%] animate-float-slow'
        gradient='bg-gradient-to-br from-orange-200 via-rose-200 to-amber-100'
      />

      {/* Tablet frame — middle layer */}
      <DeviceFrame
        className='absolute top-[38%] left-[14%] w-[48%] h-[52%] animate-float'
        gradient='bg-gradient-to-br from-blue-200 via-indigo-200 to-purple-200'
        style={{ animationDelay: '0.8s' }}
      />

      {/* Mobile frame — front layer */}
      <DeviceFrame
        className='absolute top-[20%] right-0 w-[28%] h-[68%] animate-float'
        gradient='bg-gradient-to-br from-emerald-200 via-teal-200 to-cyan-200'
        style={{ animationDelay: '1.6s' }}
      />
    </div>
  )
}
