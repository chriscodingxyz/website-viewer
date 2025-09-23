import React from 'react'
import { View, Text } from '@react-pdf/renderer'
import { styles } from '../PDFStyles'
import { WebsiteMetadata } from '@/types/metadata'

interface TechnicalSectionProps {
  metadata: WebsiteMetadata
}

export const TechnicalSection: React.FC<TechnicalSectionProps> = ({ metadata }) => {
  const { technical, headers, performance } = metadata
  const safeHeaders = headers || {}

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getTechnicalScore = () => {
    let score = 0
    const maxScore = 8

    // Security checks
    if (metadata.url.startsWith('https://')) score += 1
    if (safeHeaders.contentSecurityPolicy) score += 1
    if (safeHeaders.xFrameOptions) score += 1
    if (safeHeaders.strictTransportSecurity) score += 1

    // Performance checks
    if (safeHeaders.contentEncoding) score += 1
    if (safeHeaders.cacheControl) score += 1

    // Configuration checks
    if (metadata.seo.viewport) score += 1
    if (technical?.charset) score += 1

    return { score, maxScore, percentage: Math.round((score / maxScore) * 100) }
  }

  const technicalScore = getTechnicalScore()

  const getStatusStyle = (status: 'good' | 'warning' | 'error') => {
    switch (status) {
      case 'good': return styles.statusGood
      case 'warning': return styles.statusWarning
      case 'error': return styles.statusError
      default: return styles.statusGood
    }
  }

  const getStatusText = (status: 'good' | 'warning' | 'error') => {
    switch (status) {
      case 'good': return '✓ SECURE'
      case 'warning': return '⚠ WARNING'
      case 'error': return '✗ CRITICAL'
      default: return 'UNKNOWN'
    }
  }

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Technical Analysis</Text>

      {/* Technical Score Overview */}
      <View style={styles.scoreContainer}>
        <View style={styles.scoreItem}>
          <Text style={[styles.scoreValue, { color: technicalScore.percentage >= 80 ? '#059669' : technicalScore.percentage >= 60 ? '#d97706' : '#dc2626' }]}>
            {technicalScore.percentage}%
          </Text>
          <Text style={styles.scoreLabel}>Technical Score</Text>
        </View>
        <View style={styles.scoreItem}>
          <Text style={styles.scoreValue}>{technicalScore.score}/{technicalScore.maxScore}</Text>
          <Text style={styles.scoreLabel}>Security Checks</Text>
        </View>
        <View style={styles.scoreItem}>
          <Text style={[styles.scoreValue, { fontSize: 16 }]}>
            {metadata.url.startsWith('https://') ? 'HTTPS' : 'HTTP'}
          </Text>
          <Text style={styles.scoreLabel}>Protocol</Text>
        </View>
      </View>

      {/* Security & Headers */}
      <View style={styles.marginBottom}>
        <Text style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 10, color: '#1a1a1a' }}>
          Security Configuration
        </Text>

        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={styles.tableCellHeader}>Security Feature</Text>
            <Text style={styles.tableCellHeader}>Status</Text>
            <Text style={styles.tableCellHeader}>Value</Text>
          </View>

          <View style={styles.tableRow}>
            <Text style={styles.tableCell}>HTTPS Encryption</Text>
            <Text style={[styles.tableCell, getStatusStyle(metadata.url.startsWith('https://') ? 'good' : 'error')]}>
              {metadata.url.startsWith('https://') ? '✓ SECURE' : '✗ INSECURE'}
            </Text>
            <Text style={styles.tableCell}>
              {metadata.url.startsWith('https://') ? 'SSL/TLS Enabled' : 'HTTP Only'}
            </Text>
          </View>

          <View style={styles.tableRow}>
            <Text style={styles.tableCell}>Content Security Policy</Text>
            <Text style={[styles.tableCell, getStatusStyle(safeHeaders.contentSecurityPolicy ? 'good' : 'warning')]}>
              {safeHeaders.contentSecurityPolicy ? '✓ CONFIGURED' : '⚠ MISSING'}
            </Text>
            <Text style={styles.tableCell}>
              {safeHeaders.contentSecurityPolicy ? 'XSS Protection Active' : 'Not Configured'}
            </Text>
          </View>

          <View style={styles.tableRow}>
            <Text style={styles.tableCell}>X-Frame-Options</Text>
            <Text style={[styles.tableCell, getStatusStyle(safeHeaders.xFrameOptions ? 'good' : 'warning')]}>
              {safeHeaders.xFrameOptions ? '✓ PROTECTED' : '⚠ MISSING'}
            </Text>
            <Text style={styles.tableCell}>
              {safeHeaders.xFrameOptions || 'Clickjacking Protection Missing'}
            </Text>
          </View>

          <View style={styles.tableRow}>
            <Text style={styles.tableCell}>HSTS (Strict Transport Security)</Text>
            <Text style={[styles.tableCell, getStatusStyle(safeHeaders.strictTransportSecurity ? 'good' : 'warning')]}>
              {safeHeaders.strictTransportSecurity ? '✓ ENABLED' : '⚠ MISSING'}
            </Text>
            <Text style={styles.tableCell}>
              {safeHeaders.strictTransportSecurity ? 'HTTPS Enforced' : 'Not Enforced'}
            </Text>
          </View>

          <View style={styles.tableRow}>
            <Text style={styles.tableCell}>X-Content-Type-Options</Text>
            <Text style={[styles.tableCell, getStatusStyle(safeHeaders.xContentTypeOptions ? 'good' : 'warning')]}>
              {safeHeaders.xContentTypeOptions ? '✓ PROTECTED' : '⚠ MISSING'}
            </Text>
            <Text style={styles.tableCell}>
              {safeHeaders.xContentTypeOptions || 'MIME Sniffing Protection Missing'}
            </Text>
          </View>
        </View>
      </View>

      {/* Performance Metrics */}
      {performance && (
        <View style={styles.marginBottom}>
          <Text style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 10, color: '#1a1a1a' }}>
            Performance Metrics
          </Text>

          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={styles.tableCellHeader}>Metric</Text>
              <Text style={styles.tableCellHeader}>Value</Text>
              <Text style={styles.tableCellHeader}>Assessment</Text>
            </View>

            {performance.contentLength && (
              <View style={styles.tableRow}>
                <Text style={styles.tableCell}>Page Size</Text>
                <Text style={styles.tableCell}>{formatBytes(performance.contentLength)}</Text>
                <Text style={[styles.tableCell, getStatusStyle(
                  performance.contentLength < 1000000 ? 'good' :
                  performance.contentLength < 5000000 ? 'warning' : 'error'
                )]}>
                  {performance.contentLength < 1000000 ? '✓ OPTIMIZED' :
                   performance.contentLength < 5000000 ? '⚠ LARGE' : '✗ TOO LARGE'}
                </Text>
              </View>
            )}

            {performance.loadTime && (
              <View style={styles.tableRow}>
                <Text style={styles.tableCell}>Load Time</Text>
                <Text style={styles.tableCell}>{performance.loadTime}ms</Text>
                <Text style={[styles.tableCell, getStatusStyle(
                  performance.loadTime < 1000 ? 'good' :
                  performance.loadTime < 3000 ? 'warning' : 'error'
                )]}>
                  {performance.loadTime < 1000 ? '✓ FAST' :
                   performance.loadTime < 3000 ? '⚠ AVERAGE' : '✗ SLOW'}
                </Text>
              </View>
            )}

            <View style={styles.tableRow}>
              <Text style={styles.tableCell}>Content Compression</Text>
              <Text style={styles.tableCell}>{safeHeaders.contentEncoding || 'None'}</Text>
              <Text style={[styles.tableCell, getStatusStyle(safeHeaders.contentEncoding ? 'good' : 'warning')]}>
                {safeHeaders.contentEncoding ? '✓ ENABLED' : '⚠ DISABLED'}
              </Text>
            </View>

            <View style={styles.tableRow}>
              <Text style={styles.tableCell}>Cache Control</Text>
              <Text style={styles.tableCell}>{safeHeaders.cacheControl || 'Not Set'}</Text>
              <Text style={[styles.tableCell, getStatusStyle(safeHeaders.cacheControl ? 'good' : 'warning')]}>
                {safeHeaders.cacheControl ? '✓ CONFIGURED' : '⚠ MISSING'}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Technical Configuration */}
      <View style={styles.marginBottom}>
        <Text style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 10, color: '#1a1a1a' }}>
          Technical Configuration
        </Text>

        <View style={styles.listItem}>
          <Text style={styles.listBullet}>•</Text>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              <Text style={{ fontSize: 11, fontWeight: 'bold', marginRight: 8 }}>Character Encoding:</Text>
              <Text style={getStatusStyle(technical?.charset ? 'good' : 'warning')}>
                {technical?.charset ? '✓ DECLARED' : '⚠ MISSING'}
              </Text>
            </View>
            <Text style={styles.listText}>
              {technical?.charset || 'Character encoding not declared - may cause display issues'}
            </Text>
          </View>
        </View>

        {technical?.doctype && (
          <View style={styles.listItem}>
            <Text style={styles.listBullet}>•</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 11, fontWeight: 'bold', marginBottom: 4 }}>Document Type:</Text>
              <Text style={styles.listText}>{technical.doctype}</Text>
            </View>
          </View>
        )}

        {technical?.themeColor && (
          <View style={styles.listItem}>
            <Text style={styles.listBullet}>•</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 11, fontWeight: 'bold', marginBottom: 4 }}>Theme Color:</Text>
              <Text style={styles.listText}>{technical.themeColor}</Text>
            </View>
          </View>
        )}

        <View style={styles.listItem}>
          <Text style={styles.listBullet}>•</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 11, fontWeight: 'bold', marginBottom: 4 }}>Server Information:</Text>
            <Text style={styles.listText}>
              {safeHeaders.server || 'Server information not disclosed (security by obscurity)'}
            </Text>
          </View>
        </View>
      </View>

      {/* Security Recommendations */}
      <View>
        <Text style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 10, color: '#1a1a1a' }}>
          Security Recommendations
        </Text>

        {!metadata.url.startsWith('https://') && (
          <View style={styles.criticalIssue}>
            <Text style={styles.criticalIssueTitle}>Critical: Enable HTTPS</Text>
            <Text style={styles.criticalIssueText}>
              Switch to HTTPS to encrypt data transmission, improve SEO rankings, and meet modern web standards.
            </Text>
          </View>
        )}

        {!safeHeaders.contentSecurityPolicy && (
          <View style={styles.recommendation}>
            <Text style={styles.recommendationTitle}>Add Content Security Policy</Text>
            <Text style={styles.recommendationText}>
              Implement CSP headers to prevent XSS attacks and unauthorized resource loading.
            </Text>
          </View>
        )}

        {!safeHeaders.xFrameOptions && (
          <View style={styles.recommendation}>
            <Text style={styles.recommendationTitle}>Enable X-Frame-Options</Text>
            <Text style={styles.recommendationText}>
              Add X-Frame-Options header to prevent clickjacking attacks by controlling iframe embedding.
            </Text>
          </View>
        )}

        {!safeHeaders.strictTransportSecurity && metadata.url.startsWith('https://') && (
          <View style={styles.recommendation}>
            <Text style={styles.recommendationTitle}>Enable HSTS</Text>
            <Text style={styles.recommendationText}>
              Implement HTTP Strict Transport Security to force HTTPS connections and prevent downgrade attacks.
            </Text>
          </View>
        )}

        {!safeHeaders.contentEncoding && (
          <View style={styles.recommendation}>
            <Text style={styles.recommendationTitle}>Enable Compression</Text>
            <Text style={styles.recommendationText}>
              Configure gzip or brotli compression to reduce bandwidth usage and improve loading times.
            </Text>
          </View>
        )}
      </View>
    </View>
  )
}