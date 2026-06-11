export const PROXY_PREFIX = '/api/proxy?url='

export function getProxiedUrl (original: string, contextUrl: string): string {
  if (!original || typeof original !== 'string') return original
  const trimmed = original.trim().replace(/&amp;/g, '&')

  if (
    trimmed === '' ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('javascript:') ||
    trimmed.startsWith('mailto:') ||
    trimmed.startsWith('tel:') ||
    trimmed.startsWith('#') ||
    trimmed.startsWith(PROXY_PREFIX)
  ) {
    return original
  }

  try {
    let urlToProxy = trimmed
    if (urlToProxy.startsWith('//')) {
      urlToProxy = `https:${urlToProxy}`
    }

    const absolute = new URL(urlToProxy, contextUrl)
    if (absolute.protocol !== 'http:' && absolute.protocol !== 'https:') {
      return original
    }
    return `${PROXY_PREFIX}${encodeURIComponent(absolute.toString())}`
  } catch {
    return original
  }
}

export function getProxiedSrcset (srcset: string, contextUrl: string): string {
  if (!srcset || typeof srcset !== 'string') return srcset
  return srcset
    .split(/,(?=\s+|$)/)
    .map(part => {
      const trimmed = part.trim()
      if (trimmed.startsWith('data:')) return trimmed

      const parts = trimmed.split(/\s+/)
      if (parts.length === 0) return part

      const url = parts[0]
      const rest = parts.slice(1).join(' ')
      return `${getProxiedUrl(url, contextUrl)} ${rest}`.trim()
    })
    .join(', ')
}

export function rewriteCssUrls (css: string, contextUrl: string): string {
  if (!css || typeof css !== 'string') return css

  let rewritten = css.replace(
    /url\s*\(\s*(['"]?)([^'"\)]+)\1\s*\)/gi,
    (_match, _quote, p1) => {
      return `url("${getProxiedUrl(p1.trim(), contextUrl)}")`
    }
  )

  rewritten = rewritten.replace(
    /@import\s+(?:url\s*\(\s*)?(['"]?)([^'"\)]+)\1\s*\)?/gi,
    (match, _quote, p1) => {
      if (match.toLowerCase().includes('url')) return match
      return `@import "${getProxiedUrl(p1.trim(), contextUrl)}"`
    }
  )

  return rewritten
}
