'use client'

import React from 'react'
import {
  AlertTriangle,
  CheckCircle,
  Circle,
  XCircle
} from 'lucide-react'
import type { SubScore } from '@/lib/scoring'
import { cn } from '@/lib/utils'

export type AuditStatus = 'good' | 'warning' | 'error' | 'neutral'

type IconComponent = React.ComponentType<{ className?: string }>

const statusStyles: Record<AuditStatus, {
  icon: React.ReactNode
  text: string
  dot: string
  label: string
}> = {
  good: {
    icon: <CheckCircle className='h-4 w-4 text-emerald-600' />,
    text: 'text-emerald-700',
    dot: 'bg-emerald-500',
    label: 'Good'
  },
  warning: {
    icon: <AlertTriangle className='h-4 w-4 text-amber-600' />,
    text: 'text-amber-700',
    dot: 'bg-amber-500',
    label: 'Review'
  },
  error: {
    icon: <XCircle className='h-4 w-4 text-red-600' />,
    text: 'text-red-700',
    dot: 'bg-red-500',
    label: 'Missing'
  },
  neutral: {
    icon: <Circle className='h-4 w-4 text-muted-foreground' />,
    text: 'text-muted-foreground',
    dot: 'bg-muted-foreground/50',
    label: 'Info'
  }
}

export function getStatusStyles (status: AuditStatus) {
  return statusStyles[status]
}

export function getScoreTone (percentage: number) {
  if (percentage >= 80) {
    return {
      text: 'text-emerald-700',
      bar: 'bg-emerald-600',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20'
    }
  }

  if (percentage >= 60) {
    return {
      text: 'text-amber-700',
      bar: 'bg-amber-500',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20'
    }
  }

  return {
    text: 'text-red-700',
    bar: 'bg-red-600',
    bg: 'bg-red-500/10',
    border: 'border-red-500/20'
  }
}

export function AuditLoadingState ({
  title,
  items
}: {
  title: string
  items: string[]
}) {
  return (
    <div className='w-full min-h-[420px] flex items-center justify-center px-4'>
      <div className='w-full max-w-sm text-center'>
        <div className='mx-auto mb-7 h-10 w-10 rounded-full border border-border bg-card flex items-center justify-center'>
          <div className='h-4 w-4 rounded-full border-2 border-foreground border-t-transparent animate-spin' />
        </div>
        <h3 className='text-base font-semibold tracking-tight text-foreground mb-5'>
          {title}
        </h3>
        <div className='space-y-2'>
          {items.map((item, index) => (
            <div
              key={item}
              className='flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2 text-left text-sm text-muted-foreground opacity-0 animate-[fadeIn_0.45s_ease-out_forwards]'
              style={{ animationDelay: `${index * 140}ms` }}
            >
              <span className='h-1.5 w-1.5 rounded-full bg-foreground/70' />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function ScoreSummaryCard ({
  icon: Icon,
  label,
  score,
  description,
  children
}: {
  icon: IconComponent
  label: string
  score: SubScore
  description: string
  children?: React.ReactNode
}) {
  const tone = getScoreTone(score.percentage)

  return (
    <div className='rounded-lg border border-border bg-card overflow-hidden'>
      <div className='grid gap-0 lg:grid-cols-[1fr_220px]'>
        <div className='p-5 sm:p-6'>
          <div className='flex items-center gap-3 mb-4'>
            <div className='h-9 w-9 rounded-lg border border-border bg-background flex items-center justify-center'>
              <Icon className='h-4 w-4 text-foreground' />
            </div>
            <div>
              <p className='text-xs uppercase tracking-[0.18em] text-muted-foreground'>
                {label}
              </p>
              <p className='text-sm text-muted-foreground mt-1'>
                {description}
              </p>
            </div>
          </div>

          <div className='h-2 rounded-full bg-muted overflow-hidden'>
            <div
              className={cn('h-full transition-all duration-500', tone.bar)}
              style={{ width: `${score.percentage}%` }}
            />
          </div>
        </div>

        <div className='border-t lg:border-t-0 lg:border-l border-border p-5 sm:p-6 flex lg:flex-col items-end lg:items-start justify-between gap-4 bg-muted/20'>
          <div>
            <div className={cn('text-4xl font-semibold tabular-nums tracking-tight', tone.text)}>
              {score.percentage}%
            </div>
            <p className='text-xs text-muted-foreground mt-1 tabular-nums'>
              {score.score}/{score.maxScore} checks passed
            </p>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}

export function AuditSection ({
  icon: Icon,
  title,
  description,
  children,
  action
}: {
  icon: IconComponent
  title: string
  description: string
  children: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <section className='space-y-4'>
      <div className='flex items-start justify-between gap-4 border-b border-border pb-3'>
        <div className='flex items-start gap-3 min-w-0'>
          <div className='mt-0.5 h-8 w-8 rounded-lg border border-border bg-card flex items-center justify-center flex-shrink-0'>
            <Icon className='h-4 w-4 text-muted-foreground' />
          </div>
          <div className='min-w-0'>
            <h2 className='text-base font-semibold tracking-tight text-foreground'>
              {title}
            </h2>
            <p className='text-sm text-muted-foreground mt-1 leading-relaxed'>
              {description}
            </p>
          </div>
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

export function AuditCard ({
  status = 'neutral',
  label,
  value,
  detail,
  children,
  className
}: {
  status?: AuditStatus
  label: string
  value?: React.ReactNode
  detail?: React.ReactNode
  children?: React.ReactNode
  className?: string
}) {
  const styles = getStatusStyles(status)

  return (
    <div className={cn('rounded-lg border border-border bg-card p-4 transition-colors hover:border-foreground/20', className)}>
      <div className='flex items-start justify-between gap-3'>
        <div className='min-w-0'>
          <p className='text-sm font-medium text-foreground'>{label}</p>
          {value && (
            <div className='mt-2 text-sm text-foreground leading-relaxed break-words'>
              {value}
            </div>
          )}
        </div>
        <div className='flex-shrink-0 mt-0.5'>{styles.icon}</div>
      </div>
      {detail && (
        <div className='mt-3 text-xs text-muted-foreground leading-relaxed'>
          {detail}
        </div>
      )}
      {children}
    </div>
  )
}

export function StatusPill ({
  status,
  children
}: {
  status: AuditStatus
  children: React.ReactNode
}) {
  const styles = getStatusStyles(status)

  return (
    <span className='inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2 py-1 text-xs text-muted-foreground'>
      <span className={cn('h-1.5 w-1.5 rounded-full', styles.dot)} />
      <span className={styles.text}>{children}</span>
    </span>
  )
}

export function MetadataPill ({
  children,
  className
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/25 px-2.5 py-1.5 text-xs font-medium text-foreground', className)}>
      {children}
    </span>
  )
}
