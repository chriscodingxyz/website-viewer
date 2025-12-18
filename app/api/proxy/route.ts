import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import * as cheerio from 'cheerio'

export async function GET (request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const targetUrl = searchParams.get('url')

  if (!targetUrl) {
    return NextResponse.json(
      { success: false, error: 'URL parameter is required' },
      { status: 400 }
    )
  }

  try {
    const url = new URL(targetUrl)
    const origin = url.origin
    const baseUrl = `${url.protocol}//${url.host}${url.pathname.substring(0, url.pathname.lastIndexOf('/') + 1)}`

    // Fetch the target content
    const response = await axios.get(targetUrl, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      },
      maxRedirects: 10,
      // Handle SSL certs gracefully for dev environments
      httpsAgent: new (require('https').Agent)({
        rejectUnauthorized: false
      }),
      responseType: 'arraybuffer' // Handle binary data
    })

    const contentType = response.headers['content-type'] || 'text/html'
    const buffer = Buffer.from(response.data)

    // Helper to rewrite URLs to point back to this proxy
    const getProxiedUrl = (original: string, contextUrl: string) => {
      if (!original || typeof original !== 'string') return original
      const trimmed = original.trim()
      
      if (trimmed === '' || 
          trimmed.startsWith('data:') || 
          trimmed.startsWith('blob:') || 
          trimmed.startsWith('javascript:') ||
          trimmed.startsWith('/api/proxy?url=')) {
         return original
      }
      
      try {
        let urlToProxy = trimmed
        if (urlToProxy.startsWith('//')) {
          urlToProxy = `https:${urlToProxy}`
        }
        
        const absolute = new URL(urlToProxy, contextUrl).toString()
        return `/api/proxy?url=${encodeURIComponent(absolute)}`
      } catch (e) {
        return original
      }
    }

    // Helper to rewrite srcset attributes
    const getProxiedSrcset = (srcset: string, contextUrl: string) => {
      if (!srcset || typeof srcset !== 'string') return srcset
      return srcset.split(/,(?=\s+|$)/).map(part => {
        const trimmed = part.trim()
        if (trimmed.startsWith('data:')) return trimmed
        
        const parts = trimmed.split(/\s+/)
        if (parts.length === 0) return part
        
        const url = parts[0]
        const rest = parts.slice(1).join(' ')
        return `${getProxiedUrl(url, contextUrl)} ${rest}`.trim()
      }).join(', ')
    }

    // Helper to rewrite CSS content
    const rewriteCssUrls = (css: string, contextUrl: string) => {
      if (!css || typeof css !== 'string') return css
      
      // 1. Rewrite url(...)
      let rewritten = css.replace(/url\s*\(\s*(['"]?)([^'"\)]+)\1\s*\)/gi, (match, quote, p1) => {
        return `url("${getProxiedUrl(p1.trim(), contextUrl)}")`
      })
      
      // 2. Rewrite @import
      rewritten = rewritten.replace(/@import\s+(?:url\s*\(\s*)?(['"]?)([^'"\)]+)\1\s*\)?/gi, (match, quote, p1) => {
        if (match.toLowerCase().includes('url')) return match 
        return `@import "${getProxiedUrl(p1.trim(), contextUrl)}"`
      })
      
      return rewritten
    }

    // 1. Handle HTML
    if (contentType.includes('text/html')) {
      const originalHtml = buffer.toString('utf-8')
      const $ = cheerio.load(originalHtml)

      // Strip security headers in meta tags
      $('meta[http-equiv="Content-Security-Policy"]').remove()
      $('meta[http-equiv="X-Frame-Options"]').remove()
      $('meta[http-equiv="frame-options"]').remove()

      // Handle CSS inside style tags before we do global regex
      $('style').each((_, el) => {
        const css = $(el).text()
        $(el).text(rewriteCssUrls(css, targetUrl))
      })

      // Framebusting protection
      const framebusterScript = `
        <script>
          (function() {
            try {
              window.frameElement = { "id": "proxied-frame", "nodeName": "IFRAME" };
              Object.defineProperty(window, 'top', { get: function() { return window.self; } });
              Object.defineProperty(window, 'parent', { get: function() { return window.self; } });
              window.onbeforeunload = function() { return null; };
              window.onunload = function() {};
              window.self.location.replace = function(url) { console.log('Blocked redirect'); };
            } catch (e) {}
          })();
        </script>
      `
      $('head').prepend(framebusterScript)

      // Get HTML string and do global Regex replacement for attributes
      let processedHtml = $.html()
      
      // List of attributes that usually contain URLs
      const urlAttrs = [
        'src', 'href', 'srcset', 'action', 'poster', 'data',
        'data-src', 'data-href', 'data-srcset', 'data-original', 
        'data-lazy-src', 'data-url', 'data-basepath', 
        'data-inline-media-basepath', 'data-anim-lazy-image'
      ]
      
      // Regex to find attributes: attr="value" or attr='value'
      // We use a non-greedy catch for the value to avoid over-matching
      urlAttrs.forEach(attr => {
        const regex = new RegExp(`(\\s${attr})\\s*=\\s*(['"])([^'"]+)\\2`, 'gi')
        processedHtml = processedHtml.replace(regex, (match, attrPart, quote, val) => {
          if (attr.includes('srcset')) {
            return `${attrPart}=${quote}${getProxiedSrcset(val, targetUrl)}${quote}`
          } else {
            return `${attrPart}=${quote}${getProxiedUrl(val, targetUrl)}${quote}`
          }
        })
      })
      
      // Final pass for inline styles (which were missed by basic global attr regex because they contain quotes)
      processedHtml = processedHtml.replace(/(\sstyle)\s*=\s*(['"])([^'"]+)\2/gi, (match, attrPart, quote, val) => {
        return `${attrPart}=${quote}${rewriteCssUrls(val, targetUrl)}${quote}`
      })

      return new NextResponse(processedHtml, {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
          'X-Frame-Options': 'ALLOWALL',
          'Content-Security-Policy': "frame-ancestors *",
          'Access-Control-Allow-Headers': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        }
      })
    }

    // 2. Handle JavaScript
    if (contentType.includes('application/javascript') || contentType.includes('text/javascript')) {
      let js = buffer.toString('utf-8')
      js = js.replace(/\bwindow\.top\b/g, 'window.self')
      js = js.replace(/\bwindow\.parent\b/g, 'window.self')
      js = js.replace(/\btop\.location\b/g, 'self.location')
      js = js.replace(/\bparent\.location\b/g, 'self.location')
      
      return new NextResponse(js, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Access-Control-Allow-Origin': '*',
        }
      })
    }

    // 3. Handle CSS
    if (contentType.includes('text/css')) {
      const css = buffer.toString('utf-8')
      return new NextResponse(rewriteCssUrls(css, targetUrl), {
        status: 200,
        headers: {
          'Content-Type': 'text/css',
          'Access-Control-Allow-Origin': '*',
        }
      })
    }

    // 3. Handle everything else (images, fonts, scripts, etc.)
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=3600',
      }
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
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  })
}
