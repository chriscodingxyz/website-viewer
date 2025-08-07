/**
 * Smart Iframe Detection Service
 * Detects iframe blocking using multiple methods and provides graceful fallbacks
 */

export type IframeStatus = 'ready' | 'loading' | 'loaded' | 'blocked' | 'error' | 'timeout'

export interface IframeDetectionResult {
  status: IframeStatus
  url: string
  reason?: string
  confidence: 'low' | 'medium' | 'high'
  detectionTime: number
  methods: {
    preflight?: any
    iframeLoad?: any
    contentVerification?: any
  }
}

export interface DetectionOptions {
  timeout?: number
  enablePreflight?: boolean
  checkContentAccess?: boolean
}

class IframeDetectionService {
  private defaultOptions: Required<DetectionOptions> = {
    timeout: 15000, // Increased timeout - don't give false positives for slow sites
    enablePreflight: true,
    checkContentAccess: true
  }

  async detectIframeStatus(
    url: string, 
    container: HTMLElement, 
    options?: DetectionOptions
  ): Promise<IframeDetectionResult> {
    const startTime = performance.now()
    const opts = { ...this.defaultOptions, ...options }
    
    console.log('🚀 Starting iframe detection for:', url, 'with options:', opts)
    
    const result: IframeDetectionResult = {
      status: 'loading',
      url,
      confidence: 'low',
      detectionTime: 0,
      methods: {}
    }

    try {
      // Method 1: Quick preflight check (limited by CORS)
      if (opts.enablePreflight) {
        try {
          result.methods.preflight = await this.preflightCheck(url)
          
          // If we get definitive blocking headers, return immediately
          if (result.methods.preflight.blocked === true) {
            result.status = 'blocked'
            result.reason = 'explicit-headers'
            result.confidence = 'high'
            result.detectionTime = performance.now() - startTime
            console.log('🛡️ Blocked by headers:', result)
            return result
          }
        } catch (error) {
          console.log('⚠️ Preflight check failed (normal for CORS):', error)
          result.methods.preflight = { error: error instanceof Error ? error.message : 'Unknown error' }
        }
      }

      // Method 2: Iframe loading test with timeout
      try {
        result.methods.iframeLoad = await this.iframeLoadTest(url, container, opts.timeout)
        
        if (result.methods.iframeLoad.status === 'blocked') {
          result.status = 'blocked'
          result.reason = result.methods.iframeLoad.reason
          result.confidence = 'high'
        } else if (result.methods.iframeLoad.status === 'loaded') {
          // Iframe loaded, now verify content if possible
          if (opts.checkContentAccess && result.methods.iframeLoad.iframe) {
            result.methods.contentVerification = this.verifyIframeContent(
              result.methods.iframeLoad.iframe
            )
            
            if (result.methods.contentVerification.blocked) {
              result.status = 'blocked'
              result.reason = result.methods.contentVerification.reason
              result.confidence = 'high'
            } else {
              result.status = 'loaded'
              result.confidence = 'high'
            }
          } else {
            // Can't verify content, but iframe loaded
            result.status = 'loaded'
            result.reason = 'cross-origin-loaded'
            result.confidence = 'medium'
          }
        } else {
          // Handle other statuses
          result.status = result.methods.iframeLoad.status || 'error'
          result.reason = result.methods.iframeLoad.reason || 'Unknown error'
          result.confidence = 'high'
        }
      } catch (error) {
        console.log('❌ Iframe load test failed:', error)
        result.status = 'error'
        result.reason = error instanceof Error ? error.message : 'Unknown error'
        result.confidence = 'high'
      }

    } catch (error) {
      console.log('💥 Detection failed completely:', error)
      result.status = 'error'
      result.reason = error instanceof Error ? error.message : 'Detection failed'
      result.confidence = 'high'
    }

    result.detectionTime = performance.now() - startTime
    console.log('🏁 Final detection result:', result)
    return result
  }

  private async preflightCheck(url: string, timeout = 5000) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      const response = await fetch(url, {
        method: 'HEAD',
        mode: 'cors',
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      const xFrameOptions = response.headers.get('X-Frame-Options')
      const csp = response.headers.get('Content-Security-Policy')

      let blocked = false
      let reason = ''

      // Check X-Frame-Options
      if (xFrameOptions) {
        const lowerXFrame = xFrameOptions.toLowerCase()
        if (lowerXFrame === 'deny') {
          blocked = true
          reason = 'X-Frame-Options: DENY'
        } else if (lowerXFrame === 'sameorigin' && !this.isSameOrigin(url)) {
          blocked = true
          reason = 'X-Frame-Options: SAMEORIGIN'
        }
      }

      // Check CSP frame-ancestors
      if (csp && csp.includes('frame-ancestors')) {
        if (csp.includes("frame-ancestors 'none'")) {
          blocked = true
          reason = "CSP frame-ancestors 'none'"
        } else if (csp.includes("frame-ancestors 'self'") && !this.isSameOrigin(url)) {
          blocked = true
          reason = "CSP frame-ancestors 'self'"
        }
      }

      return {
        accessible: true,
        blocked,
        reason,
        headers: { xFrameOptions, csp }
      }
    } catch (error) {
      clearTimeout(timeoutId)
      throw error
    }
  }

  private iframeLoadTest(url: string, container: HTMLElement, timeout: number): Promise<any> {
    return new Promise((resolve) => {
      console.log('🔍 Starting iframe detection for:', url)
      
      const iframe = document.createElement('iframe')
      iframe.src = url
      iframe.style.width = '100%'
      iframe.style.height = '100%'
      iframe.style.border = 'none'
      iframe.style.display = 'none' // Hide during detection

      let hasResolved = false
      let timeoutId: NodeJS.Timeout

      const resolveOnce = (result: any) => {
        if (hasResolved) return
        hasResolved = true
        clearTimeout(timeoutId)
        
        console.log('🎯 Iframe detection result for', url, ':', result)
        
        // Clean up the test iframe
        if (iframe.parentNode) {
          iframe.parentNode.removeChild(iframe)
        }
        
        resolve(result)
      }

      // Set up timeout - treat as timeout, not blocked (could be slow site)
      timeoutId = setTimeout(() => {
        console.log('⏰ Iframe detection timeout for:', url)
        resolveOnce({
          status: 'timeout',
          iframe: null,
          reason: 'Loading timeout - website may be slow or blocked'
        })
      }, timeout)

      // Load event
      iframe.addEventListener('load', () => {
        console.log('✅ Iframe loaded for:', url)
        resolveOnce({
          status: 'loaded',
          iframe,
          reason: 'Iframe loaded successfully'
        })
      })

      // Error event  
      iframe.addEventListener('error', () => {
        console.log('❌ Iframe error for:', url)
        resolveOnce({
          status: 'blocked', // Changed from 'error' to 'blocked' since most errors are due to blocking
          iframe: null,
          reason: 'Website prevents iframe embedding'
        })
      })

      // Append to container for testing
      container.appendChild(iframe)
    })
  }

  private verifyIframeContent(iframe: HTMLIFrameElement) {
    try {
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document

      if (!iframeDoc) {
        return {
          blocked: true,
          reason: 'no-document-access',
          message: 'Cannot access iframe content due to same-origin policy'
        }
      }

      const title = iframeDoc.title
      const body = iframeDoc.body

      if (!title && !body?.innerHTML) {
        return {
          blocked: true,
          reason: 'empty-content',
          message: 'Iframe loaded but contains no content'
        }
      }

      // Check for common blocked page indicators
      const bodyText = body?.innerText?.toLowerCase() || ''
      const titleLower = title.toLowerCase()

      if (titleLower.includes('blocked') || 
          titleLower.includes('denied') ||
          bodyText.includes('x-frame-options') ||
          bodyText.includes('refused to connect')) {
        return {
          blocked: true,
          reason: 'blocked-content',
          message: 'Website explicitly blocks iframe embedding'
        }
      }

      return {
        blocked: false,
        title,
        hasContent: !!body?.innerHTML,
        message: 'Content accessible and appears valid'
      }

    } catch (error) {
      return {
        blocked: true,
        reason: 'access-denied',
        message: 'Cross-origin access denied - website likely allows embedding',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  private isSameOrigin(url: string): boolean {
    try {
      return new URL(url).origin === window.location.origin
    } catch {
      return false
    }
  }

  // Utility method to check if a domain is known to block iframes
  isDomainKnownToBlock(url: string): boolean {
    try {
      const hostname = new URL(url).hostname.toLowerCase()
      const blockedDomains = [
        'google.com',
        'facebook.com', 
        'twitter.com',
        'instagram.com',
        'linkedin.com',
        'amazon.com',
        'apple.com',
        'microsoft.com',
        'youtube.com',
        'github.com',
        'stackoverflow.com',
        'reddit.com'
      ]

      return blockedDomains.some(domain => 
        hostname === domain || hostname.endsWith(`.${domain}`)
      )
    } catch {
      return false
    }
  }

  // Get user-friendly message for different blocking scenarios
  getBlockedMessage(result: IframeDetectionResult): string {
    switch (result.reason) {
      case 'explicit-headers':
        return 'This website prevents embedding for security reasons.'
      case 'loading-timeout':
        return 'Website took too long to load - likely blocked or experiencing issues.'
      case 'no-document-access':
        return 'Website loaded but content is not accessible due to security policies.'
      case 'blocked-content':
        return 'Website explicitly refuses to be embedded in other sites.'
      case 'empty-content':
        return 'Website loaded but appears to be empty or blocked.'
      default:
        return 'Website cannot be previewed due to security restrictions.'
    }
  }
}

export const iframeDetectionService = new IframeDetectionService()