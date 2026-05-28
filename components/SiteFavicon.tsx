'use client'

import { useEffect, useMemo, useState } from 'react'
import { cn } from '@/lib/utils'

const FALLBACK_ICON = '/seoseal.png'
const metadataIconCache = new Map<string, string[]>()

function originFor(siteUrl: string) {
  try {
    return new URL(siteUrl).origin
  } catch {
    return ''
  }
}

function hostFor(siteUrl: string) {
  try {
    return new URL(siteUrl).hostname
  } catch {
    return ''
  }
}

function metadataCandidates(siteUrl: string, icons: Array<{ href?: string; sizes?: string }>) {
  const origin = originFor(siteUrl)
  return icons
    .filter(icon => Boolean(icon.href))
    .sort((a, b) => {
      const sizeA = a.sizes ? parseInt(a.sizes.split('x')[0], 10) : 0
      const sizeB = b.sizes ? parseInt(b.sizes.split('x')[0], 10) : 0
      return sizeB - sizeA
    })
    .map(icon => {
      try {
        return new URL(icon.href!, origin || siteUrl).toString()
      } catch {
        return icon.href!
      }
    })
}

function baseCandidates(siteUrl: string) {
  const origin = originFor(siteUrl)
  const host = hostFor(siteUrl)
  const localhost = host.includes('localhost') || host.includes('127.0.0.1')

  return [
    origin ? `${origin}/apple-touch-icon.png` : null,
    origin ? `${origin}/favicon.ico` : null,
    host && !localhost
      ? `https://www.google.com/s2/favicons?domain=${host}&sz=128`
      : null,
    FALLBACK_ICON
  ].filter(Boolean) as string[]
}

interface Props {
  siteUrl: string
  alt?: string
  className?: string
  imageClassName?: string
}

export default function SiteFavicon({
  siteUrl,
  alt,
  className,
  imageClassName
}: Props) {
  const [metadataIcons, setMetadataIcons] = useState<string[]>(
    () => metadataIconCache.get(siteUrl) ?? []
  )
  const [index, setIndex] = useState(0)

  useEffect(() => {
    setIndex(0)
    const cached = metadataIconCache.get(siteUrl)
    if (cached) {
      setMetadataIcons(cached)
      return
    }

    let ignore = false
    fetch(`/api/metadata?url=${encodeURIComponent(siteUrl)}`)
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (ignore) return
        const icons = metadataCandidates(siteUrl, data?.metadata?.icons ?? [])
        metadataIconCache.set(siteUrl, icons)
        setMetadataIcons(icons)
      })
      .catch(() => {
        metadataIconCache.set(siteUrl, [])
        if (!ignore) setMetadataIcons([])
      })

    return () => {
      ignore = true
    }
  }, [siteUrl])

  const candidates = useMemo(() => {
    return Array.from(new Set([...metadataIcons, ...baseCandidates(siteUrl)]))
  }, [metadataIcons, siteUrl])

  const src = candidates[Math.min(index, candidates.length - 1)] ?? FALLBACK_ICON

  return (
    <span
      className={cn(
        'inline-flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border/70 bg-background',
        className
      )}
    >
      <img
        key={src}
        src={src}
        alt={alt ?? `${hostFor(siteUrl) || 'Site'} favicon`}
        className={cn('size-full object-cover', imageClassName)}
        onError={() => {
          setIndex(next => Math.min(next + 1, candidates.length - 1))
        }}
      />
    </span>
  )
}
