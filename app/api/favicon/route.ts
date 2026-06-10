import { NextRequest, NextResponse } from 'next/server'

type IconCandidate = {
  href?: string
  sizes?: string
  rel?: string
}

const cache = new Map<string, { src: string; initials: string; generated: boolean; expires: number }>()
const CACHE_MS = 1000 * 60 * 60

function normalizeUrl(value: string) {
  const trimmed = value.trim()
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
  const url = new URL(withProtocol)
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('Use an http or https URL')
  }
  url.hash = ''
  return url
}

function initialsFor(url: URL) {
  const host = url.hostname.replace(/^www\./, '')
  const parts = host.split(/[.-]/g).filter(Boolean)
  return (parts[0]?.slice(0, 2) || 'S').toUpperCase()
}

function fallbackSvg(initials: string) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
      <rect width="128" height="128" rx="24" fill="#111111"/>
      <text x="64" y="74" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="42" font-weight="700" fill="#ffffff">${initials}</text>
    </svg>
  `.trim()
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

function absoluteIcon(iconHref: string, siteUrl: URL) {
  try {
    return new URL(iconHref, siteUrl.origin).toString()
  } catch {
    return null
  }
}

function scoreIcon(candidate: IconCandidate) {
  const rel = candidate.rel?.toLowerCase() ?? ''
  const href = candidate.href?.toLowerCase() ?? ''
  const size = candidate.sizes ? parseInt(candidate.sizes.split('x')[0], 10) || 0 : 0
  let score = size
  if (rel.includes('apple')) score += 500
  if (href.endsWith('.svg')) score += 400
  if (rel.includes('icon')) score += 200
  if (href.includes('favicon')) score += 100
  return score
}

async function metadataCandidates(request: NextRequest, siteUrl: URL) {
  try {
    const metadataUrl = new URL('/api/metadata', request.url)
    metadataUrl.searchParams.set('url', siteUrl.toString())
    const response = await fetch(metadataUrl, { cache: 'no-store' })
    if (!response.ok) return []
    const payload = await response.json()
    const icons = (payload?.data?.icons ?? []) as IconCandidate[]
    return icons
      .filter(icon => icon.href)
      .sort((a, b) => scoreIcon(b) - scoreIcon(a))
      .map(icon => absoluteIcon(icon.href!, siteUrl))
      .filter(Boolean) as string[]
  } catch {
    return []
  }
}

async function isUsableImage(src: string) {
  if (src.startsWith('data:') || src.startsWith('/')) return true
  try {
    const response = await fetch(src, {
      method: 'GET',
      redirect: 'follow',
      headers: {
        Accept: 'image/avif,image/webp,image/svg+xml,image/png,image/*,*/*;q=0.8',
        'User-Agent':
          'Mozilla/5.0 (compatible; BugsmashFavicon/1.0; +https://example.com)'
      },
      signal: AbortSignal.timeout(5000)
    })
    if (!response.ok) return false
    const contentType = response.headers.get('content-type') ?? ''
    return (
      contentType.startsWith('image/') ||
      contentType.includes('octet-stream') ||
      src.includes('google.com/s2/favicons') ||
      src.includes('gstatic.com/favicon')
    )
  } catch {
    return false
  }
}

export async function GET(request: NextRequest) {
  const rawUrl = request.nextUrl.searchParams.get('url')
  if (!rawUrl) {
    return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 })
  }

  let siteUrl: URL
  try {
    siteUrl = normalizeUrl(rawUrl)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Invalid URL' },
      { status: 400 }
    )
  }

  const cacheKey = siteUrl.origin
  const cached = cache.get(cacheKey)
  if (cached && cached.expires > Date.now()) {
    return NextResponse.json(cached)
  }

  const initials = initialsFor(siteUrl)
  const host = siteUrl.hostname
  const localhost = host.includes('localhost') || host.includes('127.0.0.1')
  const metadata = await metadataCandidates(request, siteUrl)
  const candidates = Array.from(
    new Set([
      ...metadata,
      `${siteUrl.origin}/apple-touch-icon.png`,
      `${siteUrl.origin}/apple-touch-icon-precomposed.png`,
      `${siteUrl.origin}/favicon.svg`,
      `${siteUrl.origin}/favicon.png`,
      `${siteUrl.origin}/favicon.ico`,
      !localhost
        ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=128`
        : null
    ].filter(Boolean) as string[])
  )

  for (const src of candidates) {
    if (await isUsableImage(src)) {
      const result = { src, initials, generated: false, expires: Date.now() + CACHE_MS }
      cache.set(cacheKey, result)
      return NextResponse.json(result)
    }
  }

  const result = {
    src: fallbackSvg(initials),
    initials,
    generated: true,
    expires: Date.now() + CACHE_MS
  }
  cache.set(cacheKey, result)
  return NextResponse.json(result)
}
