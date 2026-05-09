'use client'

import React from 'react'
import Image from 'next/image'
import { CheckCircle2, XCircle, Trophy, Minus } from 'lucide-react'
import { WebsiteMetadata } from '@/types/metadata'
import { computeOverallScore, gradeColor } from '@/lib/scoring'
import { cn } from '@/lib/utils'

interface Props {
  a: WebsiteMetadata
  b: WebsiteMetadata
}

const checks: Array<{
  label: string
  group: 'SEO' | 'Social' | 'Technical'
  pick: (m: WebsiteMetadata) => boolean | number
  better?: 'higher' | 'truthy'
}> = [
  { label: 'Title length 30–60', group: 'SEO', pick: m => !!(m.seo.title && m.seo.title.length >= 30 && m.seo.title.length <= 60) },
  { label: 'Description length 120–160', group: 'SEO', pick: m => !!(m.seo.description && m.seo.description.length >= 120 && m.seo.description.length <= 160) },
  { label: 'Canonical URL', group: 'SEO', pick: m => !!m.seo.canonical },
  { label: 'Viewport meta', group: 'SEO', pick: m => !!m.seo.viewport },
  { label: 'Language declared', group: 'SEO', pick: m => !!m.seo.language },
  { label: 'OG title', group: 'Social', pick: m => !!m.openGraph.title },
  { label: 'OG description', group: 'Social', pick: m => !!m.openGraph.description },
  { label: 'OG image', group: 'Social', pick: m => !!m.openGraph.image },
  { label: 'Twitter card', group: 'Social', pick: m => !!m.twitterCard.card },
  { label: 'Twitter image', group: 'Social', pick: m => !!m.twitterCard.image },
  { label: 'HTTPS', group: 'Technical', pick: m => m.url.startsWith('https://') },
  { label: 'Content-Security-Policy', group: 'Technical', pick: m => !!m.headers?.contentSecurityPolicy },
  { label: 'X-Frame-Options', group: 'Technical', pick: m => !!m.headers?.xFrameOptions },
  { label: 'HSTS', group: 'Technical', pick: m => !!m.headers?.strictTransportSecurity },
  { label: 'Cache-Control', group: 'Technical', pick: m => !!m.headers?.cacheControl }
]

function Side ({ m, side }: { m: WebsiteMetadata, side: 'A' | 'B' }) {
  const overall = computeOverallScore(m)
  const colors = gradeColor(overall.grade)
  const hostname = (() => {
    try { return new URL(m.url).hostname.replace(/^www\./, '') } catch { return m.url }
  })()
  const favicon = `https://www.google.com/s2/favicons?domain=${hostname}&sz=128`

  return (
    <div className='bg-card border border-border rounded-2xl p-5 shadow-sm'>
      <div className='flex items-center gap-3 mb-3'>
        <Image src={favicon} alt={hostname} width={36} height={36} className='w-9 h-9 rounded-lg border border-border' unoptimized />
        <div className='min-w-0 flex-1'>
          <p className='text-[10px] font-bold uppercase tracking-widest text-muted-foreground'>Site {side}</p>
          <h3 className='text-lg font-black text-foreground truncate'>{hostname}</h3>
        </div>
      </div>
      <div className='flex items-center gap-3'>
        <div className={cn('w-14 h-14 rounded-xl ring-4 flex items-center justify-center', colors.bg, colors.ring)}>
          <span className={cn('text-2xl font-black', colors.text)}>{overall.grade}</span>
        </div>
        <div>
          <p className='text-2xl font-black text-foreground leading-none'>{overall.percentage}%</p>
          <p className='text-xs text-muted-foreground mt-1'>{overall.score}/{overall.maxScore} checks</p>
        </div>
      </div>
      <div className='grid grid-cols-3 gap-2 mt-4'>
        {(['seo', 'social', 'technical'] as const).map(k => (
          <div key={k} className='border border-border rounded-lg p-2'>
            <p className='text-[9px] uppercase tracking-widest text-muted-foreground font-bold'>{k}</p>
            <p className='text-base font-black text-foreground'>{overall.breakdown[k].percentage}%</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function CompareView ({ a, b }: Props) {
  let aWins = 0, bWins = 0, ties = 0
  const rows = checks.map(c => {
    const av = c.pick(a)
    const bv = c.pick(b)
    let winner: 'a' | 'b' | 'tie'
    if (av === bv) { winner = 'tie'; ties++ }
    else if (av && !bv) { winner = 'a'; aWins++ }
    else { winner = 'b'; bWins++ }
    return { ...c, av, bv, winner }
  })

  return (
    <div className='space-y-6'>
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
        <Side m={a} side='A' />
        <Side m={b} side='B' />
      </div>

      <div className='bg-card border border-border rounded-2xl overflow-hidden shadow-sm'>
        <div className='px-5 py-4 border-b border-border bg-muted/30 flex items-center justify-between'>
          <h2 className='text-lg font-black text-foreground tracking-tight'>Check-by-check</h2>
          <div className='flex items-center gap-3 text-xs font-semibold'>
            <span className='text-emerald-600'>A wins {aWins}</span>
            <span className='text-muted-foreground'>Tie {ties}</span>
            <span className='text-emerald-600'>B wins {bWins}</span>
          </div>
        </div>
        <div className='divide-y divide-border'>
          {(['SEO', 'Social', 'Technical'] as const).map(group => (
            <div key={group}>
              <div className='px-5 py-2 bg-muted/20 text-[10px] font-bold uppercase tracking-widest text-muted-foreground'>
                {group}
              </div>
              {rows.filter(r => r.group === group).map(r => (
                <div key={r.label} className='px-5 py-3 grid grid-cols-12 gap-3 items-center'>
                  <div className='col-span-2 flex items-center gap-2 justify-start'>
                    {r.av ? <CheckCircle2 className='h-4 w-4 text-emerald-600' /> : <XCircle className='h-4 w-4 text-red-400' />}
                    {r.winner === 'a' && <Trophy className='h-3.5 w-3.5 text-accent' />}
                  </div>
                  <div className='col-span-8 flex items-center justify-center gap-2 text-sm font-medium text-foreground text-center'>
                    {r.winner === 'tie' && <Minus className='h-3.5 w-3.5 text-muted-foreground/40' />}
                    <span>{r.label}</span>
                  </div>
                  <div className='col-span-2 flex items-center gap-2 justify-end'>
                    {r.winner === 'b' && <Trophy className='h-3.5 w-3.5 text-accent' />}
                    {r.bv ? <CheckCircle2 className='h-4 w-4 text-emerald-600' /> : <XCircle className='h-4 w-4 text-red-400' />}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
