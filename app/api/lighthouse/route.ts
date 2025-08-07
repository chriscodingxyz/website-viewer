import { NextRequest, NextResponse } from 'next/server'
import { 
  LighthouseReportSchema,
  LighthouseReport,
  CoreWebVitals,
  LighthouseScores,
  LighthouseAudit,
  PerformanceOpportunity,
  PerformanceDiagnostic
} from '@/types/metadata'

// Device configurations for different viewports
const DEVICE_CONFIGS = {
  desktop: {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1024, height: 768 },
    deviceScaleFactor: 1,
    isMobile: false,
    hasTouch: false,
    formFactor: 'desktop' as const,
    throttling: {
      rttMs: 40,
      throughputKbps: 10240,
      cpuSlowdownMultiplier: 1,
      requestLatencyMs: 0,
      downloadThroughputKbps: 0,
      uploadThroughputKbps: 0
    }
  },
  tablet: {
    userAgent: 'Mozilla/5.0 (iPad; CPU OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
    viewport: { width: 768, height: 1024 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    formFactor: 'mobile' as const,
    throttling: {
      rttMs: 150,
      throughputKbps: 1638.4,
      cpuSlowdownMultiplier: 4,
      requestLatencyMs: 0,
      downloadThroughputKbps: 0,
      uploadThroughputKbps: 0
    }
  },
  mobileLarge: {
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    viewport: { width: 640, height: 1000 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    formFactor: 'mobile' as const,
    throttling: {
      rttMs: 150,
      throughputKbps: 1638.4,
      cpuSlowdownMultiplier: 4,
      requestLatencyMs: 0,
      downloadThroughputKbps: 0,
      uploadThroughputKbps: 0
    }
  },
  mobile: {
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    viewport: { width: 375, height: 667 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    formFactor: 'mobile' as const,
    throttling: {
      rttMs: 150,
      throughputKbps: 1638.4,
      cpuSlowdownMultiplier: 4,
      requestLatencyMs: 0,
      downloadThroughputKbps: 0,
      uploadThroughputKbps: 0
    }
  }
}

type ViewportType = 'desktop' | 'tablet' | 'mobileLarge' | 'mobile'

function extractCoreWebVitals(lhr: any): CoreWebVitals {
  const audits = lhr.audits || {}
  
  return {
    lcp: audits['largest-contentful-paint']?.numericValue,
    cls: audits['cumulative-layout-shift']?.numericValue,
    inp: audits['interaction-to-next-paint']?.numericValue,
    fcp: audits['first-contentful-paint']?.numericValue,
    ttfb: audits['server-response-time']?.numericValue,
    tbt: audits['total-blocking-time']?.numericValue,
    si: audits['speed-index']?.numericValue,
  }
}

function extractLighthouseScores(lhr: any): LighthouseScores {
  const categories = lhr.categories || {}
  
  return {
    performance: categories.performance?.score ? Math.round(categories.performance.score * 100) : undefined,
    accessibility: categories.accessibility?.score ? Math.round(categories.accessibility.score * 100) : undefined,
    bestPractices: categories['best-practices']?.score ? Math.round(categories['best-practices'].score * 100) : undefined,
    seo: categories.seo?.score ? Math.round(categories.seo.score * 100) : undefined,
    pwa: categories.pwa?.score ? Math.round(categories.pwa.score * 100) : undefined,
  }
}

function extractAudits(lhr: any): LighthouseAudit[] {
  const audits = lhr.audits || {}
  const auditArray: LighthouseAudit[] = []
  
  // Key performance audits
  const keyAudits = [
    'first-contentful-paint',
    'largest-contentful-paint',
    'speed-index',
    'cumulative-layout-shift',
    'total-blocking-time',
    'server-response-time',
    'interactive',
    'max-potential-fid'
  ]
  
  keyAudits.forEach(auditId => {
    const audit = audits[auditId]
    if (audit) {
      auditArray.push({
        id: auditId,
        title: audit.title || '',
        description: audit.description || '',
        score: audit.score,
        scoreDisplayMode: audit.scoreDisplayMode || '',
        numericValue: audit.numericValue,
        numericUnit: audit.numericUnit,
        displayValue: audit.displayValue,
      })
    }
  })
  
  return auditArray
}

function extractOpportunities(lhr: any): PerformanceOpportunity[] {
  const audits = lhr.audits || {}
  const opportunities: PerformanceOpportunity[] = []
  
  // Key opportunity audits
  const opportunityAudits = [
    'unused-css-rules',
    'unused-javascript',
    'modern-image-formats',
    'offscreen-images',
    'render-blocking-resources',
    'unminified-css',
    'unminified-javascript',
    'efficient-animated-content',
    'duplicated-javascript',
    'legacy-javascript'
  ]
  
  opportunityAudits.forEach(auditId => {
    const audit = audits[auditId]
    if (audit && audit.details) {
      opportunities.push({
        id: auditId,
        title: audit.title || '',
        description: audit.description || '',
        score: audit.score,
        numericValue: audit.numericValue,
        numericUnit: audit.numericUnit,
        displayValue: audit.displayValue,
        details: audit.details,
      })
    }
  })
  
  return opportunities
}

function extractDiagnostics(lhr: any): PerformanceDiagnostic[] {
  const audits = lhr.audits || {}
  const diagnostics: PerformanceDiagnostic[] = []
  
  // Key diagnostic audits
  const diagnosticAudits = [
    'mainthread-work-breakdown',
    'bootup-time',
    'uses-rel-preload',
    'uses-rel-preconnect',
    'font-display',
    'diagnostics',
    'network-requests',
    'network-rtt',
    'network-server-latency'
  ]
  
  diagnosticAudits.forEach(auditId => {
    const audit = audits[auditId]
    if (audit) {
      diagnostics.push({
        id: auditId,
        title: audit.title || '',
        description: audit.description || '',
        score: audit.score,
        scoreDisplayMode: audit.scoreDisplayMode || '',
        displayValue: audit.displayValue,
        details: audit.details,
      })
    }
  })
  
  return diagnostics.filter(d => d.score !== null || d.displayValue)
}

async function runLighthouse(url: string, viewport: ViewportType): Promise<LighthouseReport> {
  let browser: any = null
  
  try {
    // Dynamically import lighthouse and puppeteer to avoid bundling issues
    const [lighthouse, puppeteer] = await Promise.all([
      import('lighthouse').then(m => m.default),
      import('puppeteer').then(m => m.default)
    ])
    
    // Launch Puppeteer browser
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    })
    
    // Get browser WebSocket endpoint
    const endpoint = browser.wsEndpoint()
    const endpointURL = new URL(endpoint)
    
    const deviceConfig = DEVICE_CONFIGS[viewport]
    
    // Configure Lighthouse options
    const options = {
      logLevel: 'info' as const,
      output: 'json' as const,
      onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
      port: parseInt(endpointURL.port),
      emulatedFormFactor: deviceConfig.formFactor,
      throttling: deviceConfig.throttling,
      screenEmulation: {
        mobile: deviceConfig.isMobile,
        width: deviceConfig.viewport.width,
        height: deviceConfig.viewport.height,
        deviceScaleFactor: deviceConfig.deviceScaleFactor,
        disabled: false,
      }
    }
    
    // Run Lighthouse
    const result = await lighthouse(url, options)
    
    if (!result || !result.lhr) {
      throw new Error('Failed to generate Lighthouse report')
    }
    
    const lhr = result.lhr
    
    // Extract data for our schema
    const lighthouseReport: LighthouseReport = {
      requestedUrl: lhr.requestedUrl || url,
      finalUrl: lhr.finalUrl || url,
      fetchTime: lhr.fetchTime || new Date().toISOString(),
      gatherMode: lhr.gatherMode || 'navigation',
      lighthouseVersion: lhr.lighthouseVersion || '12.0.0',
      userAgent: lhr.userAgent || deviceConfig.userAgent,
      environment: {
        networkUserAgent: lhr.environment?.networkUserAgent || deviceConfig.userAgent,
        hostUserAgent: lhr.environment?.hostUserAgent || deviceConfig.userAgent,
        benchmarkIndex: lhr.environment?.benchmarkIndex || 1000,
      },
      configSettings: {
        emulatedFormFactor: deviceConfig.formFactor,
        locale: lhr.configSettings?.locale || 'en-US',
        onlyCategories: options.onlyCategories,
      },
      scores: extractLighthouseScores(lhr),
      coreWebVitals: extractCoreWebVitals(lhr),
      audits: extractAudits(lhr),
      opportunities: extractOpportunities(lhr),
      diagnostics: extractDiagnostics(lhr),
      timing: {
        total: lhr.timing?.total || 0,
      },
    }
    
    return lighthouseReport
    
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}

export async function GET(request: NextRequest) {
  // For now, return mock data to test the UI while we fix Lighthouse integration
  try {
    const searchParams = request.nextUrl.searchParams
    const url = searchParams.get('url')
    const viewport = (searchParams.get('viewport') || 'desktop') as ViewportType
    
    if (!url) {
      return NextResponse.json(
        { success: false, error: 'URL parameter is required' },
        { status: 400 }
      )
    }

    try {
      new URL(url)
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid URL format' },
        { status: 400 }
      )
    }
    console.log(`Mock Lighthouse analysis for ${url} on ${viewport} viewport...`)
    
    // Return mock data for testing
    const mockReport: LighthouseReport = {
      requestedUrl: url,
      finalUrl: url,
      fetchTime: new Date().toISOString(),
      gatherMode: 'navigation',
      lighthouseVersion: '12.0.0',
      userAgent: 'MockUserAgent',
      environment: {
        networkUserAgent: 'MockUserAgent',
        hostUserAgent: 'MockUserAgent',
        benchmarkIndex: 1000,
      },
      configSettings: {
        emulatedFormFactor: viewport === 'desktop' ? 'desktop' : 'mobile',
        locale: 'en-US',
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
      },
      scores: {
        performance: viewport === 'desktop' ? 95 : 85,
        accessibility: 92,
        bestPractices: 88,
        seo: 90,
      },
      coreWebVitals: {
        lcp: viewport === 'desktop' ? 1200 : 1800,
        cls: 0.05,
        inp: viewport === 'desktop' ? 150 : 200,
        fcp: viewport === 'desktop' ? 800 : 1200,
        ttfb: 300,
        tbt: 100,
        si: viewport === 'desktop' ? 2000 : 3000,
      },
      audits: [
        {
          id: 'first-contentful-paint',
          title: 'First Contentful Paint',
          description: 'First Contentful Paint marks the time at which the first text or image is painted.',
          score: 0.9,
          scoreDisplayMode: 'numeric',
          numericValue: viewport === 'desktop' ? 800 : 1200,
          numericUnit: 'millisecond',
          displayValue: viewport === 'desktop' ? '0.8 s' : '1.2 s',
        },
        {
          id: 'largest-contentful-paint',
          title: 'Largest Contentful Paint',
          description: 'Largest Contentful Paint marks the time at which the largest text or image is painted.',
          score: 0.85,
          scoreDisplayMode: 'numeric',
          numericValue: viewport === 'desktop' ? 1200 : 1800,
          numericUnit: 'millisecond',
          displayValue: viewport === 'desktop' ? '1.2 s' : '1.8 s',
        }
      ],
      opportunities: [
        {
          id: 'unused-css-rules',
          title: 'Reduce unused CSS',
          description: 'Reduce unused rules from stylesheets and defer CSS not used for above-the-fold content.',
          score: 0.5,
          numericValue: 150000,
          numericUnit: 'byte',
          displayValue: 'Potential savings of 150 KB',
        }
      ],
      diagnostics: [
        {
          id: 'mainthread-work-breakdown',
          title: 'Minimize main-thread work',
          description: 'Consider reducing the time spent parsing, compiling and executing JS.',
          score: 0.7,
          scoreDisplayMode: 'numeric',
          displayValue: '2.1 s',
        }
      ],
      timing: {
        total: 5000,
      },
    }
    
    return NextResponse.json({
      success: true,
      data: mockReport,
      timing: {
        duration: 2000,
        timestamp: new Date().toISOString(),
      }
    })
    
  } catch (error) {
    console.error('Mock Lighthouse analysis error:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    
    return NextResponse.json(
      { 
        success: false, 
        error: `Mock Lighthouse analysis failed: ${errorMessage}` 
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  // For now, return mock data to test the UI while we fix Lighthouse integration
  try {
    const body = await request.json()
    const { url, viewports } = body
    
    if (!url) {
      return NextResponse.json(
        { success: false, error: 'URL is required' },
        { status: 400 }
      )
    }
    
    const viewportsToAnalyze = viewports || ['desktop', 'tablet', 'mobileLarge', 'mobile']
    const results: Record<string, LighthouseReport> = {}
    
    console.log(`Mock Lighthouse analysis for ${url} on viewports: ${viewportsToAnalyze.join(', ')}`)
    
    // Generate mock data for each viewport
    for (const viewport of viewportsToAnalyze) {
      if (Object.keys(DEVICE_CONFIGS).includes(viewport)) {
        const mockReport: LighthouseReport = {
          requestedUrl: url,
          finalUrl: url,
          fetchTime: new Date().toISOString(),
          gatherMode: 'navigation',
          lighthouseVersion: '12.0.0',
          userAgent: `MockUserAgent-${viewport}`,
          environment: {
            networkUserAgent: `MockUserAgent-${viewport}`,
            hostUserAgent: `MockUserAgent-${viewport}`,
            benchmarkIndex: 1000,
          },
          configSettings: {
            emulatedFormFactor: viewport === 'desktop' ? 'desktop' : 'mobile',
            locale: 'en-US',
            onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
          },
          scores: {
            performance: getViewportScore(viewport, 'performance'),
            accessibility: getViewportScore(viewport, 'accessibility'),
            bestPractices: getViewportScore(viewport, 'bestPractices'),
            seo: getViewportScore(viewport, 'seo'),
          },
          coreWebVitals: {
            lcp: getViewportMetric(viewport, 'lcp'),
            cls: getViewportMetric(viewport, 'cls'),
            inp: getViewportMetric(viewport, 'inp'),
            fcp: getViewportMetric(viewport, 'fcp'),
            ttfb: getViewportMetric(viewport, 'ttfb'),
            tbt: getViewportMetric(viewport, 'tbt'),
            si: getViewportMetric(viewport, 'si'),
          },
          audits: [
            {
              id: 'first-contentful-paint',
              title: 'First Contentful Paint',
              description: 'First Contentful Paint marks the time at which the first text or image is painted.',
              score: 0.9,
              scoreDisplayMode: 'numeric',
              numericValue: getViewportMetric(viewport, 'fcp'),
              numericUnit: 'millisecond',
              displayValue: `${(getViewportMetric(viewport, 'fcp')! / 1000).toFixed(1)} s`,
            },
            {
              id: 'largest-contentful-paint',
              title: 'Largest Contentful Paint',
              description: 'Largest Contentful Paint marks the time at which the largest text or image is painted.',
              score: 0.85,
              scoreDisplayMode: 'numeric',
              numericValue: getViewportMetric(viewport, 'lcp'),
              numericUnit: 'millisecond',
              displayValue: `${(getViewportMetric(viewport, 'lcp')! / 1000).toFixed(1)} s`,
            }
          ],
          opportunities: [
            {
              id: 'unused-css-rules',
              title: 'Reduce unused CSS',
              description: 'Reduce unused rules from stylesheets and defer CSS not used for above-the-fold content.',
              score: 0.5,
              numericValue: 150000,
              numericUnit: 'byte',
              displayValue: 'Potential savings of 150 KB',
            },
            {
              id: 'unused-javascript',
              title: 'Reduce unused JavaScript',
              description: 'Reduce unused JavaScript and defer loading scripts until they are required.',
              score: 0.3,
              numericValue: 200000,
              numericUnit: 'byte',
              displayValue: 'Potential savings of 200 KB',
            }
          ],
          diagnostics: [
            {
              id: 'mainthread-work-breakdown',
              title: 'Minimize main-thread work',
              description: 'Consider reducing the time spent parsing, compiling and executing JS.',
              score: 0.7,
              scoreDisplayMode: 'numeric',
              displayValue: '2.1 s',
            },
            {
              id: 'bootup-time',
              title: 'Reduce JavaScript execution time',
              description: 'Consider reducing the time spent parsing, compiling, and executing JS.',
              score: 0.6,
              scoreDisplayMode: 'numeric',
              displayValue: '1.8 s',
            }
          ],
          timing: {
            total: 5000,
          },
        }
        
        results[viewport] = mockReport
      }
    }
    
    return NextResponse.json({
      success: true,
      data: results,
      timing: {
        duration: 3000,
        timestamp: new Date().toISOString(),
      }
    })
    
  } catch (error) {
    console.error('Mock Lighthouse batch analysis error:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    
    return NextResponse.json(
      { 
        success: false, 
        error: `Mock Lighthouse batch analysis failed: ${errorMessage}` 
      },
      { status: 500 }
    )
  }
}

// Helper functions for generating realistic mock data
function getViewportScore(viewport: string, metric: string): number {
  const baseScores = {
    performance: { desktop: 95, tablet: 88, mobileLarge: 85, mobile: 82 },
    accessibility: { desktop: 92, tablet: 92, mobileLarge: 91, mobile: 90 },
    bestPractices: { desktop: 88, tablet: 87, mobileLarge: 86, mobile: 85 },
    seo: { desktop: 90, tablet: 89, mobileLarge: 88, mobile: 87 }
  }
  
  return (baseScores as any)[metric]?.[viewport] || 85
}

function getViewportMetric(viewport: string, metric: string): number {
  const baseMetrics = {
    lcp: { desktop: 1200, tablet: 1500, mobileLarge: 1800, mobile: 2100 },
    cls: { desktop: 0.05, tablet: 0.08, mobileLarge: 0.12, mobile: 0.15 },
    inp: { desktop: 150, tablet: 180, mobileLarge: 220, mobile: 250 },
    fcp: { desktop: 800, tablet: 1000, mobileLarge: 1200, mobile: 1400 },
    ttfb: { desktop: 300, tablet: 400, mobileLarge: 500, mobile: 600 },
    tbt: { desktop: 100, tablet: 150, mobileLarge: 200, mobile: 250 },
    si: { desktop: 2000, tablet: 2500, mobileLarge: 3000, mobile: 3500 }
  }
  
  return (baseMetrics as any)[metric]?.[viewport] || 1000
}