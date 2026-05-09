'use client'

import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react'
import { WebsiteMetadata } from '@/types/metadata'
import { computeOverallScore, gradeColor } from '@/lib/scoring'
import { cn } from '@/lib/utils'
import './print.css'

type Status = 'pass' | 'warn' | 'fail'

function Check ({ status, label, value, hint }: {
  status: Status
  label: string
  value?: string
  hint?: string
}) {
  const Icon = status === 'pass' ? CheckCircle2 : status === 'warn' ? AlertTriangle : XCircle
  const color = status === 'pass' ? 'text-emerald-600' : status === 'warn' ? 'text-amber-600' : 'text-red-600'

  return (
    <div className='report-card flex items-start gap-3 py-3 border-b border-border last:border-b-0'>
      <Icon className={cn('h-4 w-4 mt-0.5 flex-shrink-0', color)} />
      <div className='flex-1 min-w-0'>
        <div className='flex items-baseline justify-between gap-3'>
          <span className='text-sm font-semibold text-foreground'>{label}</span>
          {value && <span className='text-xs text-muted-foreground truncate max-w-[60%]'>{value}</span>}
        </div>
        {hint && <p className='text-xs text-muted-foreground mt-0.5'>{hint}</p>}
      </div>
    </div>
  )
}

function ReportContent ({ metadata }: { metadata: WebsiteMetadata }) {
  const overall = computeOverallScore(metadata)
  const colors = gradeColor(overall.grade)
  const hostname = (() => {
    try { return new URL(metadata.url).hostname.replace(/^www\./, '') } catch { return metadata.url }
  })()
  const favicon = `https://www.google.com/s2/favicons?domain=${hostname}&sz=128`
  const today = new Date().toLocaleDateString(undefined, { dateStyle: 'long' })

  const seo = metadata.seo
  const og = metadata.openGraph
  const tw = metadata.twitterCard
  const headers = metadata.headers || {}

  return (
    <div className='report-doc'>
      {/* Cover */}
      <header className='report-cover'>
        <div className='flex items-start justify-between gap-6'>
          <div className='flex items-start gap-4'>
            <Image
              src={favicon}
              alt={hostname}
              width={48}
              height={48}
              className='w-12 h-12 rounded-lg border border-border'
              unoptimized
            />
            <div>
              <p className='text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-1'>
                WebViewer · QA Report
              </p>
              <h1 className='text-4xl font-black tracking-tight text-foreground'>{hostname}</h1>
              <p className='text-sm text-muted-foreground mt-1'>{metadata.url}</p>
              <p className='text-xs text-muted-foreground mt-1'>Audited {today}</p>
            </div>
          </div>
          <div className='text-right'>
            <div className={cn('w-24 h-24 rounded-2xl ring-4 flex items-center justify-center', colors.bg, colors.ring)}>
              <span className={cn('text-5xl font-black', colors.text)}>{overall.grade}</span>
            </div>
            <p className='text-sm font-semibold text-foreground mt-2'>{overall.percentage}%</p>
            <p className='text-xs text-muted-foreground'>{overall.score}/{overall.maxScore} checks</p>
          </div>
        </div>
        <div className='grid grid-cols-3 gap-3 mt-6'>
          {(['seo', 'social', 'technical'] as const).map(k => {
            const s = overall.breakdown[k]
            return (
              <div key={k} className='border border-border rounded-xl p-3'>
                <p className='text-[10px] uppercase tracking-widest text-muted-foreground font-bold'>{k}</p>
                <p className='text-2xl font-black text-foreground'>{s.percentage}%</p>
                <p className='text-xs text-muted-foreground'>{s.score} of {s.maxScore} checks</p>
              </div>
            )
          })}
        </div>
      </header>

      {/* SEO */}
      <section className='report-section'>
        <h2 className='text-2xl font-black tracking-tight text-foreground mb-3'>SEO</h2>
        <div>
          <Check
            status={seo.title && seo.title.length >= 30 && seo.title.length <= 60 ? 'pass' : seo.title ? 'warn' : 'fail'}
            label='Page title'
            value={seo.title || '—'}
            hint={seo.title ? `${seo.title.length} chars (optimal 30–60)` : 'Add a descriptive title.'}
          />
          <Check
            status={seo.description && seo.description.length >= 120 && seo.description.length <= 160 ? 'pass' : seo.description ? 'warn' : 'fail'}
            label='Meta description'
            value={seo.description || '—'}
            hint={seo.description ? `${seo.description.length} chars (optimal 120–160)` : 'Add a meta description.'}
          />
          <Check status={seo.canonical ? 'pass' : 'warn'} label='Canonical URL' value={seo.canonical || '—'} />
          <Check status={seo.viewport ? 'pass' : 'fail'} label='Viewport meta' value={seo.viewport || '—'} />
          <Check status={seo.language ? 'pass' : 'warn'} label='Language' value={seo.language || '—'} />
          <Check status={seo.robots ? 'pass' : 'warn'} label='Robots directive' value={seo.robots || '—'} />
        </div>
      </section>

      {/* Social */}
      <section className='report-section'>
        <h2 className='text-2xl font-black tracking-tight text-foreground mb-3'>Social</h2>
        <div>
          <Check status={og.title ? 'pass' : 'fail'} label='OG title' value={og.title} />
          <Check status={og.description ? 'pass' : 'fail'} label='OG description' value={og.description} />
          <Check status={og.image ? 'pass' : 'fail'} label='OG image' value={og.image} />
          <Check status={og.type ? 'pass' : 'warn'} label='OG type' value={og.type} />
          <Check status={tw.card ? 'pass' : 'warn'} label='Twitter card' value={tw.card} />
          <Check status={tw.title ? 'pass' : 'warn'} label='Twitter title' value={tw.title} />
          <Check status={tw.description ? 'pass' : 'warn'} label='Twitter description' value={tw.description} />
          <Check status={tw.image ? 'pass' : 'warn'} label='Twitter image' value={tw.image} />
        </div>
      </section>

      {/* Technical */}
      <section className='report-section'>
        <h2 className='text-2xl font-black tracking-tight text-foreground mb-3'>Technical</h2>
        <div>
          <Check status={metadata.url.startsWith('https://') ? 'pass' : 'fail'} label='HTTPS' />
          <Check status={headers.contentSecurityPolicy ? 'pass' : 'warn'} label='Content-Security-Policy' />
          <Check status={headers.xFrameOptions ? 'pass' : 'warn'} label='X-Frame-Options' />
          <Check status={headers.strictTransportSecurity ? 'pass' : 'warn'} label='HSTS' />
          <Check status={headers.contentEncoding ? 'pass' : 'warn'} label='Content encoding' />
          <Check status={headers.cacheControl ? 'pass' : 'warn'} label='Cache-Control' />
          <Check status={metadata.technical?.charset ? 'pass' : 'warn'} label='Charset declared' value={metadata.technical?.charset} />
        </div>
      </section>

      <footer className='border-t border-border pt-4 mt-12 text-xs text-muted-foreground flex justify-between'>
        <span>Generated by WebViewer · webviewer.app</span>
        <span>{today}</span>
      </footer>
    </div>
  )
}

export default function ReportPage () {
  const params = useSearchParams()
  const site = params?.get('site')
  const autoprint = params?.get('autoprint') === '1'
  const [metadata, setMetadata] = useState<WebsiteMetadata | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!site) {
      setError('Missing ?site parameter')
      return
    }
    const url = site.startsWith('http') ? site : `https://${site}`
    fetch(`/api/metadata?url=${encodeURIComponent(url)}`)
      .then(r => r.json())
      .then(data => {
        if (data.success && data.data) setMetadata(data.data)
        else setError(data.error || 'Failed to load metadata')
      })
      .catch(e => setError(e.message))
  }, [site])

  useEffect(() => {
    if (autoprint && metadata) {
      const t = setTimeout(() => window.print(), 600)
      return () => clearTimeout(t)
    }
  }, [autoprint, metadata])

  if (error) {
    return (
      <div className='report-page'>
        <div className='report-doc'>
          <h1 className='text-2xl font-black text-foreground mb-2'>Report unavailable</h1>
          <p className='text-sm text-muted-foreground'>{error}</p>
        </div>
      </div>
    )
  }

  if (!metadata) {
    return (
      <div className='report-page'>
        <div className='report-doc'>
          <p className='text-sm text-muted-foreground'>Generating report…</p>
        </div>
      </div>
    )
  }

  return (
    <div className='report-page'>
      <ReportContent metadata={metadata} />
    </div>
  )
}
