import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import * as cheerio from 'cheerio'
import { WebsiteMetadata, MetadataAPIResponse } from '@/types/metadata'

export async function GET(request: NextRequest) {
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
    
    // Make HTTP request with proper headers
    const startTime = Date.now()
    const response = await axios.get(targetUrl.toString(), {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
      },
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
      language: $('html').attr('lang') || $('meta[http-equiv="content-language"]').attr('content') || undefined,
      viewport: $('meta[name="viewport"]').attr('content') || undefined,
      robots: $('meta[name="robots"]').attr('content') || undefined,
      author: $('meta[name="author"]').attr('content') || undefined,
    }

    // Extract Open Graph metadata
    const openGraph = {
      title: $('meta[property="og:title"]').attr('content') || undefined,
      description: $('meta[property="og:description"]').attr('content') || undefined,
      image: $('meta[property="og:image"]').attr('content') || undefined,
      imageAlt: $('meta[property="og:image:alt"]').attr('content') || undefined,
      imageWidth: $('meta[property="og:image:width"]').attr('content') || undefined,
      imageHeight: $('meta[property="og:image:height"]').attr('content') || undefined,
      url: $('meta[property="og:url"]').attr('content') || undefined,
      type: $('meta[property="og:type"]').attr('content') || undefined,
      siteName: $('meta[property="og:site_name"]').attr('content') || undefined,
      locale: $('meta[property="og:locale"]').attr('content') || undefined,
    }

    // Extract Twitter Card metadata
    const twitterCard = {
      card: $('meta[name="twitter:card"]').attr('content') || undefined,
      title: $('meta[name="twitter:title"]').attr('content') || undefined,
      description: $('meta[name="twitter:description"]').attr('content') || undefined,
      image: $('meta[name="twitter:image"]').attr('content') || undefined,
      imageAlt: $('meta[name="twitter:image:alt"]').attr('content') || undefined,
      site: $('meta[name="twitter:site"]').attr('content') || undefined,
      creator: $('meta[name="twitter:creator"]').attr('content') || undefined,
    }

    // Extract icons
    const icons: Array<{href: string, sizes?: string, type?: string, rel: string}> = []
    
    // Favicon and various icon types
    $('link[rel*="icon"], link[rel="apple-touch-icon"], link[rel="mask-icon"]').each((_, element) => {
      const href = $(element).attr('href')
      const rel = $(element).attr('rel')
      if (href && rel) {
        icons.push({
          href: new URL(href, targetUrl).toString(),
          sizes: $(element).attr('sizes') || undefined,
          type: $(element).attr('type') || undefined,
          rel,
        })
      }
    })

    // Extract technical metadata
    const technical = {
      charset: $('meta[charset]').attr('charset') || $('meta[http-equiv="content-type"]').attr('content')?.match(/charset=([^;]+)/)?.[1] || undefined,
      themeColor: $('meta[name="theme-color"]').attr('content') || undefined,
      manifestUrl: $('link[rel="manifest"]').attr('href') ? new URL($('link[rel="manifest"]').attr('href')!, targetUrl).toString() : undefined,
      generator: $('meta[name="generator"]').attr('content') || undefined,
      referrer: $('meta[name="referrer"]').attr('content') || undefined,
      appleTouchIcon: $('link[rel="apple-touch-icon"]').attr('href') ? new URL($('link[rel="apple-touch-icon"]').attr('href')!, targetUrl).toString() : undefined,
      appleItunes: $('meta[name="apple-itunes-app"]').attr('content') || undefined,
      msapplicationConfig: $('meta[name="msapplication-config"]').attr('content') || undefined,
    }

    // Extract structured data (JSON-LD)
    const structuredData: Array<{type: string, data: any}> = []
    $('script[type="application/ld+json"]').each((_, element) => {
      try {
        const data = JSON.parse($(element).html() || '{}')
        if (data['@type']) {
          structuredData.push({
            type: data['@type'],
            data,
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
      statusCode: response.status,
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
      contentSecurityPolicy: response.headers['content-security-policy'] || undefined,
      strictTransportSecurity: response.headers['strict-transport-security'] || undefined,
    }

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
      extractedAt: new Date().toISOString(),
    }

    const apiResponse: MetadataAPIResponse = {
      success: true,
      data: metadata,
    }

    return NextResponse.json(apiResponse)
  } catch (error) {
    console.error('Metadata extraction error:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    
    const apiResponse: MetadataAPIResponse = {
      success: false,
      error: `Failed to extract metadata: ${errorMessage}`,
    }

    return NextResponse.json(apiResponse, { status: 500 })
  }
}

// Enable CORS for cross-origin requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}