
'use client'

import React from 'react'
import { WebsiteMetadata } from '@/types/metadata'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react'

interface SEOSectionProps {
  metadata: WebsiteMetadata
}

export default function SEOSection({ metadata }: SEOSectionProps) {
  const { seo } = metadata


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

  const SimpleListItem = ({ label, value, isGood, optimalRange }: {
    label: string
    value?: string
    isGood: boolean
    optimalRange?: string
  }) => {
    let icon = '❌'
    let statusText = ''
    let showDetails = false
    let badgeClass = 'bg-red-50 text-red-700 border-red-300'
    
    if (label === 'Title' && value) {
      if (value.length >= 30 && value.length <= 60) {
        icon = '✅'
        statusText = 'Good Length'
        badgeClass = 'bg-green-50 text-green-700 border-green-300'
      } else if ((value.length >= 25 && value.length < 30) || (value.length > 60 && value.length <= 70)) {
        icon = '⚠️'
        statusText = value.length < 30 ? 'Close to Optimal' : 'Slightly Long'
        badgeClass = 'bg-yellow-50 text-yellow-700 border-yellow-300'
      } else {
        icon = '❌'
        statusText = value.length < 25 ? 'Too Short' : 'Too Long'
        badgeClass = 'bg-red-50 text-red-700 border-red-300'
      }
      showDetails = true
    } else if (label === 'Description' && value) {
      if (value.length >= 120 && value.length <= 160) {
        icon = '✅'
        statusText = 'Good Length'
        badgeClass = 'bg-green-50 text-green-700 border-green-300'
      } else if ((value.length >= 100 && value.length < 120) || (value.length > 160 && value.length <= 180)) {
        icon = '⚠️'
        statusText = value.length < 120 ? 'Close to Optimal' : 'Slightly Long'
        badgeClass = 'bg-yellow-50 text-yellow-700 border-yellow-300'
      } else {
        icon = '❌'
        statusText = value.length < 100 ? 'Too Short' : 'Too Long'
        badgeClass = 'bg-red-50 text-red-700 border-red-300'
      }
      showDetails = true
    } else {
      icon = isGood ? '✅' : '❌'
      statusText = isGood ? 'Present' : 'Missing'
      badgeClass = isGood ? 'bg-green-50 text-green-700 border-green-300' : 'bg-red-50 text-red-700 border-red-300'
      showDetails = label === 'Keywords' // Show full keywords
    }
    
    return (
      <div className="py-2 text-sm border-b border-gray-100 dark:border-gray-800 last:border-b-0">
        <div className="flex items-start gap-3">
          <span className="text-base mt-0.5">{icon}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-gray-900 dark:text-gray-100">{label}</span>
              <Badge variant="outline" className={`text-xs shrink-0 ${badgeClass}`}>
                {statusText}
              </Badge>
            </div>
            
            {value ? (
              <div className="space-y-1">
                <p className="text-gray-700 dark:text-gray-300 break-words">
                  "{value}"
                </p>
                {showDetails && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 space-y-0.5">
                    {(label === 'Title' || label === 'Description') && (
                      <>
                        <div>Current length: <span className={`font-medium ${
                          isGood ? 'text-green-600' : 'text-amber-600'
                        }`}>{value.length} chars</span></div>
                        <div>Optimal range: <span className="font-medium">{optimalRange}</span></div>
                      </>
                    )}
                    {label === 'Keywords' && (
                      <div>Keywords help search engines understand your content</div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-1">
                <p className="text-red-600 dark:text-red-400">Not set</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{optimalRange || 'Recommended to add'}</p>
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
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">SEO Elements</h3>
        <div className="flex items-center gap-2">
          {getScoreIcon(seoScore.percentage)}
          <span className={`text-sm font-bold ${getScoreColor(seoScore.percentage)}`}>
            {seoScore.percentage}% ({seoScore.score}/{seoScore.maxScore})
          </span>
        </div>
      </div>
      
      {/* SEO Elements */}
      <div className="space-y-0 mb-6">
        <SimpleListItem 
            label="Title" 
            value={seo.title} 
            isGood={hasGoodTitle} 
            optimalRange="30-60 chars"
          />
          <SimpleListItem 
            label="Description" 
            value={seo.description} 
            isGood={hasGoodDescription} 
            optimalRange="120-160 chars"
          />
          <SimpleListItem 
            label="Canonical URL" 
            value={seo.canonical} 
            isGood={!!seo.canonical} 
            optimalRange="canonical URL to prevent duplicate content"
          />
          <SimpleListItem 
            label="Keywords" 
            value={seo.keywords} 
            isGood={!!seo.keywords} 
            optimalRange="relevant keywords for content"
          />
          <SimpleListItem 
            label="Language" 
            value={seo.language} 
            isGood={!!seo.language} 
            optimalRange="language attribute for accessibility"
          />
          <SimpleListItem 
            label="Viewport" 
            value={seo.viewport} 
            isGood={!!seo.viewport} 
            optimalRange="viewport meta tag for mobile support"
          />
          <SimpleListItem 
            label="Robots" 
            value={seo.robots} 
            isGood={!!seo.robots} 
            optimalRange="crawling instructions for search engines"
          />
          <SimpleListItem 
            label="Author" 
            value={seo.author} 
            isGood={!!seo.author} 
            optimalRange="author information for content"
        />
      </div>
      
      {/* SEO Recommendations */}
      {recommendations.length > 0 && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <div className="mb-3">
            <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200">SEO Recommendations</h4>
          </div>
          <div className="space-y-2">
            {recommendations.slice(0, 8).map((rec, index) => (
              <div key={index} className={`flex items-start gap-2 p-2 rounded text-xs ${
                rec.type === 'critical' 
                  ? 'bg-red-50/80 border border-red-200/60 dark:bg-red-950/20 dark:border-red-800/40'
                  : 'bg-yellow-50/80 border border-yellow-200/60 dark:bg-yellow-950/20 dark:border-yellow-800/40'
              }`}>
                {rec.type === 'critical' ? (
                  <XCircle className="h-3 w-3 text-red-500 mt-0.5 shrink-0" />
                ) : (
                  <AlertTriangle className="h-3 w-3 text-yellow-500 mt-0.5 shrink-0" />
                )}
                <p className={`font-medium ${
                  rec.type === 'critical' 
                    ? 'text-red-700 dark:text-red-300'
                    : 'text-yellow-700 dark:text-yellow-300'
                }`}>
                  {rec.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
