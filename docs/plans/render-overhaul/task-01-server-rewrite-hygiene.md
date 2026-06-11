# Task 1: Server rewrite hygiene (stop corrupting code)

Fixes RC1, RC2, RC5, RC6, RC9 from `docs/render-pipeline-audit.md`.

**Files:**
- Create: `lib/proxy/rewrite.ts` (pure helpers, extracted from route)
- Modify: `app/api/proxy/route.ts`

## Steps

### Step 1: Extract pure helpers to `lib/proxy/rewrite.ts`

Move from route.ts and export: `getProxiedUrl(original, contextUrl)`, `getProxiedSrcset(srcset, contextUrl)`, `rewriteCssUrls(css, contextUrl)`. No behavior change.

### Step 2: Replace global HTML-string regex with per-element cheerio rewriting

Delete the `urlAttrs.forEach` regex block and the inline-style regex pass (route.ts:472-499). Replace with cheerio traversal BEFORE serialization:

```ts
const URL_ATTRS = ['src', 'href', 'action', 'poster', 'data',
  'data-src', 'data-href', 'data-original', 'data-lazy-src', 'data-url',
  'data-basepath', 'data-inline-media-basepath', 'data-anim-lazy-image']

$('*').each((_, el) => {
  const $el = $(el)
  const tag = el.tagName?.toLowerCase()
  if (tag === 'script' || tag === 'style') return // attributes below still ok, content untouched
  for (const attr of URL_ATTRS) {
    const val = $el.attr(attr)
    if (val) $el.attr(attr, getProxiedUrl(val, targetUrl))
  }
  for (const attr of ['srcset', 'data-srcset']) {
    const val = $el.attr(attr)
    if (val) $el.attr(attr, getProxiedSrcset(val, targetUrl))
  }
  const style = $el.attr('style')
  if (style && style.includes('url(')) $el.attr('style', rewriteCssUrls(style, targetUrl))
})
// scripts/links DO need src/href rewritten (content untouched):
$('script[src]').each((_, el) => { /* rewrite src attr */ })
$('link[href]').each((_, el) => { /* rewrite href attr */ })
```

Key property: attribute rewriting happens on the DOM, so `<script>` text content (hydration JSON, `__NEXT_DATA__`) is **never touched**.

### Step 3: Stop editing inline script contents

Delete the `$('script:not([src])').each(...)` block that ran `rewriteJavaScriptUrls`. Inline JSON/hydration payloads must pass through byte-identical.

### Step 4: Stop editing external JS files

In the JS branch, delete `rewriteJavaScriptUrls` and the four `window.top/parent` string replaces. Serve JS byte-identical (framebusting is neutralized by the iframe sandbox lacking `allow-top-navigation`; `top`/`parent` spoofing moves to the injected script in Task 2). Runtime URL routing is handled by Tasks 2-3.

### Step 5: Strip SRI and handle `<base>`

```ts
$('[integrity]').removeAttr('integrity')
$('[crossorigin]').removeAttr('crossorigin')
const baseHref = $('base[href]').attr('href')
const resolutionBase = baseHref ? new URL(baseHref, targetUrl).toString() : targetUrl
$('base').remove()
```
Use `resolutionBase` instead of `targetUrl` as context for all attribute rewriting.

### Step 6: Verify

- `npm run build` passes.
- `curl -s 'http://localhost:3000/api/proxy?url=https%3A%2F%2Fui.shadcn.com%2Fdocs%2Fcomponents%2Faccordion' | grep -c 'self.__next_f'` — hydration payload present.
- Same curl piped to `grep '__next_f' | grep -c '/api/proxy?url='` — must be **0** (no proxy URLs inside script payloads).
- Browser: accordion page renders with styles, images load.

### Step 7: Commit

`refactor(proxy): per-element attribute rewriting, stop editing script contents`
