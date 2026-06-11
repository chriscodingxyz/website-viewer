# Render Pipeline Audit (2026-06-12)

Full audit of how proxied pages are fetched, rewritten, and rendered, and why interactivity breaks (accordions dead, navigation slow).

## How rendering works today

1. `ProjectCanvas` (`components/bugsmash/ProjectCanvas.tsx`) renders an `<iframe src="/api/proxy?url=<target>">` with `sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"`. Proxy mode is the default.
2. `/api/proxy` (`app/api/proxy/route.ts`) fetches the target with axios, then:
   - HTML: loads into cheerio, strips CSP/X-Frame-Options meta tags, rewrites `<style>` CSS urls, regex-rewrites inline `<script>` contents, injects a "framebuster" script (link click interception, history patching, preview applier, postMessage URL reporting), then serializes with `$.html()` and runs **global regexes over the entire HTML string** to rewrite `src`, `href`, `srcset`, `action`, `data-*`, `style` attributes to `/api/proxy?url=...`.
   - JS files: regex-rewrites a hardcoded list of root paths (`/_next`, `/api`, `/images`, ...) inside string literals, plus `window.top` → `window.self`, `window.parent` → `window.self`.
   - CSS files: rewrites `url(...)` and `@import`.
   - Everything else: streamed through with `Cache-Control: public, max-age=3600`.

## Root causes of broken interactivity

### RC1 - Global attribute regex corrupts inline script JSON (critical)
The `urlAttrs.forEach` regex pass (route.ts:485-494) runs on the **serialized HTML string**, so it also rewrites matches *inside* `<script>` bodies: `__NEXT_DATA__`, React Server Component payloads, Nuxt/`__NUXT__` state, JSON-LD, analytics configs. Example: `{"href":"/docs"}` inside a hydration payload becomes `{"href":"/api/proxy?url=..."}`. The client framework then either:
- fails hydration (server DOM no longer matches client render), so React bails out and **event handlers never attach** (accordions, menus, tabs go dead), or
- routes/renders wrong data.

This is the single biggest reason "some UI is interactive but not within our app".

### RC2 - Regex-editing JavaScript source (critical)
`rewriteJavaScriptUrls` (route.ts:146-159) edits inline scripts and every external JS file. Rewriting `'/api/...'`-looking string literals inside arbitrary minified code corrupts:
- router route tables (`path: '/about'` becomes a proxy URL, so route matching fails),
- equality checks (`location.pathname === '/'`),
- JSON embedded in JS.
A single corrupted string in a framework bundle can throw during hydration and kill all interactivity on the page.

### RC3 - No runtime network interception (critical)
SPAs fetch data after load: `fetch('/api/products')`, `import('./chunk-abc.js')`, lazy-loaded accordion content. Inside the iframe, the document URL is `https://our-app/api/proxy?url=...`, so:
- relative fetches resolve against **our origin** → 404,
- dynamic `import()` and `<script type="module">` relative specifiers resolve against our origin → 404,
- the hardcoded root-path JS regex only catches a few literal prefixes and misses dynamically constructed URLs.
Result: components that load content on demand silently break.

### RC4 - `location` mismatch (high)
Page JS sees `location.pathname === '/api/proxy'` and `location.search = ?url=...`. Routers (Next.js, React Router) initialize from this and can immediately 404/redirect client-side or refuse to hydrate the expected route.
Mitigation is partial by design (true `location` spoofing is not possible); the framebuster intercepts navigations, but reads of `location.pathname` remain wrong. Service-worker-based subresource mapping (RC3 fix) removes most of the practical damage.

### RC5 - Cheerio re-serialization side effects (medium)
`$.html()` re-encodes entities and normalizes markup. Combined with RC1/RC2 edits inside scripts, the served HTML diverges from the original enough to break hydration equality.

### RC6 - SRI / integrity attributes not stripped (medium)
Rewritten CSS/JS bytes no longer match `integrity="sha384-..."` hashes, so browsers refuse to apply those resources. Scripts with SRI fail to execute at all → dead interactivity on sites using SRI (common with CDNs).

### RC7 - `window.top/parent` string replacement in all JS (medium)
Blanket `\bwindow\.top\b → window.self` on every JS file can corrupt string literals and breaks legitimate `postMessage` to parent. Framebusting is already neutralized by the iframe `sandbox` attribute (no `allow-top-navigation`), so most of this rewriting is unnecessary risk.

### RC8 - Performance: no useful caching, serial fetches (high, "slow navigation")
- HTML/CSS/JS responses carry no `s-maxage`, so every navigation re-fetches and re-rewrites everything through the serverless function.
- Only the binary fallback branch sets `Cache-Control` (1h) — and it's `max-age` only, browser-side.
- axios creates a new HTTPS agent per request (`keepAlive` not enabled), adding TLS handshake latency per subresource.
- 15s timeout, 10 redirects, no streaming for HTML.
Each page load = N serverless invocations, all cold-path.

### RC9 - `<base>` tags not handled (low)
A page with `<base href="https://cdn.example/">` changes relative resolution after our rewriting and confuses the injected interceptors.

## What already works well (keep)

- Click interception + `history.pushState/replaceState` wrapping for in-frame navigation with `postMessage` URL reporting to the host.
- Preview applier (apply/clear pin edits) over postMessage.
- Media streaming branch with Range support.
- Auto-flip to proxy when direct embed is blocked (`IframeDetectionService` preflight).
- CSS `url()`/`@import` rewriting (genuinely required since stylesheet URL context changes).

## Fix strategy (summary - see docs/plans/)

1. **Stop corrupting code**: rewrite attributes per-element via cheerio (never the serialized string), stop editing inline/external JS source, strip `integrity`, handle `<base>`.
2. **Intercept at runtime instead**: patch `fetch`, `XMLHttpRequest`, `sendBeacon`, and DOM src/href setters in the injected script so dynamically constructed URLs route through the proxy.
3. **Service worker as the safety net**: a SW on our origin intercepts *every* request from proxied iframe pages (including module imports and relative fetches that resolve to our origin) and re-targets them using the client page's `?url=` parameter. This is how dedicated web proxies (Ultraviolet, etc.) achieve full-fidelity rendering.
4. **Cache aggressively**: CDN `s-maxage` + `stale-while-revalidate` per content type, keep-alive agents, long immutable caching for hashed assets.
5. **UI/UX pass** toward the BugSmash reference layout (top bar + comments rail), keyboard shortcuts, skeleton loading.
