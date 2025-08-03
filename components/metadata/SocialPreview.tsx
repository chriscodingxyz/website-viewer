'use client'

import React from 'react'
import { WebsiteMetadata } from '@/types/metadata'
import { Button } from '@/components/ui/button'
import { Copy, ExternalLink } from 'lucide-react'
import { FacebookLogo, TwitterLogo, LinkedinLogo } from '@phosphor-icons/react'
import { toast } from 'sonner'
import Image from 'next/image'

interface SocialPreviewProps {
  metadata: WebsiteMetadata
}

export default function SocialPreview({ metadata }: SocialPreviewProps) {
  const { openGraph, twitterCard, seo } = metadata

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(`${label} copied to clipboard`)
    } catch (err) {
      toast.error(`Failed to copy ${label}`)
    }
  }

  // Facebook/LinkedIn Preview (uses Open Graph)
  const FacebookPreview = () => {
    const title = openGraph.title || seo.title || 'No title'
    const description = openGraph.description || seo.description || 'No description'
    const image = openGraph.image
    const domain = new URL(metadata.url).hostname

    return (
      <div className="bg-white/50 backdrop-blur-sm border border-orange-200/60 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <FacebookLogo className="h-5 w-5 text-blue-600" weight="fill" />
          <h3 className="text-lg font-semibold text-gray-800">Facebook Preview</h3>
        </div>
        <div>
          <div className="border rounded-lg overflow-hidden bg-white max-w-lg">
            {image && (
              <div className="relative w-full h-48 bg-gray-100">
                <Image
                  src={image}
                  alt={openGraph.imageAlt || 'Open Graph image'}
                  fill
                  className="object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              </div>
            )}
            <div className="p-3">
              <p className="text-xs text-gray-500 uppercase mb-1">{domain}</p>
              <h3 className="font-semibold text-gray-900 line-clamp-2 mb-1">
                {title}
              </h3>
              <p className="text-sm text-gray-600 line-clamp-3">
                {description}
              </p>
            </div>
          </div>
          
          {/* Open Graph metadata */}
          <div className="mt-6 space-y-4">
            <h4 className="font-semibold text-gray-800 text-base">Open Graph Data</h4>
            {[
              { label: 'og:title', value: openGraph.title },
              { label: 'og:description', value: openGraph.description },
              { label: 'og:image', value: openGraph.image },
              { label: 'og:url', value: openGraph.url },
              { label: 'og:type', value: openGraph.type },
              { label: 'og:site_name', value: openGraph.siteName }
            ].map(({ label, value }) => (
              value && (
                <div key={label} className="flex items-center justify-between p-4 bg-orange-50/50 border border-orange-100 rounded-xl">
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-mono text-orange-600 font-medium">{label}</span>
                    <p className="text-sm break-all text-gray-700 font-medium mt-1">{value}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(value, label)}
                    className="shrink-0 h-7 w-7 p-0 hover:bg-orange-100/60 text-orange-600 hover:text-orange-700"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              )
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Twitter Preview
  const TwitterPreview = () => {
    const title = twitterCard.title || openGraph.title || seo.title || 'No title'
    const description = twitterCard.description || openGraph.description || seo.description || 'No description'
    const image = twitterCard.image || openGraph.image
    const domain = new URL(metadata.url).hostname
    const cardType = twitterCard.card || 'summary'

    return (
      <div className="bg-white/50 backdrop-blur-sm border border-orange-200/60 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <TwitterLogo className="h-5 w-5 text-blue-400" weight="fill" />
          <h3 className="text-lg font-semibold text-gray-800">Twitter Preview</h3>
        </div>
        <div>
          <div className="border rounded-lg overflow-hidden bg-white max-w-lg">
            {image && cardType === 'summary_large_image' && (
              <div className="relative w-full h-48 bg-gray-100">
                <Image
                  src={image}
                  alt={twitterCard.imageAlt || 'Twitter card image'}
                  fill
                  className="object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              </div>
            )}
            <div className="p-3">
              <div className="flex gap-3">
                {image && cardType === 'summary' && (
                  <div className="relative w-16 h-16 bg-gray-100 rounded shrink-0">
                    <Image
                      src={image}
                      alt={twitterCard.imageAlt || 'Twitter card image'}
                      fill
                      className="object-cover rounded"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 mb-1">{domain}</p>
                  <h3 className="font-medium text-gray-900 line-clamp-2 mb-1 text-sm">
                    {title}
                  </h3>
                  <p className="text-xs text-gray-600 line-clamp-2">
                    {description}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Twitter Card metadata */}
          <div className="mt-6 space-y-4">
            <h4 className="font-semibold text-gray-800 text-base">Twitter Card Data</h4>
            {[
              { label: 'twitter:card', value: twitterCard.card },
              { label: 'twitter:title', value: twitterCard.title },
              { label: 'twitter:description', value: twitterCard.description },
              { label: 'twitter:image', value: twitterCard.image },
              { label: 'twitter:site', value: twitterCard.site },
              { label: 'twitter:creator', value: twitterCard.creator }
            ].map(({ label, value }) => (
              value && (
                <div key={label} className="flex items-center justify-between p-4 bg-orange-50/50 border border-orange-100 rounded-xl">
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-mono text-orange-600 font-medium">{label}</span>
                    <p className="text-sm break-all text-gray-700 font-medium mt-1">{value}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(value, label)}
                    className="shrink-0 h-7 w-7 p-0 hover:bg-orange-100/60 text-orange-600 hover:text-orange-700"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              )
            ))}
          </div>
        </div>
      </div>
    )
  }

  // LinkedIn Preview (same as Facebook/Open Graph)
  const LinkedInPreview = () => {
    const title = openGraph.title || seo.title || 'No title'
    const description = openGraph.description || seo.description || 'No description'
    const image = openGraph.image
    const domain = new URL(metadata.url).hostname

    return (
      <div className="bg-white/50 backdrop-blur-sm border border-orange-200/60 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <LinkedinLogo className="h-5 w-5 text-blue-700" weight="fill" />
          <h3 className="text-lg font-semibold text-gray-800">LinkedIn Preview</h3>
        </div>
        <div>
          <div className="border rounded-lg overflow-hidden bg-white max-w-lg">
            {image && (
              <div className="relative w-full h-48 bg-gray-100">
                <Image
                  src={image}
                  alt={openGraph.imageAlt || 'LinkedIn preview image'}
                  fill
                  className="object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              </div>
            )}
            <div className="p-3">
              <h3 className="font-semibold text-gray-900 line-clamp-2 mb-1">
                {title}
              </h3>
              <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                {description}
              </p>
              <p className="text-xs text-gray-500">{domain}</p>
            </div>
          </div>

          <div className="mt-6">
            <p className="text-sm text-gray-600 font-medium bg-orange-50/50 border border-orange-100 p-4 rounded-xl">
              LinkedIn uses Open Graph data for link previews.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <FacebookPreview />
      <TwitterPreview />
      <LinkedInPreview />
    </div>
  )
}