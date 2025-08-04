
'use client'

import React from 'react'
import { WebsiteMetadata } from '@/types/metadata'
import { Badge } from '@/components/ui/badge'
import { Copy, CheckCircle, AlertTriangle, XCircle, Languages, Smartphone, Bot, FileText, User } from 'lucide-react'
import { toast } from 'sonner'

interface SEOSectionProps {
  metadata: WebsiteMetadata
}

export default function SEOSection({ metadata }: SEOSectionProps) {
  const { seo } = metadata

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(`${label} copied to clipboard`)
    } catch (err) {
      toast.error(`Failed to copy ${label}`)
    }
  }

  const getSEOScore = () => {
    let score = 0
    const maxScore = 5 // Title, Description, Canonical, Language, Viewport
    if (seo.title && seo.title.length >= 30 && seo.title.length <= 60) score += 1
    if (seo.description && seo.description.length >= 120 && seo.description.length <= 160) score += 1
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
    if (percentage >= 80) return <CheckCircle className="h-6 w-6 text-green-500" />
    if (percentage >= 50) return <AlertTriangle className="h-6 w-6 text-yellow-500" />
    return <XCircle className="h-6 w-6 text-red-500" />
  }

  const getElementStatus = (label: string, value?: string) => {
    // Use blue for "Present" status instead of orange
    const presentClasses = "border-blue-200 text-blue-700 bg-blue-100 dark:border-blue-800/70 dark:text-blue-300 dark:bg-blue-900/50";
    
    if (!value) {
      return { badge: 'Missing', badgeClass: "border-red-200 text-red-700 bg-red-100 dark:border-red-800/70 dark:text-red-300 dark:bg-red-900/50" };
    }

    if (label === 'Title') {
      if (value.length >= 30 && value.length <= 60) return { badge: 'Perfect', badgeClass: "border-green-200 text-green-700 bg-green-100 dark:border-green-800/70 dark:text-green-300 dark:bg-green-900/50" };
      if (value.length < 30) return { badge: 'Too Short', badgeClass: "border-amber-200 text-amber-700 bg-amber-100 dark:border-amber-800/70 dark:text-amber-300 dark:bg-amber-900/50" };
      return { badge: 'Too Long', badgeClass: "border-amber-200 text-amber-700 bg-amber-100 dark:border-amber-800/70 dark:text-amber-300 dark:bg-amber-900/50" };
    }
    if (label === 'Description') {
      if (value.length >= 120 && value.length <= 160) return { badge: 'Perfect', badgeClass: "border-green-200 text-green-700 bg-green-100 dark:border-green-800/70 dark:text-green-300 dark:bg-green-900/50" };
      if (value.length < 120) return { badge: 'Too Short', badgeClass: "border-amber-200 text-amber-700 bg-amber-100 dark:border-amber-800/70 dark:text-amber-300 dark:bg-amber-900/50" };
      return { badge: 'Too Long', badgeClass: "border-amber-200 text-amber-700 bg-amber-100 dark:border-amber-800/70 dark:text-amber-300 dark:bg-amber-900/50" };
    }
    return { badge: 'Present', badgeClass: presentClasses };
  }

  const seoScore = getSEOScore()

  // Define CompactMetadataItem component first
  function CompactMetadataItem({ label, value, isGood, icon: Icon, optimalRange }: {
    label: string
    value?: string
    isGood: boolean
    icon: React.ElementType
    optimalRange?: string
  }) {
    const status = getElementStatus(label, value)
    return (
      <div className="p-4 bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Icon className={`h-4 w-4 shrink-0 ${isGood ? 'text-green-600' : 'text-red-500'}`} />
            <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{label}</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={`text-xs ${status.badgeClass}`}>
              {status.badge}
            </Badge>
            {value && (
              <button
                onClick={() => copyToClipboard(value, label)}
                className="p-1 text-orange-600 hover:text-orange-700 hover:bg-orange-100/60 rounded opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Copy className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
        
        <div className="mb-3">
          {value ? (
            <p className="text-sm text-gray-700 dark:text-gray-300 font-medium break-all">{value}</p>
          ) : (
            <p className="text-sm text-red-600 dark:text-red-400 font-semibold">Not set - {optimalRange ? `Add ${optimalRange}` : 'Recommended to add'}</p>
          )}
        </div>

        {/* Character count and optimal range for Title and Description */}
        {(label === 'Title' || label === 'Description') && (
          <div className="text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-700">
            {value && (
              <div className="flex items-center justify-between mb-1">
                <span>Current length: <span className={`font-bold ${
                  label === 'Title' 
                    ? (value.length >= 30 && value.length <= 60 ? 'text-green-600' : 'text-amber-600')
                    : (value.length >= 120 && value.length <= 160 ? 'text-green-600' : 'text-amber-600')
                }`}>{value.length} chars</span></span>
              </div>
            )}
            {optimalRange && <p className="font-medium">Optimal range: {optimalRange}</p>}
          </div>
        )}
      </div>
    )
  }

  // Get critical recommendations
  const getCriticalRecommendations = () => {
    const recommendations = []
    if (!seo.title) recommendations.push({ type: 'critical', text: 'Add a descriptive title (30-60 chars)' })
    else if (seo.title.length < 30) recommendations.push({ type: 'warning', text: 'Title too short - expand for better SEO' })
    else if (seo.title.length > 60) recommendations.push({ type: 'warning', text: 'Title too long - may be truncated' })
    
    if (!seo.description) recommendations.push({ type: 'critical', text: 'Add a meta description (120-160 chars)' })
    else if (seo.description.length < 120) recommendations.push({ type: 'warning', text: 'Description too short - add more detail' })
    else if (seo.description.length > 160) recommendations.push({ type: 'warning', text: 'Description too long - may be truncated' })
    
    if (!seo.canonical) recommendations.push({ type: 'warning', text: 'Add canonical URL to prevent duplicate content' })
    if (!seo.viewport) recommendations.push({ type: 'critical', text: 'Add viewport meta tag for mobile support' })
    
    return recommendations
  }

  const recommendations = getCriticalRecommendations()
  const hasGoodTitle = seo.title && seo.title.length >= 30 && seo.title.length <= 60
  const hasGoodDescription = seo.description && seo.description.length >= 120 && seo.description.length <= 160

  return (
    <div className="space-y-8">
      {/* SEO Elements */}
      <div>
        <div className="flex items-center justify-end mb-6">
          <div className="flex items-center gap-2">
            {getScoreIcon(seoScore.percentage)}
            <span className={`text-sm font-bold ${getScoreColor(seoScore.percentage)}`}>
              {seoScore.percentage}% ({seoScore.score}/{seoScore.maxScore})
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 group">
          <CompactMetadataItem 
            label="Title" 
            value={seo.title} 
            isGood={hasGoodTitle} 
            icon={FileText} 
            optimalRange="30-60 chars"
          />
          <CompactMetadataItem 
            label="Description" 
            value={seo.description} 
            isGood={hasGoodDescription} 
            icon={FileText} 
            optimalRange="120-160 chars"
          />
          <CompactMetadataItem 
            label="Canonical URL" 
            value={seo.canonical} 
            isGood={!!seo.canonical} 
            icon={FileText} 
            optimalRange="canonical URL to prevent duplicate content"
          />
          <CompactMetadataItem 
            label="Keywords" 
            value={seo.keywords} 
            isGood={!!seo.keywords} 
            icon={FileText} 
            optimalRange="relevant keywords for content"
          />
          <CompactMetadataItem 
            label="Language" 
            value={seo.language} 
            isGood={!!seo.language} 
            icon={Languages} 
            optimalRange="language attribute for accessibility"
          />
          <CompactMetadataItem 
            label="Viewport" 
            value={seo.viewport} 
            isGood={!!seo.viewport} 
            icon={Smartphone} 
            optimalRange="viewport meta tag for mobile"
          />
          <CompactMetadataItem 
            label="Robots" 
            value={seo.robots} 
            isGood={!!seo.robots} 
            icon={Bot} 
            optimalRange="crawling instructions for search engines"
          />
          <CompactMetadataItem 
            label="Author" 
            value={seo.author} 
            isGood={!!seo.author} 
            icon={User} 
            optimalRange="author information for content"
          />
        </div>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">SEO Recommendations</h3>
          <div className="space-y-3">
            {recommendations.map((rec, index) => (
              <div key={index} className={`flex items-start gap-3 p-3 rounded-lg ${
                rec.type === 'critical' 
                  ? 'bg-red-50/80 border border-red-200/60 dark:bg-red-950/20 dark:border-red-800/40'
                  : 'bg-yellow-50/80 border border-yellow-200/60 dark:bg-yellow-950/20 dark:border-yellow-800/40'
              }`}>
                {rec.type === 'critical' ? (
                  <XCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
                )}
                <p className={`text-sm font-medium ${
                  rec.type === 'critical' 
                    ? 'text-red-700 dark:text-red-300'
                    : 'text-yellow-700 dark:text-yellow-300'
                }`}>{rec.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
