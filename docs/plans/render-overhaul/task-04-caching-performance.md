# Task 4: Caching and performance

Fixes RC8 ("navigating around the pages is slow") from `docs/render-pipeline-audit.md`.

**Files:**
- Modify: `app/api/proxy/route.ts`

## Steps

### Step 1: Per-content-type Cache-Control

| Content | Header | Rationale |
|---------|--------|-----------|
| HTML | `public, max-age=0, s-maxage=60, stale-while-revalidate=300` | CDN-fast repeat navigation, still fresh-ish |
| JS / CSS | `public, max-age=300, s-maxage=86400, stale-while-revalidate=604800` | bundles are content-hashed in practice |
| Images / fonts / media | `public, max-age=3600, s-maxage=604800, immutable` | static |

If upstream sends `cache-control: no-store` or `private`, respect it for HTML only (`no-store`); assets stay cacheable.

### Step 2: Keep-alive upstream agents

Create module-level agents instead of per-request:

```ts
import https from 'https'
import http from 'http'
const httpsAgent = new https.Agent({ keepAlive: true, rejectUnauthorized: false })
const httpAgent = new http.Agent({ keepAlive: true })
// axios.get(targetUrl, { httpsAgent, httpAgent, ... })
```

### Step 3: Trim timeouts and redirects

`timeout: 12000`, `maxRedirects: 5` (10 was excessive; each redirect is a serial round trip).

### Step 4: Verify

- `npm run build` passes.
- `curl -sI 'http://localhost:3000/api/proxy?url=https%3A%2F%2Fexample.com' | grep -i cache-control` shows the HTML policy.
- Repeat the curl with a JS asset URL; shows the asset policy.
- In the deployed env (Vercel), second navigation to the same page returns `x-vercel-cache: HIT`.

### Step 5: Commit

`perf(proxy): CDN caching per content type, keep-alive agents`

## Deferred ideas (not this task)

- Streaming HTML rewriting (parse5 SAX / WHATWG streams) to cut TTFB on large pages.
- In-flight request dedupe for identical proxy URLs.
- Hover prefetch of links inside the iframe (postMessage from injected script to host, host warms `/api/proxy?url=`).
