'use client'

import React from 'react'
import { WebsiteMetadata } from '@/types/metadata'
import { Badge } from '@/components/ui/badge'
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

  const { seo, sitemap } = metadata

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
    let statusIcon: React.ReactNode = <XCircle className='h-4 w-4' />
    let statusText = ''
    let showDetails = false
    let badgeClass = 'analysis-badge-error'

    if (label === 'Title' && value) {
      if (value.length >= 30 && value.length <= 60) {
        statusIcon = <CheckCircle className='h-4 w-4' />
        statusText = 'Optimal'
        badgeClass = 'analysis-badge-success'
      } else if (
        (value.length >= 25 && value.length < 30) ||
        (value.length > 60 && value.length <= 70)
      ) {
        statusIcon = <AlertTriangle className='h-4 w-4' />
        statusText = value.length < 30 ? 'Too Short' : 'Too Long'
        badgeClass = 'analysis-badge-warning'
      } else {
        statusIcon = <XCircle className='h-4 w-4' />
        statusText = value.length < 25 ? 'Too Short' : 'Too Long'
        badgeClass = 'analysis-badge-error'
      }
      showDetails = true
    } else if (label === 'Description' && value) {
      if (value.length >= 120 && value.length <= 160) {
        statusIcon = <CheckCircle className='h-4 w-4' />
        statusText = 'Optimal'
        badgeClass = 'analysis-badge-success'
      } else if (
        (value.length >= 100 && value.length < 120) ||
        (value.length > 160 && value.length <= 180)
      ) {
        statusIcon = <AlertTriangle className='h-4 w-4' />
        statusText = value.length < 120 ? 'Too Short' : 'Too Long'
        badgeClass = 'analysis-badge-warning'
      } else {
        statusIcon = <XCircle className='h-4 w-4' />
        statusText = value.length < 100 ? 'Too Short' : 'Too Long'
        badgeClass = 'analysis-badge-error'
      }
      showDetails = true
    } else {
      statusIcon = isGood ? (
        <CheckCircle className='h-4 w-4' />
      ) : (
        <XCircle className='h-4 w-4' />
      )
      statusText = isGood ? 'Present' : 'Missing'
      badgeClass = isGood ? 'analysis-badge-success' : 'analysis-badge-error'
      showDetails = label === 'Keywords'
    }

    return (
      <div className='analysis-list-item'>
        <div className='flex items-start gap-4'>
          <div
            className={`mt-0.5 ${
              badgeClass.includes('success')
                ? 'text-emerald-600'
                : badgeClass.includes('warning')
                ? 'text-amber-600'
                : 'text-red-600'
            }`}
          >
            {statusIcon}
          </div>
          <div className='flex-1 min-w-0'>
            <div className='flex items-center justify-between mb-2'>
              <span className='font-semibold text-foreground analysis-text-sm'>
                {label}
              </span>
              <div className={badgeClass}>{statusText}</div>
            </div>

            {value ? (
              <div className='space-y-2'>
                <p className='text-muted-foreground analysis-text-sm leading-relaxed break-words'>
                  {value}
                </p>
                {showDetails && (
                  <div className='analysis-text-xs text-muted-foreground space-y-1 pl-3 border-l-2 border-border/40'>
                    {(label === 'Title' || label === 'Description') && (
                      <>
                        <div>
                          Length:{' '}
                          <span
                            className={`font-medium ${
                              isGood ? 'text-emerald-600' : 'text-amber-600'
                            }`}
                          >
                            {value.length} characters
                          </span>
                        </div>
                        <div>
                          Recommended:{' '}
                          <span className='font-medium text-foreground'>
                            {optimalRange}
                          </span>
                        </div>
                      </>
                    )}
                    {label === 'Keywords' && (
                      <div>Help search engines understand your content</div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className='space-y-2'>
                <p className='text-red-600 dark:text-red-400 analysis-text-sm font-medium'>
                  Not configured
                </p>
                <p className='analysis-text-xs text-muted-foreground pl-3 border-l-2 border-border/40'>
                  {optimalRange || 'Recommended for better SEO'}
                </p>
              </div>
            )}
          </div>
        </div>
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

  return (
    <div className='w-full space-y-10'>
      {/* Header */}
      <div className='flex items-center justify-end'>
        <div className='flex items-center gap-3'>
          <div className='flex items-center gap-2'>
            <Globe className='h-4 w-4 text-blue-600' />
            <Badge
              variant='outline'
              className='text-xs bg-blue-50 text-blue-700 border-blue-200'
            >
              SEO
            </Badge>
            <Badge
              variant='outline'
              className='text-xs bg-green-50 text-green-700 border-green-200'
            >
              Meta
            </Badge>
            <Badge
              variant='outline'
              className='text-xs bg-purple-50 text-purple-700 border-purple-200'
            >
              Schema
            </Badge>
          </div>
          {getScoreIcon(seoScore.percentage)}
          <div className='text-right'>
            <div
              className={`text-2xl font-bold ${getScoreColor(
                seoScore.percentage
              )}`}
            >
              {seoScore.percentage}%
            </div>
            <div className='text-sm text-gray-500'>
              {seoScore.score}/{seoScore.maxScore} optimized
            </div>
          </div>
        </div>
      </div>

      {/* SEO Analysis */}
      <div className='max-w-2xl mx-auto space-y-8'>
        {/* Meta Tags */}
        <div className='space-y-6 bg-gradient-to-r from-blue-50 to-transparent dark:from-blue-900/20 rounded-lg p-4'>
          <div className='flex items-center gap-3'>
            <div className='p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg'>
              <Globe className='h-5 w-5 text-blue-600 dark:text-blue-400' />
            </div>
            <h3 className='text-xl font-semibold text-foreground'>
              Meta Tags & SEO Elements
            </h3>
          </div>
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
        </div>

        {/* Sitemaps & Robots */}
        {sitemap && (
          <div className='space-y-6 bg-gradient-to-r from-green-50 to-transparent dark:from-green-900/20 rounded-lg p-4'>
            <div className='flex items-center gap-3'>
              <div className='p-2 bg-green-100 dark:bg-green-900/40 rounded-lg'>
                <BarChart3 className='h-5 w-5 text-green-600 dark:text-green-400' />
              </div>
              <h3 className='text-xl font-semibold text-foreground'>
                Sitemaps & Robots
              </h3>
            </div>

            <div className='space-y-6'>
              {/* robots.txt Status */}
              {sitemap.robotsTxt && (
                <div className='analysis-list-item'>
                  <div className='flex items-start gap-4'>
                    <div
                      className={`mt-0.5 ${
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
                      <div className='flex items-center justify-between mb-2'>
                        <span className='font-semibold text-foreground analysis-text-sm'>
                          {sitemap.robotsTxt.accessible
                            ? sitemap.robotsTxt.url.endsWith('.js')
                              ? 'robots.js'
                              : 'robots.txt'
                            : sitemap.robotsTxt.hasMetaRobots
                            ? 'Robots Configuration'
                            : 'robots.txt'}
                        </span>
                        <div
                          className={
                            sitemap.robotsTxt.accessible
                              ? 'analysis-badge-success'
                              : sitemap.robotsTxt.hasMetaRobots
                              ? 'analysis-badge-success'
                              : 'analysis-badge-error'
                          }
                        >
                          {sitemap.robotsTxt.accessible
                            ? 'Found'
                            : sitemap.robotsTxt.hasMetaRobots
                            ? 'Via Meta Tags'
                            : 'Missing'}
                        </div>
                      </div>
                      <div className='analysis-text-xs text-muted-foreground'>
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
              )}

              {/* Sitemap Summary */}
              <div className='analysis-list-item'>
                <div className='flex items-start gap-4'>
                  <div
                    className={`mt-0.5 ${
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
                    <div className='flex items-center justify-between mb-2'>
                      <span className='font-semibold text-foreground analysis-text-sm'>
                        Sitemaps
                      </span>
                      {(() => {
                        const accessibleCount = sitemap.sitemaps.filter(
                          s => s.accessible
                        ).length
                        const totalCount = sitemap.sitemaps.length

                        if (accessibleCount > 0) {
                          return (
                            <div className='analysis-badge-success'>
                              {accessibleCount} found
                            </div>
                          )
                        } else if (totalCount > 0) {
                          return (
                            <div className='analysis-badge-warning'>
                              Found but not accessible
                            </div>
                          )
                        } else {
                          return (
                            <div className='analysis-badge-error'>
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
          </div>
        )}

        {recommendations.length > 0 && (
          <div className='space-y-4'>
            <div className='flex items-center gap-2'>
              <Info className='h-4 w-4 text-blue-600' />
              <h4 className='analysis-text-sm font-semibold text-foreground'>
                Recommendations
              </h4>
            </div>
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
          </div>
        )}
      </div>
    </div>
  )
}
