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

  // Clean status indicator component - matching sidebar style
  const StatusIndicator = ({ status, label, value, details }: {
    status: 'good' | 'warning' | 'error'
    label: string
    value?: string
    details?: string
  }) => {
    const statusConfig = {
      good: {
        icon: <CheckCircle className="h-4 w-4 text-green-600" />,
        dotClass: "w-2 h-2 bg-green-500 rounded-full"
      },
      warning: {
        icon: <AlertTriangle className="h-4 w-4 text-orange-600" />,
        dotClass: "w-2 h-2 bg-orange-500 rounded-full"
      },
      error: {
        icon: <XCircle className="h-4 w-4 text-red-600" />,
        dotClass: "w-2 h-2 bg-red-500 rounded-full"
      }
    }

    const config = statusConfig[status]

    return (
      <div className="flex items-start gap-3 p-3 bg-card border border-border rounded-lg">
        <div className={config.dotClass} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h4 className="text-sm font-medium text-foreground">{label}</h4>
            {config.icon}
          </div>
          {value && (
            <p className="text-sm text-foreground mb-1 break-words">{value}</p>
          )}
          {details && (
            <p className="text-xs text-muted-foreground">{details}</p>
          )}
        </div>
      </div>
    )
  }

  // Clean SEO Score component - matching sidebar style
  const SEOScoreDisplay = () => {
    const getScoreColor = () => {
      if (seoScore.percentage >= 80) return 'bg-green-500'
      if (seoScore.percentage >= 60) return 'bg-orange-500'
      return 'bg-red-500'
    }

    return (
      <div className="bg-card border border-border rounded-lg p-3 mb-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-muted rounded-md flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">SEO Health Score</h3>
              <p className="text-xs text-muted-foreground">Overall optimization status</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-foreground">{seoScore.percentage}%</div>
            <div className="text-xs text-muted-foreground">{seoScore.score}/{seoScore.maxScore} checks passed</div>
          </div>
        </div>

        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={getScoreColor()}
            style={{ width: `${seoScore.percentage}%` }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3 p-3">
      {/* SEO Score Header */}
      <SEOScoreDisplay />

      {/* Core Meta Tags Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <div>
            <h2 className="text-sm font-semibold text-foreground">Essential Meta Tags</h2>
            <p className="text-xs text-muted-foreground">Core elements that affect search engine visibility</p>
          </div>
        </div>

        <div className="space-y-3">
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
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Smartphone className="h-4 w-4 text-muted-foreground" />
          <div>
            <h2 className="text-sm font-semibold text-foreground">Technical Configuration</h2>
            <p className="text-xs text-muted-foreground">Technical settings for optimal user experience</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-3">
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
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-muted-foreground" />
          <div>
            <h2 className="text-sm font-semibold text-foreground">Visual Identity</h2>
            <p className="text-xs text-muted-foreground">Icons and visual elements for brand recognition</p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className={icons && icons.length > 0 ? "w-2 h-2 bg-green-500 rounded-full" : "w-2 h-2 bg-red-500 rounded-full"}></div>
              <div>
                <h3 className="text-sm font-medium text-foreground">Favicons & Icons</h3>
                <p className="text-xs text-muted-foreground">
                  {icons && icons.length > 0
                    ? `${icons.length} icon${icons.length === 1 ? '' : 's'} detected`
                    : 'No icons found'
                  }
                </p>
              </div>
            </div>
            {icons && icons.length > 0 ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <XCircle className="h-4 w-4 text-red-600" />
            )}
          </div>

          {icons && icons.length > 0 ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
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
              <p className="text-xs text-muted-foreground">
                Icons help with brand recognition across browsers and platforms.
              </p>
            </div>
          ) : (
            <div className="border border-border rounded-sm p-3 bg-muted/30">
              <p className="text-xs text-muted-foreground">
                No favicons detected. Add favicon.ico and various icon sizes to improve brand recognition in browser tabs, bookmarks, and search results.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Analytics & Tracking */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
          <div>
            <h2 className="text-sm font-semibold text-foreground">Analytics & Tracking</h2>
            <p className="text-xs text-muted-foreground">Data collection tools for performance monitoring</p>
          </div>
        </div>

        {analytics ? (
          <div className="bg-card border border-border rounded-lg p-3">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {(() => {
                  const hasAnalytics = analytics.googleAnalytics.present || analytics.googleTagManager.present || analytics.otherAnalytics.some(a => a.detected)
                  return <div className={hasAnalytics ? "w-2 h-2 bg-green-500 rounded-full" : "w-2 h-2 bg-red-500 rounded-full"}></div>
                })()}
                <div>
                  <h3 className="text-sm font-medium text-foreground">Analytics Tools</h3>
                  <p className="text-xs text-muted-foreground">
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
                return hasAnalytics ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )
              })()}
            </div>

            <div className="space-y-2">
              {analytics.googleAnalytics.present && (
                <div className="flex items-center gap-2 bg-muted/50 rounded-sm px-3 py-2 border border-border">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium text-foreground">Google Analytics</span>
                  {analytics.googleAnalytics.ga4 && (
                    <Badge variant="outline" className="text-xs">
                      GA4
                    </Badge>
                  )}
                </div>
              )}

              {analytics.googleTagManager.present && (
                <div className="flex items-center gap-2 bg-muted/50 rounded-sm px-3 py-2 border border-border">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium text-foreground">Google Tag Manager</span>
                </div>
              )}

              {analytics.otherAnalytics.filter(tool => tool.detected).map((tool, index) => (
                <div key={index} className="flex items-center gap-2 bg-muted/50 rounded-sm px-3 py-2 border border-border">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium text-foreground">{tool.name}</span>
                </div>
              ))}

              {!analytics.googleAnalytics.present && !analytics.googleTagManager.present && analytics.otherAnalytics.filter(tool => tool.detected).length === 0 && (
                <div className="border border-border rounded-sm p-3 bg-muted/30">
                  <p className="text-xs text-muted-foreground">
                    No analytics detected. Consider adding Google Analytics or similar tools to track SEO performance and user behavior.
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-lg p-3">
            <p className="text-xs text-muted-foreground">Analytics data not available</p>
          </div>
        )}
      </div>

      {/* Sitemaps & Discovery */}
      {sitemap && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <div>
              <h2 className="text-sm font-semibold text-foreground">Search Engine Discovery</h2>
              <p className="text-xs text-muted-foreground">Files that help search engines understand your site</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            {/* robots.txt */}
            {sitemap.robotsTxt && (
              <div className="bg-card border border-border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={sitemap.robotsTxt.accessible || sitemap.robotsTxt.hasMetaRobots ? "w-2 h-2 bg-green-500 rounded-full" : "w-2 h-2 bg-red-500 rounded-full"}></div>
                    <h4 className="text-sm font-medium text-foreground">robots.txt</h4>
                  </div>
                  {sitemap.robotsTxt.accessible || sitemap.robotsTxt.hasMetaRobots ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">
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
            <div className="bg-card border border-border rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={sitemap.sitemaps.some(s => s.accessible) ? "w-2 h-2 bg-green-500 rounded-full" : "w-2 h-2 bg-red-500 rounded-full"}></div>
                  <h4 className="text-sm font-medium text-foreground">XML Sitemaps</h4>
                </div>
                {sitemap.sitemaps.some(s => s.accessible) ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
              </div>
              <div className="space-y-2">
                {sitemap.sitemaps.filter(s => s.accessible).slice(0, 2).map((sitemapItem, index) => (
                  <div key={index} className="flex items-center gap-2 text-xs">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
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
                  <p className="text-xs text-muted-foreground">
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