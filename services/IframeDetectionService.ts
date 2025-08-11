/**
 * Smart Iframe Detection Service
 * Detects iframe blocking using multiple methods and provides graceful fallbacks
 */

export type IframeStatus = 'ready' | 'loading' | 'loaded' | 'blocked' | 'error' | 'timeout'

interface DetectionMethodResult {
  success?: boolean
  error?: string
  details?: string
  accessible?: boolean
  blocked?: boolean
  reason?: string
  headers?: Record<string, unknown>
  status?: string
  iframe?: HTMLIFrameElement
  retryError?: string
}

export interface IframeDetectionResult {
  status: IframeStatus
  url: string
  reason?: string
  confidence: 'low' | 'medium' | 'high'
  detectionTime: number
  methods: {
    preflight?: DetectionMethodResult
    iframeLoad?: DetectionMethodResult
    contentVerification?: DetectionMethodResult
  }
}

export interface DetectionOptions {
  timeout?: number
  enablePreflight?: boolean
  checkContentAccess?: boolean
}

class IframeDetectionService {
  private defaultOptions: Required<DetectionOptions> = {
    timeout: 12000, // Reasonable timeout - allow slow sites to load
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
    
    // Starting iframe detection
    
    const result: IframeDetectionResult = {
      status: 'loading',
      url,
      confidence: 'low',
      detectionTime: 0,
      methods: {}
    }

    try {
      // Note: Removed early domain blocking check to avoid false positives
      // We'll use known blocked domains only as hints later in the process
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
            // Blocked by headers
            return result
          }
        } catch (error) {
          // Preflight check failed (normal for CORS)
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
          // Handle other statuses with less aggressive classification
          const loadStatus = result.methods.iframeLoad.status
          if (loadStatus === 'timeout') {
            // Don't immediately assume timeout = blocked, check if it's a known blocked domain
            if (this.isDomainKnownToBlock(url)) {
              result.status = 'blocked'
              result.reason = 'timeout-known-blocked'
              result.confidence = 'high'
            } else {
              result.status = 'timeout'
              result.reason = 'loading-timeout'
              result.confidence = 'low'  // Low confidence - could be slow loading
            }
          } else if (loadStatus === 'error') {
            result.status = 'error'
            result.reason = 'loading-error'  
            result.confidence = 'medium'
          } else {
            // Ensure loadStatus is a valid IframeStatus, fallback to 'error' if not
            const validStatus: IframeStatus = (loadStatus && ['ready', 'loading', 'loaded', 'blocked', 'error', 'timeout'].includes(loadStatus)) 
              ? loadStatus as IframeStatus 
              : 'error'
            result.status = validStatus
            result.reason = result.methods.iframeLoad.reason || 'Unknown error'
            result.confidence = 'medium'
          }
        }
      } catch (error) {
        // Iframe load test failed
        result.status = 'error'
        result.reason = error instanceof Error ? error.message : 'Unknown error'
        result.confidence = 'high'
      }

    } catch (error) {
      // Detection failed completely
      result.status = 'error'
      result.reason = error instanceof Error ? error.message : 'Detection failed'
      result.confidence = 'high'
    }

    result.detectionTime = performance.now() - startTime
    // Detection complete
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

  private iframeLoadTest(url: string, container: HTMLElement, timeout: number): Promise<DetectionMethodResult> {
    return new Promise((resolve) => {
      // Starting iframe detection

      const iframe = document.createElement('iframe')
      iframe.src = url
      iframe.style.width = '100%'
      iframe.style.height = '100%'
      iframe.style.border = 'none'
      iframe.style.display = 'none' // Hide during detection

      let hasResolved = false
      let timeoutId: ReturnType<typeof setTimeout>
      const resolveOnce = (result: DetectionMethodResult) => {
        if (hasResolved) return
        hasResolved = true
        clearTimeout(timeoutId)
        
        // Iframe detection complete
        
        // Clean up the test iframe
        if (iframe.parentNode) {
          iframe.parentNode.removeChild(iframe)
        }
        
        resolve(result)
      }

      // Set up timeout - could be slow loading or blocked
      timeoutId = setTimeout(() => {
        // Iframe detection timeout
        resolveOnce({
          status: 'timeout',
          iframe: undefined,
          reason: 'Loading timeout - may be slow loading or blocked'
        })
      }, timeout)

      // Load event
      iframe.addEventListener('load', () => {
        // Iframe loaded successfully
        resolveOnce({
          status: 'loaded',
          iframe,
          reason: 'Iframe loaded successfully'
        })
      })

      // Error event  
      iframe.addEventListener('error', () => {
        // Iframe loading error
        resolveOnce({
          status: 'error', // Don't assume error = blocked
          iframe: undefined,
          reason: 'Failed to load iframe - could be network issue or blocking'
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
        // Can't access content due to cross-origin - this is normal for most sites
        // Check iframe dimensions as a hint - blocked iframes often have 0 or very small dimensions
        const rect = iframe.getBoundingClientRect()
        if (rect.width === 0 || rect.height === 0) {
          return {
            blocked: true,
            reason: 'zero-dimensions',
            message: 'Iframe has zero dimensions - likely blocked'
          }
        }
        
        return {
          blocked: false,
          reason: 'cross-origin-success',
          message: 'Cross-origin access denied - iframe loaded successfully but content protected'
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
        blocked: false,
        reason: 'cross-origin-success',
        message: 'Cross-origin access denied - iframe loaded successfully but content protected',
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
        // Google Services
        'google.com', 'google.ca', 'google.co.uk', 'google.com.au', 'google.de', 'google.fr',
        'gmail.com', 'docs.google.com', 'drive.google.com', 'maps.google.com', 'photos.google.com',
        'accounts.google.com', 'myaccount.google.com', 'pay.google.com', 'cloud.google.com',
        
        // Social Media
        'facebook.com', 'fb.com', 'messenger.com', 'instagram.com', 'whatsapp.com',
        'twitter.com', 'x.com', 'linkedin.com', 'tiktok.com', 'snapchat.com',
        'pinterest.com', 'discord.com', 'telegram.org', 'signal.org',
        
        // Video Platforms
        'youtube.com', 'youtu.be', 'vimeo.com', 'twitch.tv', 'netflix.com',
        'hulu.com', 'disneyplus.com', 'primevideo.com', 'hbomax.com',
        
        // E-commerce & Shopping
        'amazon.com', 'amazon.ca', 'amazon.co.uk', 'amazon.de', 'amazon.fr',
        'ebay.com', 'walmart.com', 'target.com', 'bestbuy.com', 'etsy.com',
        'shopify.com', 'aliexpress.com', 'alibaba.com',
        
        // Financial & Banking
        'paypal.com', 'stripe.com', 'square.com', 'coinbase.com', 'binance.com',
        'wellsfargo.com', 'bankofamerica.com', 'chase.com', 'citibank.com',
        'americanexpress.com', 'discover.com', 'capitalone.com',
        
        // Tech Companies
        'apple.com', 'icloud.com', 'microsoft.com', 'live.com', 'outlook.com',
        'office.com', 'onedrive.com', 'xbox.com', 'skype.com',
        'adobe.com', 'salesforce.com', 'zoom.us', 'slack.com',
        
        // Development & Code
        'github.com', 'gitlab.com', 'bitbucket.org', 'stackoverflow.com',
        'npmjs.com', 'pypi.org', 'docker.com', 'aws.amazon.com',
        'console.aws.amazon.com', 'azure.microsoft.com', 'console.cloud.google.com',
        
        // Communication & Email
        'yahoo.com', 'protonmail.com', 'mail.com', 'aol.com',
        
        // News & Media
        'nytimes.com', 'wsj.com', 'washingtonpost.com', 'cnn.com',
        'bbc.com', 'reuters.com', 'bloomberg.com', 'forbes.com',
        
        // Government & Security
        'irs.gov', 'usa.gov', 'canada.ca', 'gov.uk', 'uscis.gov',
        
        // Dating & Social
        'tinder.com', 'bumble.com', 'match.com', 'okcupid.com',
        
        // General Sites Known for Strict Policies
        'reddit.com', 'quora.com', 'medium.com', 'substack.com',
        'notion.so', 'airtable.com', 'figma.com', 'canva.com'
      ]

      return blockedDomains.some(domain => 
        hostname === domain || hostname.endsWith(`.${domain}`)
      )
    } catch {
      return false
    }
  }

  // Retry detection with different strategy for uncertain results
  async retryDetection(
    url: string, 
    container: HTMLElement, 
    previousResult?: IframeDetectionResult,
    options?: DetectionOptions
  ): Promise<IframeDetectionResult> {
    const opts = { 
      ...this.defaultOptions, 
      ...options, 
      timeout: 5000, // Shorter timeout for retry
      checkContentAccess: false // Skip content access check on retry
    }
    
    // Retrying iframe detection
    
    // If previous result was timeout or uncertain, try with more aggressive blocking detection
    if (previousResult?.status === 'timeout' || previousResult?.confidence === 'low') {
      // Use even shorter timeout for retry
      opts.timeout = 3000
      
      try {
        const result = await this.detectIframeStatus(url, container, opts)
        // If still uncertain, default to blocked for safety
        if (result.confidence === 'low' || result.status === 'timeout') {
          result.status = 'blocked'
          result.reason = 'retry-timeout-blocked'
          result.confidence = 'medium'
        }
        return result
      } catch (error) {
        return {
          status: 'blocked',
          url,
          reason: 'retry-failed',
          confidence: 'medium',
          detectionTime: 0,
          methods: { preflight: { error: error instanceof Error ? error.message : 'Unknown error', retryError: error instanceof Error ? error.message : 'Unknown error' } }
        }
      }
    }
    
    // For other cases, return original result or run fresh detection
    return previousResult || this.detectIframeStatus(url, container, opts)
  }

  // Get user-friendly message for different blocking scenarios
  getBlockedMessage(result: IframeDetectionResult): string {
    switch (result.reason) {
      case 'known-blocked-domain':
        return 'This website is known to block iframe embedding for security.'
      case 'explicit-headers':
        return 'This website prevents embedding for security reasons.'
      case 'loading-timeout':
      case 'retry-timeout-blocked':
        return 'Website took too long to load - likely blocked or experiencing issues.'
      case 'loading-error':
        return 'Website failed to load in iframe - likely blocked by security headers.'
      case 'no-document-access':
        return 'Website loaded but content is not accessible due to security policies.'
      case 'blocked-content':
        return 'Website explicitly refuses to be embedded in other sites.'
      case 'empty-content':
        return 'Website loaded but appears to be empty or blocked.'
      case 'retry-failed':
        return 'Multiple detection attempts failed - website likely blocks embedding.'
      default:
        return 'Website cannot be previewed due to security restrictions.'
    }
  }
}

export const iframeDetectionService = new IframeDetectionService()