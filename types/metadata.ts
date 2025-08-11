import { z } from 'zod'

// Basic SEO metadata
export const SEOMetadataSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  keywords: z.string().optional(),
  canonical: z.string().optional(),
  language: z.string().optional(),
  viewport: z.string().optional(),
  robots: z.string().optional(),
  author: z.string().optional(),
})

// Open Graph metadata
export const OpenGraphSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  image: z.string().optional(),
  imageAlt: z.string().optional(),
  imageWidth: z.string().optional(),
  imageHeight: z.string().optional(),
  url: z.string().optional(),
  type: z.string().optional(),
  siteName: z.string().optional(),
  locale: z.string().optional(),
})

// Twitter Card metadata
export const TwitterCardSchema = z.object({
  card: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  image: z.string().optional(),
  imageAlt: z.string().optional(),
  site: z.string().optional(),
  creator: z.string().optional(),
})

// Favicon and icons
export const IconSchema = z.object({
  href: z.string(),
  sizes: z.string().optional(),
  type: z.string().optional(),
  rel: z.string(),
})

// Technical metadata
export const TechnicalMetadataSchema = z.object({
  charset: z.string().optional(),
  themeColor: z.string().optional(),
  manifestUrl: z.string().optional(),
  generator: z.string().optional(),
  referrer: z.string().optional(),
  appleTouchIcon: z.string().optional(),
  appleItunes: z.string().optional(),
  msapplicationConfig: z.string().optional(),
  doctype: z.string().optional(),
})

// Sitemap information
export const SitemapInfoSchema = z.object({
  sitemaps: z.array(z.object({
    url: z.string(),
    accessible: z.boolean(),
    size: z.number().optional(),
    lastModified: z.string().optional(),
    source: z.enum(['link_tag', 'robots_txt', 'standard_location']),
  })),
  robotsTxt: z.object({
    accessible: z.boolean(),
    url: z.string(),
    content: z.string().optional(),
    hasMetaRobots: z.boolean().optional(),
    metaContent: z.string().optional(),
  }).optional(),
})

// Analytics information
export const AnalyticsInfoSchema = z.object({
  googleAnalytics: z.object({
    present: z.boolean(),
    trackingIds: z.array(z.string()),
    gtag: z.boolean(),
    universalAnalytics: z.boolean(),
    ga4: z.boolean(),
  }),
  googleTagManager: z.object({
    present: z.boolean(),
    containerIds: z.array(z.string()),
  }),
  otherAnalytics: z.array(z.object({
    name: z.string(),
    detected: z.boolean(),
    details: z.string().optional(),
  })),
})


// Performance metrics
export const PerformanceMetricsSchema = z.object({
  loadTime: z.number().optional(),
  responseTime: z.number().optional(),
  contentLength: z.number().optional(),
  statusCode: z.number().optional(),
})

// Response headers
export const ResponseHeadersSchema = z.object({
  server: z.string().optional(),
  contentType: z.string().optional(),
  contentEncoding: z.string().optional(),
  cacheControl: z.string().optional(),
  lastModified: z.string().optional(),
  etag: z.string().optional(),
  xFrameOptions: z.string().optional(),
  contentSecurityPolicy: z.string().optional(),
  strictTransportSecurity: z.string().optional(),
  xContentTypeOptions: z.string().optional(),
})

// Structured data (JSON-LD)
export const StructuredDataSchema = z.object({
  type: z.string(),
  data: z.record(z.unknown()),
})

// Complete metadata schema
export const WebsiteMetadataSchema = z.object({
  url: z.string(),
  seo: SEOMetadataSchema,
  openGraph: OpenGraphSchema,
  twitterCard: TwitterCardSchema,
  icons: z.array(IconSchema),
  technical: TechnicalMetadataSchema,
  performance: PerformanceMetricsSchema.optional(),
  headers: ResponseHeadersSchema.optional(),
  structuredData: z.array(StructuredDataSchema),
  sitemap: SitemapInfoSchema.optional(),
  analytics: AnalyticsInfoSchema.optional(),
  extractedAt: z.string(),
  error: z.string().optional(),
})

// Export types
export type SEOMetadata = z.infer<typeof SEOMetadataSchema>
export type OpenGraph = z.infer<typeof OpenGraphSchema>
export type TwitterCard = z.infer<typeof TwitterCardSchema>
export type Icon = z.infer<typeof IconSchema>
export type TechnicalMetadata = z.infer<typeof TechnicalMetadataSchema>
export type SitemapInfo = z.infer<typeof SitemapInfoSchema>
export type AnalyticsInfo = z.infer<typeof AnalyticsInfoSchema>
export type PerformanceMetrics = z.infer<typeof PerformanceMetricsSchema>
export type ResponseHeaders = z.infer<typeof ResponseHeadersSchema>
export type StructuredData = z.infer<typeof StructuredDataSchema>
export type WebsiteMetadata = z.infer<typeof WebsiteMetadataSchema>


// API response types
export const MetadataAPIResponseSchema = z.object({
  success: z.boolean(),
  data: WebsiteMetadataSchema.optional(),
  error: z.string().optional(),
})

export type MetadataAPIResponse = z.infer<typeof MetadataAPIResponseSchema>