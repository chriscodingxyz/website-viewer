'use client'

import React, { useState } from 'react'
import { WebsiteMetadata } from '@/types/metadata'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, AlertTriangle, XCircle, Share2, ExternalLink, Eye } from 'lucide-react'
import { FacebookLogo, XLogo } from '@phosphor-icons/react'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog'

interface SocialPreviewProps {
  metadata?: WebsiteMetadata | null
}

export default function SocialPreview({ metadata }: SocialPreviewProps) {
  if (!metadata) {
    return (
      <div className="w-full">
        <div className="flex items-center gap-3 mb-8">
          <Share2 className="h-8 w-8 text-gray-600 dark:text-gray-400" />
          <h1 className="text-3xl font-bold">Social Media</h1>
        </div>
        <div className="text-center py-16 text-gray-500 dark:text-gray-400">
          <div className="text-xl">Loading social media data...</div>
        </div>
      </div>
    )
  }
  const { openGraph, twitterCard, seo } = metadata

  const SimpleListItem = ({ icon, label, value, status }: {
    icon: string
    label: string
    value?: string
    status: 'present' | 'missing' | 'inherited'
  }) => {
    const statusIcon = status === 'present' 
      ? <CheckCircle className="h-4 w-4" /> 
      : status === 'inherited'
      ? <AlertTriangle className="h-4 w-4" />
      : <XCircle className="h-4 w-4" />
    
    const badgeClass = status === 'present' 
      ? 'analysis-badge-success'
      : status === 'inherited'
      ? 'analysis-badge-warning'
      : 'analysis-badge-error'
    
    const statusText = status === 'present' ? 'Set' : status === 'inherited' ? 'Inherited' : 'Missing'
    
    return (
      <div className="analysis-list-item">
        <div className="flex items-start gap-4">
          <div className={`mt-0.5 ${status === 'present' ? 'text-emerald-600' : status === 'inherited' ? 'text-amber-600' : 'text-red-600'}`}>
            {statusIcon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-foreground analysis-text-sm">{label}</span>
              <div className={badgeClass}>
                {statusText}
              </div>
            </div>
            
            {value ? (
              <div className="space-y-2">
                <p className="text-muted-foreground analysis-text-sm leading-relaxed break-words">
                  {value}
                </p>
                {status === 'inherited' && (
                  <p className="analysis-text-xs text-muted-foreground pl-3 border-l-2 border-amber-200 border-l-amber-400">
                    📋 Inherited from SEO meta {label.toLowerCase().replace('opengraph ', '')} - consider adding dedicated social media tags
                  </p>
                )}
              </div>
            ) : (
              <p className="analysis-text-xs text-muted-foreground pl-3 border-l-2 border-border/40">
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
    const maxScore = 8 // OpenGraph (4) + Twitter (4)
    
    // OpenGraph scoring (proper social media tags)
    if (openGraph.title) score += 1
    if (openGraph.description) score += 1
    if (openGraph.image) score += 1
    if (openGraph.type) score += 1
    
    // Twitter Card scoring (dedicated Twitter tags, not inherited)
    if (twitterCard.card) score += 1
    if (twitterCard.title) score += 1  // Only count if explicitly set, not inherited
    if (twitterCard.description) score += 1  // Only count if explicitly set
    if (twitterCard.image) score += 1  // Twitter-specific image
    
    return { score, maxScore, percentage: Math.round((score / maxScore) * 100) }
  }

  const socialScore = getSocialScore()

  const SocialPreviewCard = ({ platform }: { platform: 'facebook' | 'twitter' }) => {
    const isTwitter = platform === 'twitter'
    const title = (isTwitter ? twitterCard.title : openGraph.title) || seo.title || 'No Title'
    const description = (isTwitter ? twitterCard.description : openGraph.description) || seo.description || 'No Description'
    const image = (isTwitter ? twitterCard.image : openGraph.image) || '/placeholder-social.jpg'
    
    const SocialCard = ({ isDialog = false }: { isDialog?: boolean }) => (
      <div className={`border border-border rounded-lg overflow-hidden bg-card ${
        isDialog ? 'shadow-none' : 'shadow-sm hover:shadow-md transition-shadow'
      } ${!isDialog ? 'cursor-pointer hover:border-border/80' : ''}`}>
        <div className={`${isDialog ? 'aspect-[2/1]' : 'aspect-[1.91/1]'} bg-muted/30 relative overflow-hidden`}>
          {(openGraph.image || twitterCard.image) ? (
            <div className="w-full h-full relative">
              <img 
                src={image} 
                alt="Social preview" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Hide the broken image and show emoji fallback
                  e.currentTarget.style.display = 'none'
                  const parent = e.currentTarget.parentElement
                  if (parent && !parent.querySelector('.fallback-emoji')) {
                    const fallback = document.createElement('div')
                    fallback.className = 'fallback-emoji absolute inset-0 flex items-center justify-center text-muted-foreground'
                    fallback.innerHTML = '<div class="text-center"><div class="text-4xl mb-2">🖼️</div><div class="text-xs">Image missing</div></div>'
                    parent.appendChild(fallback)
                  }
                }}
              />
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <div className="text-4xl mb-2">🖼️</div>
                <div className="text-xs">Image missing</div>
              </div>
            </div>
          )}
          {!isDialog && (
            <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
              <Eye className="h-6 w-6 text-white" />
            </div>
          )}
        </div>
        <div className={`${isDialog ? 'p-6' : 'p-4'} analysis-font`}>
          <div className="analysis-text-xs text-muted-foreground mb-2 uppercase tracking-wider font-medium">
            {isTwitter ? 'Twitter Card' : 'Facebook/LinkedIn'}
          </div>
          <h4 className={`font-semibold text-foreground ${isDialog ? 'text-base' : 'analysis-text-sm'} mb-2 ${isDialog ? '' : 'line-clamp-2'} leading-snug`}>
            {title}
          </h4>
          <p className={`${isDialog ? 'text-sm' : 'analysis-text-xs'} text-muted-foreground ${isDialog ? '' : 'line-clamp-2'} leading-relaxed`}>
            {description}
          </p>
          {isDialog && (
            <div className="mt-4 pt-4 border-t border-border/50">
              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">Title</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 rounded-md font-medium ${
                          title.length <= 60 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : 
                          'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                        }`}>
                          {title.length} chars
                        </span>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground pl-3 border-l-2 border-border/40">
                      <div className="flex justify-between">
                        <span>Current length:</span>
                        <span className="font-medium">{title.length} characters</span>
                      </div>
                      <div className="flex justify-between mt-1">
                        <span>Recommended:</span>
                        <span className="font-medium">{isTwitter ? '70 characters max' : '60 characters max'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">Description</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 rounded-md font-medium ${
                          description.length <= (isTwitter ? 200 : 155) ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : 
                          'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                        }`}>
                          {description.length} chars
                        </span>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground pl-3 border-l-2 border-border/40">
                      <div className="flex justify-between">
                        <span>Current length:</span>
                        <span className="font-medium">{description.length} characters</span>
                      </div>
                      <div className="flex justify-between mt-1">
                        <span>Recommended:</span>
                        <span className="font-medium">{isTwitter ? '200 characters max' : '155 characters max'}</span>
                      </div>
                    </div>
                  </div>

                  {image && image !== '/placeholder-social.jpg' && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground">Image</span>
                        <div className="analysis-badge-success">
                          Set
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground pl-3 border-l-2 border-border/40">
                        <div className="flex justify-between">
                          <span>URL:</span>
                          <span className="font-medium truncate ml-2 max-w-48">{image}</span>
                        </div>
                        <div className="flex justify-between mt-1">
                          <span>Recommended size:</span>
                          <span className="font-medium">{isTwitter ? '1200×628px' : '1200×630px'}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    )
    
    return (
      <Dialog>
        <DialogTrigger asChild>
          <div>
            <SocialCard />
          </div>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {isTwitter ? (
                <XLogo className="h-5 w-5 text-gray-900 dark:text-gray-100" weight="fill" />
              ) : (
                <FacebookLogo className="h-5 w-5 text-blue-600" weight="fill" />
              )}
              {isTwitter ? 'Twitter Card' : 'Facebook/LinkedIn'} Preview
            </DialogTitle>
          </DialogHeader>
          <SocialCard isDialog />
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <div className="w-full space-y-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Share2 className="h-8 w-8 text-gray-600 dark:text-gray-400" />
          <h1 className="text-3xl font-bold">Social Media</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <FacebookLogo className="h-5 w-5 text-blue-600" weight="fill" />
            <XLogo className="h-5 w-5 text-gray-900 dark:text-gray-100" weight="fill" />
          </div>
          <div className="text-right">
            <div className={`text-2xl font-bold ${
              socialScore.percentage >= 75 ? 'text-emerald-600' : 
              socialScore.percentage >= 50 ? 'text-amber-600' : 'text-red-600'
            }`}>
              {socialScore.percentage}%
            </div>
            <div className="text-sm text-gray-500">
              {socialScore.score}/{socialScore.maxScore} dedicated tags
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SocialPreviewCard platform="facebook" />
        <SocialPreviewCard platform="twitter" />
      </div>
      
      <div className="space-y-0 bg-card/30 rounded-lg border border-border/50 p-4">
        <SimpleListItem
          icon="📖"
          label="OpenGraph Title"
          value={openGraph.title || seo.title}
          status={openGraph.title ? 'present' : seo.title ? 'inherited' : 'missing'}
        />
        
        <SimpleListItem
          icon="📝"
          label="OpenGraph Description"
          value={openGraph.description || seo.description}
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
        
        <SimpleListItem
          icon="🐦"
          label="Twitter Title"
          value={twitterCard.title || openGraph.title || seo.title}
          status={twitterCard.title ? 'present' : (openGraph.title || seo.title) ? 'inherited' : 'missing'}
        />
        
        <SimpleListItem
          icon="🐦"
          label="Twitter Description"
          value={twitterCard.description || openGraph.description || seo.description}
          status={twitterCard.description ? 'present' : (openGraph.description || seo.description) ? 'inherited' : 'missing'}
        />
        
        <SimpleListItem
          icon="🖼️"
          label="Twitter Image"
          value={twitterCard.image || openGraph.image}
          status={twitterCard.image ? 'present' : openGraph.image ? 'inherited' : 'missing'}
        />
      </div>
    </div>
  )
}