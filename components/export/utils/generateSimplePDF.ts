import React from 'react'
import { pdf, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import { WebsiteMetadata } from '@/types/metadata'
import { ExportConfig } from '@/types/export'
import { generateFileName, extractDomainFromUrl } from './fileNaming'

// Simple styles to avoid complex styling issues
const simpleStyles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 30,
    fontSize: 12,
    lineHeight: 1.5,
  },
  title: {
    fontSize: 20,
    marginBottom: 20,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f9f9f9',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  text: {
    fontSize: 11,
    marginBottom: 5,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  label: {
    width: '30%',
    fontWeight: 'bold',
  },
  value: {
    width: '70%',
  },
})

// Simple document component
const SimpleDocument = ({ metadata, config }: { metadata: WebsiteMetadata; config: ExportConfig }) => (
  React.createElement(Document, {},
    React.createElement(Page, { size: 'A4', style: simpleStyles.page },
      React.createElement(Text, { style: simpleStyles.title }, 'Website Analysis Report'),

      React.createElement(View, { style: simpleStyles.section },
        React.createElement(Text, { style: simpleStyles.sectionTitle }, 'Website Information'),
        React.createElement(View, { style: simpleStyles.row },
          React.createElement(Text, { style: simpleStyles.label }, 'URL:'),
          React.createElement(Text, { style: simpleStyles.value }, metadata.url)
        ),
        React.createElement(View, { style: simpleStyles.row },
          React.createElement(Text, { style: simpleStyles.label }, 'Title:'),
          React.createElement(Text, { style: simpleStyles.value }, metadata.seo.title || 'No title found')
        ),
        React.createElement(View, { style: simpleStyles.row },
          React.createElement(Text, { style: simpleStyles.label }, 'Description:'),
          React.createElement(Text, { style: simpleStyles.value }, metadata.seo.description || 'No description found')
        )
      ),

      React.createElement(View, { style: simpleStyles.section },
        React.createElement(Text, { style: simpleStyles.sectionTitle }, 'SEO Analysis'),
        React.createElement(View, { style: simpleStyles.row },
          React.createElement(Text, { style: simpleStyles.label }, 'Title Length:'),
          React.createElement(Text, { style: simpleStyles.value }, metadata.seo.title ? `${metadata.seo.title.length} characters` : 'No title')
        ),
        React.createElement(View, { style: simpleStyles.row },
          React.createElement(Text, { style: simpleStyles.label }, 'Description Length:'),
          React.createElement(Text, { style: simpleStyles.value }, metadata.seo.description ? `${metadata.seo.description.length} characters` : 'No description')
        ),
        React.createElement(View, { style: simpleStyles.row },
          React.createElement(Text, { style: simpleStyles.label }, 'Viewport:'),
          React.createElement(Text, { style: simpleStyles.value }, metadata.seo.viewport ? 'Present' : 'Missing')
        )
      ),

      React.createElement(View, { style: simpleStyles.section },
        React.createElement(Text, { style: simpleStyles.sectionTitle }, 'Technical Information'),
        React.createElement(View, { style: simpleStyles.row },
          React.createElement(Text, { style: simpleStyles.label }, 'Protocol:'),
          React.createElement(Text, { style: simpleStyles.value }, metadata.url.startsWith('https://') ? 'HTTPS (Secure)' : 'HTTP (Insecure)')
        ),
        React.createElement(View, { style: simpleStyles.row },
          React.createElement(Text, { style: simpleStyles.label }, 'Icons Found:'),
          React.createElement(Text, { style: simpleStyles.value }, `${metadata.icons?.length || 0} icons`)
        ),
        React.createElement(View, { style: simpleStyles.row },
          React.createElement(Text, { style: simpleStyles.label }, 'Environment:'),
          React.createElement(Text, { style: simpleStyles.value }, config.environment)
        )
      ),

      React.createElement(Text, {
        style: {
          position: 'absolute',
          bottom: 30,
          left: 30,
          right: 30,
          textAlign: 'center',
          fontSize: 10,
          color: '#666666'
        }
      }, `Generated on ${new Date().toLocaleDateString()} by Website Viewer`)
    )
  )
)

/**
 * Generate a simple PDF report (fallback version)
 */
export async function generateSimplePDFReport(
  metadata: WebsiteMetadata,
  config: ExportConfig
): Promise<void> {
  try {
    console.log('Starting simple PDF generation...')

    // Create the simple document
    const doc = SimpleDocument({ metadata, config })

    console.log('Document created, generating blob...')

    // Generate the PDF blob
    const pdfBlob = await pdf(doc).toBlob()

    console.log('Blob generated, creating download...')

    // Generate filename
    const domain = extractDomainFromUrl(metadata.url)
    const filename = config.filename
      ? `${config.filename}.pdf`
      : generateFileName(metadata.url, config.environment, config.customEnvironment, 'pdf')

    // Create download
    downloadBlob(pdfBlob, filename)

    console.log('PDF download initiated successfully')

  } catch (error) {
    console.error('Simple PDF generation failed:', error)
    throw new Error(`Failed to generate PDF report: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Download a blob as a file
 */
function downloadBlob(blob: Blob, filename: string): void {
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
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}