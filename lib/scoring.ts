import { WebsiteMetadata } from '@/types/metadata'

export type Grade = 'A' | 'B' | 'C' | 'D' | 'F'

export interface SubScore {
  score: number
  maxScore: number
  percentage: number
}

export interface OverallScore {
  grade: Grade
  percentage: number
  score: number
  maxScore: number
  breakdown: {
    seo: SubScore
    social: SubScore
    technical: SubScore
  }
}

export function getSEOScore (metadata: WebsiteMetadata): SubScore {
  const { seo } = metadata
  let score = 0
  const maxScore = 5
  if (seo.title && seo.title.length >= 30 && seo.title.length <= 60) score += 1
  if (seo.description && seo.description.length >= 120 && seo.description.length <= 160) score += 1
  if (seo.canonical) score += 1
  if (seo.language) score += 1
  if (seo.viewport) score += 1
  return { score, maxScore, percentage: Math.round((score / maxScore) * 100) }
}

export function getSocialScore (metadata: WebsiteMetadata): SubScore {
  const { openGraph, twitterCard } = metadata
  let score = 0
  const maxScore = 8
  if (openGraph.title) score += 1
  if (openGraph.description) score += 1
  if (openGraph.image) score += 1
  if (openGraph.type) score += 1
  if (twitterCard.card) score += 1
  if (twitterCard.title) score += 1
  if (twitterCard.description) score += 1
  if (twitterCard.image) score += 1
  return { score, maxScore, percentage: Math.round((score / maxScore) * 100) }
}

export function getTechnicalScore (metadata: WebsiteMetadata): SubScore {
  const headers = metadata.headers || {}
  let score = 0
  const maxScore = 8
  if (metadata.url.startsWith('https://')) score += 1
  if (headers.contentSecurityPolicy) score += 1
  if (headers.xFrameOptions) score += 1
  if (headers.strictTransportSecurity) score += 1
  if (headers.contentEncoding) score += 1
  if (headers.cacheControl) score += 1
  if (metadata.seo.viewport) score += 1
  if (metadata.technical?.charset) score += 1
  return { score, maxScore, percentage: Math.round((score / maxScore) * 100) }
}

export function percentageToGrade (percentage: number): Grade {
  if (percentage >= 90) return 'A'
  if (percentage >= 75) return 'B'
  if (percentage >= 60) return 'C'
  if (percentage >= 40) return 'D'
  return 'F'
}

export function gradeColor (grade: Grade): { text: string, bg: string, ring: string } {
  switch (grade) {
    case 'A':
      return { text: 'text-emerald-600', bg: 'bg-emerald-500/10', ring: 'ring-emerald-500/30' }
    case 'B':
      return { text: 'text-accent', bg: 'bg-accent/10', ring: 'ring-accent/30' }
    case 'C':
      return { text: 'text-amber-600', bg: 'bg-amber-500/10', ring: 'ring-amber-500/30' }
    case 'D':
      return { text: 'text-orange-600', bg: 'bg-orange-500/10', ring: 'ring-orange-500/30' }
    case 'F':
      return { text: 'text-red-600', bg: 'bg-red-500/10', ring: 'ring-red-500/30' }
  }
}

export function computeOverallScore (metadata: WebsiteMetadata): OverallScore {
  const seo = getSEOScore(metadata)
  const social = getSocialScore(metadata)
  const technical = getTechnicalScore(metadata)

  const score = seo.score + social.score + technical.score
  const maxScore = seo.maxScore + social.maxScore + technical.maxScore
  const percentage = Math.round((score / maxScore) * 100)

  return {
    grade: percentageToGrade(percentage),
    percentage,
    score,
    maxScore,
    breakdown: { seo, social, technical }
  }
}
