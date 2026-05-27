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
      timeout: 15000,
      headers: requestHeaders,
      maxRedirects: 10,
      // Handle SSL certs gracefully for dev environments
      httpsAgent: new (require('https').Agent)({
        rejectUnauthorized: false
      }),
      responseType: 'arraybuffer', // Handle binary data
      validateStatus: status => status >= 200 && status < 400
    })

    const contentType = response.headers['content-type'] || 'text/html'
    const buffer = Buffer.from(response.data)

    // Helper to rewrite URLs to point back to this proxy
    const getProxiedUrl = (original: string, contextUrl: string) => {
      if (!original || typeof original !== 'string') return original
      const trimmed = original.trim().replace(/&amp;/g, '&')
      
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

    const rewriteJavaScriptUrls = (js: string, contextUrl: string) => {
      if (!js || typeof js !== 'string') return js

      const rootPathPattern = /(["'`])(\/(?:_next|api|images|videos|fonts|assets|static|media|favicon\.ico|robots\.txt|sitemap(?:_index)?\.xml|sitemaps?\.xml)[^"'`\\]*)\1/g
      const escapedRootPathPattern = /\\(["'`])(\/(?:_next|api|images|videos|fonts|assets|static|media|favicon\.ico|robots\.txt|sitemap(?:_index)?\.xml|sitemaps?\.xml)[^"'`\\]*)\\\1/g

      return js
        .replace(rootPathPattern, (_match, quote, path) => {
          return `${quote}${getProxiedUrl(path, contextUrl)}${quote}`
        })
        .replace(escapedRootPathPattern, (_match, quote, path) => {
          return `\\${quote}${getProxiedUrl(path, contextUrl)}\\${quote}`
        })
    }

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

      // Handle CSS inside style tags before we do global regex
      $('style').each((_, el) => {
        const css = $(el).text()
        $(el).text(rewriteCssUrls(css, targetUrl))
      })

      $('script:not([src])').each((_, el) => {
        const script = $(el).html()
        if (script) {
          $(el).html(rewriteJavaScriptUrls(script, targetUrl))
        }
      })

      // Framebusting protection + in-iframe navigation interceptor.
      // Keeps anchor clicks, history.pushState/replaceState, and meta
      // refreshes routed back through the proxy so navigation stays
      // inside the rendered preview.
      const targetOrigin = new URL(targetUrl).origin
      const framebusterScript = `
        <script>
          (function() {
            var PROXY_PREFIX = '/api/proxy?url=';
            var TARGET_ORIGIN = ${JSON.stringify(targetOrigin)};
            var TARGET_URL = ${JSON.stringify(targetUrl)};
            var REAL_PARENT = window.parent;

            function toTargetUrl(url) {
              if (url == null) return TARGET_URL;
              try { url = String(url); } catch (e) { return TARGET_URL; }
              if (!url || url.charAt(0) === '#') return TARGET_URL;
              try {
                var proxied = new URL(url, window.location.href);
                if (proxied.pathname === '/api/proxy' && proxied.searchParams.get('url')) {
                  return proxied.searchParams.get('url') || TARGET_URL;
                }
              } catch (e) {}
              if (url.indexOf(PROXY_PREFIX) === 0) {
                try {
                  var relativeProxied = new URL(url, window.location.href);
                  return relativeProxied.searchParams.get('url') || TARGET_URL;
                } catch (e) { return TARGET_URL; }
              }
              try {
                var abs = new URL(url, TARGET_URL).toString();
                return abs;
              } catch (e) { return TARGET_URL; }
            }

            function notifyPage(url) {
              try {
                var target = toTargetUrl(url);
                window.__BUGSMASH_TARGET_URL__ = target;
                if (REAL_PARENT && REAL_PARENT !== window) {
                  REAL_PARENT.postMessage({
                    source: 'bugsmash-proxy',
                    type: 'url-change',
                    url: target
                  }, '*');
                }
              } catch (e) {}
            }

            function toProxy(url) {
              if (url == null) return url;
              try { url = String(url); } catch (e) { return url; }
              if (!url || url.indexOf(PROXY_PREFIX) === 0) return url;
              if (url.indexOf('data:') === 0 || url.indexOf('blob:') === 0 || url.indexOf('javascript:') === 0 || url.indexOf('mailto:') === 0 || url.indexOf('tel:') === 0 || url.charAt(0) === '#') return url;
              try {
                var abs = new URL(url, TARGET_URL).toString();
                return PROXY_PREFIX + encodeURIComponent(abs);
              } catch (e) { return url; }
            }

            try {
              window.frameElement = { "id": "proxied-frame", "nodeName": "IFRAME" };
              Object.defineProperty(window, 'top', { get: function() { return window.self; } });
              Object.defineProperty(window, 'parent', { get: function() { return window.self; } });
              window.onbeforeunload = function() { return null; };
              window.onunload = function() {};
            } catch (e) {}

            // Intercept anchor clicks (capture phase before site handlers).
            document.addEventListener('click', function(e) {
              if (e.defaultPrevented || e.button !== 0) return;
              if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
              var node = e.target;
              while (node && node !== document) {
                if (node.tagName === 'A' && node.getAttribute('href')) {
                  var href = node.getAttribute('href');
                  if (!href || href.charAt(0) === '#' || href.indexOf('javascript:') === 0 || href.indexOf('mailto:') === 0 || href.indexOf('tel:') === 0) return;
                  if (node.target && node.target !== '_self') return;
                  e.preventDefault();
                  e.stopPropagation();
                  notifyPage(href);
                  window.location.href = toProxy(href);
                  return;
                }
                node = node.parentNode;
              }
            }, true);

            // Wrap history navigation so SPA routes stay proxied.
            try {
              var _push = history.pushState;
              history.pushState = function(state, title, url) {
                if (url != null) {
                  notifyPage(url);
                  url = toProxy(url);
                }
                return _push.call(this, state, title, url);
              };
              var _replace = history.replaceState;
              history.replaceState = function(state, title, url) {
                if (url != null) {
                  notifyPage(url);
                  url = toProxy(url);
                }
                return _replace.call(this, state, title, url);
              };
            } catch (e) {}

            // Intercept window.location.assign / replace.
            try {
              var _assign = window.location.assign && window.location.assign.bind(window.location);
              if (_assign) {
                window.location.assign = function(url) {
                  notifyPage(url);
                  return _assign(toProxy(url));
                };
              }
              var _locReplace = window.location.replace && window.location.replace.bind(window.location);
              if (_locReplace) {
                window.location.replace = function(url) {
                  notifyPage(url);
                  return _locReplace(toProxy(url));
                };
              }
            } catch (e) {}

            // Form submissions with action attribute.
            document.addEventListener('submit', function(e) {
              var form = e.target;
              if (!form || form.tagName !== 'FORM') return;
              var action = form.getAttribute('action');
              if (action && action.indexOf(PROXY_PREFIX) !== 0) {
                form.setAttribute('action', toProxy(action));
                notifyPage(action);
              }
            }, true);

            window.addEventListener('popstate', function() {
              notifyPage(window.location.href);
            });

            // ---- Preview mode applier ----
            var PREVIEW_ATTR = 'data-bugsmash-preview';

            function clearPreview() {
              var marked = document.querySelectorAll('[' + PREVIEW_ATTR + ']');
              Array.prototype.forEach.call(marked, function(el) {
                var state = el.getAttribute(PREVIEW_ATTR);
                if (state === 'removed') {
                  el.style.display = el.getAttribute('data-bugsmash-original-display') || '';
                }
                if (state === 'text-replaced') {
                  var origText = el.getAttribute('data-bugsmash-original-text');
                  if (origText != null) el.textContent = origText;
                }
                if (state === 'image-replaced') {
                  var origSrc = el.getAttribute('data-bugsmash-original-src');
                  if (origSrc != null) el.setAttribute('src', origSrc);
                }
                if (state === 'alt-updated') {
                  var origAlt = el.getAttribute('data-bugsmash-original-alt');
                  if (origAlt != null) el.setAttribute('alt', origAlt);
                }
                if (state === 'link-updated') {
                  var origHref = el.getAttribute('data-bugsmash-original-href');
                  if (origHref != null) el.setAttribute('href', origHref);
                }
                el.style.outline = el.getAttribute('data-bugsmash-original-outline') || '';
                el.style.outlineOffset = '';
                el.removeAttribute(PREVIEW_ATTR);
                el.removeAttribute('data-bugsmash-original-text');
                el.removeAttribute('data-bugsmash-original-src');
                el.removeAttribute('data-bugsmash-original-alt');
                el.removeAttribute('data-bugsmash-original-href');
                el.removeAttribute('data-bugsmash-original-display');
                el.removeAttribute('data-bugsmash-original-outline');
              });
            }

            function highlight(el, color) {
              el.setAttribute('data-bugsmash-original-outline', el.style.outline || '');
              el.style.outline = '2px dashed ' + color;
              el.style.outlineOffset = '2px';
            }

            function applyPreview(pins, showDiff) {
              clearPreview();
              pins.forEach(function(pin) {
                if (!pin || !pin.cssSelector) return;
                var el;
                try { el = document.querySelector(pin.cssSelector); } catch (e) { return; }
                if (!el) return;
                var action = pin.action;
                var detail = (pin.replacementText || '').toString();

                if (action === 'remove-element' || action === 'remove-image') {
                  el.setAttribute('data-bugsmash-original-display', el.style.display || '');
                  el.style.display = 'none';
                  el.setAttribute(PREVIEW_ATTR, 'removed');
                } else if (action === 'replace-text' || action === 'rewrite-copy') {
                  if (!detail) return;
                  el.setAttribute('data-bugsmash-original-text', el.textContent || '');
                  el.textContent = detail;
                  el.setAttribute(PREVIEW_ATTR, 'text-replaced');
                  if (showDiff) highlight(el, 'rgb(34 197 94)');
                } else if (action === 'replace-image') {
                  if (!detail || el.tagName !== 'IMG') return;
                  el.setAttribute('data-bugsmash-original-src', el.getAttribute('src') || '');
                  el.setAttribute('src', detail);
                  el.setAttribute(PREVIEW_ATTR, 'image-replaced');
                  if (showDiff) highlight(el, 'rgb(34 197 94)');
                } else if (action === 'update-alt') {
                  if (!detail || el.tagName !== 'IMG') return;
                  el.setAttribute('data-bugsmash-original-alt', el.getAttribute('alt') || '');
                  el.setAttribute('alt', detail);
                  el.setAttribute(PREVIEW_ATTR, 'alt-updated');
                } else if (action === 'update-link') {
                  if (!detail) return;
                  if (el.tagName !== 'A' && el.tagName !== 'BUTTON') return;
                  el.setAttribute('data-bugsmash-original-href', el.getAttribute('href') || '');
                  el.setAttribute('href', detail);
                  el.setAttribute(PREVIEW_ATTR, 'link-updated');
                  if (showDiff) highlight(el, 'rgb(59 130 246)');
                }
              });
            }

            window.addEventListener('message', function(e) {
              var d = e.data;
              if (!d || typeof d !== 'object' || d.source !== 'bugsmash') return;
              if (d.type === 'apply-preview') {
                applyPreview(Array.isArray(d.pins) ? d.pins : [], d.showDiff !== false);
              } else if (d.type === 'clear-preview') {
                clearPreview();
              }
            });

            notifyPage(TARGET_URL);
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
        headers: getPassthroughHeaders({
          'Content-Type': 'text/html; charset=utf-8',
          'X-Frame-Options': 'ALLOWALL',
          'Content-Security-Policy': "frame-ancestors *",
        }, { includeEntityHeaders: false })
      })
    }

    // 2. Handle JavaScript
    if (contentType.includes('application/javascript') || contentType.includes('text/javascript') || contentType.includes('application/x-javascript')) {
      let js = buffer.toString('utf-8')
      js = rewriteJavaScriptUrls(js, targetUrl)
      js = js.replace(/\bwindow\.top\b/g, 'window.self')
      js = js.replace(/\bwindow\.parent\b/g, 'window.self')
      js = js.replace(/\btop\.location\b/g, 'self.location')
      js = js.replace(/\bparent\.location\b/g, 'self.location')
      
      return new NextResponse(js, {
        status: 200,
        headers: getPassthroughHeaders({
          'Content-Type': contentType,
        }, { includeEntityHeaders: false })
      })
    }

    // 3. Handle CSS
    if (contentType.includes('text/css')) {
      const css = buffer.toString('utf-8')
      return new NextResponse(rewriteCssUrls(css, targetUrl), {
        status: 200,
        headers: getPassthroughHeaders({
          'Content-Type': 'text/css',
        }, { includeEntityHeaders: false })
      })
    }

    // 3. Handle everything else (images, fonts, scripts, etc.)
    return new NextResponse(buffer, {
      status: response.status,
      headers: getPassthroughHeaders({
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
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
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  })
}
