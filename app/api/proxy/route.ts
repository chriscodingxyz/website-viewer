import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import * as cheerio from 'cheerio'
import https from 'https'
import http from 'http'
import {
  getProxiedUrl,
  getProxiedSrcset,
  rewriteCssUrls
} from '@/lib/proxy/rewrite'
import { buildInjectedScript } from '@/lib/proxy/inject'

// Keep-alive agents shared across requests so repeated fetches to the same
// upstream skip TCP/TLS handshakes.
const httpsAgent = new https.Agent({ keepAlive: true, rejectUnauthorized: false })
const httpAgent = new http.Agent({ keepAlive: true })

const HTML_CACHE_CONTROL = 'public, max-age=0, s-maxage=60, stale-while-revalidate=300'
const CODE_CACHE_CONTROL = 'public, max-age=300, s-maxage=86400, stale-while-revalidate=604800'
const ASSET_CACHE_CONTROL = 'public, max-age=3600, s-maxage=604800, immutable'

// Attributes that contain a single URL.
const URL_ATTRS = [
  'src', 'href', 'action', 'poster', 'data',
  'data-src', 'data-href', 'data-original', 'data-lazy-src', 'data-url',
  'data-basepath', 'data-inline-media-basepath', 'data-anim-lazy-image'
]
const SRCSET_ATTRS = ['srcset', 'data-srcset']

export async function GET (request: NextRequest) {
  return proxyRequest(request, 'GET')
}

// SPA pages POST to their own APIs (GraphQL, server actions, form handlers).
// The injected fetch/XHR patches and the service worker route those calls
// here with the original method and body.
export async function POST (request: NextRequest) {
  return proxyRequest(request, 'POST')
}

async function proxyRequest (request: NextRequest, method: 'GET' | 'POST') {
  const { searchParams } = new URL(request.url)
  const targetUrl = searchParams.get('url')

  if (!targetUrl) {
    return NextResponse.json(
      { success: false, error: 'URL parameter is required' },
      { status: 400 }
    )
  }

  try {
    const streamableMediaPattern = /\.(mp4|webm|mov|m4v|ogv|mp3|wav|ogg|m4a|aac)(?:$|[?#])/i
    const requestHeaders: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': '*/*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
    }

    const rangeHeader = request.headers.get('range')
    if (rangeHeader) {
      requestHeaders.Range = rangeHeader
    }

    if (method === 'POST') {
      const contentTypeHeader = request.headers.get('content-type')
      if (contentTypeHeader) requestHeaders['Content-Type'] = contentTypeHeader
      const body = Buffer.from(await request.arrayBuffer())

      const upstream = await axios.post(targetUrl, body, {
        timeout: 12000,
        headers: requestHeaders,
        maxRedirects: 5,
        httpsAgent,
        httpAgent,
        responseType: 'arraybuffer',
        validateStatus: () => true
      })

      const upstreamType = upstream.headers['content-type'] || 'application/octet-stream'
      return new NextResponse(Buffer.from(upstream.data), {
        status: upstream.status,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Cross-Origin-Resource-Policy': 'cross-origin',
          'Content-Type': upstreamType,
          'Cache-Control': 'no-store'
        }
      })
    }

    if (streamableMediaPattern.test(targetUrl)) {
      const upstreamResponse = await fetch(targetUrl, {
        headers: requestHeaders,
        redirect: 'follow'
      })

      const headers: Record<string, string> = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Expose-Headers': 'Content-Length, Content-Range, Accept-Ranges',
        'Cross-Origin-Resource-Policy': 'cross-origin',
        'X-Frame-Options': 'ALLOWALL',
        'Content-Security-Policy': 'frame-ancestors *'
      }

      const passthroughHeaders = [
        'accept-ranges',
        'cache-control',
        'content-length',
        'content-range',
        'content-type',
        'etag',
        'last-modified'
      ]

      passthroughHeaders.forEach(header => {
        const value = upstreamResponse.headers.get(header)
        if (value) {
          headers[header] = value
        }
      })

      return new NextResponse(upstreamResponse.body, {
        status: upstreamResponse.status,
        headers
      })
    }

    // Fetch the target content
    const response = await axios.get(targetUrl, {
      timeout: 12000,
      headers: requestHeaders,
      maxRedirects: 5,
      httpsAgent,
      httpAgent,
      responseType: 'arraybuffer', // Handle binary data
      validateStatus: status => status >= 200 && status < 400
    })

    const contentType = response.headers['content-type'] || 'text/html'
    const buffer = Buffer.from(response.data)

    const getPassthroughHeaders = (
      overrides: Record<string, string> = {},
      options: { includeEntityHeaders?: boolean } = {}
    ) => {
      const includeEntityHeaders = options.includeEntityHeaders ?? true
      const headers: Record<string, string> = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Expose-Headers': 'Content-Length, Content-Range, Accept-Ranges',
        'Cross-Origin-Resource-Policy': 'cross-origin',
        ...overrides
      }

      const contentLength = response.headers['content-length']
      const contentRange = response.headers['content-range']
      const acceptRanges = response.headers['accept-ranges']

      if (includeEntityHeaders) {
        if (contentLength) headers['Content-Length'] = String(contentLength)
        if (contentRange) headers['Content-Range'] = String(contentRange)
        if (acceptRanges) headers['Accept-Ranges'] = String(acceptRanges)
      }

      return headers
    }

    // 1. Handle HTML
    if (contentType.includes('text/html')) {
      const originalHtml = buffer.toString('utf-8')
      const $ = cheerio.load(originalHtml)

      // Strip security headers in meta tags
      $('meta[http-equiv="Content-Security-Policy"]').remove()
      $('meta[http-equiv="X-Frame-Options"]').remove()
      $('meta[http-equiv="frame-options"]').remove()

      // Rewritten resource bytes no longer match SRI hashes; strip them so the
      // browser doesn't refuse to apply scripts/styles.
      $('[integrity]').removeAttr('integrity')
      $('[crossorigin]').removeAttr('crossorigin')

      // A <base> tag would change relative resolution after rewriting; fold it
      // into the resolution context and drop the tag.
      const baseHref = $('base[href]').attr('href')
      let resolutionBase = targetUrl
      if (baseHref) {
        try {
          resolutionBase = new URL(baseHref, targetUrl).toString()
        } catch {}
      }
      $('base').remove()

      // Rewrite URL-bearing attributes per element. Script/style CONTENT is
      // never touched: hydration payloads (__NEXT_DATA__ etc.) must pass
      // through byte-identical or client frameworks fail to attach handlers.
      $('*').each((_, el) => {
        const $el = $(el)
        for (const attr of URL_ATTRS) {
          const val = $el.attr(attr)
          if (val) $el.attr(attr, getProxiedUrl(val, resolutionBase))
        }
        for (const attr of SRCSET_ATTRS) {
          const val = $el.attr(attr)
          if (val) $el.attr(attr, getProxiedSrcset(val, resolutionBase))
        }
        const style = $el.attr('style')
        if (style && style.toLowerCase().includes('url(')) {
          $el.attr('style', rewriteCssUrls(style, resolutionBase))
        }
      })

      // Meta refresh redirects.
      $('meta[http-equiv="refresh" i]').each((_, el) => {
        const content = $(el).attr('content')
        if (!content) return
        const match = content.match(/^(\s*\d+\s*;\s*url\s*=\s*)(.+)$/i)
        if (match) {
          $(el).attr('content', `${match[1]}${getProxiedUrl(match[2].trim(), resolutionBase)}`)
        }
      })

      // CSS inside <style> tags references URLs relative to the stylesheet
      // context, which has changed - rewrite them.
      $('style').each((_, el) => {
        const css = $(el).text()
        $(el).text(rewriteCssUrls(css, resolutionBase))
      })

      // Inject navigation/network interception + preview applier.
      $('head').prepend(buildInjectedScript(targetUrl))

      return new NextResponse($.html(), {
        status: 200,
        headers: getPassthroughHeaders({
          'Content-Type': 'text/html; charset=utf-8',
          'X-Frame-Options': 'ALLOWALL',
          'Content-Security-Policy': 'frame-ancestors *',
          'Cache-Control': HTML_CACHE_CONTROL
        }, { includeEntityHeaders: false })
      })
    }

    // 2. Handle CSS (urls resolve relative to the stylesheet, whose URL
    // context changed - must rewrite).
    if (contentType.includes('text/css')) {
      const css = buffer.toString('utf-8')
      return new NextResponse(rewriteCssUrls(css, targetUrl), {
        status: 200,
        headers: getPassthroughHeaders({
          'Content-Type': 'text/css',
          'Cache-Control': CODE_CACHE_CONTROL
        }, { includeEntityHeaders: false })
      })
    }

    // 3. Handle JavaScript: served byte-identical. URL routing happens at
    // runtime (injected script + service worker), never by editing JS source.
    if (
      contentType.includes('application/javascript') ||
      contentType.includes('text/javascript') ||
      contentType.includes('application/x-javascript')
    ) {
      return new NextResponse(buffer, {
        status: 200,
        headers: getPassthroughHeaders({
          'Content-Type': contentType,
          'Cache-Control': CODE_CACHE_CONTROL
        }, { includeEntityHeaders: false })
      })
    }

    // 4. Handle everything else (images, fonts, etc.)
    return new NextResponse(buffer, {
      status: response.status,
      headers: getPassthroughHeaders({
        'Content-Type': contentType,
        'Cache-Control': ASSET_CACHE_CONTROL,
      })
    })

  } catch (error: any) {
    console.error('Proxy error:', error.message)
    return NextResponse.json(
      { success: false, error: `Failed to proxy: ${error.message}` },
      { status: 500 }
    )
  }
}

export async function OPTIONS () {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': '*'
    }
  })
}
