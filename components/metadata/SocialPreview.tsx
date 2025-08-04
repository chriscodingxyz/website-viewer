'use client'

import React from 'react'
import { WebsiteMetadata } from '@/types/metadata'
import { Badge } from '@/components/ui/badge'

interface SocialPreviewProps {
  metadata: WebsiteMetadata
}

export default function SocialPreview({ metadata }: SocialPreviewProps) {
  const { openGraph, twitterCard, seo } = metadata

  const SimpleListItem = ({ icon, label, value, status }: {
    icon: string
    label: string
    value?: string
    status: 'present' | 'missing' | 'inherited'
  }) => {
    const iconEmoji = status === 'present' ? '✅' : status === 'inherited' ? '⚠️' : '❌'
    const badgeClass = status === 'present' 
      ? 'bg-green-50 text-green-700 border-green-300' 
      : status === 'inherited'
      ? 'bg-yellow-50 text-yellow-700 border-yellow-300'
      : 'bg-red-50 text-red-700 border-red-300'
    
    const statusText = status === 'present' ? 'Set' : status === 'inherited' ? 'From SEO' : 'Missing'
    
    return (
      <div className="py-2 text-sm border-b border-gray-100 dark:border-gray-800 last:border-b-0">
        <div className="flex items-start gap-3">
          <span className="text-base mt-0.5">{iconEmoji}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium text-gray-900 dark:text-gray-100">{label}</span>
              <Badge variant="outline" className={`text-xs shrink-0 ${badgeClass}`}>
                {statusText}
              </Badge>
            </div>
            
            {value ? (
              <div className="space-y-1">
                <p className="text-gray-700 dark:text-gray-300 break-words">
                  "{value}"
                </p>
                {status === 'inherited' && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Using SEO {label.toLowerCase()} as fallback
                  </p>
                )}
              </div>
            ) : (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Add {label.toLowerCase()} for better social media sharing
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }

  const getSocialScore = () => {
    let score = 0
    const maxScore = 4
    if (openGraph.title) score += 1
    if (openGraph.description) score += 1
    if (openGraph.image) score += 1
    if (twitterCard.card) score += 1
    return { score, maxScore, percentage: Math.round((score / maxScore) * 100) }
  }

  const socialScore = getSocialScore()

  const SocialPreviewCard = ({ platform }: { platform: 'facebook' | 'twitter' }) => {
    const isTwitter = platform === 'twitter'
    const title = (isTwitter ? twitterCard.title : openGraph.title) || seo.title || 'No Title'
    const description = (isTwitter ? twitterCard.description : openGraph.description) || seo.description || 'No Description'
    const image = (isTwitter ? twitterCard.image : openGraph.image) || '/placeholder-social.jpg'
    
    return (
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-900">
        <div className="aspect-[1.91/1] bg-gray-100 dark:bg-gray-800 relative overflow-hidden">
          {(openGraph.image || twitterCard.image) ? (
            <img 
              src={image} 
              alt="Social preview" 
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDQwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNzUgNzVIMjI1VjEyNUgxNzVWNzVaIiBzdHJva2U9IiM5Q0EzQUYiIHN0cm9rZS13aWR0aD0iMiIgZmlsbD0ibm9uZSIvPgo8cGF0aCBkPSJtMTg3IDk3IDEwIDEwIDEwLTEwIiBzdHJva2U9IiM5Q0EzQUYiIHN0cm9rZS13aWR0aD0iMiIgZmlsbD0ibm9uZSIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8L3N2Zz4K'
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <span className="text-6xl">🖼️</span>
            </div>
          )}
        </div>
        <div className="p-3">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">
            {isTwitter ? 'Twitter Card' : 'Facebook/LinkedIn'}
          </div>
          <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm mb-1 line-clamp-2">
            {title}
          </h4>
          <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
            {description}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Social Media ({socialScore.percentage}%)</h3>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-bold ${
            socialScore.percentage >= 75 ? 'text-green-600' : 
            socialScore.percentage >= 50 ? 'text-yellow-600' : 'text-red-600'
          }`}>
            {socialScore.score}/{socialScore.maxScore}
          </span>
        </div>
      </div>
      
      {/* Social Preview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <SocialPreviewCard platform="facebook" />
        <SocialPreviewCard platform="twitter" />
      </div>
      
      {/* Detailed Meta Data */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <SimpleListItem
          icon="📖"
          label="OpenGraph Title"
          value={openGraph.title}
          status={openGraph.title ? 'present' : seo.title ? 'inherited' : 'missing'}
        />
        
        <SimpleListItem
          icon="📝"
          label="OpenGraph Description"
          value={openGraph.description}
          status={openGraph.description ? 'present' : seo.description ? 'inherited' : 'missing'}
        />
        
        <SimpleListItem
          icon="🖼️"
          label="OpenGraph Image"
          value={openGraph.image}
          status={openGraph.image ? 'present' : 'missing'}
        />
        
        <SimpleListItem
          icon="🐦"
          label="Twitter Card"
          value={twitterCard.card ? `${twitterCard.card} card` : undefined}
          status={twitterCard.card ? 'present' : 'missing'}
        />
        
        {twitterCard.title && (
          <SimpleListItem
            icon="🐦"
            label="Twitter Title"
            value={twitterCard.title}
            status="present"
          />
        )}
        
        {twitterCard.description && (
          <SimpleListItem
            icon="🐦"
            label="Twitter Description"
            value={twitterCard.description}
            status="present"
          />
        )}
      </div>
    </div>
  )
}