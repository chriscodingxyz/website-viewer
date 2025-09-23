import React from 'react'
import { Page, View, Text } from '@react-pdf/renderer'
import { styles } from '../PDFStyles'
import { WebsiteMetadata } from '@/types/metadata'
import { ExportConfig } from '@/types/export'

interface CoverPageProps {
  metadata: WebsiteMetadata
  config: ExportConfig
  generatedAt: string
}

export const CoverPage: React.FC<CoverPageProps> = ({ metadata, config, generatedAt }) => {
  const getDomainName = (url: string) => {
    try {
      return new URL(url).hostname.replace('www.', '')
    } catch {
      return url
    }
  }

  const getEnvironmentColor = (env: string) => {
    switch (env) {
      case 'production': return '#059669'
      case 'staging': return '#d97706'
      case 'local': return '#2563eb'
      default: return '#6b7280'
    }
  }

  return (
    <Page size="A4" style={styles.page}>
      <View style={styles.coverPage}>
        <Text style={styles.coverTitle}>Website Analysis Report</Text>

        <Text style={styles.coverSubtitle}>
          Comprehensive SEO, Technical & Performance Analysis
        </Text>

        <View style={[styles.coverUrl, { borderLeftColor: getEnvironmentColor(config.environment) }]}>
          <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 8 }}>
            {getDomainName(metadata.url)}
          </Text>
          <Text style={{ fontSize: 12, color: '#666666' }}>
            {metadata.url}
          </Text>
        </View>

        <View style={{
          backgroundColor: getEnvironmentColor(config.environment),
          color: '#ffffff',
          paddingHorizontal: 16,
          paddingVertical: 8,
          borderRadius: 6,
          marginBottom: 32
        }}>
          <Text style={{ fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase' }}>
            {config.environment} Environment
          </Text>
        </View>

        {/* Quick Stats Preview */}
        <View style={{
          backgroundColor: '#f9fafb',
          padding: 20,
          borderRadius: 8,
          border: 1,
          borderColor: '#e5e7eb',
          width: '100%',
          maxWidth: 400,
          marginBottom: 40
        }}>
          <Text style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 12, textAlign: 'center' }}>
            Report Overview
          </Text>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={{ fontSize: 11, color: '#666666' }}>Generated:</Text>
            <Text style={{ fontSize: 11, fontWeight: 'bold' }}>{generatedAt}</Text>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={{ fontSize: 11, color: '#666666' }}>Page Title:</Text>
            <Text style={{ fontSize: 11, fontWeight: 'bold' }}>
              {metadata.seo.title ?
                (metadata.seo.title.length > 30 ?
                  `${metadata.seo.title.substring(0, 30)}...` :
                  metadata.seo.title) :
                'No title found'}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={{ fontSize: 11, color: '#666666' }}>Protocol:</Text>
            <Text style={{ fontSize: 11, fontWeight: 'bold' }}>
              {metadata.url.startsWith('https://') ? 'HTTPS ✓' : 'HTTP ⚠'}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 11, color: '#666666' }}>Icons Found:</Text>
            <Text style={{ fontSize: 11, fontWeight: 'bold' }}>
              {metadata.icons?.length || 0} icons
            </Text>
          </View>
        </View>

        {config.notes && (
          <View style={{
            backgroundColor: '#f0f9ff',
            padding: 16,
            borderRadius: 6,
            borderLeft: 4,
            borderLeftColor: '#2563eb',
            width: '100%',
            maxWidth: 400,
            marginBottom: 20
          }}>
            <Text style={{ fontSize: 10, fontWeight: 'bold', marginBottom: 6, color: '#1e40af' }}>
              Custom Notes:
            </Text>
            <Text style={{ fontSize: 10, color: '#374151', lineHeight: 1.4 }}>
              {config.notes}
            </Text>
          </View>
        )}

        <Text style={styles.coverDate}>
          Report generated on {generatedAt} by Website Viewer
        </Text>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text>Website Viewer - Professional Website Analysis Tool</Text>
      </View>
    </Page>
  )
}