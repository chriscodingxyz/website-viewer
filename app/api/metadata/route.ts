import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import * as cheerio from 'cheerio'
import {
  WebsiteMetadata,
  MetadataAPIResponse,
  SitemapInfo,
  AnalyticsInfo
} from '@/types/metadata'

// Helper function to check if a URL is accessible
async function checkUrlAccessible (
  url: string,
  timeout: number = 5000
): Promise<{ accessible: boolean; size?: number; lastModified?: string }> {
  try {
    const response = await axios.head(url, {
      timeout,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; WebsiteViewer/1.0; +https://example.com/bot)'
      },
      // Handle SSL certificate issues gracefully
      httpsAgent: new (require('https').Agent)({
        rejectUnauthorized: false,
        requestCert: false,
        agent: false
      }),
      validateStatus: function (status) {
        return status >= 200 && status < 400;
      }
    })

    return {
      accessible: response.status === 200,
      size: response.headers['content-length']
        ? parseInt(response.headers['content-length'])
        : undefined,
      lastModified: response.headers['last-modified'] || undefined
    }
  } catch (error) {
    return { accessible: false }
  }
}

// Helper function to extract sitemap information
async function extractSitemapInfo (
  targetUrl: URL,
  $: cheerio.Root
): Promise<SitemapInfo> {
  const sitemapInfo: SitemapInfo = {
    sitemaps: []
  }

  // Check if robots directives are handled via HTML meta tags (Next.js style)
  const robotsMeta = $('meta[name="robots"]').attr('content')
  const hasMetaRobots = !!robotsMeta

  // Check for sitemap link tags in HTML
  $('link[rel="sitemap"]').each((_, element) => {
    const href = $(element).attr('href')
    if (href) {
      const sitemapUrl = new URL(href, targetUrl).toString()
      sitemapInfo.sitemaps.push({
        url: sitemapUrl,
        accessible: false, // Will be checked later
        source: 'link_tag'
      })
    }
  })

  // Check standard sitemap locations
  const standardLocations = [
    '/sitemap.xml',
    '/sitemap_index.xml',
    '/sitemaps.xml',
    '/sitemap1.xml'
  ]

  for (const location of standardLocations) {
    const sitemapUrl = new URL(location, targetUrl).toString()
    sitemapInfo.sitemaps.push({
      url: sitemapUrl,
      accessible: false, // Will be checked later
      source: 'standard_location'
    })
  }

  // Check for robots file (both .txt and .js formats)
  const robotsFiles = ['/robots.txt', '/robots.js']
  let robotsFound = false

  for (const robotsPath of robotsFiles) {
    const robotsUrl = new URL(robotsPath, targetUrl).toString()
    try {
      const robotsResponse = await axios.get(robotsUrl, {
        timeout: 5000,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (compatible; WebsiteViewer/1.0; +https://example.com/bot)'
        },
        // Handle SSL certificate issues gracefully
        httpsAgent: new (require('https').Agent)({
          rejectUnauthorized: false,
          requestCert: false,
          agent: false
        }),
        validateStatus: function (status) {
          return status >= 200 && status < 400;
        }
      })

      if (robotsResponse.status === 200) {
        const robotsContent = String(robotsResponse.data).trim()

        // Check if this is actually a robots file (not just a 200 response)
        // Robots files should contain specific directives or be plain text
        const isValidRobotsFile =
          robotsContent.toLowerCase().includes('user-agent') ||
          robotsContent.toLowerCase().includes('disallow') ||
          robotsContent.toLowerCase().includes('allow') ||
          robotsContent.toLowerCase().includes('sitemap') ||
          robotsContent.toLowerCase().includes('crawl-delay') ||
          (robotsContent.length > 0 &&
            robotsContent.length < 10000 &&
            !robotsContent.includes('<!DOCTYPE html>'))

        if (isValidRobotsFile) {
          robotsFound = true
          sitemapInfo.robotsTxt = {
            accessible: true,
            url: robotsUrl,
            content: robotsContent
          }

          // Parse robots content for sitemap URLs (works for both .txt and .js)
          const sitemapMatches = robotsContent.match(/^Sitemap:\s*(.+)$/gim)

          if (sitemapMatches) {
            sitemapMatches.forEach((match: string) => {
              const sitemapUrl = match.replace(/^Sitemap:\s*/i, '').trim()
              if (sitemapUrl) {
                sitemapInfo.sitemaps.push({
                  url: sitemapUrl,
                  accessible: false, // Will be checked later
                  source: 'robots_txt'
                })
              }
            })
          }
          break // Found robots file, no need to check others
        }
      }
    } catch (error) {
      // Continue to next robots file format
      continue
    }
  }

  // If no robots file was found, set as not accessible but include meta robots info
  if (!robotsFound) {
    sitemapInfo.robotsTxt = {
      accessible: false,
      url: new URL('/robots.txt', targetUrl).toString(),
      hasMetaRobots: hasMetaRobots,
      metaContent: robotsMeta
    }
  } else if (sitemapInfo.robotsTxt) {
    // Add meta robots info to existing robots file info
    sitemapInfo.robotsTxt.hasMetaRobots = hasMetaRobots
    sitemapInfo.robotsTxt.metaContent = robotsMeta
  }

  // Remove duplicate sitemap URLs
  const uniqueSitemaps = sitemapInfo.sitemaps.filter(
    (sitemap, index, self) =>
      index === self.findIndex(s => s.url === sitemap.url)
  )

  // Check accessibility of each sitemap
  const accessibilityPromises = uniqueSitemaps.map(async sitemap => {
    const accessResult = await checkUrlAccessible(sitemap.url)
    return {
      ...sitemap,
      accessible: accessResult.accessible,
      size: accessResult.size,
      lastModified: accessResult.lastModified
    }
  })

  sitemapInfo.sitemaps = await Promise.all(accessibilityPromises)

  return sitemapInfo
}

// Helper function to extract analytics information
function extractAnalyticsInfo (
  $: cheerio.Root,
  html: string
): AnalyticsInfo {
  const analyticsInfo: AnalyticsInfo = {
    googleAnalytics: {
      present: false,
      trackingIds: [],
      gtag: false,
      universalAnalytics: false,
      ga4: false
    },
    googleTagManager: {
      present: false,
      containerIds: []
    },
    otherAnalytics: []
  }

  // Google Analytics Detection
  // Check for gtag (Global Site Tag) - GA4 and Universal Analytics
  const gtagMatches = html.match(/gtag\(['"]config['"],\s*['"]([^'"]+)['"]/g)
  if (gtagMatches) {
    analyticsInfo.googleAnalytics.gtag = true
    analyticsInfo.googleAnalytics.present = true

    gtagMatches.forEach(match => {
      const trackingId = match.match(
        /gtag\(['"]config['"],\s*['"]([^'"]+)['"]/
      )?.[1]
      if (trackingId) {
        analyticsInfo.googleAnalytics.trackingIds.push(trackingId)

        // Determine GA type based on tracking ID format
        if (trackingId.startsWith('GA-') || trackingId.startsWith('G-')) {
          analyticsInfo.googleAnalytics.ga4 = true
        } else if (trackingId.startsWith('UA-')) {
          analyticsInfo.googleAnalytics.universalAnalytics = true
        }
      }
    })
  }

  // Check for Universal Analytics (ga function)
  const gaMatches = html.match(/ga\(['"]create['"],\s*['"]([^'"]+)['"]/g)
  if (gaMatches) {
    analyticsInfo.googleAnalytics.universalAnalytics = true
    analyticsInfo.googleAnalytics.present = true

    gaMatches.forEach(match => {
      const trackingId = match.match(
        /ga\(['"]create['"],\s*['"]([^'"]+)['"]/
      )?.[1]
      if (
        trackingId &&
        !analyticsInfo.googleAnalytics.trackingIds.includes(trackingId)
      ) {
        analyticsInfo.googleAnalytics.trackingIds.push(trackingId)
      }
    })
  }

  // Check for Google Analytics script tags
  $(
    'script[src*="googletagmanager.com/gtag"], script[src*="google-analytics.com/ga.js"], script[src*="google-analytics.com/analytics.js"]'
  ).each((_, element) => {
    analyticsInfo.googleAnalytics.present = true
  })

  // Google Tag Manager Detection
  const gtmMatches = html.match(/GTM-[A-Z0-9]+/g)
  if (gtmMatches) {
    analyticsInfo.googleTagManager.present = true
    analyticsInfo.googleTagManager.containerIds = Array.from(new Set(gtmMatches)) // Remove duplicates
  }

  // Check for GTM script tags and noscript tags
  $('script[src*="googletagmanager.com/gtm.js"]').each((_, element) => {
    analyticsInfo.googleTagManager.present = true
  })

  // Other Analytics Tools Detection
  const otherAnalyticsTools = [
    {
      name: 'Facebook Pixel',
      patterns: [/fbevents\.js/, /fbq\(/],
      scriptSrc: ['connect.facebook.net/en_US/fbevents.js']
    },
    {
      name: 'Adobe Analytics',
      patterns: [/s_code\.js/, /omniture/, /Adobe\.Analytics/],
      scriptSrc: ['metrics.adobe.com', 'omtrdc.net']
    },
    {
      name: 'Hotjar',
      patterns: [/hotjar/, /hj\(/],
      scriptSrc: ['static.hotjar.com']
    },
    {
      name: 'Mixpanel',
      patterns: [/mixpanel/, /mp_lib/],
      scriptSrc: ['cdn.mxpnl.com']
    },
    {
      name: 'Segment',
      patterns: [/analytics\.js/, /analytics\.track/],
      scriptSrc: ['cdn.segment.com']
    },
    {
      name: 'Heap Analytics',
      patterns: [/heap\.load/, /heapanalytics/],
      scriptSrc: ['heapanalytics.com']
    },
    {
      name: 'Amplitude',
      patterns: [/amplitude/, /amplitude\.init/],
      scriptSrc: ['amplitude.com']
    },
    {
      name: 'Plausible',
      patterns: [/plausible/],
      scriptSrc: ['plausible.io']
    },
    {
      name: 'Fathom Analytics',
      patterns: [/fathom/],
      scriptSrc: ['cdn.usefathom.com']
    }
  ]

  otherAnalyticsTools.forEach(tool => {
    let detected = false
    let details = ''

    // Check for patterns in HTML content
    tool.patterns.forEach(pattern => {
      if (pattern.test(html)) {
        detected = true
      }
    })

    // Check for script sources
    tool.scriptSrc.forEach(src => {
      $(`script[src*="${src}"]`).each((_, element) => {
        detected = true
        const scriptSrc = $(element).attr('src')
        if (scriptSrc) {
          details = `Found script: ${scriptSrc}`
        }
      })
    })

    analyticsInfo.otherAnalytics.push({
      name: tool.name,
      detected,
      details: details || undefined
    })
  })

  return analyticsInfo
}

export async function GET (request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get('url')

  if (!url) {
    return NextResponse.json(
      { success: false, error: 'URL parameter is required' },
      { status: 400 }
    )
  }

  try {
    // Validate and normalize URL
    const targetUrl = new URL(url)

    // Make HTTP request with proper headers and SSL handling
    const startTime = Date.now()
    const response = await axios.get(targetUrl.toString(), {
      timeout: 10000,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        Connection: 'keep-alive'
      },
      // Handle SSL certificate issues gracefully
      httpsAgent: new (require('https').Agent)({
        rejectUnauthorized: false, // Accept self-signed certificates
        requestCert: false,
        agent: false
      }),
      // Allow redirects and validate status codes broadly
      maxRedirects: 5,
      validateStatus: function (status) {
        return status >= 200 && status < 400; // Accept 2xx and 3xx status codes
      }
    })
    const loadTime = Date.now() - startTime

    const html = response.data
    const $ = cheerio.load(html)

    // Extract SEO metadata
    const seo = {
      title: $('title').first().text().trim() || undefined,
      description: $('meta[name="description"]').attr('content') || undefined,
      keywords: $('meta[name="keywords"]').attr('content') || undefined,
      canonical: $('link[rel="canonical"]').attr('href') || undefined,
      language:
        $('html').attr('lang') ||
        $('meta[http-equiv="content-language"]').attr('content') ||
        undefined,
      viewport: $('meta[name="viewport"]').attr('content') || undefined,
      robots: $('meta[name="robots"]').attr('content') || undefined,
      author: $('meta[name="author"]').attr('content') || undefined
    }

    // Extract Open Graph metadata
    const openGraph = {
      title: $('meta[property="og:title"]').attr('content') || undefined,
      description:
        $('meta[property="og:description"]').attr('content') || undefined,
      image: $('meta[property="og:image"]').attr('content') || undefined,
      imageAlt: $('meta[property="og:image:alt"]').attr('content') || undefined,
      imageWidth:
        $('meta[property="og:image:width"]').attr('content') || undefined,
      imageHeight:
        $('meta[property="og:image:height"]').attr('content') || undefined,
      url: $('meta[property="og:url"]').attr('content') || undefined,
      type: $('meta[property="og:type"]').attr('content') || undefined,
      siteName: $('meta[property="og:site_name"]').attr('content') || undefined,
      locale: $('meta[property="og:locale"]').attr('content') || undefined
    }

    // Extract Twitter Card metadata
    const twitterCard = {
      card: $('meta[name="twitter:card"]').attr('content') || undefined,
      title: $('meta[name="twitter:title"]').attr('content') || undefined,
      description:
        $('meta[name="twitter:description"]').attr('content') || undefined,
      image: $('meta[name="twitter:image"]').attr('content') || undefined,
      imageAlt:
        $('meta[name="twitter:image:alt"]').attr('content') || undefined,
      site: $('meta[name="twitter:site"]').attr('content') || undefined,
      creator: $('meta[name="twitter:creator"]').attr('content') || undefined
    }

    // Extract icons
    const icons: Array<{
      href: string
      sizes?: string
      type?: string
      rel: string
    }> = []

    // Favicon and various icon types
    $(
      'link[rel*="icon"], link[rel="apple-touch-icon"], link[rel="mask-icon"]'
    ).each((_, element) => {
      const href = $(element).attr('href')
      const rel = $(element).attr('rel')
      if (href && rel) {
        icons.push({
          href: new URL(href, targetUrl).toString(),
          sizes: $(element).attr('sizes') || undefined,
          type: $(element).attr('type') || undefined,
          rel
        })
      }
    })

    // Extract technical metadata
    const technical = {
      charset:
        $('meta[charset]').attr('charset') ||
        $('meta[http-equiv="content-type"]')
          .attr('content')
          ?.match(/charset=([^;]+)/)?.[1] ||
        undefined,
      themeColor: $('meta[name="theme-color"]').attr('content') || undefined,
      manifestUrl: $('link[rel="manifest"]').attr('href')
        ? new URL($('link[rel="manifest"]').attr('href')!, targetUrl).toString()
        : undefined,
      generator: $('meta[name="generator"]').attr('content') || undefined,
      referrer: $('meta[name="referrer"]').attr('content') || undefined,
      appleTouchIcon: $('link[rel="apple-touch-icon"]').attr('href')
        ? new URL(
            $('link[rel="apple-touch-icon"]').attr('href')!,
            targetUrl
          ).toString()
        : undefined,
      appleItunes:
        $('meta[name="apple-itunes-app"]').attr('content') || undefined,
      msapplicationConfig:
        $('meta[name="msapplication-config"]').attr('content') || undefined,
      doctype: html.match(/<!DOCTYPE\s+[^>]+>/i)?.[0] || undefined
    }

    // Extract structured data (JSON-LD)
    const structuredData: Array<{ type: string; data: Record<string, unknown> }> = []
    $('script[type="application/ld+json"]').each((_, element) => {
      try {
        const data = JSON.parse($(element).html() || '{}') as Record<string, unknown>
        if (data['@type'] && typeof data['@type'] === 'string') {
          structuredData.push({
            type: data['@type'],
            data
          })
        }
      } catch (e) {
        // Ignore invalid JSON-LD
      }
    })

    // Extract performance metrics
    const performance = {
      loadTime,
      responseTime: loadTime,
      contentLength: Buffer.byteLength(html, 'utf8'),
      statusCode: response.status
    }

    // Extract response headers
    const headers = {
      server: response.headers['server'] || undefined,
      contentType: response.headers['content-type'] || undefined,
      contentEncoding: response.headers['content-encoding'] || undefined,
      cacheControl: response.headers['cache-control'] || undefined,
      lastModified: response.headers['last-modified'] || undefined,
      etag: response.headers['etag'] || undefined,
      xFrameOptions: response.headers['x-frame-options'] || undefined,
      contentSecurityPolicy:
        response.headers['content-security-policy'] || undefined,
      strictTransportSecurity:
        response.headers['strict-transport-security'] || undefined,
      xContentTypeOptions: response.headers['x-content-type-options'] || undefined
    }

    // Extract sitemap information (run in parallel with analytics)
    const [sitemapInfo, analyticsInfo] = await Promise.all([
      extractSitemapInfo(targetUrl, $),
      Promise.resolve(extractAnalyticsInfo($, html))
    ])

    const metadata: WebsiteMetadata = {
      url: targetUrl.toString(),
      seo,
      openGraph,
      twitterCard,
      icons,
      technical,
      performance,
      headers,
      structuredData,
      sitemap: sitemapInfo,
      analytics: analyticsInfo,
      extractedAt: new Date().toISOString()
    }

    const apiResponse: MetadataAPIResponse = {
      success: true,
      data: metadata
    }

    return NextResponse.json(apiResponse)
  } catch (error) {
    console.error('Metadata extraction error:', error)

    // Check if this is a 401 authentication error
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as any
      if (axiosError.response?.status === 401) {
        const apiResponse: MetadataAPIResponse = {
          success: false,
          error: 'Authentication required',
          status: 401
        }
        return NextResponse.json(apiResponse, { status: 200 }) // Return 200 so frontend can handle it
      }
    }

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred'

    const apiResponse: MetadataAPIResponse = {
      success: false,
      error: `Failed to extract metadata: ${errorMessage}`
    }

    return NextResponse.json(apiResponse, { status: 500 })
  }
}

// Enable CORS for cross-origin requests
export async function OPTIONS () {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  })
}
