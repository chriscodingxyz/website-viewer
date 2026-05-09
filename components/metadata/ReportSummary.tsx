'use client'

import React from 'react'
import { useWebsiteViewer } from '@/contexts/WebsiteViewerContext'
import { computeOverallScore, gradeColor, type SubScore } from '@/lib/scoring'
import { cn } from '@/lib/utils'

function ScoreChip ({ label, score }: { label: string, score: SubScore }) {
  const tint =
    score.percentage >= 80 ? 'text-emerald-600' :
    score.percentage >= 50 ? 'text-amber-600' :
    'text-red-500'

  return (
    <div className='flex items-baseline gap-2'>
      <span className='text-[10px] uppercase tracking-[0.18em] text-muted-foreground'>{label}</span>
      <span className={cn('text-sm font-semibold tabular-nums', tint)}>{score.percentage}%</span>
      <span className='text-[10px] text-muted-foreground/60 tabular-nums'>{score.score}/{score.maxScore}</span>
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
      <div className='bg-card border border-border rounded-xl px-5 py-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-4'>
        <div className='flex items-center gap-3.5'>
          <div className={cn(
            'w-10 h-10 rounded-lg flex items-center justify-center',
            colors.bg
          )}>
            <span className={cn('text-lg font-semibold leading-none', colors.text)}>
              {overall.grade}
            </span>
          </div>
          <div>
            <div className='flex items-baseline gap-2'>
              <h2 className='text-base font-semibold text-foreground tracking-tight'>
                {hostname}
              </h2>
              <span className='text-xs text-muted-foreground tabular-nums'>
                {overall.percentage}% · {overall.score}/{overall.maxScore}
              </span>
            </div>
            <p className='text-[11px] text-muted-foreground'>
              Audited {new Date(metadata.extractedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
            </p>
          </div>
        </div>
        <div className='flex flex-wrap gap-x-6 gap-y-2'>
          <ScoreChip label='SEO' score={overall.breakdown.seo} />
          <ScoreChip label='Social' score={overall.breakdown.social} />
          <ScoreChip label='Technical' score={overall.breakdown.technical} />
        </div>
      </div>
    </div>
  )
}
