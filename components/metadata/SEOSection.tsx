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

  // Status indicator component for cleaner code
  const StatusIndicator = ({ status, label, value, details }: {
    status: 'good' | 'warning' | 'error'
    label: string
    value?: string
    details?: string
  }) => {
    const styles = {
      good: {
        icon: <CheckCircle className="h-5 w-5 text-emerald-600" />,
        bg: "bg-emerald-50 dark:bg-emerald-950/20",
        border: "border-l-emerald-500",
        text: "text-emerald-800 dark:text-emerald-200"
      },
      warning: {
        icon: <AlertTriangle className="h-5 w-5 text-amber-600" />,
        bg: "bg-amber-50 dark:bg-amber-950/20",
        border: "border-l-amber-500",
        text: "text-amber-800 dark:text-amber-200"
      },
      error: {
        icon: <XCircle className="h-5 w-5 text-red-600" />,
        bg: "bg-red-50 dark:bg-red-950/20",
        border: "border-l-red-500",
        text: "text-red-800 dark:text-red-200"
      }
    }

    const style = styles[status]

    return (
      <div className={`border-l-4 ${style.border} ${style.bg} p-4 space-y-2`}>
        <div className="flex items-center gap-3">
          {style.icon}
          <div className="flex-1">
            <h4 className={`font-semibold ${style.text}`}>{label}</h4>
            {value && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{value}</p>
            )}
          </div>
        </div>
        {details && (
          <p className="text-xs text-muted-foreground ml-8">{details}</p>
        )}
      </div>
    )
  }

  // SEO Score component
  const SEOScoreDisplay = () => (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-l-4 border-l-blue-500 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <TrendingUp className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-foreground">SEO Health Score</h3>
            <p className="text-sm text-muted-foreground">Overall optimization status</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-blue-600">{seoScore.percentage}%</div>
          <div className="text-sm text-muted-foreground">{seoScore.score}/{seoScore.maxScore} checks passed</div>
        </div>
      </div>

      <div className="w-full bg-gray-200 dark:bg-gray-700 h-2">
        <div
          className="h-2 bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-300"
          style={{ width: `${seoScore.percentage}%` }}
        />
      </div>
    </div>
  )

  return (
    <div className="w-full space-y-8">
      {/* SEO Score Header */}
      <SEOScoreDisplay />

      {/* Core Meta Tags Section */}
      <div className="space-y-6">
        <div className="border-b border-border pb-4">
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <Search className="h-7 w-7 text-blue-600" />
            Essential Meta Tags
          </h2>
          <p className="text-muted-foreground mt-2">Core elements that affect search engine visibility</p>
        </div>

        <div className="grid gap-4">
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
      <div className="space-y-6">
        <div className="border-b border-border pb-4">
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <Smartphone className="h-7 w-7 text-green-600" />
            Technical Configuration
          </h2>
          <p className="text-muted-foreground mt-2">Technical settings for optimal user experience</p>
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
      <div className="space-y-6">
        <div className="border-b border-border pb-4">
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <Target className="h-7 w-7 text-purple-600" />
            Visual Identity
          </h2>
          <p className="text-muted-foreground mt-2">Icons and visual elements for brand recognition</p>
        </div>

        <div className="border-l-4 border-l-purple-500 bg-purple-50 dark:bg-purple-950/20 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {icons && icons.length > 0 ? (
                <CheckCircle className="h-6 w-6 text-emerald-600" />
              ) : (
                <XCircle className="h-6 w-6 text-red-600" />
              )}
              <div>
                <h3 className="text-lg font-semibold text-foreground">Favicons & Icons</h3>
                <p className="text-sm text-muted-foreground">
                  {icons && icons.length > 0
                    ? `${icons.length} icon${icons.length === 1 ? '' : 's'} detected`
                    : 'No icons found'
                  }
                </p>
              </div>
            </div>
          </div>

          {icons && icons.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 flex-wrap">
                {icons.slice(0, 4).map((icon, index) => (
                  <div key={index} className="flex items-center gap-2 bg-white/70 dark:bg-black/30 rounded-lg px-3 py-2 border">
                    {icon.href && (
                      <Image
                        src={icon.href}
                        alt={`${icon.sizes || 'favicon'}`}
                        width={20}
                        height={20}
                        className="w-5 h-5 rounded"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                        unoptimized
                      />
                    )}
                    <span className="text-sm font-medium">{icon.sizes || '16x16'}</span>
                  </div>
                ))}
                {icons.length > 4 && (
                  <div className="text-sm text-muted-foreground px-3 py-2">
                    +{icons.length - 4} more
                  </div>
                )}
              </div>
              <p className="text-sm text-emerald-700 dark:text-emerald-300">
                Great! Icons help with brand recognition across browsers and platforms.
              </p>
            </div>
          ) : (
            <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/30 rounded-lg p-4">
              <p className="text-sm text-red-700 dark:text-red-300">
                No favicons detected. Add favicon.ico and various icon sizes to improve brand recognition in browser tabs, bookmarks, and search results.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Analytics & Tracking */}
      <div className="space-y-6">
        <div className="border-b border-border pb-4">
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <BarChart3 className="h-7 w-7 text-orange-600" />
            Analytics & Tracking
          </h2>
          <p className="text-muted-foreground mt-2">Data collection tools for performance monitoring</p>
        </div>

        {analytics ? (
          <div className="border-l-4 border-l-orange-500 bg-orange-50 dark:bg-orange-950/20 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                {analytics.googleAnalytics.present || analytics.googleTagManager.present || analytics.otherAnalytics.some(a => a.detected) ? (
                  <CheckCircle className="h-6 w-6 text-emerald-600" />
                ) : (
                  <XCircle className="h-6 w-6 text-red-600" />
                )}
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Analytics Tools</h3>
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
            </div>

            <div className="space-y-3">
              {analytics.googleAnalytics.present && (
                <div className="flex items-center gap-3 bg-white/70 dark:bg-black/30 rounded-lg px-4 py-3 border">
                  <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                  <span className="font-medium">Google Analytics</span>
                  {analytics.googleAnalytics.ga4 && (
                    <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800">
                      GA4
                    </Badge>
                  )}
                </div>
              )}

              {analytics.googleTagManager.present && (
                <div className="flex items-center gap-3 bg-white/70 dark:bg-black/30 rounded-lg px-4 py-3 border">
                  <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                  <span className="font-medium">Google Tag Manager</span>
                </div>
              )}

              {analytics.otherAnalytics.filter(tool => tool.detected).map((tool, index) => (
                <div key={index} className="flex items-center gap-3 bg-white/70 dark:bg-black/30 rounded-lg px-4 py-3 border">
                  <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                  <span className="font-medium">{tool.name}</span>
                </div>
              ))}

              {!analytics.googleAnalytics.present && !analytics.googleTagManager.present && analytics.otherAnalytics.filter(tool => tool.detected).length === 0 && (
                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/30 rounded-lg p-4">
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    No analytics detected. Consider adding Google Analytics or similar tools to track SEO performance and user behavior.
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="border-l-4 border-l-gray-300 bg-gray-50 dark:bg-gray-950/20 p-6">
            <p className="text-muted-foreground">Analytics data not available</p>
          </div>
        )}
      </div>

      {/* Sitemaps & Discovery */}
      {sitemap && (
        <div className="space-y-6">
          <div className="border-b border-border pb-4">
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
              <Globe className="h-7 w-7 text-indigo-600" />
              Search Engine Discovery
            </h2>
            <p className="text-muted-foreground mt-2">Files that help search engines understand your site</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* robots.txt */}
            {sitemap.robotsTxt && (
              <div className="border-l-4 border-l-indigo-500 bg-indigo-50 dark:bg-indigo-950/20 p-4">
                <div className="flex items-center gap-3 mb-3">
                  {sitemap.robotsTxt.accessible || sitemap.robotsTxt.hasMetaRobots ? (
                    <CheckCircle className="h-5 w-5 text-emerald-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  <h4 className="font-semibold text-foreground">robots.txt</h4>
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
            <div className={`border-l-4 p-4 ${
              sitemap.sitemaps.some(s => s.accessible)
                ? 'border-l-green-500 bg-green-50 dark:bg-green-950/20'
                : 'border-l-amber-500 bg-amber-50 dark:bg-amber-950/20'
            }`}>
              <div className="flex items-center gap-3 mb-3">
                {sitemap.sitemaps.some(s => s.accessible) ? (
                  <CheckCircle className="h-5 w-5 text-emerald-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
                <h4 className="font-semibold text-foreground">XML Sitemaps</h4>
              </div>
              <div className="space-y-3">
                {sitemap.sitemaps.filter(s => s.accessible).slice(0, 2).map((sitemapItem, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-3 w-3 text-emerald-500 flex-shrink-0" />
                    <a
                      href={sitemapItem.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 truncate flex-1 underline"
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
                  <p className="text-sm text-amber-700 dark:text-amber-300">
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