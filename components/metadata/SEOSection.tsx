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
  loading?: boolean
  error?: string | null
}

export default function SEOSection ({ metadata, loading, error }: SEOSectionProps) {
  console.log('🔥 [SEOSection] Render:', { hasMetadata: !!metadata, loading, hasError: !!error })

  // Show error state first
  if (error) {
    console.log('🔥 [SEOSection] Showing ERROR')
    return (
      <div className='w-full min-h-[400px] flex items-center justify-center'>
        <div className='text-center max-w-md'>
          <div className='mx-auto mb-4 w-16 h-16 rounded-full bg-red-100 dark:bg-red-950/20 flex items-center justify-center'>
            <AlertTriangle className='h-8 w-8 text-red-600 dark:text-red-400' />
          </div>
          <h3 className='text-base font-semibold mb-2 text-foreground'>
            Failed to Load SEO Data
          </h3>
          <p className='text-sm text-muted-foreground mb-4'>
            {error}
          </p>
        </div>
      </div>
    )
  }

  // Show loading state
  if (!metadata) {
    console.log('🔥 [SEOSection] Showing SPINNER (no metadata)')
    return (
      <div className='w-full min-h-[400px] flex items-center justify-center'>
        <div className='text-center max-w-md'>
          {/* Clean spinner */}
          <div className='flex justify-center items-center mb-8'>
            <div className='w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin'></div>
          </div>

          <h3 className='text-base font-semibold mb-6 text-foreground'>
            Analyzing SEO Data
          </h3>

          {/* Clean animated list */}
          <div className='space-y-3 text-sm text-muted-foreground'>
            <div className='flex items-center justify-center gap-3 px-4 py-2 bg-muted/50 rounded-full opacity-0 animate-[fadeIn_0.5s_ease-in-out_0.1s_forwards]'>
              <div className='w-1 h-1 rounded-full bg-foreground'></div>
              <span>Scanning meta tags</span>
            </div>
            <div className='flex items-center justify-center gap-3 px-4 py-2 bg-muted/50 rounded-full opacity-0 animate-[fadeIn_0.5s_ease-in-out_0.3s_forwards]'>
              <div className='w-1 h-1 rounded-full bg-foreground'></div>
              <span>Checking SEO scores</span>
            </div>
            <div className='flex items-center justify-center gap-3 px-4 py-2 bg-muted/50 rounded-full opacity-0 animate-[fadeIn_0.5s_ease-in-out_0.5s_forwards]'>
              <div className='w-1 h-1 rounded-full bg-foreground'></div>
              <span>Analyzing keywords</span>
            </div>
            <div className='flex items-center justify-center gap-3 px-4 py-2 bg-muted/50 rounded-full opacity-0 animate-[fadeIn_0.5s_ease-in-out_0.7s_forwards]'>
              <div className='w-1 h-1 rounded-full bg-foreground'></div>
              <span>Discovering sitemaps</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  console.log('🔥 [SEOSection] Showing CONTENT')
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

  // Elegant card-based status indicator - inspired by reference design
  const StatusIndicator = ({ status, label, value, details }: {
    status: 'good' | 'warning' | 'error'
    label: string
    value?: string
    details?: string
  }) => {
    const statusConfig = {
      good: {
        icon: <CheckCircle className="h-3.5 w-3.5" style={{ color: 'hsl(var(--brand-teal))' }} />,
        bgClass: "bg-green-50 dark:bg-green-950/30"
      },
      warning: {
        icon: <AlertTriangle className="h-3.5 w-3.5" style={{ color: 'hsl(var(--brand-orange))' }} />,
        bgClass: "bg-orange-50 dark:bg-orange-950/30"
      },
      error: {
        icon: <XCircle className="h-3.5 w-3.5 text-red-600" />,
        bgClass: "bg-red-50 dark:bg-red-950/30"
      }
    }

    const config = statusConfig[status]

    return (
      <div className="bg-card border border-border/40 rounded-lg overflow-hidden shadow-sm">
        {/* Header section with gray background */}
        <div className="bg-muted/50 px-3 py-2 border-b border-border/40">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-medium text-foreground">{label}</h4>
            {config.icon}
          </div>
        </div>

        {/* Content section */}
        <div className="p-3">
          {value ? (
            <>
              <p className="text-xs text-foreground mb-1.5 break-words leading-relaxed">{value}</p>
              {details && (
                <p className="text-[11px] text-muted-foreground leading-relaxed">{details}</p>
              )}
            </>
          ) : (
            <p className="text-[11px] text-muted-foreground leading-relaxed">{details}</p>
          )}
        </div>
      </div>
    )
  }

  // Elegant SEO Score card - inspired by reference design
  const SEOScoreDisplay = () => {
    const getScoreColor = () => {
      if (seoScore.percentage >= 80) return 'bg-[hsl(var(--brand-teal))]'
      if (seoScore.percentage >= 60) return 'bg-orange-500'
      return 'bg-red-500'
    }

    return (
      <div className="bg-card border border-border/40 rounded-lg overflow-hidden shadow-sm">
        {/* Header section with gray background */}
        <div className="bg-muted/50 px-3 py-2 border-b border-border/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
              <h3 className="text-xs font-medium text-foreground">SEO Health Score</h3>
            </div>
            <div className="text-right">
              <span className="text-sm font-semibold text-foreground">{seoScore.percentage}%</span>
            </div>
          </div>
        </div>

        {/* Content section */}
        <div className="p-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] text-muted-foreground">Overall optimization status</p>
            <p className="text-[11px] text-muted-foreground">{seoScore.score}/{seoScore.maxScore} checks passed</p>
          </div>

          <div className="h-2 bg-muted/60 rounded-full overflow-hidden">
            <div
              className={`h-full ${getScoreColor()} transition-all duration-300`}
              style={{ width: `${seoScore.percentage}%` }}
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* SEO Score Header */}
      <SEOScoreDisplay />

      {/* Core Meta Tags Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-3">
          <Search className="h-3.5 w-3.5 text-muted-foreground" />
          <div>
            <h2 className="text-xs font-semibold text-foreground">Essential Meta Tags</h2>
            <p className="text-[11px] text-muted-foreground">Core elements that affect search engine visibility</p>
          </div>
        </div>

        <div className="space-y-2.5">
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
        <div className="flex items-center gap-2 mb-3">
          <Smartphone className="h-3.5 w-3.5 text-muted-foreground" />
          <div>
            <h2 className="text-xs font-semibold text-foreground">Technical Configuration</h2>
            <p className="text-[11px] text-muted-foreground">Technical settings for optimal user experience</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-2.5">
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
        <div className="flex items-center gap-2 mb-3">
          <Target className="h-3.5 w-3.5 text-muted-foreground" />
          <div>
            <h2 className="text-xs font-semibold text-foreground">Visual Identity</h2>
            <p className="text-[11px] text-muted-foreground">Icons and visual elements for brand recognition</p>
          </div>
        </div>

        <div className="bg-card border border-border/40 rounded-lg overflow-hidden shadow-sm">
          {/* Header section with gray background */}
          <div className="bg-muted/50 px-3 py-2 border-b border-border/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-medium text-foreground">Favicons & Icons</h3>
                <span className="text-[11px] text-muted-foreground">
                  {icons && icons.length > 0
                    ? `${icons.length} detected`
                    : 'None found'
                  }
                </span>
              </div>
              {icons && icons.length > 0 ? (
                <CheckCircle className="h-3.5 w-3.5" style={{ color: 'hsl(var(--brand-teal))' }} />
              ) : (
                <XCircle className="h-3.5 w-3.5 text-red-600" />
              )}
            </div>
          </div>

          {/* Content section */}
          <div className="p-3">
            {icons && icons.length > 0 ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  {icons.slice(0, 4).map((icon, index) => (
                    <div key={index} className="flex items-center gap-1.5 bg-muted/30 rounded px-2 py-1.5 border border-border/40">
                      {icon.href && (
                        <Image
                          src={icon.href}
                          alt={`${icon.sizes || 'favicon'}`}
                          width={16}
                          height={16}
                          className="w-4 h-4"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                          }}
                          unoptimized
                        />
                      )}
                      <span className="text-[11px] font-medium text-foreground">{icon.sizes || '16x16'}</span>
                    </div>
                  ))}
                  {icons.length > 4 && (
                    <div className="text-[11px] text-muted-foreground px-2 py-1.5">
                      +{icons.length - 4} more
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Icons help with brand recognition across browsers and platforms.
                </p>
              </div>
            ) : (
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                No favicons detected. Add favicon.ico and various icon sizes to improve brand recognition in browser tabs, bookmarks, and search results.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Analytics & Tracking */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="h-3.5 w-3.5 text-muted-foreground" />
          <div>
            <h2 className="text-xs font-semibold text-foreground">Analytics & Tracking</h2>
            <p className="text-[11px] text-muted-foreground">Data collection tools for performance monitoring</p>
          </div>
        </div>

        {analytics ? (
          <div className="bg-card border border-border/40 rounded-lg overflow-hidden shadow-sm">
            {/* Header section with gray background */}
            <div className="bg-muted/50 px-3 py-2 border-b border-border/40">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-medium text-foreground">Analytics Tools</h3>
                  <span className="text-[11px] text-muted-foreground">
                    {(() => {
                      const totalTools = [
                        analytics.googleAnalytics.present,
                        analytics.googleTagManager.present,
                        ...analytics.otherAnalytics.map(tool => tool.detected)
                      ].filter(Boolean).length
                      return totalTools > 0 ? `${totalTools} active` : 'None detected'
                    })()}
                  </span>
                </div>
                {(() => {
                  const hasAnalytics = analytics.googleAnalytics.present || analytics.googleTagManager.present || analytics.otherAnalytics.some(a => a.detected)
                  return hasAnalytics ? (
                    <CheckCircle className="h-3.5 w-3.5" style={{ color: 'hsl(var(--brand-teal))' }} />
                  ) : (
                    <XCircle className="h-3.5 w-3.5 text-red-600" />
                  )
                })()}
              </div>
            </div>

            {/* Content section */}
            <div className="p-3">
              <div className="space-y-1.5">
                {analytics.googleAnalytics.present && (
                  <div className="flex items-center gap-2 bg-muted/30 rounded px-2 py-1.5 border border-border/40">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                    <span className="text-[11px] font-medium text-foreground">Google Analytics</span>
                    {analytics.googleAnalytics.ga4 && (
                      <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                        GA4
                      </Badge>
                    )}
                  </div>
                )}

                {analytics.googleTagManager.present && (
                  <div className="flex items-center gap-2 bg-muted/30 rounded px-2 py-1.5 border border-border/40">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                    <span className="text-[11px] font-medium text-foreground">Google Tag Manager</span>
                  </div>
                )}

                {analytics.otherAnalytics.filter(tool => tool.detected).map((tool, index) => (
                  <div key={index} className="flex items-center gap-2 bg-muted/30 rounded px-2 py-1.5 border border-border/40">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                    <span className="text-[11px] font-medium text-foreground">{tool.name}</span>
                  </div>
                ))}

                {!analytics.googleAnalytics.present && !analytics.googleTagManager.present && analytics.otherAnalytics.filter(tool => tool.detected).length === 0 && (
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    No analytics detected. Consider adding Google Analytics or similar tools to track SEO performance and user behavior.
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-card border border-border/40 rounded-lg p-3">
            <p className="text-[11px] text-muted-foreground">Analytics data not available</p>
          </div>
        )}
      </div>

      {/* Sitemaps & Discovery */}
      {sitemap && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-3">
            <Globe className="h-3.5 w-3.5 text-muted-foreground" />
            <div>
              <h2 className="text-xs font-semibold text-foreground">Search Engine Discovery</h2>
              <p className="text-[11px] text-muted-foreground">Files that help search engines understand your site</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-2.5">
            {/* robots.txt */}
            {sitemap.robotsTxt && (
              <div className="bg-card border border-border/40 rounded-lg overflow-hidden shadow-sm">
                <div className="bg-muted/50 px-3 py-2 border-b border-border/40">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-medium text-foreground">robots.txt</h4>
                    {sitemap.robotsTxt.accessible || sitemap.robotsTxt.hasMetaRobots ? (
                      <CheckCircle className="h-3.5 w-3.5" style={{ color: 'hsl(var(--brand-teal))' }} />
                    ) : (
                      <XCircle className="h-3.5 w-3.5 text-red-600" />
                    )}
                  </div>
                </div>
                <div className="p-3">
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
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
            <div className="bg-card border border-border/40 rounded-lg overflow-hidden shadow-sm">
              <div className="bg-muted/50 px-3 py-2 border-b border-border/40">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-medium text-foreground">XML Sitemaps</h4>
                  {sitemap.sitemaps.some(s => s.accessible) ? (
                    <CheckCircle className="h-3.5 w-3.5" style={{ color: 'hsl(var(--brand-teal))' }} />
                  ) : (
                    <XCircle className="h-3.5 w-3.5 text-red-600" />
                  )}
                </div>
              </div>
              <div className="p-3">
                <div className="space-y-1.5">
                  {sitemap.sitemaps.filter(s => s.accessible).slice(0, 2).map((sitemapItem, index) => (
                    <div key={index} className="flex items-center gap-1.5 text-[11px]">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full flex-shrink-0"></div>
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
                    <p className="text-[11px] text-muted-foreground">
                      +{sitemap.sitemaps.filter(s => s.accessible).length - 2} more sitemaps
                    </p>
                  )}

                  {sitemap.sitemaps.filter(s => s.accessible).length === 0 && (
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      No accessible sitemaps found - consider adding sitemap.xml for better search engine discovery
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}