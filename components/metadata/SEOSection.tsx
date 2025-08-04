
'use client'

import React from 'react'
import { WebsiteMetadata } from '@/types/metadata'
import { Badge } from '@/components/ui/badge'
import { Copy, CheckCircle, AlertTriangle, XCircle, Languages, ScanViewport, Bot, FileText, User } from 'lucide-react'
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
    const baseClasses = "border-orange-200 text-orange-700 bg-orange-100 dark:border-orange-800/70 dark:text-orange-300 dark:bg-orange-900/50";
    if (!value) {
      return { badge: 'Missing', badgeClass: "border-red-200 text-red-700 bg-red-100 dark:border-red-800/70 dark:text-red-300 dark:bg-red-900/50" };
    }

    if (label === 'Title') {
      if (value.length >= 30 && value.length <= 60) return { badge: 'Perfect', badgeClass: "border-green-200 text-green-700 bg-green-100 dark:border-green-800/70 dark:text-green-300 dark:bg-green-900/50" };
      if (value.length < 30) return { badge: 'Too Short', badgeClass: "border-yellow-200 text-yellow-700 bg-yellow-100 dark:border-yellow-800/70 dark:text-yellow-300 dark:bg-yellow-900/50" };
      return { badge: 'Too Long', badgeClass: "border-yellow-200 text-yellow-700 bg-yellow-100 dark:border-yellow-800/70 dark:text-yellow-300 dark:bg-yellow-900/50" };
    }
    if (label === 'Description') {
      if (value.length >= 120 && value.length <= 160) return { badge: 'Perfect', badgeClass: "border-green-200 text-green-700 bg-green-100 dark:border-green-800/70 dark:text-green-300 dark:bg-green-900/50" };
      if (value.length < 120) return { badge: 'Too Short', badgeClass: "border-yellow-200 text-yellow-700 bg-yellow-100 dark:border-yellow-800/70 dark:text-yellow-300 dark:bg-yellow-900/50" };
      return { badge: 'Too Long', badgeClass: "border-yellow-200 text-yellow-700 bg-yellow-100 dark:border-yellow-800/70 dark:text-yellow-300 dark:bg-yellow-900/50" };
    }
    return { badge: 'Present', badgeClass: baseClasses };
  }

  const seoScore = getSEOScore()

  const MetadataCard = ({ label, value, recommendation, optimalRange }: { label: string; value?: string; recommendation: string; optimalRange?: string }) => {
    const status = getElementStatus(label, value)
    const Icon = {
      Title: FileText,
      Description: FileText,
      "Canonical URL": FileText,
      Keywords: FileText,
      Language: Languages,
      Viewport: ScanViewport,
      Robots: Bot,
      Author: User,
    }[label] || FileText

    return (
      <div className="p-4 rounded-xl border bg-orange-50/50 dark:bg-orange-950/30 border-orange-100 dark:border-orange-900/50 flex flex-col h-full">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            <span className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{label}</span>
          </div>
          <Badge variant="outline" className={status.badgeClass}>
            {status.badge}
          </Badge>
        </div>
        <div className="flex-grow">
          {value ? (
            <p className="text-sm text-gray-700 dark:text-gray-300 font-medium break-all">{value}</p>
          ) : (
            <p className="text-sm text-red-600 dark:text-red-400 font-semibold">{recommendation}</p>
          )}
        </div>
        {(label === 'Title' || label === 'Description') && (
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 pt-2 border-t border-orange-100 dark:border-orange-900/50">
            {value && <p>Current length: {value.length} chars</p>}
            <p>Optimal range: {optimalRange}</p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column: SEO Score */}
      <div className="lg:col-span-1 bg-white/50 dark:bg-gray-900/30 backdrop-blur-sm border border-orange-200/60 dark:border-orange-800/40 rounded-2xl p-6 shadow-sm flex flex-col justify-center items-center text-center">
        <div className="flex items-center gap-3 mb-3">
          {getScoreIcon(seoScore.percentage)}
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">SEO Score</h3>
        </div>
        <div className={`text-5xl font-bold ${getScoreColor(seoScore.percentage)}`}>{seoScore.percentage}%</div>
        <p className="text-gray-600 dark:text-gray-400 font-medium mt-1">({seoScore.score}/{seoScore.maxScore} checks passed)</p>
        <div className="w-full bg-orange-100/60 dark:bg-orange-900/50 rounded-full h-2.5 mt-4">
          <div className={`h-2.5 rounded-full bg-gradient-to-r ${seoScore.percentage >= 80 ? 'from-green-400 to-green-600' : seoScore.percentage >= 50 ? 'from-yellow-400 to-yellow-600' : 'from-red-400 to-red-600'}`} style={{ width: `${seoScore.percentage}%` }} />
        </div>
      </div>

      {/* Right Column: SEO Details */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white/50 dark:bg-gray-900/30 backdrop-blur-sm border border-orange-200/60 dark:border-orange-800/40 rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Core SEO Elements</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <MetadataCard label="Title" value={seo.title} recommendation="Add a descriptive title." optimalRange="30-60 chars" />
            <MetadataCard label="Description" value={seo.description} recommendation="Add a meta description." optimalRange="120-160 chars" />
            <MetadataCard label="Canonical URL" value={seo.canonical} recommendation="Add a canonical URL to avoid duplicate content." />
            <MetadataCard label="Keywords" value={seo.keywords} recommendation="Add keywords to help define content." />
          </div>
        </div>
        <div className="bg-white/50 dark:bg-gray-900/30 backdrop-blur-sm border border-orange-200/60 dark:border-orange-800/40 rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Technical SEO</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <MetadataCard label="Language" value={seo.language} recommendation="Set the language for accessibility." />
            <MetadataCard label="Viewport" value={seo.viewport} recommendation="Set the viewport for mobile responsiveness." />
            <MetadataCard label="Robots" value={seo.robots} recommendation="Define rules for search engine crawlers." />
            <MetadataCard label="Author" value={seo.author} recommendation="Add an author to the content." />
          </div>
        </div>
      </div>
    </div>
  )
}
