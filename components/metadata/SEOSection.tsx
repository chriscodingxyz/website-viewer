'use client'

import React from 'react'
import Image from 'next/image'
import { WebsiteMetadata } from '@/types/metadata'
import { Badge } from '@/components/ui/badge'
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  Search,
  Globe,
  ExternalLink,
  BarChart3,
  Target,
  Smartphone,
  TrendingUp
} from 'lucide-react'

interface SEOSectionProps {
  metadata?: WebsiteMetadata | null
}

export default function SEOSection ({ metadata }: SEOSectionProps) {
  if (!metadata) {
    return (
      <div className='w-full min-h-[400px] flex items-center justify-center'>
        <div className='text-center'>
          <div className='text-xl font-medium text-muted-foreground mb-2'>Loading SEO Analysis...</div>
          <div className='text-sm text-muted-foreground'>Analyzing website metadata and optimization</div>
        </div>
      </div>
    )
  }

  const { seo, sitemap, icons, analytics } = metadata

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

  // Modern status indicator component
  const StatusIndicator = ({ status, label, value, details }: {
    status: 'good' | 'warning' | 'error'
    label: string
    value?: string
    details?: string
  }) => {
    const statusConfig = {
      good: {
        dotClass: "status-dot-success",
        badgeClass: "pro-badge-success"
      },
      warning: {
        dotClass: "status-dot-warning",
        badgeClass: "pro-badge-warning"
      },
      error: {
        dotClass: "status-dot-error",
        badgeClass: "pro-badge-error"
      }
    }

    const config = statusConfig[status]

    return (
      <div className="status-indicator">
        <div className={config.dotClass}></div>
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-foreground">{label}</h4>
            <span className={config.badgeClass}>
              {status === 'good' ? '✓' : status === 'warning' ? '⚠' : '✕'}
            </span>
          </div>
          {value && (
            <p className="text-sm text-foreground line-clamp-2 font-medium">{value}</p>
          )}
          {details && (
            <p className="text-xs text-muted-foreground">{details}</p>
          )}
        </div>
      </div>
    )
  }

  // Professional SEO Score component
  const SEOScoreDisplay = () => {
    const getScoreColor = () => {
      if (seoScore.percentage >= 80) return 'pro-progress-fill-success'
      if (seoScore.percentage >= 60) return 'pro-progress-fill-warning'
      return 'pro-progress-fill-error'
    }

    return (
      <div className="pro-card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">SEO Health Score</h3>
              <p className="text-sm text-muted-foreground">Overall optimization status</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-foreground">{seoScore.percentage}%</div>
            <div className="text-xs text-muted-foreground">{seoScore.score}/{seoScore.maxScore} checks passed</div>
          </div>
        </div>

        <div className="pro-progress-bar">
          <div
            className={getScoreColor()}
            style={{ width: `${seoScore.percentage}%` }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="pro-section">
      {/* SEO Score Header */}
      <SEOScoreDisplay />

      {/* Core Meta Tags Section */}
      <div className="pro-section">
        <div className="pro-section-header">
          <h2 className="pro-section-title">
            <Search className="h-5 w-5 text-muted-foreground" />
            Essential Meta Tags
          </h2>
          <p className="pro-section-subtitle">Core elements that affect search engine visibility</p>
        </div>

        <div className="space-y-4">
          <StatusIndicator
            status={seo.title && seo.title.length >= 30 && seo.title.length <= 60 ? 'good' : seo.title ? 'warning' : 'error'}
            label="Page Title"
            value={seo.title}
            details={seo.title ? `${seo.title.length} characters (optimal: 30-60)` : 'Missing - add a descriptive title for better search rankings'}
          />

          <StatusIndicator
            status={seo.description && seo.description.length >= 120 && seo.description.length <= 160 ? 'good' : seo.description ? 'warning' : 'error'}
            label="Meta Description"
            value={seo.description}
            details={seo.description ? `${seo.description.length} characters (optimal: 120-160)` : 'Missing - add a compelling description to improve click-through rates'}
          />

          <StatusIndicator
            status={seo.canonical ? 'good' : 'warning'}
            label="Canonical URL"
            value={seo.canonical}
            details={seo.canonical ? 'Helps prevent duplicate content issues' : 'Consider adding to prevent duplicate content penalties'}
          />
        </div>
      </div>

      {/* Technical Configuration */}
      <div className="pro-section">
        <div className="pro-section-header">
          <h2 className="pro-section-title">
            <Smartphone className="h-5 w-5 text-muted-foreground" />
            Technical Configuration
          </h2>
          <p className="pro-section-subtitle">Technical settings for optimal user experience</p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <StatusIndicator
            status={seo.viewport ? 'good' : 'error'}
            label="Viewport"
            value={seo.viewport}
            details={seo.viewport ? 'Mobile-responsive configuration detected' : 'Critical - add viewport meta tag for mobile compatibility'}
          />

          <StatusIndicator
            status={seo.language ? 'good' : 'warning'}
            label="Language"
            value={seo.language}
            details={seo.language ? 'Language specified for accessibility' : 'Consider adding language attribute for better accessibility'}
          />

          <StatusIndicator
            status={seo.robots ? 'good' : 'warning'}
            label="Robots Directive"
            value={seo.robots}
            details={seo.robots ? 'Search engine crawling instructions provided' : 'Consider adding robots meta tag for crawling control'}
          />

          <StatusIndicator
            status={seo.author ? 'good' : 'warning'}
            label="Author"
            value={seo.author}
            details={seo.author ? 'Author information provided' : 'Optional - can improve content credibility'}
          />
        </div>
      </div>

      {/* Visual Identity */}
      <div className="pro-section">
        <div className="pro-section-header">
          <h2 className="pro-section-title">
            <Target className="h-5 w-5 text-muted-foreground" />
            Visual Identity
          </h2>
          <p className="pro-section-subtitle">Icons and visual elements for brand recognition</p>
        </div>

        <div className="pro-card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={icons && icons.length > 0 ? "status-dot-success" : "status-dot-error"}></div>
              <div>
                <h3 className="font-medium text-foreground">Favicons & Icons</h3>
                <p className="text-sm text-muted-foreground">
                  {icons && icons.length > 0
                    ? `${icons.length} icon${icons.length === 1 ? '' : 's'} detected`
                    : 'No icons found'
                  }
                </p>
              </div>
            </div>
            <span className={icons && icons.length > 0 ? "pro-badge-success" : "pro-badge-error"}>
              {icons && icons.length > 0 ? '✓' : '✕'}
            </span>
          </div>

          {icons && icons.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 flex-wrap">
                {icons.slice(0, 4).map((icon, index) => (
                  <div key={index} className="flex items-center gap-2 bg-muted/50 rounded-sm px-3 py-2 border border-border">
                    {icon.href && (
                      <Image
                        src={icon.href}
                        alt={`${icon.sizes || 'favicon'}`}
                        width={20}
                        height={20}
                        className="w-5 h-5"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                        unoptimized
                      />
                    )}
                    <span className="text-sm font-medium text-foreground">{icon.sizes || '16x16'}</span>
                  </div>
                ))}
                {icons.length > 4 && (
                  <div className="text-sm text-muted-foreground px-3 py-2">
                    +{icons.length - 4} more
                  </div>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Icons help with brand recognition across browsers and platforms.
              </p>
            </div>
          ) : (
            <div className="border border-border rounded-sm p-4 bg-muted/30">
              <p className="text-sm text-muted-foreground">
                No favicons detected. Add favicon.ico and various icon sizes to improve brand recognition in browser tabs, bookmarks, and search results.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Analytics & Tracking */}
      <div className="pro-section">
        <div className="pro-section-header">
          <h2 className="pro-section-title">
            <BarChart3 className="h-5 w-5 text-muted-foreground" />
            Analytics & Tracking
          </h2>
          <p className="pro-section-subtitle">Data collection tools for performance monitoring</p>
        </div>

        {analytics ? (
          <div className="pro-card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                {(() => {
                  const hasAnalytics = analytics.googleAnalytics.present || analytics.googleTagManager.present || analytics.otherAnalytics.some(a => a.detected)
                  return <div className={hasAnalytics ? "status-dot-success" : "status-dot-error"}></div>
                })()}
                <div>
                  <h3 className="font-medium text-foreground">Analytics Tools</h3>
                  <p className="text-sm text-muted-foreground">
                    {(() => {
                      const totalTools = [
                        analytics.googleAnalytics.present,
                        analytics.googleTagManager.present,
                        ...analytics.otherAnalytics.map(tool => tool.detected)
                      ].filter(Boolean).length
                      return totalTools > 0 ? `${totalTools} tool${totalTools === 1 ? '' : 's'} active` : 'No tracking detected'
                    })()}
                  </p>
                </div>
              </div>
              {(() => {
                const hasAnalytics = analytics.googleAnalytics.present || analytics.googleTagManager.present || analytics.otherAnalytics.some(a => a.detected)
                return <span className={hasAnalytics ? "pro-badge-success" : "pro-badge-error"}>
                  {hasAnalytics ? '✓' : '✕'}
                </span>
              })()}
            </div>

            <div className="space-y-3">
              {analytics.googleAnalytics.present && (
                <div className="flex items-center gap-3 bg-muted/50 rounded-sm px-4 py-3 border border-border">
                  <div className="status-dot-success"></div>
                  <span className="font-medium text-foreground">Google Analytics</span>
                  {analytics.googleAnalytics.ga4 && (
                    <Badge variant="outline" className="pro-badge-info">
                      GA4
                    </Badge>
                  )}
                </div>
              )}

              {analytics.googleTagManager.present && (
                <div className="flex items-center gap-3 bg-muted/50 rounded-sm px-4 py-3 border border-border">
                  <div className="status-dot-success"></div>
                  <span className="font-medium text-foreground">Google Tag Manager</span>
                </div>
              )}

              {analytics.otherAnalytics.filter(tool => tool.detected).map((tool, index) => (
                <div key={index} className="flex items-center gap-3 bg-muted/50 rounded-sm px-4 py-3 border border-border">
                  <div className="status-dot-success"></div>
                  <span className="font-medium text-foreground">{tool.name}</span>
                </div>
              ))}

              {!analytics.googleAnalytics.present && !analytics.googleTagManager.present && analytics.otherAnalytics.filter(tool => tool.detected).length === 0 && (
                <div className="border border-border rounded-sm p-4 bg-muted/30">
                  <p className="text-sm text-muted-foreground">
                    No analytics detected. Consider adding Google Analytics or similar tools to track SEO performance and user behavior.
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="pro-card">
            <p className="text-muted-foreground">Analytics data not available</p>
          </div>
        )}
      </div>

      {/* Sitemaps & Discovery */}
      {sitemap && (
        <div className="pro-section">
          <div className="pro-section-header">
            <h2 className="pro-section-title">
              <Globe className="h-5 w-5 text-muted-foreground" />
              Search Engine Discovery
            </h2>
            <p className="pro-section-subtitle">Files that help search engines understand your site</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* robots.txt */}
            {sitemap.robotsTxt && (
              <div className="pro-card">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={sitemap.robotsTxt.accessible || sitemap.robotsTxt.hasMetaRobots ? "status-dot-success" : "status-dot-error"}></div>
                    <h4 className="font-medium text-foreground">robots.txt</h4>
                  </div>
                  <span className={sitemap.robotsTxt.accessible || sitemap.robotsTxt.hasMetaRobots ? "pro-badge-success" : "pro-badge-error"}>
                    {sitemap.robotsTxt.accessible || sitemap.robotsTxt.hasMetaRobots ? '✓' : '✕'}
                  </span>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {sitemap.robotsTxt.accessible
                      ? `Found at ${sitemap.robotsTxt.url.split('/').pop()} - provides crawling instructions`
                      : sitemap.robotsTxt.hasMetaRobots
                      ? `Using meta robots: "${sitemap.robotsTxt.metaContent}"`
                      : 'Not found - consider adding for better SEO control'
                    }
                  </p>
                </div>
              </div>
            )}

            {/* Sitemaps */}
            <div className="pro-card">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={sitemap.sitemaps.some(s => s.accessible) ? "status-dot-success" : "status-dot-error"}></div>
                  <h4 className="font-medium text-foreground">XML Sitemaps</h4>
                </div>
                <span className={sitemap.sitemaps.some(s => s.accessible) ? "pro-badge-success" : "pro-badge-error"}>
                  {sitemap.sitemaps.some(s => s.accessible) ? '✓' : '✕'}
                </span>
              </div>
              <div className="space-y-3">
                {sitemap.sitemaps.filter(s => s.accessible).slice(0, 2).map((sitemapItem, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <div className="status-dot-success"></div>
                    <a
                      href={sitemapItem.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-foreground hover:text-primary truncate flex-1 underline decoration-muted-foreground hover:decoration-primary"
                      title={sitemapItem.url}
                    >
                      {sitemapItem.url.replace(/^https?:\/\/[^\/]+/, '')}
                    </a>
                    <ExternalLink className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                  </div>
                ))}

                {sitemap.sitemaps.filter(s => s.accessible).length > 2 && (
                  <p className="text-xs text-muted-foreground">
                    +{sitemap.sitemaps.filter(s => s.accessible).length - 2} more sitemaps
                  </p>
                )}

                {sitemap.sitemaps.filter(s => s.accessible).length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No accessible sitemaps found - consider adding sitemap.xml for better search engine discovery
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}