'use client'

import React, { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Search01Icon, ArrowRight02Icon } from 'hugeicons-react'
import { GitCompareArrows } from 'lucide-react'
import { WebsiteMetadata } from '@/types/metadata'
import CompareView from '@/components/CompareView'

function fmt (raw: string) {
  const v = raw.trim()
  if (!v) return null
  if (v.startsWith('http://') || v.startsWith('https://')) return v
  return `https://${v}`
}

function ComparePageInner () {
  const params = useSearchParams()
  const router = useRouter()
  const initialA = params?.get('a') || ''
  const initialB = params?.get('b') || ''

  const [a, setA] = useState(initialA)
  const [b, setB] = useState(initialB)
  const [aMeta, setAMeta] = useState<WebsiteMetadata | null>(null)
  const [bMeta, setBMeta] = useState<WebsiteMetadata | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const runCompare = async () => {
    const fa = fmt(a)
    const fb = fmt(b)
    if (!fa || !fb) {
      setError('Enter both URLs.')
      return
    }
    setError(null)
    setLoading(true)
    setAMeta(null)
    setBMeta(null)
    router.replace(`/compare?a=${encodeURIComponent(a)}&b=${encodeURIComponent(b)}`, { scroll: false })

    try {
      const [ra, rb] = await Promise.all([
        fetch(`/api/metadata?url=${encodeURIComponent(fa)}`).then(r => r.json()),
        fetch(`/api/metadata?url=${encodeURIComponent(fb)}`).then(r => r.json())
      ])
      if (ra.success && ra.data) setAMeta(ra.data)
      else throw new Error(`Site A: ${ra.error || 'failed'}`)
      if (rb.success && rb.data) setBMeta(rb.data)
      else throw new Error(`Site B: ${rb.error || 'failed'}`)
    } catch (e: any) {
      setError(e.message || 'Compare failed')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (initialA && initialB) {
      runCompare()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className='container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl py-10 sm:py-14'>
      <div className='mb-8'>
        <span className='inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold tracking-wide mb-4'>
          <GitCompareArrows className='w-3.5 h-3.5' />
          COMPARE TWO SITES
        </span>
        <h1 className='text-4xl sm:text-5xl font-black tracking-tight text-foreground mb-2 leading-[1.05]'>
          Who&apos;s shipping a better site?
        </h1>
        <p className='text-base text-muted-foreground max-w-2xl'>
          Stack two URLs side-by-side. Get a per-check breakdown of SEO, social, and technical setup. Hand the winner to your dev as a benchmark.
        </p>
      </div>

      <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3'>
        {[
          { v: a, set: setA, side: 'A', placeholder: 'your-site.com' },
          { v: b, set: setB, side: 'B', placeholder: 'competitor.com' }
        ].map(({ v, set, side, placeholder }) => (
          <div key={side} className='relative'>
            <span className='absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black tracking-widest text-muted-foreground'>
              SITE {side}
            </span>
            <Search01Icon className='absolute left-16 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground' />
            <input
              type='text'
              value={v}
              placeholder={placeholder}
              onChange={(e) => set(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && runCompare()}
              className='w-full h-12 pl-24 pr-4 rounded-xl border border-border bg-card focus:outline-none focus:ring-4 focus:ring-accent/20 focus:border-accent/60 text-foreground placeholder:text-muted-foreground text-base'
            />
          </div>
        ))}
      </div>

      <div className='flex items-center gap-3 mb-10'>
        <Button
          size='lg'
          onClick={runCompare}
          disabled={loading}
          className='h-12 px-7 font-semibold gap-2 rounded-xl bg-primary hover:bg-primary/90 shadow-lg'
        >
          {loading ? 'Comparing…' : 'Compare'}
          <ArrowRight02Icon className='w-4 h-4' />
        </Button>
        {error && <span className='text-sm text-red-600'>{error}</span>}
      </div>

      {loading && (
        <div className='py-20 text-center'>
          <div className='w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4' />
          <p className='text-sm text-muted-foreground'>Auditing both sites…</p>
        </div>
      )}

      {!loading && aMeta && bMeta && <CompareView a={aMeta} b={bMeta} />}
    </div>
  )
}

export default function ComparePage () {
  return (
    <Suspense fallback={<div className='py-20 text-center text-sm text-muted-foreground'>Loading…</div>}>
      <ComparePageInner />
    </Suspense>
  )
}
