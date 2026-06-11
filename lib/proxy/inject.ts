// Client-side script injected into every proxied HTML document.
// Responsibilities:
// 1. Keep navigation (clicks, history, forms) routed through /api/proxy and
//    report the real page URL to the host app via postMessage.
// 2. Route runtime network calls (fetch/XHR/sendBeacon/dynamic DOM nodes)
//    through the proxy so SPA data loading works.
// 3. Register the proxy service worker as the safety net for anything missed.
// 4. Apply/clear pin edit previews on request from the host.

export function buildInjectedScript (targetUrl: string): string {
  const targetOrigin = new URL(targetUrl).origin

  return `
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
          try {
            return new URL(url, TARGET_URL).toString();
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
          if (url.indexOf('data:') === 0 || url.indexOf('blob:') === 0 || url.indexOf('javascript:') === 0 || url.indexOf('mailto:') === 0 || url.indexOf('tel:') === 0 || url.indexOf('about:') === 0 || url.charAt(0) === '#') return url;
          if (url.indexOf('ws:') === 0 || url.indexOf('wss:') === 0) return url;
          try {
            var abs = new URL(url, TARGET_URL);
            if (abs.protocol !== 'http:' && abs.protocol !== 'https:') return url;
            if (abs.origin === window.location.origin && abs.pathname === '/api/proxy') return url;
            return PROXY_PREFIX + encodeURIComponent(abs.toString());
          } catch (e) { return url; }
        }

        function toProxySrcset(value) {
          if (!value || typeof value !== 'string') return value;
          return value.split(/,(?=\\s+|$)/).map(function(part) {
            var trimmed = part.trim();
            if (trimmed.indexOf('data:') === 0) return trimmed;
            var pieces = trimmed.split(/\\s+/);
            var rest = pieces.slice(1).join(' ');
            return (toProxy(pieces[0]) + ' ' + rest).trim();
          }).join(', ');
        }

        // ---- Frame identity spoofing (best effort; sandbox already blocks
        // framebust navigation since allow-top-navigation is absent) ----
        try {
          window.frameElement = { "id": "proxied-frame", "nodeName": "IFRAME" };
          Object.defineProperty(window, 'top', { get: function() { return window.self; } });
          Object.defineProperty(window, 'parent', { get: function() { return window.self; } });
          window.onbeforeunload = function() { return null; };
          window.onunload = function() {};
        } catch (e) {}

        // ---- Runtime network interception ----
        try {
          var _fetch = window.fetch;
          if (_fetch) {
            window.fetch = function(input, init) {
              try {
                if (typeof input === 'string' || input instanceof URL) {
                  input = toProxy(String(input));
                } else if (input && typeof input.url === 'string') {
                  var proxied = toProxy(input.url);
                  if (proxied !== input.url) {
                    input = new Request(proxied, input);
                  }
                }
              } catch (e) {}
              return _fetch.call(this, input, init);
            };
          }
        } catch (e) {}

        try {
          var _xhrOpen = XMLHttpRequest.prototype.open;
          XMLHttpRequest.prototype.open = function(method, url) {
            var args = Array.prototype.slice.call(arguments);
            try { args[1] = toProxy(String(url)); } catch (e) {}
            return _xhrOpen.apply(this, args);
          };
        } catch (e) {}

        try {
          if (navigator.sendBeacon) {
            var _beacon = navigator.sendBeacon.bind(navigator);
            navigator.sendBeacon = function(url, data) {
              try { url = toProxy(String(url)); } catch (e) {}
              return _beacon(url, data);
            };
          }
        } catch (e) {}

        function patchUrlProp(proto, prop, mapper) {
          try {
            var d = Object.getOwnPropertyDescriptor(proto, prop);
            if (!d || !d.set || !d.configurable) return;
            Object.defineProperty(proto, prop, {
              get: d.get,
              set: function(v) { d.set.call(this, mapper(String(v))); },
              configurable: true,
              enumerable: d.enumerable
            });
          } catch (e) {}
        }
        patchUrlProp(HTMLImageElement.prototype, 'src', toProxy);
        patchUrlProp(HTMLImageElement.prototype, 'srcset', toProxySrcset);
        patchUrlProp(HTMLScriptElement.prototype, 'src', toProxy);
        patchUrlProp(HTMLLinkElement.prototype, 'href', toProxy);
        patchUrlProp(HTMLSourceElement.prototype, 'src', toProxy);
        patchUrlProp(HTMLSourceElement.prototype, 'srcset', toProxySrcset);
        patchUrlProp(HTMLMediaElement.prototype, 'src', toProxy);
        patchUrlProp(HTMLIFrameElement.prototype, 'src', toProxy);
        patchUrlProp(HTMLEmbedElement.prototype, 'src', toProxy);
        patchUrlProp(HTMLObjectElement.prototype, 'data', toProxy);

        try {
          var URL_ATTRS = { src: 1, href: 1, action: 1, poster: 1, 'data-src': 1, 'data-href': 1, 'data-lazy-src': 1 };
          var _setAttribute = Element.prototype.setAttribute;
          Element.prototype.setAttribute = function(name, value) {
            try {
              var lower = String(name).toLowerCase();
              if (URL_ATTRS[lower]) {
                value = toProxy(String(value));
              } else if (lower === 'srcset' || lower === 'data-srcset') {
                value = toProxySrcset(String(value));
              }
            } catch (e) {}
            return _setAttribute.call(this, name, value);
          };
        } catch (e) {}

        // ---- Service worker safety net ----
        try {
          if ('serviceWorker' in navigator && (window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
            navigator.serviceWorker.register('/bugsmash-proxy-sw.js').catch(function() {});
          }
        } catch (e) {}

        // ---- Navigation interception ----
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
              var origSrcset = el.getAttribute('data-bugsmash-original-srcset');
              if (origSrcset) el.setAttribute('srcset', origSrcset);
              var pic = el.closest ? el.closest('picture') : null;
              if (pic) {
                pic.querySelectorAll('source').forEach(function(s) { s.removeAttribute('media'); });
              }
              el.removeAttribute('data-bugsmash-original-srcset');
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
              if (!detail) return;
              var imgEl = el.tagName === 'IMG' ? el : el.querySelector('img');
              if (!imgEl) return;
              imgEl.setAttribute('data-bugsmash-original-src', imgEl.getAttribute('src') || '');
              imgEl.setAttribute('data-bugsmash-original-srcset', imgEl.getAttribute('srcset') || '');
              imgEl.setAttribute('src', detail);
              imgEl.removeAttribute('srcset');
              imgEl.removeAttribute('sizes');
              var picture = imgEl.closest('picture');
              if (picture) {
                picture.querySelectorAll('source').forEach(function(s) { s.setAttribute('media', 'not all'); });
              }
              imgEl.setAttribute(PREVIEW_ATTR, 'image-replaced');
              if (showDiff) highlight(imgEl, 'rgb(34 197 94)');
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
}
