# Task 3: Service worker safety net

Fixes RC3 fully (module imports, anything escaping the injected patches) and most practical RC4 damage. See `docs/render-pipeline-audit.md`.

**Files:**
- Create: `public/bugsmash-proxy-sw.js`
- Modify: `lib/proxy/inject.ts` (register the SW from proxied pages)

## How it works

Proxied iframe documents live on OUR origin (`/api/proxy?url=<target>`). A service worker registered at scope `/` therefore controls them and sees **every** request they make - including `import './chunk.js'` resolving to our origin and dynamically built URLs that the injected patches missed. The SW re-targets those against the client page's `?url=` parameter.

CRITICAL SAFETY RULE: the SW must never interfere with the host app itself. For any request whose client is not a `/api/proxy` page, the fetch handler returns **without** calling `respondWith` (default network behavior, zero risk).

## Steps

### Step 1: Write `public/bugsmash-proxy-sw.js`

```js
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()))

const PROXY_PATH = '/api/proxy'

function targetFromProxyUrl(urlStr) {
  try {
    const u = new URL(urlStr)
    if (u.pathname === PROXY_PATH) return u.searchParams.get('url')
  } catch (e) {}
  return null
}

self.addEventListener('fetch', event => {
  const req = event.request
  const reqUrl = new URL(req.url)

  // Never touch the proxy endpoint itself or cross-origin requests made by the host app.
  if (reqUrl.origin === self.location.origin && reqUrl.pathname.startsWith('/api/')) return

  event.respondWith((async () => {
    let clientUrl = null
    if (event.clientId) {
      const client = await self.clients.get(event.clientId)
      if (client) clientUrl = client.url
    }
    if (!clientUrl && req.referrer) clientUrl = req.referrer

    const target = clientUrl ? targetFromProxyUrl(clientUrl) : null
    if (!target) return fetch(req) // host app request: passthrough untouched

    // Request from a proxied page: re-target it.
    let absolute
    if (reqUrl.origin === self.location.origin) {
      absolute = new URL(reqUrl.pathname + reqUrl.search + reqUrl.hash, target).toString()
    } else {
      absolute = req.url // cross-origin: still pipe through proxy for CORS/CSP freedom
    }
    return fetch(PROXY_PATH + '?url=' + encodeURIComponent(absolute), {
      method: req.method,
      headers: req.headers,
      body: req.method === 'GET' || req.method === 'HEAD' ? undefined : await req.clone().arrayBuffer(),
      redirect: 'follow'
    })
  })())
})
```

Note: the early-return for `/api/` host paths must happen BEFORE `respondWith` so host API calls (feedback, auth, upload) keep default semantics (cookies, streaming). `/api/proxy?url=` requests issued by the injected patches pass through here too.

### Step 2: Register from injected script (in `lib/proxy/inject.ts`)

```js
if ('serviceWorker' in navigator) {
  try { navigator.serviceWorker.register('/bugsmash-proxy-sw.js').catch(function(){}) } catch (e) {}
}
```

### Step 3: Guard against double-proxying

In the SW, if `reqUrl.pathname === PROXY_PATH`, return immediately (covered by the `/api/` early return). In `toProxy` (inject), keep the existing already-proxied check.

### Step 4: Verify

- `npm run build` passes.
- Browser DevTools > Application > Service Workers: `bugsmash-proxy-sw.js` activated after loading a proxied page.
- Load a Next.js site through the proxy: `_next/static` chunk requests appear as `/api/proxy?url=...` 200s; no 404s on our origin.
- Host app sanity: dashboard, auth, comments still work with SW active (passthrough path).
- Accordion on `https://ui.shadcn.com/docs/components/accordion` expands/collapses inside the iframe.

### Step 5: Commit

`feat(proxy): service worker re-targets all proxied-page requests`
