'use client'

import React from 'react'
import { useWebsiteViewer } from '@/contexts/WebsiteViewerContext'
import { computeOverallScore, gradeColor, type SubScore } from '@/lib/scoring'
import { cn } from '@/lib/utils'

function ScoreChip ({ label, score }: { label: string, score: SubScore }) {
  const tint =
    score.percentage >= 80 ? 'text-emerald-600' :
    score.percentage >= 50 ? 'text-amber-600' :
    'text-red-600'

  return (
    <div className='flex items-baseline gap-2 px-3 py-2 rounded-xl bg-muted/40 border border-border'>
      <span className='text-xs font-semibold text-muted-foreground uppercase tracking-wide'>{label}</span>
      <span className={cn('text-base font-black', tint)}>{score.percentage}%</span>
      <span className='text-[10px] text-muted-foreground/70'>{score.score}/{score.maxScore}</span>
    </div>
  )
}

export default function ReportSummary () {
  const { metadata, metadataLoading, currentSite } = useWebsiteViewer()

  if (!currentSite) return null

  const hostname = (() => {
    try { return new URL(currentSite).hostname.replace(/^www\./, '') } catch { return currentSite }
  })()

  if (metadataLoading || !metadata) {
    return (
      <div className='max-w-[1600px] mx-auto px-4 lg:px-8 pt-4'>
        <div className='bg-card border border-border rounded-2xl px-5 py-4 flex items-center justify-between gap-4'>
          <div className='flex items-center gap-4'>
            <div className='w-14 h-14 rounded-xl bg-muted animate-pulse' />
            <div className='space-y-2'>
              <div className='h-3 w-40 bg-muted animate-pulse rounded' />
              <div className='h-2 w-24 bg-muted/70 animate-pulse rounded' />
            </div>
          </div>
          <span className='text-xs text-muted-foreground'>Auditing {hostname}…</span>
        </div>
      </div>
    )
  }

  const overall = computeOverallScore(metadata)
  const colors = gradeColor(overall.grade)

  return (
    <div className='max-w-[1600px] mx-auto px-4 lg:px-8 pt-4'>
      <div className='bg-card border border-border rounded-2xl px-5 py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-sm'>
        <div className='flex items-center gap-4'>
          <div className={cn(
            'w-14 h-14 rounded-2xl flex items-center justify-center ring-4',
            colors.bg,
            colors.ring
          )}>
            <span className={cn('text-3xl font-black leading-none', colors.text)}>
              {overall.grade}
            </span>
          </div>
          <div>
            <div className='flex items-baseline gap-2'>
              <h2 className='text-xl sm:text-2xl font-black text-foreground tracking-tight'>
                {hostname}
              </h2>
              <span className='text-sm font-semibold text-muted-foreground'>
                {overall.percentage}%
              </span>
            </div>
            <p className='text-xs text-muted-foreground'>
              {overall.score} of {overall.maxScore} checks passed · audited {new Date(metadata.extractedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
            </p>
          </div>
        </div>
        <div className='flex flex-wrap gap-2'>
          <ScoreChip label='SEO' score={overall.breakdown.seo} />
          <ScoreChip label='Social' score={overall.breakdown.social} />
          <ScoreChip label='Technical' score={overall.breakdown.technical} />
        </div>
      </div>
    </div>
  )
}
