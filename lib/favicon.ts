import { WebsiteMetadata } from '@/types/metadata'

/**
 * Get favicon URL with automatic protocol detection and localhost handling
 */
export const getFaviconUrl = (siteUrl: string): string => {
  try {
    const url = new URL(siteUrl)
    const domain = url.hostname

    // Check if localhost/127.0.0.1
    if (domain.includes('localhost') || domain.includes('127.0.0.1')) {
      return '/seoseal.png'
    }

    // Use Google S2 API (256px for high quality)
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=256`
  } catch {
    // Invalid URL fallback
    return '/seoseal.png'
  }
}

/**
 * Get the best available favicon with priority fallback chain:
 * 1. Metadata icon (highest quality)
 * 2. Google S2 API
 * 3. seoseal.png (fallback)
 */
export const getBestFavicon = (
  siteUrl: string,
  metadata?: WebsiteMetadata | null
): string => {
  // Priority 1: Use metadata icon if available (highest quality)
  if (metadata?.icons && metadata.icons.length > 0) {
    const sortedIcons = [...metadata.icons].sort((a, b) => {
      const sizeA = a.sizes ? parseInt(a.sizes.split('x')[0]) : 0
      const sizeB = b.sizes ? parseInt(b.sizes.split('x')[0]) : 0
      return sizeB - sizeA
    })

    const bestIcon = sortedIcons[0]
    if (bestIcon?.href) {
      try {
        const url = new URL(siteUrl)
        return new URL(bestIcon.href, url.origin).toString()
      } catch {
        return bestIcon.href
      }
    }
  }

  // Priority 2: Fallback to Google S2 API
  return getFaviconUrl(siteUrl)
}
