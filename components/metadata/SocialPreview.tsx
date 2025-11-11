'use client'

import React, { useState } from 'react'
import { WebsiteMetadata } from '@/types/metadata'
import { Badge } from '@/components/ui/badge'
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  Share2,
  ExternalLink,
  Eye,
  Search
} from 'lucide-react'
import {
  FacebookLogo,
  XLogo,
  GoogleLogo,
  DiscordLogo,
  WhatsappLogo,
  LinkedinLogo,
  TelegramLogo
} from '@phosphor-icons/react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import Image from 'next/image'

interface SocialPreviewProps {
  metadata?: WebsiteMetadata | null
  loading?: boolean
  error?: string | null
}

export default function SocialPreview ({ metadata, loading, error }: SocialPreviewProps) {
  // Show error state first
  if (error) {
    return (
      <div className='w-full min-h-[400px] flex items-center justify-center'>
        <div className='text-center max-w-md'>
          <div className='mx-auto mb-4 w-16 h-16 rounded-full bg-red-100 dark:bg-red-950/20 flex items-center justify-center'>
            <AlertTriangle className='h-8 w-8 text-red-600 dark:text-red-400' />
          </div>
          <h3 className='text-base font-semibold mb-2 text-foreground'>
            Failed to Load Social Data
          </h3>
          <p className='text-sm text-muted-foreground mb-4'>
            {error}
          </p>
        </div>
      </div>
    )
  }

  // Show loading state
  if (loading || !metadata) {
    return (
      <div className='w-full min-h-[400px] flex items-center justify-center'>
        <div className='text-center max-w-md'>
          {/* Clean spinner */}
          <div className='flex justify-center items-center mb-8'>
            <div className='w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin'></div>
          </div>

          <h3 className='text-base font-semibold mb-6 text-foreground'>
            Analyzing Social Media
          </h3>

          {/* Clean animated list */}
          <div className='space-y-3 text-sm text-muted-foreground'>
            <div className='flex items-center justify-center gap-3 px-4 py-2 bg-muted/50 rounded-full opacity-0 animate-[fadeIn_0.5s_ease-in-out_0.1s_forwards]'>
              <div className='w-1 h-1 rounded-full bg-foreground'></div>
              <span>Checking Open Graph tags</span>
            </div>
            <div className='flex items-center justify-center gap-3 px-4 py-2 bg-muted/50 rounded-full opacity-0 animate-[fadeIn_0.5s_ease-in-out_0.3s_forwards]'>
              <div className='w-1 h-1 rounded-full bg-foreground'></div>
              <span>Analyzing Twitter cards</span>
            </div>
            <div className='flex items-center justify-center gap-3 px-4 py-2 bg-muted/50 rounded-full opacity-0 animate-[fadeIn_0.5s_ease-in-out_0.5s_forwards]'>
              <div className='w-1 h-1 rounded-full bg-foreground'></div>
              <span>Validating social images</span>
            </div>
          </div>
        </div>
      </div>
    )
  }
  const { openGraph, twitterCard, seo } = metadata

  const SimpleListItem = ({
    icon,
    label,
    value,
    status
  }: {
    icon: string
    label: string
    value?: string
    status: 'present' | 'missing' | 'inherited'
  }) => {
    const statusIcon =
      status === 'present' ? (
        <CheckCircle className='h-3.5 w-3.5 text-green-600' />
      ) : status === 'inherited' ? (
        <AlertTriangle className='h-3.5 w-3.5 text-orange-600' />
      ) : (
        <XCircle className='h-3.5 w-3.5 text-red-600' />
      )

    return (
      <div className="bg-card border border-border/40 rounded-lg overflow-hidden shadow-sm">
        {/* Header section with gray background */}
        <div className="bg-muted/50 px-3 py-2 border-b border-border/40">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-medium text-foreground">{label}</h4>
            {statusIcon}
          </div>
        </div>

        {/* Content section */}
        <div className="p-3">
          {value ? (
            <>
              <p className="text-xs text-foreground mb-1.5 break-words leading-relaxed">{value}</p>
              {status === 'inherited' && (
                <p className="text-[11px] text-muted-foreground leading-relaxed flex items-start gap-1.5">
                  <AlertTriangle className='h-3 w-3 text-orange-500 flex-shrink-0 mt-0.5' />
                  <span>Inherited from SEO meta - consider adding dedicated social media tags</span>
                </p>
              )}
            </>
          ) : (
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Add {label.toLowerCase()} for better social media sharing
            </p>
          )}
        </div>
      </div>
    )
  }

  const getSocialScore = () => {
    let score = 0
    const maxScore = 8 // OpenGraph (4) + Twitter (4)

    // OpenGraph scoring (proper social media tags)
    if (openGraph.title) score += 1
    if (openGraph.description) score += 1
    if (openGraph.image) score += 1
    if (openGraph.type) score += 1

    // Twitter Card scoring (dedicated Twitter tags, not inherited)
    if (twitterCard.card) score += 1
    if (twitterCard.title) score += 1 // Only count if explicitly set, not inherited
    if (twitterCard.description) score += 1 // Only count if explicitly set
    if (twitterCard.image) score += 1 // Twitter-specific image

    return { score, maxScore, percentage: Math.round((score / maxScore) * 100) }
  }

  const socialScore = getSocialScore()

  const SocialPreviewCard = ({
    platform
  }: {
    platform:
      | 'facebook'
      | 'twitter'
      | 'google'
      | 'discord'
      | 'whatsapp'
      | 'linkedin'
      | 'telegram'
  }) => {
    const title =
      openGraph.title || twitterCard.title || seo.title || 'No Title'
    const description =
      openGraph.description ||
      twitterCard.description ||
      seo.description ||
      'No Description'
    const image = openGraph.image || twitterCard.image
    const siteName = openGraph.siteName || new URL(metadata.url).hostname
    const url = metadata.url

    const SocialCard = ({ isDialog = false }: { isDialog?: boolean }) => {
      const getPlatformIcon = () => {
        switch (platform) {
          case 'google':
            return <Search className='h-4 w-4 text-blue-600' />
          case 'discord':
            return (
              <DiscordLogo className='h-4 w-4 text-indigo-500' weight='fill' />
            )
          case 'whatsapp':
            return (
              <WhatsappLogo className='h-4 w-4 text-green-500' weight='fill' />
            )
          case 'linkedin':
            return (
              <LinkedinLogo className='h-4 w-4 text-blue-700' weight='fill' />
            )
          case 'telegram':
            return (
              <TelegramLogo className='h-4 w-4 text-blue-500' weight='fill' />
            )
          case 'twitter':
            return (
              <XLogo
                className='h-4 w-4 text-gray-900 dark:text-gray-100'
                weight='fill'
              />
            )
          case 'facebook':
            return (
              <FacebookLogo className='h-4 w-4 text-blue-600' weight='fill' />
            )
          default:
            return null
        }
      }

      const getPlatformName = () => {
        switch (platform) {
          case 'google':
            return 'Google Search'
          case 'discord':
            return 'Discord'
          case 'whatsapp':
            return 'WhatsApp'
          case 'linkedin':
            return 'LinkedIn'
          case 'telegram':
            return 'Telegram'
          case 'twitter':
            return 'Twitter/X'
          case 'facebook':
            return 'Facebook'
          default:
            return platform
        }
      }

      // Google Search Result Style
      if (platform === 'google') {
        return (
          <div className='space-y-4'>
            <div className='inline-flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1.5 mb-0'>
              <svg className='w-4 h-4' viewBox='0 0 24 24' fill='none'>
                <path
                  d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'
                  fill='#4285F4'
                />
                <path
                  d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'
                  fill='#34A853'
                />
                <path
                  d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z'
                  fill='#FBBC05'
                />
                <path
                  d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z'
                  fill='#EA4335'
                />
              </svg>
              <span className='text-sm font-medium text-gray-700'>Google</span>
            </div>
            <div className='bg-white'>
              <div className='flex items-center gap-2 mb-1'>
                <div className='w-4 h-4 rounded-sm overflow-hidden flex-shrink-0'>
                  {metadata.icons && metadata.icons.length > 0 ? (
                    <Image
                      src={metadata.icons[0].href}
                      alt='favicon'
                      width={16}
                      height={16}
                      className='w-full h-full object-contain'
                      onError={e => {
                        e.currentTarget.style.display = 'none'
                      }}
                      unoptimized
                    />
                  ) : (
                    <div className='w-4 h-4 bg-gray-100 rounded-sm'></div>
                  )}
                </div>
                <div className='text-sm text-green-700 truncate font-normal'>
                  {url}
                </div>
              </div>
              <h3 className='text-blue-600 text-xl mb-1 line-clamp-1 hover:underline cursor-pointer font-normal'>
                {title}
              </h3>
              <p className='text-gray-600 text-sm line-clamp-2 leading-relaxed'>
                {description}
              </p>
            </div>
          </div>
        )
      }

      // Discord Rich Embed Style
      if (platform === 'discord') {
        return (
          <div className='space-y-4'>
            <div className='inline-flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1.5 mb-0'>
              <DiscordLogo className='w-4 h-4 text-indigo-500' weight='fill' />
              <span className='text-sm font-medium text-gray-700'>Discord</span>
            </div>
            <div className='bg-gray-800 text-white p-4 rounded-lg'>
              <div className='flex items-center gap-3 mb-4'>
                <Image
                  src='/v1punk.png'
                  alt='cryptopunk'
                  width={40}
                  height={40}
                  className='w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center'
                  unoptimized
                />
                <div>
                  <div className='flex items-center gap-2'>
                    <span className='text-white font-medium'>
                      cryptopunk420
                    </span>
                    <div className='w-3 h-3 bg-green-500 rounded-full'></div>
                    <span className='text-xs text-gray-400'>
                      Today at 3:14 PM
                    </span>
                  </div>
                </div>
              </div>
              <div className='ml-13'>
                <a href={url} className='text-blue-400 hover:underline text-sm'>
                  {url}
                </a>
                <div className='border-l-4 border-blue-500 bg-gray-700 p-4 rounded-r mt-2 max-w-lg'>
                  <div className='text-blue-400 text-sm mb-1'>{siteName}</div>
                  <h4 className='text-blue-300 text-base font-medium mb-2 line-clamp-2'>
                    {title}
                  </h4>
                  <p className='text-gray-300 text-sm line-clamp-2 leading-relaxed mb-3'>
                    {description}
                  </p>
                  {image && (
                    <div className='w-full max-w-sm h-48 bg-gray-600 rounded overflow-hidden'>
                      <Image
                        src={image}
                        alt='Discord preview'
                        width={400}
                        height={192}
                        className='w-full h-full object-cover'
                        unoptimized
                      />
                    </div>
                  )}
                </div>
                <div className='flex items-center gap-4 mt-2'>
                  <div className='flex items-center gap-1'>
                    <span className='text-lg'>❤️</span>
                    <span className='text-gray-400 text-sm'>4</span>
                  </div>
                  <div className='flex items-center gap-1'>
                    <span className='text-lg'>⚡</span>
                    <span className='text-gray-400 text-sm'>7</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      }

      // WhatsApp Link Preview Style
      if (platform === 'whatsapp') {
        return (
          <div className='space-y-4'>
            <div className='inline-flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1.5 mb-0'>
              <WhatsappLogo className='w-4 h-4 text-green-500' weight='fill' />
              <span className='text-sm font-medium text-gray-700'>
                WhatsApp
              </span>
            </div>
            <div className='flex justify-end'>
              <div className='max-w-xs bg-green-200 rounded-2xl p-2 relative'>
                {image && (
                  <div className='w-full h-32 bg-gray-800 rounded-t-lg overflow-hidden mb-0'>
                    <Image
                      src={image}
                      alt='WhatsApp preview'
                      width={200}
                      height={128}
                      className='w-full h-full object-cover'
                      unoptimized
                    />
                  </div>
                )}
                <div className='bg-green-200 rounded-b-lg p-2'>
                  <h4 className='text-gray-800 text-sm font-medium mb-1 line-clamp-1'>
                    {title}
                  </h4>
                  <p className='text-gray-600 text-xs line-clamp-2 mb-2'>
                    {description}
                  </p>

                  <div className='flex items-center justify-between'>
                    <div className='text-sm text-green-600 underline'>
                      {url}
                    </div>
                    <div className='flex items-center gap-1'>
                      <span
                        className='text-xs text-gray-400'
                        style={{ fontSize: '10px' }}
                      >
                        4:20 PM
                      </span>
                      <div className='flex text-blue-600'>
                        <svg
                          className='w-3 h-3'
                          fill='currentColor'
                          viewBox='0 0 24 24'
                        >
                          <path d='M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z' />
                        </svg>
                        <svg
                          className='w-3 h-3 -ml-1'
                          fill='currentColor'
                          viewBox='0 0 24 24'
                        >
                          <path d='M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z' />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      }

      // LinkedIn Post Preview Style
      if (platform === 'linkedin') {
        return (
          <div className='space-y-4'>
            <div className='inline-flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1.5 mb-0'>
              <LinkedinLogo className='w-4 h-4 text-blue-700' weight='fill' />
              <span className='text-sm font-medium text-gray-700'>
                Linkedin
              </span>
            </div>
            <div className='bg-white border border-gray-200 rounded-lg p-4'>
              <div className='flex items-start gap-3 mb-3'>
                <div className='w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center'>
                  <span className='text-white font-medium text-lg'>JD</span>
                </div>
                <div className='flex-1'>
                  <div className='flex items-center gap-2 mb-1'>
                    <h3 className='font-semibold text-gray-900'>John Doe</h3>
                    <span className='text-gray-500'>• You</span>
                  </div>
                  <p className='text-sm text-gray-600 mb-1'>
                    VP of a Big Company
                  </p>
                  <div className='flex items-center gap-1 text-xs text-gray-500'>
                    <span>3w</span>
                    <span>•</span>
                    <div className='w-3 h-3 rounded-full bg-gray-400 flex items-center justify-center'>
                      <div className='w-1.5 h-1.5 bg-white rounded-full'></div>
                    </div>
                  </div>
                </div>
                <button className='text-gray-400 hover:text-gray-600'>
                  <svg
                    className='w-5 h-5'
                    fill='currentColor'
                    viewBox='0 0 20 20'
                  >
                    <path d='M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z' />
                  </svg>
                </button>
              </div>

              <p className='text-gray-900 text-sm mb-4 leading-relaxed'>
                {image
                  ? "Just analyzed this site and wow - they've nailed their SEO game! Proper OpenGraph images, social media tags, the works. This is exactly how you optimize for social sharing. 💯"
                  : "Found this interesting site, but they're missing a huge opportunity. No social media images or proper OpenGraph tags - they could get so much more engagement with better SEO setup!"}
              </p>

              <div className='border border-gray-200 rounded-lg overflow-hidden'>
                <div className='flex'>
                  {image && (
                    <div className='w-24 h-16 bg-gray-100 flex-shrink-0'>
                      <Image
                        src={image}
                        alt='LinkedIn preview'
                        width={96}
                        height={64}
                        className='w-full h-full object-cover'
                        unoptimized
                      />
                    </div>
                  )}
                  <div className='flex-1 p-3 min-w-0'>
                    <h4 className='text-gray-900 text-sm font-medium mb-1 line-clamp-1'>
                      {title}
                    </h4>
                    <p className='text-gray-600 text-xs mb-1'>
                      {new URL(url).hostname}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      }

      // Telegram Instant View Style
      if (platform === 'telegram') {
        return (
          <div className='space-y-4'>
            <div className='inline-flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1.5 mb-0'>
              <TelegramLogo className='w-4 h-4 text-blue-500' weight='fill' />
              <span className='text-sm font-medium text-gray-700'>
                Telegram
              </span>
            </div>
            <div className='flex justify-end'>
              <div className='max-w-xs bg-blue-500 rounded-2xl p-3'>
                <div className='text-white text-xs underline mb-2'>{url}</div>
                <div className='bg-blue-400 rounded-lg p-3 mb-2'>
                  <div className='text-white text-sm mb-1'>
                    {new URL(url).hostname}
                  </div>
                  <h4 className='text-white text-base font-medium mb-2 line-clamp-2'>
                    {title}
                  </h4>
                  <p className='text-blue-100 text-sm line-clamp-3 mb-3'>
                    {description}
                  </p>
                  {image && (
                    <div className='w-full h-48 bg-gray-600 rounded-lg overflow-hidden'>
                      <Image
                        src={image}
                        alt='Telegram preview'
                        width={320}
                        height={192}
                        className='w-full h-full object-cover'
                        unoptimized
                      />
                    </div>
                  )}
                </div>
                <div className='flex items-center justify-end'>
                  <span className='text-xs text-white'>4:20 PM</span>
                </div>
              </div>
            </div>
          </div>
        )
      }

      // Facebook Post Style
      if (platform === 'facebook') {
        return (
          <div className='space-y-4'>
            <div className='inline-flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1.5 mb-0'>
              <FacebookLogo className='w-4 h-4 text-blue-600' weight='fill' />
              <span className='text-sm font-medium text-gray-700'>
                Facebook
              </span>
            </div>
            <div className='bg-white border border-gray-200 rounded-lg p-4'>
              <div className='flex items-start gap-3 mb-3'>
                <Image
                  src='/markzuck.png'
                  alt='avatar'
                  width={40}
                  height={40}
                  className='w-10 h-10 object-cover rounded-full'
                  unoptimized
                />
                <div className='flex-1'>
                  <div className='flex items-center gap-2 mb-1'>
                    <h3 className='font-semibold text-gray-900'>
                      Mark Zuckerberg
                    </h3>
                    <div className='w-4 h-4 text-blue-500'>
                      <svg fill='currentColor' viewBox='0 0 20 20'>
                        <path
                          fillRule='evenodd'
                          d='M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                          clipRule='evenodd'
                        />
                      </svg>
                    </div>
                  </div>
                  <div className='flex items-center gap-1 text-xs text-gray-500'>
                    <span>Just Now</span>
                    <span>•</span>
                    <div className='w-3 h-3'>
                      <svg fill='currentColor' viewBox='0 0 20 20'>
                        <path d='M10 12a2 2 0 100-4 2 2 0 000 4z' />
                        <path
                          fillRule='evenodd'
                          d='M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z'
                          clipRule='evenodd'
                        />
                      </svg>
                    </div>
                  </div>
                </div>
                <button className='text-gray-400 hover:text-gray-600'>
                  <svg
                    className='w-5 h-5'
                    fill='currentColor'
                    viewBox='0 0 20 20'
                  >
                    <path d='M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z' />
                  </svg>
                </button>
              </div>

              <div className='text-gray-900 text-sm mb-3 leading-relaxed'>
                {image
                  ? 'Interesting site with solid social media fundamentals. Good OpenGraph implementation - this is what proper web development looks like. Meta approves! 👍'
                  : 'Checked out this site - potential is there but missing key social media optimization. No OpenGraph images means poor sharing experience. Room for improvement.'}
              </div>

              <div className='text-blue-600 text-sm mb-3 hover:underline cursor-pointer'>
                {url}
              </div>

              <div className='border border-gray-200 rounded-lg overflow-hidden'>
                {image && (
                  <div className='aspect-[1.91/1] bg-gray-100'>
                    <Image
                      src={image}
                      alt='Facebook preview'
                      width={400}
                      height={209}
                      className='w-full h-full object-cover'
                      unoptimized
                    />
                  </div>
                )}
                <div className='p-4 bg-gray-50'>
                  <div className='text-gray-500 text-xs mb-1 uppercase'>
                    {new URL(url).hostname}
                  </div>
                  <h4 className='font-semibold text-gray-900 text-base mb-2 line-clamp-2'>
                    {title}
                  </h4>
                  <p className='text-gray-600 text-sm line-clamp-2'>
                    {description}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )
      }

      // Twitter/X Card Style
      return (
        <div className='space-y-4'>
          <div className='inline-flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1.5 mb-0'>
            <XLogo className='w-4 h-4 text-gray-900' weight='fill' />
            <span className='text-sm font-medium text-gray-700'>Twitter/X</span>
          </div>
          <div className='bg-black text-white rounded-2xl p-4 max-w-lg'>
            <div className='flex items-start gap-3 mb-3'>
              <div className='w-10 h-10 bg-gray-600 rounded-full overflow-hidden'>
                <Image
                  src='/NATKmh45_400x400.jpg'
                  alt='Elon Musk'
                  width={40}
                  height={40}
                  className='w-full h-full object-cover'
                  unoptimized
                />
              </div>
              <div className='flex-1'>
                <div className='flex items-center gap-2 mb-1'>
                  <h3 className='font-bold text-white'>Elon Musk</h3>
                  <div className='w-5 h-5 text-blue-400'>
                    <svg fill='currentColor' viewBox='0 0 20 20'>
                      <path
                        fillRule='evenodd'
                        d='M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                        clipRule='evenodd'
                      />
                    </svg>
                  </div>
                  <span className='text-gray-500'>@elonmusk</span>
                  <span className='text-gray-500'>•</span>
                  <span className='text-gray-500'>3h</span>
                </div>
              </div>
            </div>

            <div className='text-white text-base mb-3'>
              {twitterCard.image
                ? 'Finally! A site that actually has proper Twitter Card images. Most devs are too lazy to implement this correctly. Respect. 🚀'
                : openGraph.image
                ? "No dedicated Twitter image but at least you have OpenGraph. It'll inherit, but dedicated twitter:image tags are always better. Acceptable. ✅"
                : `No Twitter Card image AND no OpenGraph image? Seriously? It's ${new Date().getFullYear()}. Fix your meta tags. This is embarrassing.`}
            </div>

            <div className='border border-gray-700 rounded-2xl overflow-hidden'>
              {image && (
                <div className='aspect-[1.91/1] bg-gray-800'>
                  <Image
                    src={image}
                    alt='Twitter preview'
                    width={400}
                    height={209}
                    className='w-full h-full object-cover'
                    unoptimized
                  />
                </div>
              )}
              <div className='p-4'>
                <div className='text-gray-400 text-sm mb-1'>
                  From {new URL(url).hostname}
                </div>
                <h4 className='font-normal text-white text-base mb-2 line-clamp-2'>
                  {title}
                </h4>
                <p className='text-gray-400 text-sm line-clamp-2'>
                  {description}
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return <SocialCard />
  }

  return (
    <div className='w-full space-y-10'>
      {/* Header */}
      <div className='flex items-center justify-end'>
        <div className='flex items-center gap-3'>
          <div className='flex items-center gap-2'>
            <Search className='h-4 w-4 text-blue-600' />
            <FacebookLogo className='h-4 w-4 text-blue-600' weight='fill' />
            <XLogo
              className='h-4 w-4 text-gray-900 dark:text-gray-100'
              weight='fill'
            />
            <DiscordLogo className='h-4 w-4 text-indigo-500' weight='fill' />
            <WhatsappLogo className='h-4 w-4 text-green-500' weight='fill' />
            <LinkedinLogo className='h-4 w-4 text-blue-700' weight='fill' />
            <TelegramLogo className='h-4 w-4 text-blue-500' weight='fill' />
          </div>
          <div className='text-right'>
            <div
              className={`text-2xl font-bold ${
                socialScore.percentage >= 75
                  ? 'text-emerald-600'
                  : socialScore.percentage >= 50
                  ? 'text-amber-600'
                  : 'text-red-600'
              }`}
            >
              {socialScore.percentage}%
            </div>
            <div className='text-sm text-gray-500'>
              {socialScore.score}/{socialScore.maxScore} dedicated tags
            </div>
          </div>
        </div>
      </div>

      <div className='space-y-10 max-w-2xl mx-auto'>
        <SocialPreviewCard platform='google' />
        <SocialPreviewCard platform='facebook' />
        <SocialPreviewCard platform='twitter' />
        <SocialPreviewCard platform='discord' />
        <SocialPreviewCard platform='whatsapp' />
        <SocialPreviewCard platform='linkedin' />
        <SocialPreviewCard platform='telegram' />
      </div>

      {/* OpenGraph Section */}
      <div className='space-y-3'>
        <h3 className='text-lg font-semibold text-foreground mb-4'>OpenGraph Tags</h3>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
          <SimpleListItem
            icon='📖'
            label='OpenGraph Title'
            value={openGraph.title || seo.title}
            status={
              openGraph.title ? 'present' : seo.title ? 'inherited' : 'missing'
            }
          />

          <SimpleListItem
            icon='📝'
            label='OpenGraph Description'
            value={openGraph.description || seo.description}
            status={
              openGraph.description
                ? 'present'
                : seo.description
                ? 'inherited'
                : 'missing'
            }
          />

          <SimpleListItem
            icon='🖼️'
            label='OpenGraph Image'
            value={openGraph.image}
            status={openGraph.image ? 'present' : 'missing'}
          />
        </div>
      </div>

      {/* Twitter Section */}
      <div className='space-y-3'>
        <h3 className='text-lg font-semibold text-foreground mb-4'>Twitter Card Tags</h3>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
          <SimpleListItem
            icon='🐦'
            label='Twitter Card'
            value={twitterCard.card ? `${twitterCard.card} card` : undefined}
            status={twitterCard.card ? 'present' : 'missing'}
          />

          <SimpleListItem
            icon='🐦'
            label='Twitter Title'
            value={twitterCard.title || openGraph.title || seo.title}
            status={
              twitterCard.title
                ? 'present'
                : openGraph.title || seo.title
                ? 'inherited'
                : 'missing'
            }
          />

          <SimpleListItem
            icon='🐦'
            label='Twitter Description'
            value={
              twitterCard.description || openGraph.description || seo.description
            }
            status={
              twitterCard.description
                ? 'present'
                : openGraph.description || seo.description
                ? 'inherited'
                : 'missing'
            }
          />

          <SimpleListItem
            icon='🖼️'
            label='Twitter Image'
            value={twitterCard.image || openGraph.image}
            status={
              twitterCard.image
                ? 'present'
                : openGraph.image
                ? 'inherited'
                : 'missing'
            }
          />
        </div>
      </div>
    </div>
  )
}
