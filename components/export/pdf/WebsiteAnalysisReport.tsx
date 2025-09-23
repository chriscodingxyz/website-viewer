import React from 'react'
import { Document, Page, View, Text } from '@react-pdf/renderer'
import { styles } from './PDFStyles'
import { CoverPage } from './components/CoverPage'
import { SEOSection } from './components/SEOSection'
import { TechnicalSection } from './components/TechnicalSection'
import { WebsiteMetadata } from '@/types/metadata'
import { ExportConfig } from '@/types/export'

interface WebsiteAnalysisReportProps {
  metadata: WebsiteMetadata
  config: ExportConfig
  generatedAt: string
}

export const WebsiteAnalysisReport: React.FC<WebsiteAnalysisReportProps> = ({
  metadata,
  config,
  generatedAt
}) => {
  const getDomainName = (url: string) => {
    try {
      return new URL(url).hostname.replace('www.', '')
    } catch {
      return url
    }
  }

  // Executive Summary Component
  const ExecutiveSummary = () => {
    const getSEOScore = () => {
      let score = 0
      const maxScore = 5
      const { seo } = metadata
      if (seo.title && seo.title.length >= 30 && seo.title.length <= 60) score += 1
      if (seo.description && seo.description.length >= 120 && seo.description.length <= 160) score += 1
      if (seo.canonical) score += 1
      if (seo.language) score += 1
      if (seo.viewport) score += 1
      return { score, maxScore, percentage: Math.round((score / maxScore) * 100) }
    }

    const getTechnicalScore = () => {
      let score = 0
      const maxScore = 8
      const safeHeaders = metadata.headers || {}

      if (metadata.url.startsWith('https://')) score += 1
      if (safeHeaders.contentSecurityPolicy) score += 1
      if (safeHeaders.xFrameOptions) score += 1
      if (safeHeaders.strictTransportSecurity) score += 1
      if (safeHeaders.contentEncoding) score += 1
      if (safeHeaders.cacheControl) score += 1
      if (metadata.seo.viewport) score += 1
      if (metadata.technical?.charset) score += 1

      return { score, maxScore, percentage: Math.round((score / maxScore) * 100) }
    }

    const getCriticalIssues = () => {
      const issues = []
      const { seo } = metadata
      if (!seo.title) issues.push('Missing page title')
      if (!seo.description) issues.push('Missing meta description')
      if (!seo.viewport) issues.push('Missing viewport meta tag')
      if (!metadata.url.startsWith('https://')) issues.push('Not using HTTPS')
      if (!metadata.headers?.contentSecurityPolicy) issues.push('No Content Security Policy')
      return issues
    }

    const seoScore = getSEOScore()
    const technicalScore = getTechnicalScore()
    const criticalIssues = getCriticalIssues()

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Executive Summary</Text>

        {/* Overall Scores */}
        <View style={styles.scoreContainer}>
          <View style={styles.scoreItem}>
            <Text style={[styles.scoreValue, { color: seoScore.percentage >= 80 ? '#059669' : seoScore.percentage >= 60 ? '#d97706' : '#dc2626' }]}>
              {seoScore.percentage}%
            </Text>
            <Text style={styles.scoreLabel}>SEO Score</Text>
          </View>
          <View style={styles.scoreItem}>
            <Text style={[styles.scoreValue, { color: technicalScore.percentage >= 80 ? '#059669' : technicalScore.percentage >= 60 ? '#d97706' : '#dc2626' }]}>
              {technicalScore.percentage}%
            </Text>
            <Text style={styles.scoreLabel}>Technical Score</Text>
          </View>
          <View style={styles.scoreItem}>
            <Text style={[styles.scoreValue, { fontSize: 16, color: criticalIssues.length === 0 ? '#059669' : criticalIssues.length <= 2 ? '#d97706' : '#dc2626' }]}>
              {criticalIssues.length}
            </Text>
            <Text style={styles.scoreLabel}>Critical Issues</Text>
          </View>
        </View>

        {/* Website Overview */}
        <View style={styles.marginBottom}>
          <Text style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 10, color: '#1a1a1a' }}>
            Website Overview
          </Text>

          <View style={styles.table}>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { fontWeight: 'bold' }]}>URL:</Text>
              <Text style={styles.tableCell}>{metadata.url}</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { fontWeight: 'bold' }]}>Title:</Text>
              <Text style={styles.tableCell}>{metadata.seo.title || 'No title found'}</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { fontWeight: 'bold' }]}>Environment:</Text>
              <Text style={styles.tableCell}>{config.environment}</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { fontWeight: 'bold' }]}>Protocol:</Text>
              <Text style={styles.tableCell}>
                {metadata.url.startsWith('https://') ? 'HTTPS (Secure)' : 'HTTP (Insecure)'}
              </Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { fontWeight: 'bold' }]}>Icons:</Text>
              <Text style={styles.tableCell}>
                {metadata.icons?.length || 0} favicon{(metadata.icons?.length || 0) === 1 ? '' : 's'} found
              </Text>
            </View>
          </View>
        </View>

        {/* Critical Issues */}
        {criticalIssues.length > 0 && (
          <View style={styles.marginBottom}>
            <Text style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 10, color: '#dc2626' }}>
              Critical Issues Requiring Immediate Attention
            </Text>

            {criticalIssues.map((issue, index) => (
              <View key={index} style={styles.criticalIssue}>
                <Text style={styles.criticalIssueTitle}>Issue {index + 1}: {issue}</Text>
                <Text style={styles.criticalIssueText}>
                  {issue === 'Missing page title' && 'Add a unique, descriptive title tag (30-60 characters) to improve SEO and user experience.'}
                  {issue === 'Missing meta description' && 'Add a compelling meta description (120-160 characters) to improve click-through rates from search results.'}
                  {issue === 'Missing viewport meta tag' && 'Add viewport meta tag for mobile responsiveness - critical for mobile SEO and usability.'}
                  {issue === 'Not using HTTPS' && 'Migrate to HTTPS for security, SEO benefits, and user trust. Modern browsers mark HTTP sites as "Not Secure".'}
                  {issue === 'No Content Security Policy' && 'Implement CSP headers to prevent XSS attacks and improve security posture.'}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Key Recommendations */}
        <View>
          <Text style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 10, color: '#1a1a1a' }}>
            Key Recommendations
          </Text>

          <View style={styles.recommendation}>
            <Text style={styles.recommendationTitle}>Priority 1: SEO Fundamentals</Text>
            <Text style={styles.recommendationText}>
              Ensure all essential meta tags are present and optimized. Focus on title, description, and viewport tags.
            </Text>
          </View>

          <View style={styles.recommendation}>
            <Text style={styles.recommendationTitle}>Priority 2: Security Headers</Text>
            <Text style={styles.recommendationText}>
              Implement security headers like CSP, X-Frame-Options, and HSTS to protect against common web vulnerabilities.
            </Text>
          </View>

          <View style={styles.recommendation}>
            <Text style={styles.recommendationTitle}>Priority 3: Performance Optimization</Text>
            <Text style={styles.recommendationText}>
              Enable compression, configure caching headers, and optimize resource loading for better user experience.
            </Text>
          </View>
        </View>
      </View>
    )
  }

  // Social Media Analysis Component
  const SocialMediaSection = () => {
    const { openGraph, twitterCard } = metadata

    const getSocialScore = () => {
      let score = 0
      const maxScore = 4
      if (openGraph.title) score += 1
      if (openGraph.description) score += 1
      if (openGraph.image) score += 1
      if (twitterCard.card) score += 1
      return { score, maxScore, percentage: Math.round((score / maxScore) * 100) }
    }

    const socialScore = getSocialScore()

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Social Media Analysis</Text>

        {/* Social Score */}
        <View style={styles.scoreContainer}>
          <View style={styles.scoreItem}>
            <Text style={[styles.scoreValue, { color: socialScore.percentage >= 80 ? '#059669' : socialScore.percentage >= 60 ? '#d97706' : '#dc2626' }]}>
              {socialScore.percentage}%
            </Text>
            <Text style={styles.scoreLabel}>Social Score</Text>
          </View>
          <View style={styles.scoreItem}>
            <Text style={styles.scoreValue}>{socialScore.score}/{socialScore.maxScore}</Text>
            <Text style={styles.scoreLabel}>Tags Present</Text>
          </View>
          <View style={styles.scoreItem}>
            <Text style={[styles.scoreValue, { fontSize: 16 }]}>
              {openGraph.image ? 'Yes' : 'No'}
            </Text>
            <Text style={styles.scoreLabel}>Share Image</Text>
          </View>
        </View>

        {/* Open Graph Tags */}
        <View style={styles.marginBottom}>
          <Text style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 10, color: '#1a1a1a' }}>
            Open Graph Tags (Facebook, LinkedIn)
          </Text>

          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={styles.tableCellHeader}>Property</Text>
              <Text style={styles.tableCellHeader}>Status</Text>
              <Text style={styles.tableCellHeader}>Value</Text>
            </View>

            <View style={styles.tableRow}>
              <Text style={styles.tableCell}>og:title</Text>
              <Text style={[styles.tableCell, openGraph.title ? styles.statusGood : styles.statusError]}>
                {openGraph.title ? '✓ PRESENT' : '✗ MISSING'}
              </Text>
              <Text style={styles.tableCell}>{openGraph.title || 'Not set'}</Text>
            </View>

            <View style={styles.tableRow}>
              <Text style={styles.tableCell}>og:description</Text>
              <Text style={[styles.tableCell, openGraph.description ? styles.statusGood : styles.statusError]}>
                {openGraph.description ? '✓ PRESENT' : '✗ MISSING'}
              </Text>
              <Text style={styles.tableCell}>{openGraph.description || 'Not set'}</Text>
            </View>

            <View style={styles.tableRow}>
              <Text style={styles.tableCell}>og:image</Text>
              <Text style={[styles.tableCell, openGraph.image ? styles.statusGood : styles.statusError]}>
                {openGraph.image ? '✓ PRESENT' : '✗ MISSING'}
              </Text>
              <Text style={styles.tableCell}>{openGraph.image ? 'Image configured' : 'No image set'}</Text>
            </View>

            <View style={styles.tableRow}>
              <Text style={styles.tableCell}>og:url</Text>
              <Text style={[styles.tableCell, openGraph.url ? styles.statusGood : styles.statusWarning]}>
                {openGraph.url ? '✓ PRESENT' : '⚠ MISSING'}
              </Text>
              <Text style={styles.tableCell}>{openGraph.url || 'Not specified'}</Text>
            </View>
          </View>
        </View>

        {/* Twitter Card Tags */}
        <View style={styles.marginBottom}>
          <Text style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 10, color: '#1a1a1a' }}>
            Twitter Card Tags
          </Text>

          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={styles.tableCellHeader}>Property</Text>
              <Text style={styles.tableCellHeader}>Status</Text>
              <Text style={styles.tableCellHeader}>Value</Text>
            </View>

            <View style={styles.tableRow}>
              <Text style={styles.tableCell}>twitter:card</Text>
              <Text style={[styles.tableCell, twitterCard.card ? styles.statusGood : styles.statusError]}>
                {twitterCard.card ? '✓ PRESENT' : '✗ MISSING'}
              </Text>
              <Text style={styles.tableCell}>{twitterCard.card || 'Not set'}</Text>
            </View>

            <View style={styles.tableRow}>
              <Text style={styles.tableCell}>twitter:title</Text>
              <Text style={[styles.tableCell, twitterCard.title ? styles.statusGood : styles.statusWarning]}>
                {twitterCard.title ? '✓ PRESENT' : '⚠ MISSING'}
              </Text>
              <Text style={styles.tableCell}>{twitterCard.title || 'Not set'}</Text>
            </View>

            <View style={styles.tableRow}>
              <Text style={styles.tableCell}>twitter:description</Text>
              <Text style={[styles.tableCell, twitterCard.description ? styles.statusGood : styles.statusWarning]}>
                {twitterCard.description ? '✓ PRESENT' : '⚠ MISSING'}
              </Text>
              <Text style={styles.tableCell}>{twitterCard.description || 'Not set'}</Text>
            </View>

            <View style={styles.tableRow}>
              <Text style={styles.tableCell}>twitter:image</Text>
              <Text style={[styles.tableCell, twitterCard.image ? styles.statusGood : styles.statusWarning]}>
                {twitterCard.image ? '✓ PRESENT' : '⚠ MISSING'}
              </Text>
              <Text style={styles.tableCell}>{twitterCard.image ? 'Image configured' : 'No image set'}</Text>
            </View>
          </View>
        </View>

        {/* Social Recommendations */}
        <View>
          <Text style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 10, color: '#1a1a1a' }}>
            Social Media Recommendations
          </Text>

          {!openGraph.image && (
            <View style={styles.criticalIssue}>
              <Text style={styles.criticalIssueTitle}>Critical: Missing Social Share Image</Text>
              <Text style={styles.criticalIssueText}>
                Add an og:image (1200x630px recommended) to ensure proper preview when shared on social media platforms.
              </Text>
            </View>
          )}

          {!openGraph.title && (
            <View style={styles.recommendation}>
              <Text style={styles.recommendationTitle}>Add Open Graph Title</Text>
              <Text style={styles.recommendationText}>
                Set og:title to control how your page title appears when shared on Facebook and LinkedIn.
              </Text>
            </View>
          )}

          {!twitterCard.card && (
            <View style={styles.recommendation}>
              <Text style={styles.recommendationTitle}>Configure Twitter Cards</Text>
              <Text style={styles.recommendationText}>
                Add twitter:card meta tag (summary_large_image recommended) to optimize Twitter sharing experience.
              </Text>
            </View>
          )}
        </View>
      </View>
    )
  }

  return (
    <Document>
      {/* Cover Page */}
      <CoverPage metadata={metadata} config={config} generatedAt={generatedAt} />

      {/* Executive Summary */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Website Analysis Report</Text>
          <Text style={styles.headerDate}>{getDomainName(metadata.url)} • {generatedAt}</Text>
        </View>

        <ExecutiveSummary />

        <View style={styles.footer}>
          <Text>Page 2 • {getDomainName(metadata.url)} • Generated by Website Viewer</Text>
        </View>
      </Page>

      {/* SEO Analysis */}
      {config.includeSections.seo && (
        <Page size="A4" style={styles.page}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>SEO Analysis</Text>
            <Text style={styles.headerDate}>{getDomainName(metadata.url)} • {generatedAt}</Text>
          </View>

          <SEOSection metadata={metadata} />

          <View style={styles.footer}>
            <Text>Page 3 • {getDomainName(metadata.url)} • Generated by Website Viewer</Text>
          </View>
        </Page>
      )}

      {/* Technical Analysis */}
      {config.includeSections.technical && (
        <Page size="A4" style={styles.page}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Technical Analysis</Text>
            <Text style={styles.headerDate}>{getDomainName(metadata.url)} • {generatedAt}</Text>
          </View>

          <TechnicalSection metadata={metadata} />

          <View style={styles.footer}>
            <Text>Page 4 • {getDomainName(metadata.url)} • Generated by Website Viewer</Text>
          </View>
        </Page>
      )}

      {/* Social Media Analysis */}
      {config.includeSections.social && (
        <Page size="A4" style={styles.page}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Social Media Analysis</Text>
            <Text style={styles.headerDate}>{getDomainName(metadata.url)} • {generatedAt}</Text>
          </View>

          <SocialMediaSection />

          <View style={styles.footer}>
            <Text>Page 5 • {getDomainName(metadata.url)} • Generated by Website Viewer</Text>
          </View>
        </Page>
      )}
    </Document>
  )
}