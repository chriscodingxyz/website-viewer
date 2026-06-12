/*
 * Proxy safety net for pages rendered through /api/proxy.
 *
 * Proxied iframe documents live on this origin (URL /api/proxy?url=<target>),
 * so this worker controls them and sees every request they make. Target
 * same-origin subresources are served root-relative (e.g. /_next/static/...)
 * so bundler runtimes resolve their real chunk paths; this worker remaps those
 * requests to the target origin. Anything escaping the injected interception
 * script is caught here too.
 *
 * SAFETY RULE: a request is only remapped when its CLIENT is a proxied page.
 * Requests from the host app itself (client URL is not /api/proxy) are passed
 * through untouched - the host's own /_next/, /api/feedback, /api/auth, etc.
 * are never affected.
 */

self.addEventListener('install', function () {
  self.skipWaiting()
})

self.addEventListener('activate', function (event) {
  event.waitUntil(self.clients.claim())
})

var PROXY_PATH = '/api/proxy'

function targetFromClientUrl (urlStr) {
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

  // Top-level navigations are handled by the injected click interceptor and
  // the proxy route directly; never remap them.
  if (req.mode === 'navigate') return

  // A cross-origin request that is not attributable to a proxied page (its
  // referrer is not an /api/proxy document) belongs to the host app - e.g. a
  // project favicon or analytics beacon. Leave it completely native; touching
  // it would break no-cors image loads. Proxied pages rewrite their own
  // cross-origin URLs to the /api/proxy form at the source, so this only ever
  // skips genuine host-app requests.
  var fromProxiedRef = req.referrer && targetFromClientUrl(req.referrer)
  if (reqUrl.origin !== self.location.origin && !fromProxiedRef) {
    return
  }

  event.respondWith(
    (async function () {
      // The controlling client is the document making the request. For a
      // proxied page that is /api/proxy?url=<target>. This is authoritative -
      // unlike the referrer, which for a CSS-loaded font points at the
      // stylesheet, not the document.
      var clientUrl = null
      if (event.clientId) {
        try {
          var client = await self.clients.get(event.clientId)
          if (client) clientUrl = client.url
        } catch (e) {}
      }
      // Fallbacks for requests with no client (e.g. some preloads).
      if (!clientUrl && req.referrer && targetFromClientUrl(req.referrer)) {
        clientUrl = req.referrer
      }

      var target = clientUrl ? targetFromClientUrl(clientUrl) : null

      // Not a proxied page (host app, or unknown client): passthrough untouched.
      if (!target) return fetch(req)

      // Request already aimed at our proxy route: let it through to the route.
      if (reqUrl.origin === self.location.origin && reqUrl.pathname === PROXY_PATH) {
        return fetch(req)
      }
      if (reqUrl.origin === self.location.origin && reqUrl.pathname === '/bugsmash-proxy-sw.js') {
        return fetch(req)
      }

      var absolute
      if (reqUrl.origin === self.location.origin) {
        // Transparent same-origin subresource - remap onto the target origin.
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
      var init = { method: req.method, redirect: 'follow' }
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
