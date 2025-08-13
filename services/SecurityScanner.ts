/**
 * Security Scanner Service
 * Detects exposed environment variables and API keys in client-side JavaScript bundles
 */

export type SecuritySeverity = 'critical' | 'high' | 'medium' | 'info'

export interface SecurityFinding {
  id: string
  type: string
  severity: SecuritySeverity
  title: string
  description: string
  value: string | null
  location: string
  recommendation: string
  service?: string
  variable: string
  context: string
  line?: number
}

export interface SecurityScanResult {
  url: string
  scanTime: number
  findings: SecurityFinding[]
  summary: {
    critical: number
    high: number
    medium: number
    info: number
  }
  bundlesScanned: number
  bundlesFailed: number
  totalFindings: number
  scannedBundles: Array<{
    url: string
    size: number
    error?: string
  }>
}

// Service-specific finding templates
const FINDING_TEMPLATES = {
  stripe_secret_live: {
    title: 'Stripe Live Secret Key Exposed',
    description: '🚨 CRITICAL: Live Stripe secret key found in client-side code! This can process real payments.',
    recommendation: 'Remove immediately! Move to server-side environment variables and rotate the key in Stripe dashboard.',
    service: 'Stripe'
  },
  stripe_secret_test: {
    title: 'Stripe Test Secret Key Exposed',
    description: '⚠️ Stripe test secret key exposed. While not live payments, this is still a security risk.',
    recommendation: 'Move to server-side. Test keys should also be kept secure.',
    service: 'Stripe'
  },
  stripe_publishable_live: {
    title: 'Stripe Live Publishable Key',
    description: 'Stripe live publishable key found. This is intended for client-side but verify it\'s restricted.',
    recommendation: 'Ensure this key has domain restrictions in your Stripe dashboard.',
    service: 'Stripe'
  },
  openai_secret: {
    title: 'OpenAI API Key Exposed',
    description: '🚨 CRITICAL: OpenAI secret key exposed! This can consume your API credits.',
    recommendation: 'Move to server-side proxy immediately. Rotate key in OpenAI dashboard.',
    service: 'OpenAI'
  },
  aws_access_key: {
    title: 'AWS Access Key Exposed',
    description: '🚨 HIGH RISK: AWS access key found in client-side code.',
    recommendation: 'Remove immediately and rotate in AWS console. Check CloudTrail for unauthorized usage.',
    service: 'AWS'
  },
  sendgrid_api_key: {
    title: 'SendGrid API Key Exposed',
    description: '⚠️ SendGrid API key can send emails using your account.',
    recommendation: 'Move email sending to server-side API routes. Rotate key in SendGrid.',
    service: 'SendGrid'
  },
  supabase_url: {
    title: 'Supabase Project URL',
    description: 'Supabase project URL found. This is safe when used with anon key and RLS.',
    recommendation: 'Verify Row Level Security (RLS) is enabled on all tables.',
    service: 'Supabase'
  },
  firebase_api_key: {
    title: 'Firebase API Key',
    description: 'Firebase API key found. This is generally safe for client-side use.',
    recommendation: 'Ensure Firebase Security Rules are properly configured.',
    service: 'Firebase'
  },
  potential_api_key: {
    title: 'Potential API Key or Secret',
    description: 'Long alphanumeric string that could be an API key or secret.',
    recommendation: 'Verify if this is sensitive data that should be moved server-side.',
    service: 'Generic'
  },
  env_variable_with_value: {
    title: 'Environment Variable with Exposed Value',
    description: 'Environment variable found with its actual value exposed in client-side code.',
    recommendation: 'Review if this variable contains sensitive data that should be server-side only.',
    service: 'Environment'
  },
  env_variable_reference: {
    title: 'Environment Variable Reference',
    description: 'Environment variable reference found in compiled code (value may be replaced at build time).',
    recommendation: 'This indicates process.env usage - verify no sensitive data is exposed.',
    service: 'Environment'
  }
}

export class SecurityScanner {
  private generateFindingId(variable: string, value: string | null): string {
    const valueStr = value || 'null'
    return `${variable}_${valueStr}`.replace(/[^a-z0-9_]/gi, '_').toLowerCase()
  }

  private createFinding(match: any, bundleUrl: string): SecurityFinding {
    const template = FINDING_TEMPLATES[match.type as keyof typeof FINDING_TEMPLATES] || {
      title: match.variable.includes('process.env') ? 'Process Environment Reference' : 'Environment Variable',
      description: match.value 
        ? 'Environment variable found with its value exposed in client-side code.'
        : 'Environment variable reference found in compiled code.',
      recommendation: match.value 
        ? 'Review if this variable contains sensitive data that should be server-side only.'
        : 'This indicates process.env usage - verify no sensitive data is exposed.',
      service: 'Environment'
    }

    return {
      id: this.generateFindingId(match.variable, match.value),
      type: match.type,
      severity: match.severity,
      title: template.title,
      description: template.description,
      value: match.value,
      location: match.bundleUrl || bundleUrl,
      recommendation: template.recommendation,
      service: template.service,
      variable: match.variable,
      context: match.context,
      line: match.line
    }
  }

  async scanWebsite(url: string): Promise<SecurityScanResult> {
    const startTime = Date.now()

    try {
      const response = await fetch('/api/security-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.details || `HTTP ${response.status}`)
      }

      const data = await response.json()
      
      // Transform API findings into SecurityFinding format
      const findings: SecurityFinding[] = data.findings.map((match: any) => 
        this.createFinding(match, match.bundleUrl || 'JavaScript Bundle')
      )

      return {
        url,
        scanTime: data.scanTime ? (data.scanTime - startTime) : (Date.now() - startTime),
        findings,
        summary: {
          critical: data.summary?.critical || 0,
          high: data.summary?.high || 0,
          medium: data.summary?.medium || 0,
          info: data.summary?.info || 0
        },
        bundlesScanned: data.bundlesScanned || 0,
        bundlesFailed: data.bundlesFailed || 0,
        totalFindings: data.totalFindings || findings.length,
        scannedBundles: data.scannedBundles || []
      }

    } catch (error) {
      console.error('Security scan error:', error)
      
      // Return empty result with error info
      return {
        url,
        scanTime: Date.now() - startTime,
        findings: [],
        summary: { critical: 0, high: 0, medium: 0, info: 0 },
        bundlesScanned: 0,
        bundlesFailed: 0,
        totalFindings: 0,
        scannedBundles: []
      }
    }
  }
}

export const securityScanner = new SecurityScanner()