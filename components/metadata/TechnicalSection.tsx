'use client'

import React from 'react'
import { WebsiteMetadata } from '@/types/metadata'
import {
  Code2,
  FileJson,
  Info,
  Server,
  Settings,
  Shield,
  Zap
} from 'lucide-react'
import SiteDiscovery from '@/components/SiteDiscovery'
import MetadataErrorCard from './MetadataErrorCard'
import { getTechnicalScore } from '@/lib/scoring'
import {
  AuditCard,
  AuditLoadingState,
  AuditSection,
  AuditStatus,
  MetadataPill,
  ScoreSummaryCard,
  StatusPill
} from './AnalysisPrimitives'

interface TechnicalSectionProps {
  metadata?: WebsiteMetadata | null
  loading?: boolean
  error?: string | null
}

const formatBytes = (bytes?: number) => {
  if (!bytes) return undefined
  const units = ['Bytes', 'KB', 'MB', 'GB']
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  return `${parseFloat((bytes / Math.pow(1024, index)).toFixed(2))} ${units[index]}`
}

const getSizeStatus = (bytes?: number): AuditStatus => {
  if (!bytes) return 'neutral'
  if (bytes < 1000000) return 'good'
  if (bytes < 5000000) return 'warning'
  return 'error'
}

const getLoadStatus = (loadTime?: number): AuditStatus => {
  if (!loadTime) return 'neutral'
  if (loadTime < 1000) return 'good'
  if (loadTime < 3000) return 'warning'
  return 'error'
}

export default function TechnicalSection ({ metadata, error }: TechnicalSectionProps) {
  if (error) {
    return <MetadataErrorCard sectionName='Technical' error={error} />
  }

  if (!metadata) {
    return (
      <AuditLoadingState
        title='Analyzing technical data'
        items={[
          'Reading server headers',
          'Checking security policies',
          'Reviewing performance signals',
          'Inspecting structured data'
        ]}
      />
    )
  }

  const { technical, headers, structuredData, performance } = metadata
  const safeHeaders = headers || {}
  const technicalScore = getTechnicalScore(metadata)
  const responseHeaderCount = Object.keys(safeHeaders).length

  return (
    <div className='space-y-8'>
      <ScoreSummaryCard
        icon={Settings}
        label='Technical Health'
        score={technicalScore}
        description='Transport security, HTTP headers, performance hints, and document setup.'
      >
        <StatusPill status={technicalScore.percentage >= 80 ? 'good' : technicalScore.percentage >= 60 ? 'warning' : 'error'}>
          {technicalScore.percentage >= 80 ? 'Well configured' : technicalScore.percentage >= 60 ? 'Partially configured' : 'Needs hardening'}
        </StatusPill>
      </ScoreSummaryCard>

      <AuditSection
        icon={Zap}
        title='Performance Signals'
        description='Lightweight measurements and transfer hints from the metadata request.'
      >
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
          <AuditCard
            status={getSizeStatus(performance?.contentLength)}
            label='Page size'
            value={formatBytes(performance?.contentLength)}
            detail={
              performance?.contentLength
                ? performance.contentLength < 1000000
                  ? 'Compact transfer size for the initial HTML response.'
                  : performance.contentLength < 5000000
                    ? 'Usable, but worth reviewing assets and payload weight.'
                    : 'Large response size can slow down first load.'
                : 'Content length was not available from the response.'
            }
          />
          <AuditCard
            status={getLoadStatus(performance?.loadTime)}
            label='Metadata fetch time'
            value={performance?.loadTime ? `${performance.loadTime}ms` : undefined}
            detail={
              performance?.loadTime
                ? performance.loadTime < 1000
                  ? 'Fast response during this audit.'
                  : performance.loadTime < 3000
                    ? 'Acceptable response time, with room to improve.'
                    : 'Slow response during this audit.'
                : 'Load time was not available for this request.'
            }
          />
          <AuditCard
            status={safeHeaders.contentEncoding ? 'good' : 'warning'}
            label='Content compression'
            value={safeHeaders.contentEncoding}
            detail={safeHeaders.contentEncoding ? 'Compression is enabled for smaller transfers.' : 'Enable gzip or Brotli where possible.'}
          />
          <AuditCard
            status={safeHeaders.cacheControl ? 'good' : 'warning'}
            label='Cache control'
            value={safeHeaders.cacheControl}
            detail={safeHeaders.cacheControl ? 'Caching rules are present.' : 'Add cache headers for better repeat visits.'}
          />
        </div>
      </AuditSection>

      <AuditSection
        icon={Shield}
        title='Security Headers'
        description='Browser-level protections that reduce common security and embedding risks.'
      >
        <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3'>
          <AuditCard
            status={metadata.url.startsWith('https://') ? 'good' : 'error'}
            label='HTTPS'
            value={metadata.url.startsWith('https://') ? 'Secure connection' : 'HTTP connection'}
            detail={metadata.url.startsWith('https://') ? 'Traffic is encrypted.' : 'Switch to HTTPS for security, trust, and SEO.'}
          />
          <AuditCard
            status={safeHeaders.contentSecurityPolicy ? 'good' : 'warning'}
            label='Content Security Policy'
            value={safeHeaders.contentSecurityPolicy ? 'Configured' : undefined}
            detail={safeHeaders.contentSecurityPolicy ? 'CSP helps limit script and injection risks.' : 'Add a CSP to reduce script injection exposure.'}
          />
          <AuditCard
            status={safeHeaders.xFrameOptions ? 'good' : 'warning'}
            label='X-Frame-Options'
            value={safeHeaders.xFrameOptions}
            detail={safeHeaders.xFrameOptions ? 'Clickjacking protection is declared.' : 'Add frame protections if the page should not be embedded.'}
          />
          <AuditCard
            status={safeHeaders.strictTransportSecurity ? 'good' : 'warning'}
            label='HSTS'
            value={safeHeaders.strictTransportSecurity ? 'Enabled' : undefined}
            detail={safeHeaders.strictTransportSecurity ? 'Browsers are instructed to use HTTPS.' : 'Enable HSTS after HTTPS is stable.'}
          />
          <AuditCard
            status={safeHeaders.xContentTypeOptions ? 'good' : 'warning'}
            label='X-Content-Type-Options'
            value={safeHeaders.xContentTypeOptions}
            detail={safeHeaders.xContentTypeOptions ? 'MIME sniffing protection is present.' : 'Add nosniff to reduce content type confusion.'}
          />
          <AuditCard
            status={safeHeaders.referrerPolicy ? 'good' : 'neutral'}
            label='Referrer policy'
            value={safeHeaders.referrerPolicy}
            detail={safeHeaders.referrerPolicy ? 'Referrer sharing behavior is explicit.' : 'Optional, but recommended for privacy-sensitive pages.'}
          />
        </div>
      </AuditSection>

      <AuditSection
        icon={Code2}
        title='Document Setup'
        description='HTML-level declarations and app metadata that affect rendering and install surfaces.'
      >
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
          <AuditCard
            status={metadata.seo.viewport ? 'good' : 'error'}
            label='Mobile viewport'
            value={metadata.seo.viewport}
            detail={metadata.seo.viewport ? 'Responsive viewport meta tag is present.' : 'Required for reliable mobile rendering.'}
          />
          <AuditCard
            status={technical?.charset ? 'good' : 'warning'}
            label='Character encoding'
            value={technical?.charset}
            detail={technical?.charset ? 'Character set is declared.' : 'Declare a charset to avoid text rendering ambiguity.'}
          />
          <AuditCard
            status={technical?.doctype ? 'good' : 'warning'}
            label='Document type'
            value={technical?.doctype}
            detail={technical?.doctype ? 'HTML document type is declared.' : 'Declare a doctype to ensure standards mode.'}
          />
          <AuditCard
            status={technical?.themeColor ? 'good' : 'neutral'}
            label='Theme color'
            value={technical?.themeColor}
            detail={technical?.themeColor ? 'Browser UI theme color is configured.' : 'Optional. Useful for mobile browser polish.'}
          />
          <AuditCard
            status={technical?.manifestUrl ? 'good' : 'neutral'}
            label='Web app manifest'
            value={technical?.manifestUrl}
            detail={technical?.manifestUrl ? 'Manifest is linked for install and app metadata.' : 'Optional unless the site supports installable app behavior.'}
          />
          <AuditCard
            status='neutral'
            label='Server'
            value={safeHeaders.server}
            detail={safeHeaders.server ? 'Server signature is visible in response headers.' : 'Server signature is not exposed.'}
          />
        </div>
      </AuditSection>

      {structuredData && structuredData.length > 0 && (
        <AuditSection
          icon={FileJson}
          title='Structured Data'
          description='JSON-LD schemas that help search engines classify page content.'
        >
          <AuditCard
            status='good'
            label='JSON-LD schemas'
            detail={`${structuredData.length} schema${structuredData.length === 1 ? '' : 's'} detected.`}
          >
            <div className='mt-4 flex flex-wrap gap-2'>
              {structuredData.slice(0, 8).map((schema, index) => (
                <MetadataPill key={`${schema.type}-${index}`}>
                  {schema.type || 'Schema'}
                </MetadataPill>
              ))}
              {structuredData.length > 8 && (
                <MetadataPill>+{structuredData.length - 8} more</MetadataPill>
              )}
            </div>
          </AuditCard>
        </AuditSection>
      )}

      {responseHeaderCount > 0 && (
        <AuditSection
          icon={Server}
          title='Response Headers'
          description='Raw response headers for debugging, caching, policy checks, and deployment verification.'
          action={
            <MetadataPill>
              <Info className='h-3.5 w-3.5 text-muted-foreground' />
              {responseHeaderCount} headers
            </MetadataPill>
          }
        >
          <div className='rounded-lg border border-border bg-card overflow-hidden'>
            <details>
              <summary className='cursor-pointer px-4 py-3 text-sm font-medium text-foreground hover:bg-muted/30 transition-colors'>
                View all HTTP headers
              </summary>
              <pre className='max-h-72 overflow-auto border-t border-border bg-muted/20 p-4 text-xs leading-relaxed text-muted-foreground whitespace-pre-wrap'>
                {Object.entries(safeHeaders)
                  .map(([key, value]) => `${key}: ${value}`)
                  .join('\n')}
              </pre>
            </details>
          </div>
        </AuditSection>
      )}

      <SiteDiscovery metadata={metadata} />
    </div>
  )
}
