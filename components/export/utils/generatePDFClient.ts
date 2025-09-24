import { WebsiteMetadata } from '@/types/metadata'
import { ExportConfig } from '@/types/export'
import { generateFileName, extractDomainFromUrl } from './fileNaming'
import { generateAnalysis } from './analysisEngine'

/**
 * Enhanced client-side PDF generation with comprehensive analysis and color-coded sections
 */
export async function generatePDFClientSide(
  metadata: WebsiteMetadata,
  config: ExportConfig
): Promise<void> {
  try {
    console.log('Starting enhanced PDF generation...')

    // Dynamic import to ensure this only runs on the client
    const { pdf, Document, Page, Text, View, StyleSheet } = await import('@react-pdf/renderer')
    const React = await import('react')

    console.log('PDF libraries loaded...')

    // Generate analysis data
    const analysis = generateAnalysis(metadata, config.environment)

    // Enhanced styles with color coding
    const styles = StyleSheet.create({
      page: {
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        padding: 20,
        fontSize: 10,
        lineHeight: 1.4,
        fontFamily: 'Helvetica',
      },
      header: {
        backgroundColor: '#f8f9fa',
        padding: 15,
        marginBottom: 15,
        borderRadius: 4,
      },
      title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 8,
        textAlign: 'center',
      },
      subtitle: {
        fontSize: 11,
        color: '#6b7280',
        textAlign: 'center',
        marginBottom: 5,
      },
      url: {
        fontSize: 10,
        color: '#3b82f6',
        textAlign: 'center',
      },
      scoreCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 15,
        paddingHorizontal: 10,
      },
      scoreItem: {
        alignItems: 'center',
        flex: 1,
        marginHorizontal: 5,
      },
      scoreValue: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 2,
      },
      scoreLabel: {
        fontSize: 8,
        color: '#6b7280',
        textAlign: 'center',
      },
      twoColumn: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
      },
      column: {
        width: '48%',
      },
      section: {
        marginBottom: 8,
        padding: 8,
        backgroundColor: '#f9fafb',
        borderRadius: 4,
        borderLeft: '3px solid #e5e7eb',
      },
      sectionGood: {
        borderLeftColor: '#10b981',
        backgroundColor: '#f0fdf4',
      },
      sectionWarning: {
        borderLeftColor: '#f59e0b',
        backgroundColor: '#fffbeb',
      },
      sectionError: {
        borderLeftColor: '#ef4444',
        backgroundColor: '#fef2f2',
      },
      sectionTitle: {
        fontSize: 11,
        fontWeight: 'bold',
        marginBottom: 4,
        color: '#1f2937',
      },
      row: {
        flexDirection: 'row',
        marginBottom: 2,
        alignItems: 'flex-start',
      },
      label: {
        width: '40%',
        fontSize: 8,
        color: '#4b5563',
        paddingRight: 4,
      },
      value: {
        width: '60%',
        fontSize: 8,
        color: '#1f2937',
      },
      statusGood: {
        color: '#10b981',
        fontWeight: 'bold',
      },
      statusWarning: {
        color: '#f59e0b',
        fontWeight: 'bold',
      },
      statusError: {
        color: '#ef4444',
        fontWeight: 'bold',
      },
      issuesList: {
        marginTop: 5,
      },
      issueItem: {
        fontSize: 8,
        marginBottom: 2,
        paddingLeft: 8,
      },
      progressBar: {
        height: 8,
        backgroundColor: '#e5e7eb',
        borderRadius: 4,
        marginTop: 3,
        overflow: 'hidden',
      },
      progressFill: {
        height: '100%',
        borderRadius: 4,
      },
      footer: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
        textAlign: 'center',
        fontSize: 8,
        color: '#9ca3af',
        borderTop: '1px solid #e5e7eb',
        paddingTop: 8,
      },
      environmentBadge: {
        display: 'flex',
        padding: '2 6',
        backgroundColor: '#e5e7eb',
        borderRadius: 3,
        fontSize: 8,
        color: '#4b5563',
        marginLeft: 5,
      },
      compactRow: {
        flexDirection: 'row',
        marginBottom: 1,
        fontSize: 8,
        alignItems: 'flex-start',
      },
      compactLabel: {
        width: '40%',
        color: '#6b7280',
        fontSize: 8,
      },
      compactValue: {
        width: '60%',
        color: '#1f2937',
        fontSize: 8,
      },
    })

    console.log('Enhanced styles created...')

    // Helper functions
    const getStatusColor = (status: 'good' | 'warning' | 'error') => {
      switch (status) {
        case 'good': return '#10b981'
        case 'warning': return '#f59e0b'
        case 'error': return '#ef4444'
        default: return '#6b7280'
      }
    }

    const getSectionStyle = (status: 'good' | 'warning' | 'error') => {
      switch (status) {
        case 'good': return [styles.section, styles.sectionGood]
        case 'warning': return [styles.section, styles.sectionWarning]
        case 'error': return [styles.section, styles.sectionError]
        default: return styles.section
      }
    }

    const getStatusText = (value: any, good: any, warning?: any) => {
      if (value === good) return { text: '✓ Good', status: 'good' as const }
      if (warning && value === warning) return { text: '⚠ Warning', status: 'warning' as const }
      return { text: '✗ Error', status: 'error' as const }
    }

    // Create enhanced PDF document
    const MyDocument = () =>
      React.createElement(Document, {},
        React.createElement(Page, { size: 'A4', style: styles.page },
          // Header Section
          React.createElement(View, { style: styles.header },
            React.createElement(Text, { style: styles.title }, 'Website Analysis Report'),
            React.createElement(Text, { style: styles.subtitle },
              `Generated ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`),
            React.createElement(View, { style: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' } },
              React.createElement(Text, { style: styles.url }, metadata.url),
              React.createElement(Text, { style: styles.environmentBadge }, config.environment.toUpperCase())
            )
          ),

          // Score Dashboard
          React.createElement(View, { style: styles.scoreCard },
            React.createElement(View, { style: styles.scoreItem },
              React.createElement(Text, {
                style: [styles.scoreValue, { color: getStatusColor(analysis.seoScore >= 80 ? 'good' : analysis.seoScore >= 60 ? 'warning' : 'error') }]
              }, `${analysis.seoScore}%`),
              React.createElement(Text, { style: styles.scoreLabel }, 'SEO Score')
            ),
            React.createElement(View, { style: styles.scoreItem },
              React.createElement(Text, {
                style: [styles.scoreValue, { color: getStatusColor(analysis.technicalScore >= 80 ? 'good' : analysis.technicalScore >= 60 ? 'warning' : 'error') }]
              }, `${analysis.technicalScore}%`),
              React.createElement(Text, { style: styles.scoreLabel }, 'Technical Score')
            ),
            analysis.performanceScore !== undefined ? React.createElement(View, { style: styles.scoreItem },
              React.createElement(Text, {
                style: [styles.scoreValue, { color: getStatusColor(analysis.performanceScore >= 80 ? 'good' : analysis.performanceScore >= 60 ? 'warning' : 'error') }]
              }, `${analysis.performanceScore}%`),
              React.createElement(Text, { style: styles.scoreLabel }, 'Performance')
            ) : null,
            React.createElement(View, { style: styles.scoreItem },
              React.createElement(Text, {
                style: [styles.scoreValue, {
                  color: getStatusColor(
                    analysis.criticalIssues.length === 0 ? 'good' :
                    analysis.criticalIssues.length <= 2 ? 'warning' : 'error'
                  )
                }]
              }, analysis.criticalIssues.length.toString()),
              React.createElement(Text, { style: styles.scoreLabel }, 'Critical Issues')
            )
          ),

          // Two-column layout for compact information
          React.createElement(View, { style: styles.twoColumn },
            // Left Column
            React.createElement(View, { style: styles.column },
              // SEO Analysis Section
              React.createElement(View, {
                style: getSectionStyle(
                  analysis.seoScore >= 80 ? 'good' :
                  analysis.seoScore >= 60 ? 'warning' : 'error'
                )
              },
                React.createElement(Text, { style: styles.sectionTitle }, '🔍 SEO Analysis'),
                React.createElement(View, { style: styles.row },
                  React.createElement(Text, { style: styles.label }, 'Title:'),
                  React.createElement(Text, { style: styles.value },
                    metadata.seo.title ?
                      (metadata.seo.title.length >= 30 && metadata.seo.title.length <= 60 ?
                        `✓ ${metadata.seo.title.slice(0, 40)}...` :
                        `⚠ ${metadata.seo.title.slice(0, 40)}... (${metadata.seo.title.length} chars)`
                      ) : '✗ Missing title'
                  )
                ),
                React.createElement(View, { style: styles.row },
                  React.createElement(Text, { style: styles.label }, 'Description:'),
                  React.createElement(Text, { style: styles.value },
                    metadata.seo.description ?
                      (metadata.seo.description.length >= 120 && metadata.seo.description.length <= 160 ?
                        `✓ ${metadata.seo.description.slice(0, 40)}...` :
                        `⚠ ${metadata.seo.description.slice(0, 40)}... (${metadata.seo.description.length} chars)`
                      ) : '✗ Missing description'
                  )
                ),
                React.createElement(View, { style: styles.row },
                  React.createElement(Text, { style: styles.label }, 'Viewport:'),
                  React.createElement(Text, {
                    style: [styles.value, metadata.seo.viewport ? styles.statusGood : styles.statusError]
                  }, metadata.seo.viewport ? '✓ Present' : '✗ Missing')
                ),
                React.createElement(View, { style: styles.row },
                  React.createElement(Text, { style: styles.label }, 'Canonical:'),
                  React.createElement(Text, {
                    style: [styles.value, metadata.seo.canonical ? styles.statusGood : styles.statusWarning]
                  }, metadata.seo.canonical ? '✓ Present' : '⚠ Missing')
                ),
                React.createElement(View, { style: styles.row },
                  React.createElement(Text, { style: styles.label }, 'Language:'),
                  React.createElement(Text, { style: styles.value }, metadata.seo.language || 'Not specified')
                ),
                React.createElement(View, { style: styles.row },
                  React.createElement(Text, { style: styles.label }, 'Robots:'),
                  React.createElement(Text, { style: styles.value }, metadata.seo.robots || 'Default')
                )
              ),

              // Social Media Section
              React.createElement(View, {
                style: getSectionStyle(
                  (metadata.openGraph.title && metadata.openGraph.description && metadata.openGraph.image) ? 'good' :
                  (metadata.openGraph.title || metadata.openGraph.description) ? 'warning' : 'error'
                )
              },
                React.createElement(Text, { style: styles.sectionTitle }, '📱 Social Media'),
                React.createElement(View, { style: styles.compactRow },
                  React.createElement(Text, { style: styles.compactLabel }, 'Open Graph:'),
                  React.createElement(Text, {
                    style: [styles.compactValue,
                      (metadata.openGraph.title && metadata.openGraph.description) ? styles.statusGood :
                      metadata.openGraph.title ? styles.statusWarning : styles.statusError
                    ]
                  },
                    (metadata.openGraph.title && metadata.openGraph.description && metadata.openGraph.image) ? '✓ Complete' :
                    (metadata.openGraph.title || metadata.openGraph.description) ? '⚠ Partial' : '✗ Missing'
                  )
                ),
                React.createElement(View, { style: styles.compactRow },
                  React.createElement(Text, { style: styles.compactLabel }, 'Twitter Card:'),
                  React.createElement(Text, {
                    style: [styles.compactValue,
                      metadata.twitterCard.card ? styles.statusGood : styles.statusWarning
                    ]
                  }, metadata.twitterCard.card ? `✓ ${metadata.twitterCard.card}` : '⚠ Not configured')
                ),
                React.createElement(View, { style: styles.compactRow },
                  React.createElement(Text, { style: styles.compactLabel }, 'OG Image:'),
                  React.createElement(Text, { style: styles.compactValue },
                    metadata.openGraph.image ? '✓ Present' : '⚠ Missing'
                  )
                )
              ),

              // Analytics Section
              React.createElement(View, {
                style: getSectionStyle(
                  (metadata.analytics?.googleAnalytics.present || metadata.analytics?.googleTagManager.present) ? 'good' : 'warning'
                )
              },
                React.createElement(Text, { style: styles.sectionTitle }, '📊 Analytics'),
                React.createElement(View, { style: styles.compactRow },
                  React.createElement(Text, { style: styles.compactLabel }, 'Google Analytics:'),
                  React.createElement(Text, {
                    style: [styles.compactValue, metadata.analytics?.googleAnalytics.present ? styles.statusGood : styles.statusWarning]
                  }, metadata.analytics?.googleAnalytics.present ?
                    `✓ ${metadata.analytics.googleAnalytics.ga4 ? 'GA4' : 'Universal'}` : '⚠ Not detected'
                  )
                ),
                React.createElement(View, { style: styles.compactRow },
                  React.createElement(Text, { style: styles.compactLabel }, 'Tag Manager:'),
                  React.createElement(Text, {
                    style: [styles.compactValue, metadata.analytics?.googleTagManager.present ? styles.statusGood : styles.statusWarning]
                  }, metadata.analytics?.googleTagManager.present ? '✓ Detected' : '⚠ Not detected')
                )
              )
            ),

            // Right Column
            React.createElement(View, { style: styles.column },
              // Technical Analysis Section
              React.createElement(View, {
                style: getSectionStyle(
                  analysis.technicalScore >= 80 ? 'good' :
                  analysis.technicalScore >= 60 ? 'warning' : 'error'
                )
              },
                React.createElement(Text, { style: styles.sectionTitle }, '⚙️ Technical'),
                React.createElement(View, { style: styles.row },
                  React.createElement(Text, { style: styles.label }, 'Protocol:'),
                  React.createElement(Text, {
                    style: [styles.value, metadata.url.startsWith('https://') ? styles.statusGood : styles.statusError]
                  }, metadata.url.startsWith('https://') ? '✓ HTTPS' : '✗ HTTP')
                ),
                React.createElement(View, { style: styles.row },
                  React.createElement(Text, { style: styles.label }, 'HSTS:'),
                  React.createElement(Text, {
                    style: [styles.value, metadata.headers?.strictTransportSecurity ? styles.statusGood : styles.statusWarning]
                  }, metadata.headers?.strictTransportSecurity ? '✓ Enabled' : '⚠ Missing')
                ),
                React.createElement(View, { style: styles.row },
                  React.createElement(Text, { style: styles.label }, 'CSP:'),
                  React.createElement(Text, {
                    style: [styles.value, metadata.headers?.contentSecurityPolicy ? styles.statusGood : styles.statusWarning]
                  }, metadata.headers?.contentSecurityPolicy ? '✓ Configured' : '⚠ Missing')
                ),
                React.createElement(View, { style: styles.row },
                  React.createElement(Text, { style: styles.label }, 'Compression:'),
                  React.createElement(Text, {
                    style: [styles.value, metadata.headers?.contentEncoding ? styles.statusGood : styles.statusWarning]
                  }, metadata.headers?.contentEncoding ? `✓ ${metadata.headers.contentEncoding}` : '⚠ None')
                ),
                React.createElement(View, { style: styles.row },
                  React.createElement(Text, { style: styles.label }, 'Charset:'),
                  React.createElement(Text, { style: styles.value }, metadata.technical?.charset || 'Not specified')
                )
              ),

              // Performance Section
              metadata.performance ? React.createElement(View, {
                style: getSectionStyle(
                  (analysis.performanceScore ?? 0) >= 80 ? 'good' :
                  (analysis.performanceScore ?? 0) >= 60 ? 'warning' : 'error'
                )
              },
                React.createElement(Text, { style: styles.sectionTitle }, '⚡ Performance'),
                React.createElement(View, { style: styles.compactRow },
                  React.createElement(Text, { style: styles.compactLabel }, 'Load Time:'),
                  React.createElement(Text, { style: styles.compactValue },
                    metadata.performance.loadTime ? `${metadata.performance.loadTime}ms` : 'Unknown'
                  )
                ),
                React.createElement(View, { style: styles.compactRow },
                  React.createElement(Text, { style: styles.compactLabel }, 'Content Size:'),
                  React.createElement(Text, { style: styles.compactValue },
                    metadata.performance.contentLength ?
                      `${Math.round(metadata.performance.contentLength / 1024)}KB` : 'Unknown'
                  )
                ),
                React.createElement(View, { style: styles.compactRow },
                  React.createElement(Text, { style: styles.compactLabel }, 'Status Code:'),
                  React.createElement(Text, {
                    style: [styles.compactValue,
                      metadata.performance.statusCode === 200 ? styles.statusGood : styles.statusError
                    ]
                  }, metadata.performance.statusCode?.toString() || 'Unknown')
                )
              ) : null,

              // Structured Data Section
              React.createElement(View, {
                style: getSectionStyle(
                  metadata.structuredData && metadata.structuredData.length > 0 ? 'good' : 'warning'
                )
              },
                React.createElement(Text, { style: styles.sectionTitle }, '🏗️ Structured Data'),
                React.createElement(View, { style: styles.compactRow },
                  React.createElement(Text, { style: styles.compactLabel }, 'JSON-LD:'),
                  React.createElement(Text, {
                    style: [styles.compactValue,
                      metadata.structuredData && metadata.structuredData.length > 0 ? styles.statusGood : styles.statusWarning
                    ]
                  },
                    metadata.structuredData && metadata.structuredData.length > 0 ?
                      `✓ ${metadata.structuredData.length} schema(s)` : '⚠ None found'
                  )
                ),
                React.createElement(View, { style: styles.compactRow },
                  React.createElement(Text, { style: styles.compactLabel }, 'Icons:'),
                  React.createElement(Text, { style: styles.compactValue },
                    `${metadata.icons?.length || 0} detected`
                  )
                )
              )
            )
          ),

          // Issues and Recommendations Section
          (analysis.criticalIssues.length > 0 || analysis.warnings.length > 0) ?
            React.createElement(View, { style: getSectionStyle('error') },
              React.createElement(Text, { style: styles.sectionTitle }, '🚨 Issues & Recommendations'),
              analysis.criticalIssues.length > 0 ? React.createElement(View, { style: styles.issuesList },
                React.createElement(Text, { style: [styles.label, styles.statusError] }, 'Critical Issues:'),
                ...analysis.criticalIssues.slice(0, 3).map((issue, i) =>
                  React.createElement(Text, { key: i, style: [styles.issueItem, styles.statusError] }, `• ${issue}`)
                )
              ) : null,
              analysis.warnings.length > 0 ? React.createElement(View, { style: styles.issuesList },
                React.createElement(Text, { style: [styles.label, styles.statusWarning] }, 'Warnings:'),
                ...analysis.warnings.slice(0, 3).map((warning, i) =>
                  React.createElement(Text, { key: i, style: [styles.issueItem, styles.statusWarning] }, `• ${warning}`)
                )
              ) : null
            ) : null,

          // Footer
          React.createElement(Text, { style: styles.footer },
            `Generated by Website Viewer • ${new Date().toISOString().split('T')[0]} • Environment: ${config.environment}${config.customEnvironment ? ` (${config.customEnvironment})` : ''}`
          )
        )
      )

    console.log('Enhanced document structure created...')

    // Generate the PDF
    const doc = MyDocument()
    console.log('Creating PDF blob...')

    const pdfBlob = await pdf(doc).toBlob()
    console.log('PDF blob created successfully')

    // Generate filename
    const domain = extractDomainFromUrl(metadata.url)
    const filename = config.filename
      ? `${config.filename}.pdf`
      : generateFileName(metadata.url, config.environment, config.customEnvironment, 'pdf')

    console.log('Downloading file:', filename)

    // Download the file
    downloadBlob(pdfBlob, filename)

    console.log('Enhanced PDF generation and download completed successfully')

  } catch (error) {
    console.error('Enhanced PDF generation failed:', error)
    throw new Error(`Failed to generate PDF report: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Download a blob as a file
 */
function downloadBlob(blob: Blob, filename: string): void {
  try {
    // Create object URL
    const url = URL.createObjectURL(blob)

    // Create temporary download link
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.style.display = 'none'

    // Trigger download
    document.body.appendChild(link)
    link.click()

    // Cleanup
    setTimeout(() => {
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    }, 100)

  } catch (error) {
    console.error('Download failed:', error)
    throw new Error('Failed to download PDF file')
  }
}