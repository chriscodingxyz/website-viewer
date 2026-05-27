'use client'

import { useEffect, useRef, useState } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ArrowClockwise, CircleNotch, Image as ImageIcon, Info } from '@phosphor-icons/react'

type SeoSummary = {
  title?: string
  description?: string
  canonical?: string
  robots?: string
  ogImage?: string
  ogType?: string
  siteName?: string
  twitterCard?: string
}

interface Props {
  pageUrl: string
}

const cache = new Map<string, SeoSummary>()

export default function ProjectSeoPreview({ pageUrl }: Props) {
  const [open, setOpen] = useState(false)
  const [data, setData] = useState<SeoSummary | null>(() => cache.get(pageUrl) ?? null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const lastFetched = useRef<string | null>(null)

  const fetchMetadata = async (force = false) => {
    if (!pageUrl) return
    if (!force && lastFetched.current === pageUrl && cache.has(pageUrl)) {
      setData(cache.get(pageUrl) ?? null)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/metadata?url=${encodeURIComponent(pageUrl)}`)
      if (!res.ok) throw new Error(`Request failed (${res.status})`)
      const json = await res.json()
      const m = json?.data
      const summary: SeoSummary = {
        title: m?.seo?.title || m?.openGraph?.title,
        description: m?.seo?.description || m?.openGraph?.description,
        canonical: m?.seo?.canonical,
        robots: m?.seo?.robots,
        ogImage: m?.openGraph?.image,
        ogType: m?.openGraph?.type,
        siteName: m?.openGraph?.siteName,
        twitterCard: m?.twitterCard?.card
      }
      cache.set(pageUrl, summary)
      lastFetched.current = pageUrl
      setData(summary)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load metadata')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!open) return
    void fetchMetadata()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, pageUrl])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          size='sm'
          className='h-8 gap-1.5 rounded-md text-xs'
          title='Page SEO preview'
        >
          <Info className='h-3.5 w-3.5' />
          SEO
        </Button>
      </PopoverTrigger>
      <PopoverContent align='end' className='w-[340px] p-0'>
        <div className='flex items-center justify-between gap-2 border-b border-border/60 px-3 py-2'>
          <div className='min-w-0'>
            <p className='text-[10px] font-medium uppercase tracking-wide text-muted-foreground'>
              Page SEO
            </p>
            <p className='truncate text-[11px] text-muted-foreground' title={pageUrl}>
              {pageUrl}
            </p>
          </div>
          <Button
            variant='ghost'
            size='icon'
            className='h-7 w-7'
            onClick={() => fetchMetadata(true)}
            disabled={loading}
            title='Refresh'
          >
            {loading ? (
              <CircleNotch className='h-3.5 w-3.5 animate-spin' />
            ) : (
              <ArrowClockwise className='h-3.5 w-3.5' />
            )}
          </Button>
        </div>

        <div className='space-y-3 px-3 py-3'>
          {error && (
            <p className='rounded-md border border-destructive/30 bg-destructive/5 px-2 py-1.5 text-[11px] text-destructive'>
              {error}
            </p>
          )}

          <div className='overflow-hidden rounded-md border border-border/60'>
            {data?.ogImage ? (
              <img
                src={data.ogImage}
                alt={data.title || 'Open Graph preview'}
                className='aspect-[1200/630] w-full bg-muted object-cover'
                onError={event => {
                  event.currentTarget.style.display = 'none'
                }}
              />
            ) : (
              <div className='flex aspect-[1200/630] w-full items-center justify-center bg-muted text-muted-foreground'>
                <ImageIcon className='h-6 w-6' />
              </div>
            )}
            <div className='space-y-1 px-2.5 py-2'>
              <p className='line-clamp-2 text-sm font-medium leading-snug'>
                {data?.title ?? (loading ? 'Loading…' : 'No title')}
              </p>
              <p className='line-clamp-3 text-xs leading-snug text-muted-foreground'>
                {data?.description ?? (loading ? '' : 'No description')}
              </p>
            </div>
          </div>

          <div className='space-y-1'>
            {data?.canonical && (
              <Row label='Canonical' value={data.canonical} mono />
            )}
            {data?.siteName && <Row label='Site' value={data.siteName} />}
            <div className='flex flex-wrap gap-1.5 pt-1'>
              {data?.ogType && (
                <Badge variant='outline' className='text-[10px] uppercase tracking-wide'>
                  og:{data.ogType}
                </Badge>
              )}
              {data?.twitterCard && (
                <Badge variant='outline' className='text-[10px] uppercase tracking-wide'>
                  twitter:{data.twitterCard}
                </Badge>
              )}
              {data?.robots && (
                <Badge variant='outline' className='text-[10px] tracking-wide'>
                  robots: {data.robots}
                </Badge>
              )}
            </div>
          </div>

          <Separator className='my-1' />
          <p className='text-[10px] text-muted-foreground'>
            Fetched server-side from the live URL.
          </p>
        </div>
      </PopoverContent>
    </Popover>
  )
}

function Row({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className='flex min-w-0 items-start gap-2 text-[11px]'>
      <span className='shrink-0 text-muted-foreground'>{label}</span>
      <span
        className={`min-w-0 flex-1 break-all text-foreground ${mono ? 'font-mono' : ''}`}
      >
        {value}
      </span>
    </div>
  )
}
