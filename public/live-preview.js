/**
 * Website Viewer Live Preview SDK
 * 
 * Add this script to your local development environment to enable 
 * live metadata preview in the Website Viewer.
 * 
 * <script src="https://your-viewer-url.com/live-preview.js"></script>
 */
(function() {
  // Prevent running multiple times
  if (window.__WEBSITE_VIEWER_SDK_LOADED__) return;
  window.__WEBSITE_VIEWER_SDK_LOADED__ = true;

  console.log('🔌 Website Viewer SDK: Active');

  function getMetadata() {
    var d = document;
    var q = function(s) { return d.querySelector(s)?.getAttribute('content') || '' };
    
    return {
      url: window.location.href,
      seo: {
        title: d.title,
        description: q('meta[name="description"]'),
        language: d.documentElement.lang || 'en',
        viewport: q('meta[name="viewport"]')
      },
      openGraph: {
        title: q('meta[property="og:title"]') || d.title,
        description: q('meta[property="og:description"]') || q('meta[name="description"]'),
        image: q('meta[property="og:image"]')
      },
      twitterCard: {
        card: q('meta[name="twitter:card"]'),
        title: q('meta[name="twitter:title"]') || q('meta[property="og:title"]') || d.title,
        description: q('meta[name="twitter:description"]') || q('meta[property="og:description"]') || q('meta[name="description"]')
      },
      technical: {
        charset: d.characterSet || 'utf-8'
      },
      extractedAt: new Date().toISOString()
    };
  }

  function sendUpdate() {
    var metadata = getMetadata();
    var payload = {
      type: 'WEBSITE_VIEWER_METADATA',
      payload: metadata
    };

    // Send to parent (if in iframe)
    if (window.parent && window.parent !== window) {
      window.parent.postMessage(payload, '*');
    }

    // Send to opener (if opened via window.open)
    if (window.opener && window.opener !== window) {
      window.opener.postMessage(payload, '*');
    }
  }

  // Send initial update
  // Wait for DOMContentLoaded if not ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', sendUpdate);
  } else {
    sendUpdate();
  }

  // Watch for changes in <head> to enable live updates
  // This is great for Next.js/HMR where metadata might change
  var head = document.querySelector('head');
  if (head) {
    var observer = new MutationObserver(function(mutations) {
      // Debounce updates slightly
      if (window.__WEBSITE_VIEWER_TIMEOUT__) clearTimeout(window.__WEBSITE_VIEWER_TIMEOUT__);
      window.__WEBSITE_VIEWER_TIMEOUT__ = setTimeout(sendUpdate, 500);
    });
    
    observer.observe(head, {
      subtree: true,
      childList: true,
      attributes: true,
      characterData: true
    });
  }
})();
