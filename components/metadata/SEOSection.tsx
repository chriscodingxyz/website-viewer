'use client'

import React from 'react'
import { WebsiteMetadata } from '@/types/metadata'
import { Button } from '@/components/ui/button'
import { Copy, CheckCircle, AlertTriangle, XCircle } from 'lucide-react'
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
    let maxScore = 7

    if (seo.title) score += 1
    if (seo.description) score += 1
    if (seo.title && seo.title.length >= 30 && seo.title.length <= 60) score += 1
    if (seo.description && seo.description.length >= 120 && seo.description.length <= 160) score += 1
    if (seo.canonical) score += 1
    if (seo.language) score += 1
    if (seo.viewport) score += 1

    return { score, maxScore, percentage: Math.round((score / maxScore) * 100) }
  }


  const getScoreIcon = (percentage: number) => {
    if (percentage >= 80) return <CheckCircle className="h-5 w-5 text-green-500" />
    if (percentage >= 60) return <AlertTriangle className="h-5 w-5 text-yellow-500" />
    return <XCircle className="h-5 w-5 text-red-500" />
  }

  // Enhanced status system for individual SEO elements
  const getElementStatus = (label: string, value?: string) => {
    if (!value) {
      // Determine severity of missing element
      const criticalElements = ['Title', 'Description', 'Language', 'Viewport']
      const isCritical = criticalElements.includes(label)
      
      return {
        status: 'missing',
        icon: <XCircle className="h-4 w-4 text-red-500" />,
        badge: isCritical ? 'CRITICAL: MISSING' : 'MISSING',
        color: 'red',
        bgClass: 'bg-red-50/80 border-red-200/60',
        textClass: 'text-red-700',
        badgeClass: isCritical ? 'bg-red-100 text-red-700 border-red-200' : 'bg-red-100 text-red-700 border-red-200'
      }
    }
    
    // Title length validation
    if (label === 'Title') {
      const length = value.length
      if (length >= 30 && length <= 60) {
        return {
          status: 'perfect',
          icon: <CheckCircle className="h-4 w-4 text-green-500" />,
          badge: 'PERFECT',
          color: 'green',
          bgClass: 'bg-green-50/80 border-green-200/60',
          textClass: 'text-green-700',
          badgeClass: 'bg-green-100 text-green-700 border-green-200'
        }
      } else if ((length >= 20 && length < 30) || (length > 60 && length <= 70)) {
        return {
          status: 'warning',
          icon: <AlertTriangle className="h-4 w-4 text-yellow-500" />,
          badge: length < 30 ? 'TOO SHORT' : 'TOO LONG',
          color: 'yellow',
          bgClass: 'bg-yellow-50/80 border-yellow-200/60',
          textClass: 'text-yellow-700',
          badgeClass: 'bg-yellow-100 text-yellow-700 border-yellow-200'
        }
      } else {
        return {
          status: 'critical',
          icon: <XCircle className="h-4 w-4 text-red-500" />,
          badge: length < 20 ? 'CRITICAL: TOO SHORT' : 'CRITICAL: TOO LONG',
          color: 'red',
          bgClass: 'bg-red-50/80 border-red-200/60',
          textClass: 'text-red-700',
          badgeClass: 'bg-red-100 text-red-700 border-red-200'
        }
      }
    }
    
    // Description length validation
    if (label === 'Description') {
      const length = value.length
      if (length >= 120 && length <= 160) {
        return {
          status: 'perfect',
          icon: <CheckCircle className="h-4 w-4 text-green-500" />,
          badge: 'PERFECT',
          color: 'green',
          bgClass: 'bg-green-50/80 border-green-200/60',
          textClass: 'text-green-700',
          badgeClass: 'bg-green-100 text-green-700 border-green-200'
        }
      } else if ((length >= 100 && length < 120) || (length > 160 && length <= 180)) {
        return {
          status: 'warning',
          icon: <AlertTriangle className="h-4 w-4 text-yellow-500" />,
          badge: length < 120 ? 'TOO SHORT' : 'TOO LONG',
          color: 'yellow',
          bgClass: 'bg-yellow-50/80 border-yellow-200/60',
          textClass: 'text-yellow-700',
          badgeClass: 'bg-yellow-100 text-yellow-700 border-yellow-200'
        }
      } else {
        return {
          status: 'critical',
          icon: <XCircle className="h-4 w-4 text-red-500" />,
          badge: length < 100 ? 'CRITICAL: TOO SHORT' : 'CRITICAL: TOO LONG',
          color: 'red',
          bgClass: 'bg-red-50/80 border-red-200/60',
          textClass: 'text-red-700',
          badgeClass: 'bg-red-100 text-red-700 border-red-200'
        }
      }
    }
    
    // Special handling for technical SEO elements
    if (label === 'Language' || label === 'Viewport') {
      // These are critical for SEO and accessibility
      return {
        status: 'perfect',
        icon: <CheckCircle className="h-4 w-4 text-green-500" />,
        badge: 'EXCELLENT',
        color: 'green',
        bgClass: 'bg-green-50/80 border-green-200/60',
        textClass: 'text-green-700',
        badgeClass: 'bg-green-100 text-green-700 border-green-200'
      }
    }
    
    if (label === 'Robots') {
      // Robots meta is important for indexing control
      return {
        status: 'perfect',
        icon: <CheckCircle className="h-4 w-4 text-green-500" />,
        badge: 'CONFIGURED',
        color: 'green',
        bgClass: 'bg-green-50/80 border-green-200/60',
        textClass: 'text-green-700',
        badgeClass: 'bg-green-100 text-green-700 border-green-200'
      }
    }
    
    if (label === 'Author') {
      // Author is optional, so it's good but not critical
      return {
        status: 'perfect',
        icon: <CheckCircle className="h-4 w-4 text-green-500" />,
        badge: 'GOOD',
        color: 'green',
        bgClass: 'bg-green-50/80 border-green-200/60',
        textClass: 'text-green-700',
        badgeClass: 'bg-green-100 text-green-700 border-green-200'
      }
    }
    
    // For other elements (Keywords, Canonical URL, etc.) - just present or missing
    return {
      status: 'perfect',
      icon: <CheckCircle className="h-4 w-4 text-green-500" />,
      badge: 'PRESENT',
      color: 'green',
      bgClass: 'bg-green-50/80 border-green-200/60',
      textClass: 'text-green-700',
      badgeClass: 'bg-green-100 text-green-700 border-green-200'
    }
  }

  const seoScore = getSEOScore()

  const MetadataRow = ({ 
    label, 
    value, 
    recommendation 
  }: { 
    label: string
    value?: string
    recommendation?: string 
  }) => {
    const status = getElementStatus(label, value)
    
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {status.icon}
            <span className="font-semibold text-gray-800 text-sm">{label}</span>
            <div className={`px-2 py-1 rounded-md text-xs font-bold border ${status.badgeClass}`}>
              {status.badge}
            </div>
          </div>
          {value && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(value, label)}
              className="h-7 w-7 p-0 hover:bg-orange-100/60 text-orange-600 hover:text-orange-700"
            >
              <Copy className="h-3 w-3" />
            </Button>
          )}
        </div>
        
        <div className={`p-4 rounded-xl border ${status.bgClass}`}>
          {value ? (
            <>
              <p className={`text-sm break-words font-medium ${status.textClass}`}>{value}</p>
              {(label === 'Title' || label === 'Description') && value.length > 0 && (
                <div className="mt-3 flex items-center gap-2">
                  <div className={`px-2 py-1 rounded-md text-xs font-bold ${status.badgeClass}`}>
                    {value.length} chars
                  </div>
                  <p className={`text-xs font-medium ${status.textClass}`}>
                    {label === 'Title' && 'Optimal: 30-60 characters'}
                    {label === 'Description' && 'Optimal: 120-160 characters'}
                  </p>
                </div>
              )}
            </>
          ) : (
            <>
              <p className={`text-sm font-bold ${status.textClass}`}>Missing {label}</p>
              {recommendation && (
                <p className={`text-xs mt-2 font-medium ${status.textClass}`}>{recommendation}</p>
              )}
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* SEO Score Card */}
      <div className="bg-white/50 backdrop-blur-sm border border-orange-200/60 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {getScoreIcon(seoScore.percentage)}
            <h3 className="text-lg font-semibold text-gray-800">SEO Score</h3>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-800">{seoScore.score}/{seoScore.maxScore}</div>
            <div className="text-sm text-orange-600 font-medium">{seoScore.percentage}%</div>
          </div>
        </div>
        
        <div className="w-full bg-orange-100/60 rounded-full h-3 mb-3">
          <div 
            className="h-3 rounded-full transition-all duration-500 bg-gradient-to-r from-orange-400 to-red-400"
            style={{ width: `${seoScore.percentage}%` }}
          />
        </div>
        <p className="text-sm text-gray-700 font-medium">
          {seoScore.percentage >= 80 && 'Excellent SEO optimization!'}
          {seoScore.percentage >= 60 && seoScore.percentage < 80 && 'Good SEO, with room for improvement.'}
          {seoScore.percentage < 60 && 'SEO needs improvement. Consider adding missing elements.'}
        </p>
      </div>

      {/* Basic SEO Elements */}
      <div className="bg-white/50 backdrop-blur-sm border border-orange-200/60 rounded-2xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-6">Basic SEO Elements</h3>
        <div className="space-y-6">
          <MetadataRow 
            label="Title" 
            value={seo.title}
            recommendation="Add a descriptive title tag (30-60 characters)"
          />
          
          <MetadataRow 
            label="Description" 
            value={seo.description}
            recommendation="Add a meta description (120-160 characters)"
          />
          
          <MetadataRow 
            label="Keywords" 
            value={seo.keywords}
            recommendation="While not critical for modern SEO, keywords can help with content organization"
          />
          
          <MetadataRow 
            label="Canonical URL" 
            value={seo.canonical}
            recommendation="Add canonical URL to prevent duplicate content issues"
          />
        </div>
      </div>

      {/* Technical SEO */}
      <div className="bg-white/50 backdrop-blur-sm border border-orange-200/60 rounded-2xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-6">Technical SEO</h3>
        <div className="space-y-6">
          <MetadataRow 
            label="Language" 
            value={seo.language}
            recommendation="Add lang attribute to HTML tag for better accessibility"
          />
          
          <MetadataRow 
            label="Viewport" 
            value={seo.viewport}
            recommendation="Add viewport meta tag for mobile responsiveness"
          />
          
          <MetadataRow 
            label="Robots" 
            value={seo.robots}
            recommendation="Consider adding robots meta tag to control search engine indexing"
          />
          
          <MetadataRow 
            label="Author" 
            value={seo.author}
            recommendation="Optional: Add author meta tag for content attribution"
          />
        </div>
      </div>
    </div>
  )
}