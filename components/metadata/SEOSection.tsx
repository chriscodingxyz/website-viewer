'use client'

import React from 'react'
import Image from 'next/image'
import { WebsiteMetadata } from '@/types/metadata'
import { Badge } from '@/components/ui/badge'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  Info,
  Globe,
  ExternalLink,
  BarChart3
} from 'lucide-react'

interface SEOSectionProps {
  metadata?: WebsiteMetadata | null
}

export default function SEOSection ({ metadata }: SEOSectionProps) {
  if (!metadata) {
    return (
      <div className='w-full'>
        <div className='text-center py-16 text-gray-500 dark:text-gray-400'>
          <div className='text-xl'>Loading SEO data...</div>
        </div>
      </div>
    )
  }

  const { seo, sitemap, icons, analytics } = metadata

  const getSEOScore = () => {
    let score = 0
    const maxScore = 5 // Title, Description, Canonical, Language, Viewport
    if (seo.title && seo.title.length >= 30 && seo.title.length <= 60)
      score += 1
    if (
      seo.description &&
      seo.description.length >= 120 &&
      seo.description.length <= 160
    )
      score += 1
    if (seo.canonical) score += 1
    if (seo.language) score += 1
    if (seo.viewport) score += 1
    return { score, maxScore, percentage: Math.round((score / maxScore) * 100) }
  }

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600'
    if (percentage >= 50) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreIcon = (percentage: number) => {
    if (percentage >= 80)
      return <CheckCircle className='h-6 w-6 text-green-500' />
    if (percentage >= 50)
      return <AlertTriangle className='h-6 w-6 text-yellow-500' />
    return <XCircle className='h-6 w-6 text-red-500' />
  }

  const seoScore = getSEOScore()

  const SimpleListItem = ({
    label,
    value,
    isGood,
    optimalRange
  }: {
    label: string
    value?: string
    isGood: boolean
    optimalRange?: string
  }) => {
    let statusText = ''
    let statusType: 'success' | 'warning' | 'error' = 'error'
    let showDetails = false

    if (label === 'Title' && value) {
      if (value.length >= 30 && value.length <= 60) {
        statusText = 'Optimal'
        statusType = 'success'
      } else {
        // All title length issues are warnings, not errors
        statusText = value.length < 30 ? 'Too Short' : 'Too Long'
        statusType = 'warning'
      }
      showDetails = true
    } else if (label === 'Description' && value) {
      if (value.length >= 120 && value.length <= 160) {
        statusText = 'Optimal'
        statusType = 'success'
      } else {
        // All description length issues are warnings, not errors
        statusText = value.length < 120 ? 'Too Short' : 'Too Long'
        statusType = 'warning'
      }
      showDetails = true
    } else {
      statusText = isGood ? 'Present' : 'Missing'
      statusType = isGood ? 'success' : 'error'
    }

    const getBgColor = () => {
      switch (statusType) {
        case 'success':
          return 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800/30'
        case 'warning':
          return 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-800/30'
        case 'error':
          return 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800/30'
      }
    }

    const getStatusColor = () => {
      switch (statusType) {
        case 'success':
          return 'text-green-700 dark:text-green-300'
        case 'warning':
          return 'text-yellow-700 dark:text-yellow-300'
        case 'error':
          return 'text-red-700 dark:text-red-300'
      }
    }

    const getStatusIcon = () => {
      switch (statusType) {
        case 'success':
          return <CheckCircle className='h-4 w-4 text-green-600' />
        case 'warning':
          return <AlertTriangle className='h-4 w-4 text-yellow-600' />
        case 'error':
          return <XCircle className='h-4 w-4 text-red-600' />
      }
    }

    return (
      <div className={`border rounded-lg p-3 ${getBgColor()}`}>
        <div className='flex items-center justify-between mb-2'>
          <div className='flex items-center gap-2'>
            {getStatusIcon()}
            <h4 className='font-medium text-foreground text-sm'>{label}</h4>
          </div>
          <span className={`text-xs font-medium px-2 py-1 rounded ${getStatusColor()}`}>
            {statusText}
          </span>
        </div>

        {value && (
          <div className='space-y-2'>
            <p className='text-sm text-muted-foreground line-clamp-2'>
              {value}
            </p>
            {showDetails && (
              <div className='flex items-center justify-between text-xs text-muted-foreground'>
                <span>
                  Length: <span className={`font-medium ${getStatusColor()}`}>
                    {value.length} characters
                  </span>
                </span>
                <span>
                  Recommended: <span className='font-medium text-foreground'>
                    {optimalRange}
                  </span>
                </span>
              </div>
            )}
          </div>
        )}

        {!value && (
          <p className={`text-xs ${getStatusColor()}`}>
            {optimalRange || 'Recommended for better SEO'}
          </p>
        )}
      </div>
    )
  }

  // Get critical recommendations
  const getCriticalRecommendations = () => {
    const recommendations = []
    if (!seo.title)
      recommendations.push({
        type: 'critical',
        text: 'Add a descriptive title (30-60 chars)'
      })
    else if (seo.title.length < 30)
      recommendations.push({
        type: 'warning',
        text: 'Title too short - expand for better SEO'
      })
    else if (seo.title.length > 60)
      recommendations.push({
        type: 'warning',
        text: 'Title too long - may be truncated'
      })

    if (!seo.description)
      recommendations.push({
        type: 'critical',
        text: 'Add a meta description (120-160 chars)'
      })
    else if (seo.description.length < 120)
      recommendations.push({
        type: 'warning',
        text: 'Description too short - add more detail'
      })
    else if (seo.description.length > 160)
      recommendations.push({
        type: 'warning',
        text: 'Description too long - may be truncated'
      })

    if (!seo.canonical)
      recommendations.push({
        type: 'warning',
        text: 'Add canonical URL to prevent duplicate content'
      })
    if (!seo.viewport)
      recommendations.push({
        type: 'critical',
        text: 'Add viewport meta tag for mobile support'
      })

    return recommendations
  }

  const recommendations = getCriticalRecommendations()
  const hasGoodTitle =
    seo.title && seo.title.length >= 30 && seo.title.length <= 60
  const hasGoodDescription =
    seo.description &&
    seo.description.length >= 120 &&
    seo.description.length <= 160

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <div className='w-full space-y-6'>
        {/* SEO Analysis */}
        <div className='max-w-2xl mx-auto'>
        <Accordion type="multiple" className="w-full space-y-4" defaultValue={["meta-tags", "favicons"]}>
          {/* Meta Tags */}
          <AccordionItem value="meta-tags" className="border border-border/50 rounded-lg bg-card/30">
            <AccordionTrigger className="px-4 py-3 hover:no-underline">
              <div className='flex items-center gap-3'>
                <Globe className='h-5 w-5 text-blue-600' />
                <span className='font-medium text-foreground'>Meta Tags & SEO Elements</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className='space-y-4'>
            <SimpleListItem
              label='Title'
              value={seo.title}
              isGood={!!hasGoodTitle}
              optimalRange='30-60 chars'
            />
            <SimpleListItem
              label='Description'
              value={seo.description}
              isGood={!!hasGoodDescription}
              optimalRange='120-160 chars'
            />
            <SimpleListItem
              label='Canonical URL'
              value={seo.canonical}
              isGood={!!seo.canonical}
              optimalRange='canonical URL to prevent duplicate content'
            />
            <SimpleListItem
              label='Keywords'
              value={seo.keywords}
              isGood={!!seo.keywords}
              optimalRange='relevant keywords for content'
            />
            <SimpleListItem
              label='Language'
              value={seo.language}
              isGood={!!seo.language}
              optimalRange='language attribute for accessibility'
            />
            <SimpleListItem
              label='Viewport'
              value={seo.viewport}
              isGood={!!seo.viewport}
              optimalRange='viewport meta tag for mobile support'
            />
            <SimpleListItem
              label='Robots'
              value={seo.robots}
              isGood={!!seo.robots}
              optimalRange='crawling instructions for search engines'
            />
            <SimpleListItem
              label='Author'
              value={seo.author}
              isGood={!!seo.author}
              optimalRange='author information for content'
            />
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Favicons */}
          <AccordionItem value="favicons" className="border border-border/50 rounded-lg bg-card/30">
            <AccordionTrigger className="px-4 py-3 hover:no-underline">
              <div className='flex items-center gap-3'>
                <Globe className='h-5 w-5 text-purple-600' />
                <span className='font-medium text-foreground'>Favicons & Icons</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className='space-y-4'>
            <div className={`border rounded-lg p-3 ${
              icons && icons.length > 0 
                ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800/30'
                : 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800/30'
            }`}>
              <div className='flex items-center justify-between mb-2'>
                <div className='flex items-center gap-2'>
                  {icons && icons.length > 0 ? (
                    <CheckCircle className='h-4 w-4 text-green-600' />
                  ) : (
                    <XCircle className='h-4 w-4 text-red-600' />
                  )}
                  <h4 className='font-medium text-foreground text-sm'>Favicons</h4>
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded ${
                  icons && icons.length > 0 
                    ? 'text-green-700 dark:text-green-300'
                    : 'text-red-700 dark:text-red-300'
                }`}>
                  {icons && icons.length > 0 
                    ? `${icons.length} ${icons.length === 1 ? 'icon' : 'icons'}`
                    : 'Missing'
                  }
                </span>
              </div>

              {icons && icons.length > 0 ? (
                <div className='space-y-2'>
                  <div className='flex items-center gap-2 flex-wrap'>
                    {icons.slice(0, 3).map((icon, index) => (
                      <div key={index} className='flex items-center gap-2 bg-white/50 dark:bg-black/50 rounded px-2 py-1'>
                        {icon.href && (
                          <Image
                            src={icon.href}
                            alt={`${icon.sizes || 'favicon'}`}
                            width={16}
                            height={16}
                            className='w-4 h-4 rounded'
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'
                            }}
                            unoptimized
                          />
                        )}
                        <span className='text-xs'>{icon.sizes || '16x16'}</span>
                      </div>
                    ))}
                    {icons.length > 3 && (
                      <span className='text-xs text-muted-foreground'>
                        +{icons.length - 3} more
                      </span>
                    )}
                  </div>
                  <p className='text-xs text-green-700 dark:text-green-300'>
                    Essential for brand recognition in browser tabs and bookmarks
                  </p>
                </div>
              ) : (
                <p className='text-xs text-red-700 dark:text-red-300'>
                  Add favicons to improve brand recognition in browser tabs, bookmarks, and search results
                </p>
              )}
            </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Analytics */}
          <AccordionItem value="analytics" className="border border-border/50 rounded-lg bg-card/30">
            <AccordionTrigger className="px-4 py-3 hover:no-underline">
              <div className='flex items-center gap-3'>
                <BarChart3 className='h-5 w-5 text-orange-600' />
                <span className='font-medium text-foreground'>Analytics & Tracking</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className='space-y-4'>
{analytics && (
              <div className={`border rounded-lg p-3 ${
                analytics.googleAnalytics.present ||
                analytics.googleTagManager.present ||
                analytics.otherAnalytics.some(a => a.detected)
                  ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800/30'
                  : 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800/30'
              }`}>
                <div className='flex items-center justify-between mb-2'>
                  <div className='flex items-center gap-2'>
                    {analytics.googleAnalytics.present ||
                    analytics.googleTagManager.present ||
                    analytics.otherAnalytics.some(a => a.detected) ? (
                      <CheckCircle className='h-4 w-4 text-green-600' />
                    ) : (
                      <XCircle className='h-4 w-4 text-red-600' />
                    )}
                    <h4 className='font-medium text-foreground text-sm'>Analytics</h4>
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded ${
                    analytics.googleAnalytics.present ||
                    analytics.googleTagManager.present ||
                    analytics.otherAnalytics.some(a => a.detected)
                      ? 'text-green-700 dark:text-green-300'
                      : 'text-red-700 dark:text-red-300'
                  }`}>
                    {(() => {
                      const totalTools = [
                        analytics.googleAnalytics.present,
                        analytics.googleTagManager.present,
                        ...analytics.otherAnalytics.map(tool => tool.detected)
                      ].filter(Boolean).length
                      return totalTools > 0 ? `${totalTools} tools` : 'None'
                    })()}
                  </span>
                </div>

                <div className='space-y-2'>
                  {analytics.googleAnalytics.present && (
                    <div className='flex items-center gap-2'>
                      <div className='w-2 h-2 rounded-full bg-green-500'></div>
                      <span className='text-sm'>Google Analytics</span>
                      {analytics.googleAnalytics.ga4 && (
                        <span className='text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded'>GA4</span>
                      )}
                    </div>
                  )}
                  
                  {analytics.googleTagManager.present && (
                    <div className='flex items-center gap-2'>
                      <div className='w-2 h-2 rounded-full bg-green-500'></div>
                      <span className='text-sm'>Google Tag Manager</span>
                    </div>
                  )}

                  {analytics.otherAnalytics.filter(tool => tool.detected).length > 0 && (
                    <div className='flex items-center gap-2 flex-wrap'>
                      <div className='w-2 h-2 rounded-full bg-green-500'></div>
                      <span className='text-sm'>Other tools:</span>
                      {analytics.otherAnalytics.filter(tool => tool.detected).slice(0, 2).map((tool, index) => (
                        <span key={index} className='text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded'>
                          {tool.name}
                        </span>
                      ))}
                    </div>
                  )}

                  {!analytics.googleAnalytics.present &&
                   !analytics.googleTagManager.present &&
                   analytics.otherAnalytics.filter(tool => tool.detected).length === 0 && (
                    <p className='text-xs text-red-700 dark:text-red-300'>
                      Analytics help track SEO performance, user behavior, and search visibility
                    </p>
                  )}
                </div>
              </div>
            )}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Sitemaps & Robots */}
          {sitemap && (
            <AccordionItem value="sitemaps" className="border border-border/50 rounded-lg bg-card/30">
              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <div className='flex items-center gap-3'>
                  <BarChart3 className='h-5 w-5 text-green-600' />
                  <span className='font-medium text-foreground'>Sitemaps & Robots</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">

            <div className='space-y-6'>
              {/* robots.txt Status */}
              {sitemap.robotsTxt && (
                <div className='bg-card/30 border border-border/50 rounded-lg p-4 hover:bg-card/50 transition-colors'>
                  <div className='flex items-start gap-3'>
                    <div
                      className={`flex-shrink-0 ${
                        sitemap.robotsTxt.accessible ||
                        sitemap.robotsTxt.hasMetaRobots
                          ? 'text-emerald-600'
                          : 'text-red-600'
                      }`}
                    >
                      {sitemap.robotsTxt.accessible ||
                      sitemap.robotsTxt.hasMetaRobots ? (
                        <CheckCircle className='h-4 w-4' />
                      ) : (
                        <XCircle className='h-4 w-4' />
                      )}
                    </div>
                    <div className='flex-1 min-w-0'>
                      <div className='flex items-start justify-between mb-3'>
                        <div className='flex-1'>
                          <h4 className='font-medium text-foreground text-sm'>
                            {sitemap.robotsTxt.accessible
                              ? sitemap.robotsTxt.url.endsWith('.js')
                                ? 'robots.js'
                                : 'robots.txt'
                              : sitemap.robotsTxt.hasMetaRobots
                              ? 'Robots Configuration'
                              : 'robots.txt'}
                          </h4>
                        </div>
                        <div
                          className={`ml-3 flex-shrink-0 ${
                            sitemap.robotsTxt.accessible
                              ? 'analysis-badge-success'
                              : sitemap.robotsTxt.hasMetaRobots
                              ? 'analysis-badge-success'
                              : 'analysis-badge-error'
                          }`}
                        >
                          {sitemap.robotsTxt.accessible
                            ? 'Found'
                            : sitemap.robotsTxt.hasMetaRobots
                            ? 'Via Meta Tags'
                            : 'Missing'}
                        </div>
                      </div>
                      <div className='space-y-3'>
                        <div className='bg-muted/30 rounded-md p-3 text-xs text-muted-foreground'>
                          {sitemap.robotsTxt.accessible
                            ? `${
                                sitemap.robotsTxt.url.endsWith('.js')
                                  ? 'robots.js'
                                  : 'robots.txt'
                              } found - helps search engines understand crawling rules`
                            : sitemap.robotsTxt.hasMetaRobots
                            ? `robots.txt not needed - using Next.js meta robots config: "${sitemap.robotsTxt.metaContent}"`
                            : 'robots file not found - consider adding robots.txt or robots.js for better SEO'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Sitemap Summary */}
              <div className='bg-card/30 border border-border/50 rounded-lg p-4 hover:bg-card/50 transition-colors'>
                <div className='flex items-start gap-3'>
                  <div
                    className={`flex-shrink-0 ${
                      sitemap.sitemaps.some(s => s.accessible)
                        ? 'text-emerald-600'
                        : 'text-red-600'
                    }`}
                  >
                    {sitemap.sitemaps.some(s => s.accessible) ? (
                      <CheckCircle className='h-4 w-4' />
                    ) : (
                      <XCircle className='h-4 w-4' />
                    )}
                  </div>
                  <div className='flex-1 min-w-0'>
                    <div className='flex items-start justify-between mb-3'>
                      <div className='flex-1'>
                        <h4 className='font-medium text-foreground text-sm'>
                          Sitemaps
                        </h4>
                      </div>
                      {(() => {
                        const accessibleCount = sitemap.sitemaps.filter(
                          s => s.accessible
                        ).length
                        const totalCount = sitemap.sitemaps.length

                        if (accessibleCount > 0) {
                          return (
                            <div className='ml-3 flex-shrink-0 analysis-badge-success'>
                              {accessibleCount} found
                            </div>
                          )
                        } else if (totalCount > 0) {
                          return (
                            <div className='ml-3 flex-shrink-0 analysis-badge-warning'>
                              Found but not accessible
                            </div>
                          )
                        } else {
                          return (
                            <div className='ml-3 flex-shrink-0 analysis-badge-error'>
                              None found
                            </div>
                          )
                        }
                      })()}
                    </div>

                    {(() => {
                      const accessibleSitemaps = sitemap.sitemaps.filter(
                        s => s.accessible
                      )
                      const inaccessibleSitemaps = sitemap.sitemaps.filter(
                        s => !s.accessible
                      )

                      if (accessibleSitemaps.length > 0) {
                        return (
                          <div className='space-y-2'>
                            {accessibleSitemaps
                              .slice(0, 3)
                              .map((sitemapItem, index) => (
                                <div
                                  key={index}
                                  className='flex items-center gap-2 analysis-text-xs text-muted-foreground'
                                >
                                  <CheckCircle className='h-3 w-3 text-green-500' />
                                  <a
                                    href={sitemapItem.url}
                                    target='_blank'
                                    rel='noopener noreferrer'
                                    className='hover:text-blue-600 underline truncate flex-1'
                                    title={sitemapItem.url}
                                  >
                                    {sitemapItem.url.replace(
                                      /^https?:\/\/[^\/]+/,
                                      ''
                                    )}
                                  </a>
                                  <ExternalLink className='h-3 w-3' />
                                  <Badge variant='outline' className='text-xs'>
                                    {sitemapItem.source === 'link_tag'
                                      ? 'HTML'
                                      : sitemapItem.source === 'robots_txt'
                                      ? 'robots.txt'
                                      : 'standard'}
                                  </Badge>
                                </div>
                              ))}

                            {accessibleSitemaps.length > 3 && (
                              <div className='analysis-text-xs text-muted-foreground'>
                                +{accessibleSitemaps.length - 3} more accessible
                                sitemaps
                              </div>
                            )}
                          </div>
                        )
                      } else if (inaccessibleSitemaps.length > 0) {
                        return (
                          <div className='analysis-text-xs text-amber-600'>
                            Found {inaccessibleSitemaps.length} sitemap
                            location(s) but they&apos;re not accessible
                          </div>
                        )
                      } else {
                        return (
                          <div className='analysis-text-xs text-red-600'>
                            No sitemaps found - consider adding sitemap.xml for
                            better SEO
                          </div>
                        )
                      }
                    })()}
                  </div>
                </div>
              </div>
            </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <AccordionItem value="recommendations" className="border border-border/50 rounded-lg bg-card/30">
              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <div className='flex items-center gap-3'>
                  <Info className='h-5 w-5 text-blue-600' />
                  <span className='font-medium text-foreground'>Recommendations</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className='space-y-3'>
              {recommendations.slice(0, 6).map((rec, index) => (
                <div
                  key={index}
                  className={`flex items-start gap-3 p-3 rounded-lg border ${
                    rec.type === 'critical'
                      ? 'bg-red-50/50 border-red-200/50 dark:bg-red-950/10 dark:border-red-800/20'
                      : 'bg-amber-50/50 border-amber-200/50 dark:bg-amber-950/10 dark:border-amber-800/20'
                  }`}
                >
                  {rec.type === 'critical' ? (
                    <XCircle className='h-4 w-4 text-red-500 mt-0.5 shrink-0' />
                  ) : (
                    <AlertTriangle className='h-4 w-4 text-amber-500 mt-0.5 shrink-0' />
                  )}
                  <p
                    className={`analysis-text-sm ${
                      rec.type === 'critical'
                        ? 'text-red-700 dark:text-red-300'
                        : 'text-amber-700 dark:text-amber-300'
                    }`}
                  >
                    {rec.text}
                  </p>
                </div>
              ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}
        </Accordion>
        </div>
    </div>
  )
}
