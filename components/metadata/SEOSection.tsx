'use client'

import React from 'react'
import Image from 'next/image'
import { WebsiteMetadata } from '@/types/metadata'
import {
  BarChart3,
  CheckCircle,
  ExternalLink,
  FileText,
  Globe,
  Search,
  Smartphone,
  Target,
  TrendingUp
} from 'lucide-react'
import MetadataErrorCard from './MetadataErrorCard'
import { getSEOScore } from '@/lib/scoring'
import {
  AuditCard,
  AuditLoadingState,
  AuditSection,
  AuditStatus,
  MetadataPill,
  ScoreSummaryCard,
  StatusPill
} from './AnalysisPrimitives'

interface SEOSectionProps {
  metadata?: WebsiteMetadata | null
  loading?: boolean
  error?: string | null
}

const getLengthStatus = (
  value: string | undefined,
  min: number,
  max: number
): AuditStatus => {
  if (!value) return 'error'
  return value.length >= min && value.length <= max ? 'good' : 'warning'
}

const getLengthDetail = (
  value: string | undefined,
  min: number,
  max: number,
  missing: string
) => {
  if (!value) return missing
  return `${value.length} characters. Recommended range: ${min}-${max}.`
}

export default function SEOSection ({ metadata, error }: SEOSectionProps) {
  if (error) {
    return <MetadataErrorCard sectionName='SEO' error={error} />
  }

  if (!metadata) {
    return (
      <AuditLoadingState
        title='Analyzing SEO data'
        items={[
          'Reading title and description',
          'Checking indexing directives',
          'Finding canonical and language signals',
          'Looking for discovery files'
        ]}
      />
    )
  }

  const { seo, sitemap, icons, analytics } = metadata
  const seoScore = getSEOScore(metadata)
  const analyticsTools = analytics
    ? [
      analytics.googleAnalytics.present,
      analytics.googleTagManager.present,
      ...analytics.otherAnalytics.map(tool => tool.detected)
    ].filter(Boolean).length
    : 0

  const accessibleSitemaps = sitemap?.sitemaps.filter(item => item.accessible) || []

  return (
    <div className='space-y-8'>
      <ScoreSummaryCard
        icon={TrendingUp}
        label='SEO Health'
        score={seoScore}
        description='Search essentials, indexing signals, and discovery coverage.'
      >
        <StatusPill status={seoScore.percentage >= 80 ? 'good' : seoScore.percentage >= 60 ? 'warning' : 'error'}>
          {seoScore.percentage >= 80 ? 'Strong coverage' : seoScore.percentage >= 60 ? 'Needs refinement' : 'Needs attention'}
        </StatusPill>
      </ScoreSummaryCard>

      <AuditSection
        icon={Search}
        title='Essential Meta'
        description='The title, description, and canonical tags that search results depend on most.'
      >
        <div className='grid grid-cols-1 xl:grid-cols-3 gap-3'>
          <AuditCard
            status={getLengthStatus(seo.title, 30, 60)}
            label='Page title'
            value={seo.title}
            detail={getLengthDetail(seo.title, 30, 60, 'Missing. Add a concise, descriptive title for search result headlines.')}
          />
          <AuditCard
            status={getLengthStatus(seo.description, 120, 160)}
            label='Meta description'
            value={seo.description}
            detail={getLengthDetail(seo.description, 120, 160, 'Missing. Add a clear summary to improve search result click-through.')}
          />
          <AuditCard
            status={seo.canonical ? 'good' : 'warning'}
            label='Canonical URL'
            value={seo.canonical}
            detail={seo.canonical ? 'Canonical target is present, which helps consolidate duplicate URLs.' : 'Recommended when pages can be reached from multiple URL variants.'}
          />
        </div>
      </AuditSection>

      <AuditSection
        icon={Smartphone}
        title='Indexing Configuration'
        description='Core page-level settings for crawling, language, and mobile rendering.'
      >
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
          <AuditCard
            status={seo.viewport ? 'good' : 'error'}
            label='Viewport'
            value={seo.viewport}
            detail={seo.viewport ? 'Mobile viewport configuration is present.' : 'Critical for responsive rendering on phones and tablets.'}
          />
          <AuditCard
            status={seo.language ? 'good' : 'warning'}
            label='Language'
            value={seo.language}
            detail={seo.language ? 'Language is declared for crawlers and assistive technology.' : 'Add an html lang attribute to clarify page language.'}
          />
          <AuditCard
            status={seo.robots ? 'good' : 'warning'}
            label='Robots directive'
            value={seo.robots}
            detail={seo.robots ? 'Page-level crawling instructions are available.' : 'Optional, but useful when indexing behavior needs to be explicit.'}
          />
          <AuditCard
            status='neutral'
            label='Keywords'
            value={seo.keywords}
            detail={seo.keywords ? 'Keyword metadata exists, although modern ranking relies more on page content and structure.' : 'No keyword tag found. This is usually fine for modern SEO.'}
          />
        </div>
      </AuditSection>

      <AuditSection
        icon={Target}
        title='Brand Signals'
        description='Visual identity and ownership cues that help the page feel complete across browsers and search surfaces.'
      >
        <div className='grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-3'>
          <AuditCard
            status={icons && icons.length > 0 ? 'good' : 'error'}
            label='Favicons and app icons'
            detail={icons && icons.length > 0 ? `${icons.length} icon${icons.length === 1 ? '' : 's'} detected.` : 'No icons detected. Add favicon and app icon sizes for tabs, bookmarks, and install prompts.'}
          >
            {icons && icons.length > 0 && (
              <div className='mt-4 flex flex-wrap gap-2'>
                {icons.slice(0, 6).map((icon, index) => (
                  <MetadataPill key={`${icon.href}-${index}`}>
                    <Image
                      src={icon.href}
                      alt={icon.sizes || 'favicon'}
                      width={16}
                      height={16}
                      className='h-4 w-4 object-contain'
                      onError={event => {
                        event.currentTarget.style.display = 'none'
                      }}
                      unoptimized
                    />
                    <span>{icon.sizes || icon.rel}</span>
                  </MetadataPill>
                ))}
                {icons.length > 6 && (
                  <MetadataPill>+{icons.length - 6} more</MetadataPill>
                )}
              </div>
            )}
          </AuditCard>

          <AuditCard
            status={seo.author ? 'good' : 'neutral'}
            label='Author'
            value={seo.author}
            detail={seo.author ? 'Author metadata is present.' : 'Optional. Useful for editorial or publication-style pages.'}
          />
        </div>
      </AuditSection>

      <AuditSection
        icon={BarChart3}
        title='Analytics'
        description='Measurement tools detected in the page source.'
      >
        <AuditCard
          status={analyticsTools > 0 ? 'good' : 'warning'}
          label='Tracking tools'
          detail={analyticsTools > 0 ? `${analyticsTools} analytics integration${analyticsTools === 1 ? '' : 's'} detected.` : 'No analytics tools detected. Add analytics if the site needs performance or conversion reporting.'}
        >
          {analytics && analyticsTools > 0 && (
            <div className='mt-4 flex flex-wrap gap-2'>
              {analytics.googleAnalytics.present && (
                <MetadataPill>
                  <CheckCircle className='h-3.5 w-3.5 text-emerald-600' />
                  Google Analytics{analytics.googleAnalytics.ga4 ? ' GA4' : ''}
                </MetadataPill>
              )}
              {analytics.googleTagManager.present && (
                <MetadataPill>
                  <CheckCircle className='h-3.5 w-3.5 text-emerald-600' />
                  Google Tag Manager
                </MetadataPill>
              )}
              {analytics.otherAnalytics.filter(tool => tool.detected).map(tool => (
                <MetadataPill key={tool.name}>
                  <CheckCircle className='h-3.5 w-3.5 text-emerald-600' />
                  {tool.name}
                </MetadataPill>
              ))}
            </div>
          )}
        </AuditCard>
      </AuditSection>

      {sitemap && (
        <AuditSection
          icon={Globe}
          title='Search Discovery'
          description='Sitemaps and robots files that help crawlers understand what to index.'
        >
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-3'>
            <AuditCard
              status={sitemap.robotsTxt?.accessible || sitemap.robotsTxt?.hasMetaRobots ? 'good' : 'warning'}
              label='robots.txt'
              detail={
                sitemap.robotsTxt?.accessible
                  ? 'robots.txt is accessible and can provide crawler instructions.'
                  : sitemap.robotsTxt?.hasMetaRobots
                    ? `Using meta robots: ${sitemap.robotsTxt.metaContent}`
                    : 'No accessible robots.txt found.'
              }
            />

            <AuditCard
              status={accessibleSitemaps.length > 0 ? 'good' : 'warning'}
              label='XML sitemaps'
              detail={accessibleSitemaps.length > 0 ? `${accessibleSitemaps.length} accessible sitemap${accessibleSitemaps.length === 1 ? '' : 's'} found.` : 'No accessible sitemap found. Add sitemap.xml for better discovery.'}
            >
              {accessibleSitemaps.length > 0 && (
                <div className='mt-4 space-y-2'>
                  {accessibleSitemaps.slice(0, 3).map(sitemapItem => (
                    <a
                      key={sitemapItem.url}
                      href={sitemapItem.url}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='flex items-center gap-2 rounded-md border border-border bg-muted/20 px-3 py-2 text-xs text-foreground hover:border-foreground/20 transition-colors'
                    >
                      <FileText className='h-3.5 w-3.5 text-muted-foreground flex-shrink-0' />
                      <span className='truncate'>{sitemapItem.url.replace(/^https?:\/\/[^/]+/, '') || sitemapItem.url}</span>
                      <ExternalLink className='h-3 w-3 text-muted-foreground flex-shrink-0 ml-auto' />
                    </a>
                  ))}
                  {accessibleSitemaps.length > 3 && (
                    <div className='text-xs text-muted-foreground'>
                      +{accessibleSitemaps.length - 3} more sitemaps
                    </div>
                  )}
                </div>
              )}
            </AuditCard>
          </div>
        </AuditSection>
      )}
    </div>
  )
}
