'use client'

import React from 'react'
import { WebsiteMetadata } from '@/types/metadata'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600'
    if (percentage >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreIcon = (percentage: number) => {
    if (percentage >= 80) return <CheckCircle className="h-5 w-5 text-green-500" />
    if (percentage >= 60) return <AlertTriangle className="h-5 w-5 text-yellow-500" />
    return <XCircle className="h-5 w-5 text-red-500" />
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
  }) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-medium text-sm">{label}</span>
        {value && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => copyToClipboard(value, label)}
            className="h-6 w-6 p-0"
          >
            <Copy className="h-3 w-3" />
          </Button>
        )}
      </div>
      {value ? (
        <div className="bg-muted p-3 rounded-md">
          <p className="text-sm break-words">{value}</p>
          {label === 'Title' && value.length > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              Length: {value.length} characters
              {value.length < 30 && ' (too short, recommended: 30-60)'}
              {value.length > 60 && ' (too long, recommended: 30-60)'}
            </p>
          )}
          {label === 'Description' && value.length > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              Length: {value.length} characters
              {value.length < 120 && ' (too short, recommended: 120-160)'}
              {value.length > 160 && ' (too long, recommended: 120-160)'}
            </p>
          )}
        </div>
      ) : (
        <div className="bg-red-50 border border-red-200 p-3 rounded-md">
          <p className="text-sm text-red-600">Missing</p>
          {recommendation && (
            <p className="text-xs text-red-500 mt-1">{recommendation}</p>
          )}
        </div>
      )}
    </div>
  )

  return (
    <div className="space-y-6">
      {/* SEO Score Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            {getScoreIcon(seoScore.percentage)}
            <span>SEO Score</span>
            <Badge className={getScoreColor(seoScore.percentage)}>
              {seoScore.score}/{seoScore.maxScore} ({seoScore.percentage}%)
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                seoScore.percentage >= 80 ? 'bg-green-500' :
                seoScore.percentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${seoScore.percentage}%` }}
            />
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {seoScore.percentage >= 80 && 'Excellent SEO optimization!'}
            {seoScore.percentage >= 60 && seoScore.percentage < 80 && 'Good SEO, with room for improvement.'}
            {seoScore.percentage < 60 && 'SEO needs improvement. Consider adding missing elements.'}
          </p>
        </CardContent>
      </Card>

      {/* Basic SEO Elements */}
      <Card>
        <CardHeader>
          <CardTitle>Basic SEO Elements</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
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
        </CardContent>
      </Card>

      {/* Technical SEO */}
      <Card>
        <CardHeader>
          <CardTitle>Technical SEO</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
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
        </CardContent>
      </Card>
    </div>
  )
}