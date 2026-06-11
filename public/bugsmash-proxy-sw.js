/*
 * Proxy safety net for pages rendered through /api/proxy.
 *
 * Proxied iframe documents live on this origin, so this worker sees every
 * request they make - including module imports and dynamically built URLs
 * that escape the injected interception script. Those requests are
 * re-targeted against the client page's ?url= parameter.
 *
 * SAFETY RULE: requests whose client is NOT a /api/proxy page are never
 * intercepted (the handler returns before respondWith), so the host app is
 * unaffected.
 */

self.addEventListener('install', function () {
  self.skipWaiting()
})

self.addEventListener('activate', function (event) {
  event.waitUntil(self.clients.claim())
})

var PROXY_PATH = '/api/proxy'

function targetFromProxyUrl (urlStr) {
  try {
    var u = new URL(urlStr)
    if (u.origin === self.location.origin && u.pathname === PROXY_PATH) {
      return u.searchParams.get('url')
    }
  } catch (e) {}
  return null
}

self.addEventListener('fetch', function (event) {
  var req = event.request
  var reqUrl
  try {
    reqUrl = new URL(req.url)
  } catch (e) {
    return
  }

  // Never touch our own API (includes /api/proxy itself) or Next.js internals.
  if (reqUrl.origin === self.location.origin) {
    if (reqUrl.pathname.startsWith('/api/')) return
    if (reqUrl.pathname.startsWith('/_next/')) return
    if (reqUrl.pathname === '/bugsmash-proxy-sw.js') return
  }

  // Top-level navigations have no source client; the injected click
  // interceptor already routes those through the proxy.
  if (req.mode === 'navigate') return

  event.respondWith(
    (async function () {
      var clientUrl = null
      if (event.clientId) {
        try {
          var client = await self.clients.get(event.clientId)
          if (client) clientUrl = client.url
        } catch (e) {}
      }
      if (!clientUrl && req.referrer) clientUrl = req.referrer

      var target = clientUrl ? targetFromProxyUrl(clientUrl) : null
      if (!target) return fetch(req) // host app request: passthrough untouched

      // Request from a proxied page: re-target it.
      var absolute
      if (reqUrl.origin === self.location.origin) {
        // Relative URL that resolved against our origin - remap onto target.
        try {
          absolute = new URL(reqUrl.pathname + reqUrl.search + reqUrl.hash, target).toString()
        } catch (e) {
          return fetch(req)
        }
      } else {
        // Cross-origin: pipe through the proxy for CORS/CSP freedom.
        absolute = req.url
      }

      var proxied = PROXY_PATH + '?url=' + encodeURIComponent(absolute)
      var init = {
        method: req.method,
        redirect: 'follow'
      }
      var contentType = req.headers.get('content-type')
      if (contentType) init.headers = { 'Content-Type': contentType }
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        try {
          init.body = await req.clone().arrayBuffer()
        } catch (e) {}
      }
      return fetch(proxied, init)
    })()
  )
})
