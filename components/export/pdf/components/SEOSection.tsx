import React from 'react'
import { View, Text } from '@react-pdf/renderer'
import { styles } from '../PDFStyles'
import { WebsiteMetadata } from '@/types/metadata'

interface SEOSectionProps {
  metadata: WebsiteMetadata
}

export const SEOSection: React.FC<SEOSectionProps> = ({ metadata }) => {
  const { seo, sitemap, icons } = metadata

  const getSEOScore = () => {
    let score = 0
    const maxScore = 5
    if (seo.title && seo.title.length >= 30 && seo.title.length <= 60) score += 1
    if (seo.description && seo.description.length >= 120 && seo.description.length <= 160) score += 1
    if (seo.canonical) score += 1
    if (seo.language) score += 1
    if (seo.viewport) score += 1
    return { score, maxScore, percentage: Math.round((score / maxScore) * 100) }
  }

  const seoScore = getSEOScore()

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
      case 'good': return '✓ GOOD'
      case 'warning': return '⚠ WARNING'
      case 'error': return '✗ ERROR'
      default: return 'UNKNOWN'
    }
  }

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>SEO Analysis</Text>

      {/* SEO Score Overview */}
      <View style={styles.scoreContainer}>
        <View style={styles.scoreItem}>
          <Text style={[styles.scoreValue, { color: seoScore.percentage >= 80 ? '#059669' : seoScore.percentage >= 60 ? '#d97706' : '#dc2626' }]}>
            {seoScore.percentage}%
          </Text>
          <Text style={styles.scoreLabel}>SEO Score</Text>
        </View>
        <View style={styles.scoreItem}>
          <Text style={styles.scoreValue}>{seoScore.score}/{seoScore.maxScore}</Text>
          <Text style={styles.scoreLabel}>Checks Passed</Text>
        </View>
        <View style={styles.scoreItem}>
          <Text style={[styles.scoreValue, { fontSize: 16 }]}>
            {seoScore.percentage >= 80 ? 'Excellent' : seoScore.percentage >= 60 ? 'Good' : 'Needs Work'}
          </Text>
          <Text style={styles.scoreLabel}>Overall Rating</Text>
        </View>
      </View>

      {/* Core Meta Tags */}
      <View style={styles.marginBottom}>
        <Text style={styles.subsectionTitle}>
          Essential Meta Tags
        </Text>

        {/* Title */}
        <View style={styles.listItem}>
          <Text style={styles.listBullet}>•</Text>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              <Text style={{ fontSize: 11, fontWeight: 'bold', marginRight: 8 }}>Page Title:</Text>
              <Text style={getStatusStyle(seo.title && seo.title.length >= 30 && seo.title.length <= 60 ? 'good' : seo.title ? 'warning' : 'error')}>
                {getStatusText(seo.title && seo.title.length >= 30 && seo.title.length <= 60 ? 'good' : seo.title ? 'warning' : 'error')}
              </Text>
            </View>
            <Text style={[styles.listText, { fontStyle: seo.title ? 'normal' : 'italic' }]}>
              {seo.title || 'No title found'}
            </Text>
            {seo.title && (
              <Text style={{ fontSize: 9, color: '#666666', marginTop: 2 }}>
                {seo.title.length} characters (optimal: 30-60)
              </Text>
            )}
          </View>
        </View>

        {/* Description */}
        <View style={styles.listItem}>
          <Text style={styles.listBullet}>•</Text>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              <Text style={{ fontSize: 11, fontWeight: 'bold', marginRight: 8 }}>Meta Description:</Text>
              <Text style={getStatusStyle(seo.description && seo.description.length >= 120 && seo.description.length <= 160 ? 'good' : seo.description ? 'warning' : 'error')}>
                {getStatusText(seo.description && seo.description.length >= 120 && seo.description.length <= 160 ? 'good' : seo.description ? 'warning' : 'error')}
              </Text>
            </View>
            <Text style={[styles.listText, { fontStyle: seo.description ? 'normal' : 'italic' }]}>
              {seo.description || 'No meta description found'}
            </Text>
            {seo.description && (
              <Text style={{ fontSize: 9, color: '#666666', marginTop: 2 }}>
                {seo.description.length} characters (optimal: 120-160)
              </Text>
            )}
          </View>
        </View>

        {/* Canonical URL */}
        <View style={styles.listItem}>
          <Text style={styles.listBullet}>•</Text>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              <Text style={{ fontSize: 11, fontWeight: 'bold', marginRight: 8 }}>Canonical URL:</Text>
              <Text style={getStatusStyle(seo.canonical ? 'good' : 'warning')}>
                {getStatusText(seo.canonical ? 'good' : 'warning')}
              </Text>
            </View>
            <Text style={[styles.listText, { fontStyle: seo.canonical ? 'normal' : 'italic' }]}>
              {seo.canonical || 'Not specified - consider adding for SEO'}
            </Text>
          </View>
        </View>
      </View>

      {/* Technical Configuration */}
      <View style={styles.marginBottom}>
        <Text style={styles.subsectionTitle}>
          Technical Configuration
        </Text>

        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={styles.tableCellHeader}>Setting</Text>
            <Text style={styles.tableCellHeader}>Status</Text>
            <Text style={styles.tableCellHeader}>Value</Text>
          </View>

          <View style={styles.tableRow}>
            <Text style={styles.tableCell}>Viewport Meta Tag</Text>
            <Text style={[styles.tableCell, getStatusStyle(seo.viewport ? 'good' : 'error')]}>
              {getStatusText(seo.viewport ? 'good' : 'error')}
            </Text>
            <Text style={styles.tableCell}>{seo.viewport || 'Missing'}</Text>
          </View>

          <View style={styles.tableRow}>
            <Text style={styles.tableCell}>Language Declaration</Text>
            <Text style={[styles.tableCell, getStatusStyle(seo.language ? 'good' : 'warning')]}>
              {getStatusText(seo.language ? 'good' : 'warning')}
            </Text>
            <Text style={styles.tableCell}>{seo.language || 'Not specified'}</Text>
          </View>

          <View style={styles.tableRow}>
            <Text style={styles.tableCell}>Robots Directive</Text>
            <Text style={[styles.tableCell, getStatusStyle(seo.robots ? 'good' : 'warning')]}>
              {getStatusText(seo.robots ? 'good' : 'warning')}
            </Text>
            <Text style={styles.tableCell}>{seo.robots || 'Default behavior'}</Text>
          </View>

          <View style={styles.tableRow}>
            <Text style={styles.tableCell}>Author Information</Text>
            <Text style={[styles.tableCell, getStatusStyle(seo.author ? 'good' : 'warning')]}>
              {getStatusText(seo.author ? 'good' : 'warning')}
            </Text>
            <Text style={styles.tableCell}>{seo.author || 'Not specified'}</Text>
          </View>
        </View>
      </View>

      {/* Icons & Branding */}
      <View style={styles.marginBottom}>
        <Text style={styles.subsectionTitle}>
          Visual Identity
        </Text>

        <View style={styles.listItem}>
          <Text style={styles.listBullet}>•</Text>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              <Text style={{ fontSize: 11, fontWeight: 'bold', marginRight: 8 }}>Favicons:</Text>
              <Text style={getStatusStyle(icons && icons.length > 0 ? 'good' : 'error')}>
                {getStatusText(icons && icons.length > 0 ? 'good' : 'error')}
              </Text>
            </View>
            <Text style={styles.listText}>
              {icons && icons.length > 0
                ? `${icons.length} icon${icons.length === 1 ? '' : 's'} found - enhances brand recognition`
                : 'No favicons detected - add favicon.ico and various icon sizes'
              }
            </Text>
          </View>
        </View>
      </View>

      {/* SEO Recommendations */}
      <View>
        <Text style={styles.subsectionTitle}>
          Recommendations
        </Text>

        {!seo.title && (
          <View style={styles.criticalIssue}>
            <Text style={styles.criticalIssueTitle}>Critical: Missing Page Title</Text>
            <Text style={styles.criticalIssueText}>
              Add a descriptive, unique title tag (30-60 characters) to improve search engine rankings and click-through rates.
            </Text>
          </View>
        )}

        {!seo.description && (
          <View style={styles.criticalIssue}>
            <Text style={styles.criticalIssueTitle}>Critical: Missing Meta Description</Text>
            <Text style={styles.criticalIssueText}>
              Add a compelling meta description (120-160 characters) to improve search result snippets and user engagement.
            </Text>
          </View>
        )}

        {!seo.viewport && (
          <View style={styles.criticalIssue}>
            <Text style={styles.criticalIssueTitle}>Critical: Missing Viewport Meta Tag</Text>
            <Text style={styles.criticalIssueText}>
              Add viewport meta tag for mobile responsiveness. This is essential for mobile SEO and user experience.
            </Text>
          </View>
        )}

        {!seo.canonical && (
          <View style={styles.recommendation}>
            <Text style={styles.recommendationTitle}>Add Canonical URL</Text>
            <Text style={styles.recommendationText}>
              Include a canonical URL to prevent duplicate content issues and consolidate page authority.
            </Text>
          </View>
        )}

        {(!icons || icons.length === 0) && (
          <View style={styles.recommendation}>
            <Text style={styles.recommendationTitle}>Add Favicon and Icons</Text>
            <Text style={styles.recommendationText}>
              Include favicon.ico and various icon sizes for better brand recognition across browsers and platforms.
            </Text>
          </View>
        )}
      </View>
    </View>
  )
}