'use client'

import React from 'react'
import Image from 'next/image'
import { WebsiteMetadata } from '@/types/metadata'
import {
  AlertTriangle,
  CheckCircle,
  ImageIcon,
  Search,
  Share2,
  XCircle
} from 'lucide-react'
import {
  DiscordLogo,
  FacebookLogo,
  LinkedinLogo,
  TelegramLogo,
  WhatsappLogo,
  XLogo
} from '@phosphor-icons/react'
import MetadataErrorCard from './MetadataErrorCard'
import { getSocialScore } from '@/lib/scoring'
import {
  AuditCard,
  AuditLoadingState,
  AuditSection,
  AuditStatus,
  MetadataPill,
  ScoreSummaryCard,
  StatusPill
} from './AnalysisPrimitives'

interface SocialPreviewProps {
  metadata?: WebsiteMetadata | null
  loading?: boolean
  error?: string | null
}

const resolveHost = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

const resolveAssetUrl = (value: string | undefined, baseUrl: string) => {
  if (!value) return undefined
  try {
    return new URL(value, baseUrl).toString()
  } catch {
    return value
  }
}

const inheritedStatus = (direct?: string, inherited?: string): AuditStatus => {
  if (direct) return 'good'
  if (inherited) return 'warning'
  return 'error'
}

function PreviewImage ({
  src,
  label
}: {
  src?: string
  label: string
}) {
  if (!src) {
    return (
      <div className='aspect-[1.91/1] w-full bg-muted/30 border-b border-border flex items-center justify-center'>
        <div className='text-center text-muted-foreground'>
          <ImageIcon className='h-6 w-6 mx-auto mb-2' />
          <p className='text-xs'>No preview image</p>
        </div>
      </div>
    )
  }

  return (
    <div className='aspect-[1.91/1] w-full bg-muted border-b border-border overflow-hidden'>
      <Image
        src={src}
        alt={label}
        width={720}
        height={377}
        className='h-full w-full object-cover'
        unoptimized
      />
    </div>
  )
}

function PlatformBadge ({
  icon,
  label
}: {
  icon: React.ReactNode
  label: string
}) {
  return (
    <div className='inline-flex items-center gap-2 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-foreground'>
      {icon}
      <span>{label}</span>
    </div>
  )
}

function SearchResultPreview ({
  title,
  description,
  url,
  host,
  favicon
}: {
  title: string
  description: string
  url: string
  host: string
  favicon?: string
}) {
  return (
    <div className='rounded-lg border border-border bg-card p-4'>
      <PlatformBadge icon={<Search className='h-3.5 w-3.5 text-muted-foreground' />} label='Google Search' />
      <div className='mt-4 space-y-2'>
        <div className='flex items-center gap-2 text-sm text-foreground'>
          <div className='h-5 w-5 rounded-md border border-border bg-background overflow-hidden flex items-center justify-center'>
            {favicon ? (
              <Image
                src={favicon}
                alt={`${host} favicon`}
                width={20}
                height={20}
                className='h-4 w-4 object-contain'
                unoptimized
              />
            ) : (
              <Share2 className='h-3 w-3 text-muted-foreground' />
            )}
          </div>
          <span className='truncate'>{host}</span>
        </div>
        <h3 className='text-lg leading-snug text-[#1a0dab] line-clamp-2'>
          {title}
        </h3>
        <p className='text-sm leading-relaxed text-muted-foreground line-clamp-3'>
          {description}
        </p>
        <p className='text-xs text-muted-foreground truncate'>{url}</p>
      </div>
    </div>
  )
}

function LinkCardPreview ({
  icon,
  label,
  title,
  description,
  image,
  host,
  compact = false
}: {
  icon: React.ReactNode
  label: string
  title: string
  description: string
  image?: string
  host: string
  compact?: boolean
}) {
  return (
    <div className='rounded-lg border border-border bg-card overflow-hidden'>
      <div className='p-4 border-b border-border bg-muted/20'>
        <PlatformBadge icon={icon} label={label} />
      </div>
      {!compact && <PreviewImage src={image} label={`${label} preview`} />}
      <div className='p-4'>
        {compact && (
          <div className='mb-3 rounded-lg border border-border overflow-hidden'>
            <PreviewImage src={image} label={`${label} preview`} />
          </div>
        )}
        <p className='text-xs uppercase tracking-[0.16em] text-muted-foreground mb-2'>
          {host}
        </p>
        <h3 className='text-base font-semibold leading-snug text-foreground line-clamp-2'>
          {title}
        </h3>
        <p className='mt-2 text-sm leading-relaxed text-muted-foreground line-clamp-3'>
          {description}
        </p>
      </div>
    </div>
  )
}

export default function SocialPreview ({ metadata, error }: SocialPreviewProps) {
  if (error) {
    return <MetadataErrorCard sectionName='Social' error={error} />
  }

  if (!metadata) {
    return (
      <AuditLoadingState
        title='Analyzing social metadata'
        items={[
          'Checking Open Graph tags',
          'Reading Twitter card metadata',
          'Resolving preview images',
          'Preparing share surfaces'
        ]}
      />
    )
  }

  const { openGraph, twitterCard, seo } = metadata
  const socialScore = getSocialScore(metadata)
  const host = resolveHost(metadata.url)
  const title = openGraph.title || twitterCard.title || seo.title || 'No title available'
  const description = openGraph.description || twitterCard.description || seo.description || 'No description available'
  const openGraphImage = resolveAssetUrl(openGraph.image, metadata.url)
  const twitterImage = resolveAssetUrl(twitterCard.image, metadata.url)
  const image = openGraphImage || twitterImage
  const favicon = metadata.icons?.[0]?.href
  const twitterDedicatedCount = [
    twitterCard.card,
    twitterCard.title,
    twitterCard.description,
    twitterCard.image
  ].filter(Boolean).length

  return (
    <div className='space-y-8'>
      <ScoreSummaryCard
        icon={Share2}
        label='Social Readiness'
        score={socialScore}
        description='Open Graph and Twitter card coverage for link previews.'
      >
        <StatusPill status={socialScore.percentage >= 75 ? 'good' : socialScore.percentage >= 50 ? 'warning' : 'error'}>
          {socialScore.percentage >= 75 ? 'Ready to share' : socialScore.percentage >= 50 ? 'Partially ready' : 'Needs metadata'}
        </StatusPill>
      </ScoreSummaryCard>

      <AuditSection
        icon={Share2}
        title='Preview Surfaces'
        description='Representative link previews using the metadata detected on this page.'
      >
        <div className='grid grid-cols-1 xl:grid-cols-2 gap-4'>
          <SearchResultPreview
            title={seo.title || title}
            description={seo.description || description}
            url={metadata.url}
            host={host}
            favicon={favicon}
          />
          <LinkCardPreview
            icon={<FacebookLogo className='h-3.5 w-3.5 text-[#1877f2]' weight='fill' />}
            label='Facebook / Open Graph'
            title={openGraph.title || title}
            description={openGraph.description || description}
            image={openGraphImage || image}
            host={openGraph.siteName || host}
          />
          <LinkCardPreview
            icon={<XLogo className='h-3.5 w-3.5 text-foreground' weight='fill' />}
            label='X / Twitter'
            title={twitterCard.title || openGraph.title || title}
            description={twitterCard.description || openGraph.description || description}
            image={twitterImage || openGraphImage}
            host={host}
            compact
          />
          <LinkCardPreview
            icon={<LinkedinLogo className='h-3.5 w-3.5 text-[#0a66c2]' weight='fill' />}
            label='LinkedIn'
            title={openGraph.title || title}
            description={openGraph.description || description}
            image={openGraphImage || image}
            host={host}
            compact
          />
        </div>

        <div className='mt-4 flex flex-wrap gap-2'>
          <MetadataPill>
            <DiscordLogo className='h-3.5 w-3.5 text-[#5865f2]' weight='fill' />
            Discord uses Open Graph
          </MetadataPill>
          <MetadataPill>
            <WhatsappLogo className='h-3.5 w-3.5 text-[#25d366]' weight='fill' />
            WhatsApp uses Open Graph
          </MetadataPill>
          <MetadataPill>
            <TelegramLogo className='h-3.5 w-3.5 text-[#26a5e4]' weight='fill' />
            Telegram uses Open Graph
          </MetadataPill>
        </div>
      </AuditSection>

      <AuditSection
        icon={FacebookLogo}
        title='Open Graph Tags'
        description='Metadata used by Facebook, LinkedIn, Discord, messaging apps, and many other share surfaces.'
      >
        <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
          <AuditCard
            status={openGraph.title ? 'good' : seo.title ? 'warning' : 'error'}
            label='og:title'
            value={openGraph.title || seo.title}
            detail={openGraph.title ? 'Dedicated Open Graph title is present.' : seo.title ? 'Falls back to the SEO title. Add og:title for platform-specific control.' : 'Missing title metadata.'}
          />
          <AuditCard
            status={openGraph.description ? 'good' : seo.description ? 'warning' : 'error'}
            label='og:description'
            value={openGraph.description || seo.description}
            detail={openGraph.description ? 'Dedicated Open Graph description is present.' : seo.description ? 'Falls back to the SEO description. Add og:description for social copy control.' : 'Missing description metadata.'}
          />
          <AuditCard
            status={openGraph.image ? 'good' : 'error'}
            label='og:image'
            value={openGraph.image}
            detail={openGraph.image ? 'Primary social preview image is present.' : 'Missing. Add an image sized around 1200x630 for rich shares.'}
          />
          <AuditCard
            status={openGraph.type ? 'good' : 'warning'}
            label='og:type'
            value={openGraph.type}
            detail={openGraph.type ? 'Content type is declared.' : 'Recommended. Use website, article, product, or another suitable type.'}
          />
          <AuditCard
            status={openGraph.url ? 'good' : 'warning'}
            label='og:url'
            value={openGraph.url}
            detail={openGraph.url ? 'Canonical share URL is declared.' : 'Recommended to prevent fragmented share metrics.'}
          />
          <AuditCard
            status={openGraph.siteName ? 'good' : 'neutral'}
            label='og:site_name'
            value={openGraph.siteName}
            detail={openGraph.siteName ? 'Site name is available for preview context.' : 'Optional, but useful for brand recognition.'}
          />
        </div>
      </AuditSection>

      <AuditSection
        icon={XLogo}
        title='Twitter Card Tags'
        description='Dedicated metadata for X/Twitter cards. When absent, many clients fall back to Open Graph.'
      >
        <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
          <AuditCard
            status={twitterCard.card ? 'good' : 'error'}
            label='twitter:card'
            value={twitterCard.card}
            detail={twitterCard.card ? 'Card type is declared.' : 'Missing. Add summary_large_image or summary for predictable previews.'}
          />
          <AuditCard
            status={inheritedStatus(twitterCard.title, openGraph.title || seo.title)}
            label='twitter:title'
            value={twitterCard.title || openGraph.title || seo.title}
            detail={twitterCard.title ? 'Dedicated Twitter title is present.' : openGraph.title || seo.title ? 'Inherited from Open Graph or SEO metadata.' : 'Missing title metadata.'}
          />
          <AuditCard
            status={inheritedStatus(twitterCard.description, openGraph.description || seo.description)}
            label='twitter:description'
            value={twitterCard.description || openGraph.description || seo.description}
            detail={twitterCard.description ? 'Dedicated Twitter description is present.' : openGraph.description || seo.description ? 'Inherited from Open Graph or SEO metadata.' : 'Missing description metadata.'}
          />
          <AuditCard
            status={inheritedStatus(twitterCard.image, openGraph.image)}
            label='twitter:image'
            value={twitterCard.image || openGraph.image}
            detail={twitterCard.image ? 'Dedicated Twitter image is present.' : openGraph.image ? 'Inherited from Open Graph image.' : 'Missing. Add a high-quality preview image.'}
          />
          <AuditCard
            status={twitterCard.site ? 'good' : 'neutral'}
            label='twitter:site'
            value={twitterCard.site}
            detail={twitterCard.site ? 'Publisher account is declared.' : 'Optional. Useful when the site has a brand account.'}
          />
          <AuditCard
            status={twitterCard.creator ? 'good' : 'neutral'}
            label='twitter:creator'
            value={twitterCard.creator}
            detail={twitterCard.creator ? 'Creator account is declared.' : 'Optional. Useful for author-led or editorial pages.'}
          />
        </div>
      </AuditSection>

      <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
        <AuditCard
          status={openGraph.title && openGraph.description ? 'good' : 'warning'}
          label='Copy coverage'
          detail='Social previews need a clear title and description before image polish matters.'
        >
          <div className='mt-4 flex gap-2'>
            {openGraph.title || twitterCard.title || seo.title ? (
              <CheckCircle className='h-4 w-4 text-emerald-600' />
            ) : (
              <XCircle className='h-4 w-4 text-red-600' />
            )}
            {openGraph.description || twitterCard.description || seo.description ? (
              <CheckCircle className='h-4 w-4 text-emerald-600' />
            ) : (
              <XCircle className='h-4 w-4 text-red-600' />
            )}
          </div>
        </AuditCard>
        <AuditCard
          status={image ? 'good' : 'error'}
          label='Image coverage'
          detail={image ? 'A preview image is available for rich social cards.' : 'No preview image was found.'}
        >
          <div className='mt-4'>
            {image ? <CheckCircle className='h-4 w-4 text-emerald-600' /> : <XCircle className='h-4 w-4 text-red-600' />}
          </div>
        </AuditCard>
        <AuditCard
          status={twitterDedicatedCount >= 4 ? 'good' : twitterDedicatedCount > 0 ? 'warning' : 'neutral'}
          label='Fallback behavior'
          detail={twitterDedicatedCount >= 4 ? 'Twitter card metadata is complete.' : twitterDedicatedCount > 0 ? 'Some Twitter fields are present. Complete the set for better control.' : 'Twitter will likely rely on Open Graph fallbacks.'}
        >
          <div className='mt-4'>
            {twitterDedicatedCount >= 4 ? (
              <CheckCircle className='h-4 w-4 text-emerald-600' />
            ) : (
              <AlertTriangle className='h-4 w-4 text-amber-600' />
            )}
          </div>
        </AuditCard>
      </div>
    </div>
  )
}
