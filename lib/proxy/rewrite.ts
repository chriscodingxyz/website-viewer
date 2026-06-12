export const PROXY_PREFIX = '/api/proxy?url='

const SKIP_SCHEME = /^(data:|blob:|javascript:|mailto:|tel:|about:|#)/i

function resolveAbsolute (value: string, base: string): URL | null {
  const trimmed = value.trim().replace(/&amp;/g, '&')
  if (!trimmed || SKIP_SCHEME.test(trimmed)) return null
  let candidate = trimmed
  if (candidate.startsWith('//')) candidate = `https:${candidate}`
  try {
    const abs = new URL(candidate, base)
    if (abs.protocol !== 'http:' && abs.protocol !== 'https:') return null
    return abs
  } catch {
    return null
  }
}

/**
 * Encode a URL for top-level navigation: always the explicit ?url= form so a
 * real navigation lands on our proxy route (service worker skips navigations).
 */
export function getProxiedUrl (original: string, contextUrl: string): string {
  if (!original || typeof original !== 'string') return original
  if (original.trim().startsWith(PROXY_PREFIX)) return original
  const abs = resolveAbsolute(original, contextUrl)
  if (!abs) return original
  return `${PROXY_PREFIX}${encodeURIComponent(abs.toString())}`
}

/**
 * Encode a URL for a subresource (script/img/css/fetch). Same-origin-as-target
 * URLs become root-relative paths so bundler runtimes (Turbopack/webpack) see
 * their real chunk paths; the service worker remaps those requests back to the
 * target origin. Cross-origin URLs fall back to the ?url= form.
 */
export function getAssetUrl (
  original: string,
  contextUrl: string,
  targetOrigin: string
): string {
  if (!original || typeof original !== 'string') return original
  if (original.trim().startsWith(PROXY_PREFIX)) return original
  const abs = resolveAbsolute(original, contextUrl)
  if (!abs) return original
  if (abs.origin === targetOrigin) {
    return `${abs.pathname}${abs.search}${abs.hash}`
  }
  return `${PROXY_PREFIX}${encodeURIComponent(abs.toString())}`
}

export function getAssetSrcset (
  srcset: string,
  contextUrl: string,
  targetOrigin: string
): string {
  if (!srcset || typeof srcset !== 'string') return srcset
  return srcset
    .split(/,(?=\s+|$)/)
    .map(part => {
      const trimmed = part.trim()
      if (trimmed.startsWith('data:')) return trimmed
      const pieces = trimmed.split(/\s+/)
      if (pieces.length === 0) return part
      const rest = pieces.slice(1).join(' ')
      return `${getAssetUrl(pieces[0], contextUrl, targetOrigin)} ${rest}`.trim()
    })
    .join(', ')
}

export function rewriteCssUrls (
  css: string,
  contextUrl: string,
  targetOrigin: string
): string {
  if (!css || typeof css !== 'string') return css

  let rewritten = css.replace(
    /url\s*\(\s*(['"]?)([^'"\)]+)\1\s*\)/gi,
    (_match, _quote, p1) => {
      return `url("${getAssetUrl(p1.trim(), contextUrl, targetOrigin)}")`
    }
  )

  rewritten = rewritten.replace(
    /@import\s+(?:url\s*\(\s*)?(['"]?)([^'"\)]+)\1\s*\)?/gi,
    (match, _quote, p1) => {
      if (match.toLowerCase().includes('url')) return match
      return `@import "${getAssetUrl(p1.trim(), contextUrl, targetOrigin)}"`
    }
  )

  return rewritten
}
