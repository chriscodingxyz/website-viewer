'use client'

import React from 'react'
import { WebsiteMetadata } from '@/types/metadata'
import { Button } from '@/components/ui/button'
import { Copy } from 'lucide-react'
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

  const SocialCard = ({ platform }: { platform: 'facebook' | 'twitter' }) => {
    const isTwitter = platform === 'twitter'
    const title = (isTwitter ? twitterCard.title : openGraph.title) || seo.title || 'No Title Provided'
    const description = (isTwitter ? twitterCard.description : openGraph.description) || seo.description || 'No Description Provided'
    const image = isTwitter ? twitterCard.image : openGraph.image
    const domain = new URL(metadata.url).hostname
    const cardType = twitterCard.card || 'summary'

    return (
      <div className={`border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800 max-w-md mx-auto`}>
        {image && (cardType === 'summary_large_image' || !isTwitter) && (
          <div className="relative w-full h-48 bg-gray-100 dark:bg-gray-700">
            <Image src={image} alt={title} fill className="object-cover" onError={(e) => e.currentTarget.style.display = 'none'} />
          </div>
        )}
        <div className="p-3">
          <div className="flex gap-3">
            {image && cardType === 'summary' && isTwitter && (
              <div className="relative w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-md shrink-0">
                <Image src={image} alt={title} fill className="object-cover rounded-md" onError={(e) => e.currentTarget.style.display = 'none'} />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase mb-1">{domain}</p>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 mb-1">{title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3">{description}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const MetadataGrid = ({ data }: { data: { label: string; value?: string }[] }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
      {data.map(({ label, value }) => (
        value && (
          <div key={label} className="flex items-center justify-between p-3 bg-orange-50/50 dark:bg-orange-950/30 border border-orange-100 dark:border-orange-900/50 rounded-lg">
            <div className="flex-1 min-w-0">
              <span className="text-xs font-mono text-orange-600 dark:text-orange-400 font-medium">{label}</span>
              <p className="text-sm break-all text-gray-700 dark:text-gray-300 font-medium mt-1">{value}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => copyToClipboard(value, label)} className="shrink-0 h-6 w-6 p-0 hover:bg-orange-100/60 text-orange-600 hover:text-orange-700">
              <Copy className="h-3 w-3" />
            </Button>
          </div>
        )
      ))}
    </div>
  )

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Facebook / Open Graph */}
      <div className="bg-white/50 dark:bg-gray-900/30 backdrop-blur-sm border border-orange-200/60 dark:border-orange-800/40 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <FacebookLogo className="h-5 w-5 text-blue-600" weight="fill" />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Facebook Preview</h3>
        </div>
        <SocialCard platform="facebook" />
        <div className="mt-3 text-xs text-gray-600 dark:text-gray-400 flex items-center gap-2 p-3 bg-orange-50/50 dark:bg-orange-950/30 border border-orange-100 dark:border-orange-900/50 rounded-lg">
            <LinkedinLogo className="h-4 w-4 text-blue-700" weight="fill" />
            <span>LinkedIn previews also use this Open Graph data.</span>
        </div>
        <MetadataGrid data={[
          { label: 'og:title', value: openGraph.title },
          { label: 'og:description', value: openGraph.description },
          { label: 'og:image', value: openGraph.image },
          { label: 'og:url', value: openGraph.url },
          { label: 'og:type', value: openGraph.type },
          { label: 'og:site_name', value: openGraph.siteName },
        ]} />
      </div>

      {/* Twitter */}
      <div className="bg-white/50 dark:bg-gray-900/30 backdrop-blur-sm border border-orange-200/60 dark:border-orange-800/40 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <TwitterLogo className="h-5 w-5 text-sky-500" weight="fill" />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Twitter Preview</h3>
        </div>
        <SocialCard platform="twitter" />
        <MetadataGrid data={[
          { label: 'twitter:card', value: twitterCard.card },
          { label: 'twitter:title', value: twitterCard.title },
          { label: 'twitter:description', value: twitterCard.description },
          { label: 'twitter:image', value: twitterCard.image },
          { label: 'twitter:site', value: twitterCard.site },
          { label: 'twitter:creator', value: twitterCard.creator },
        ]} />
      </div>
    </div>
  )
}