# Task 2: Runtime network interception (injected script)

Fixes RC3 (partial - pre-SW window + non-SW browsers) and RC7 from `docs/render-pipeline-audit.md`.

**Files:**
- Create: `lib/proxy/inject.ts` (exports `buildInjectedScript(targetUrl: string): string`)
- Modify: `app/api/proxy/route.ts` (replace inline template literal with import)

## Steps

### Step 1: Move the existing framebuster template into `lib/proxy/inject.ts`

Keep all current behavior: `toTargetUrl`, `notifyPage`, `toProxy`, click interception, history wrapping, location.assign/replace wrapping, form action rewriting, popstate notify, preview applier, postMessage listener. Route.ts shrinks to `$('head').prepend(buildInjectedScript(targetUrl))`.

### Step 2: Add `fetch` patch

```js
var _fetch = window.fetch;
window.fetch = function(input, init) {
  try {
    if (typeof input === 'string' || input instanceof URL) {
      input = toProxy(String(input));
    } else if (input && input.url) {
      input = new Request(toProxy(input.url), input);
    }
  } catch (e) {}
  return _fetch.call(this, input, init);
};
```
`toProxy` must skip URLs already pointing at `/api/proxy` and non-http(s) schemes (existing logic).

### Step 3: Add `XMLHttpRequest` patch

```js
var _open = XMLHttpRequest.prototype.open;
XMLHttpRequest.prototype.open = function(method, url) {
  try { arguments[1] = toProxy(String(url)); } catch (e) {}
  return _open.apply(this, arguments);
};
```

### Step 4: Add `navigator.sendBeacon` patch

Same pattern; wrap in try/catch, keep original on failure.

### Step 5: Add DOM setter patches (dynamic element creation)

Patch property setters so `img.src = '/x.png'`, `script.src = ...`, `link.href = ...` route through the proxy:

```js
function patchUrlProp(proto, prop) {
  var d = Object.getOwnPropertyDescriptor(proto, prop);
  if (!d || !d.set) return;
  Object.defineProperty(proto, prop, {
    get: d.get,
    set: function(v) { d.set.call(this, toProxy(String(v))); },
    configurable: true
  });
}
patchUrlProp(HTMLImageElement.prototype, 'src');
patchUrlProp(HTMLScriptElement.prototype, 'src');
patchUrlProp(HTMLLinkElement.prototype, 'href');
patchUrlProp(HTMLSourceElement.prototype, 'src');
patchUrlProp(HTMLMediaElement.prototype, 'src');
patchUrlProp(HTMLIFrameElement.prototype, 'src');
```
Also wrap `Element.prototype.setAttribute` for `src`/`href`/`srcset`/`action` (srcset via existing srcset splitter logic, simplified client-side).

### Step 6: `top`/`parent` spoofing stays best-effort

Keep the existing `try { Object.defineProperty(window, 'top', ...) } catch {}` block (works in some engines, silently fails where unforgeable). Do NOT reintroduce JS source rewriting — the sandbox attribute already blocks framebust navigation.

### Step 7: Verify

- `npm run build` passes.
- Browser: proxied SPA page where content loads on demand (e.g. a docs site search, or any page issuing `fetch('/...')`) shows the request going to `/api/proxy?url=...` in the network panel, returning 200.
- Existing behaviors intact: link clicks navigate within frame, URL chip in toolbar updates, preview applier still works.

### Step 8: Commit

`feat(proxy): runtime fetch/XHR/DOM interception in injected script`
