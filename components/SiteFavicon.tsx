'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

const faviconCache = new Map<string, { src: string; initials: string }>()

function hostFor(siteUrl: string) {
  try {
    return new URL(siteUrl).hostname.replace(/^www\./, '')
  } catch {
    return siteUrl
  }
}

function initialsFor(siteUrl: string) {
  const host = hostFor(siteUrl)
  const first = host.split(/[.-]/g).filter(Boolean)[0] ?? 'S'
  return first.slice(0, 2).toUpperCase()
}

function fallbackDataUrl(initials: string) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
      <rect width="128" height="128" rx="24" fill="#111111"/>
      <text x="64" y="74" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="42" font-weight="700" fill="#ffffff">${initials}</text>
    </svg>
  `.trim()
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
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
  const fallbackInitials = initialsFor(siteUrl)
  const cached = faviconCache.get(siteUrl)
  const [icon, setIcon] = useState<{ src: string; initials: string } | null>(
    cached ?? null
  )

  useEffect(() => {
    const existing = faviconCache.get(siteUrl)
    if (existing) {
      setIcon(existing)
      return
    }

    let ignore = false
    setIcon(null)
    fetch(`/api/favicon?url=${encodeURIComponent(siteUrl)}`)
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (ignore || !data?.src) return
        const next = {
          src: String(data.src),
          initials: String(data.initials || fallbackInitials)
        }
        faviconCache.set(siteUrl, next)
        setIcon(next)
      })
      .catch(() => {
        if (!ignore) {
          setIcon({
            src: fallbackDataUrl(fallbackInitials),
            initials: fallbackInitials
          })
        }
      })

    return () => {
      ignore = true
    }
  }, [fallbackInitials, siteUrl])

  return (
    <span
      className={cn(
        'inline-flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border/70 bg-background text-[10px] font-semibold text-foreground',
        className
      )}
      title={hostFor(siteUrl)}
    >
      {icon?.src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={icon.src}
          alt={alt ?? `${hostFor(siteUrl)} favicon`}
          className={cn('size-full object-cover', imageClassName)}
          onError={() => {
            const next = {
              src: fallbackDataUrl(icon.initials || fallbackInitials),
              initials: icon.initials || fallbackInitials
            }
            faviconCache.set(siteUrl, next)
            setIcon(next)
          }}
        />
      ) : (
        <span aria-hidden='true'>{fallbackInitials}</span>
      )}
    </span>
  )
}
