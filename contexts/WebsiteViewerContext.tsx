'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { toast } from 'sonner'
import { useFavorites } from '@/contexts/FavoritesContext'
import { useHistory } from '@/contexts/HistoryContext'
import { WebsiteMetadata } from '@/types/metadata'
import { IframeStatus, IframeDetectionResult, iframeDetectionService } from '@/services/IframeDetectionService'


export type ViewType = 'desktop' | 'tablet' | 'mobileLarge' | 'mobile'
export type TabType = 'viewports' | 'seo' | 'social' | 'technical'

export interface View {
  id: number
  url: string
  type: ViewType
  refreshKey?: number
  iframeStatus: IframeStatus
  iframeResult?: IframeDetectionResult
}

const isValidUrl = (url: string): boolean => {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

const formatUrl = (inputUrl: string): string | null => {
  if (!inputUrl || inputUrl.trim() === '') return null
  
  let formattedUrl = inputUrl.trim()
  
  // Add protocol if missing
  if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
    // Use http:// for localhost, https:// for everything else
    if (formattedUrl.includes('localhost') || formattedUrl.includes('127.0.0.1')) {
      formattedUrl = `http://${formattedUrl}`
    } else {
      formattedUrl = `https://${formattedUrl}`
    }
  }
  
  return isValidUrl(formattedUrl) ? formattedUrl : null
}

// Helper function to strip protocol and trailing slash for clean URL params
const stripUrlForParams = (fullUrl: string): string => {
  return fullUrl
    .replace(/^https?:\/\//, '') // Remove protocol
    .replace(/\/$/, '') // Remove trailing slash
}

// Helper function to add protocol based on domain for URL params
const addProtocolFromDomain = (domain: string): string => {
  // Auto-detect protocol: localhost = http, everything else = https
  if (domain.includes('localhost') || domain.includes('127.0.0.1')) {
    return `http://${domain}`
  } else {
    return `https://${domain}`
  }
}

const commonDevPorts = [
  'localhost:3000',
  'localhost:3001',
  'localhost:5173',
  'localhost:8080',
  'localhost:4000',
  'localhost:8000',
  'localhost:8888',
  '127.0.0.1:3000',
  '127.0.0.1:5173'
]

interface WebsiteViewerContextType {
  url: string
  setUrl: (url: string) => void
  currentSite: string | null
  views: View[]
  isInputHighlighted: boolean
  showSuggestions: boolean
  filteredSuggestions: string[]
  setShowSuggestions: (show: boolean) => void
  handleUrlChange: (value: string) => void
  handleKeyDown: (e: React.KeyboardEvent) => void
  selectSuggestion: (suggestion: string) => void
  formatUrl: (url: string) => string | null
  loadSite: (urlOverride?: string) => void
  setUrlWithHighlight: (url: string) => void
  removeView: (id: number) => void
  changeViewType: (id: number, type: ViewType) => void
  duplicateView: (view: View) => void
  globalZoom: number
  setGlobalZoomStepIndex: (index: number) => void
  globalZoomStepIndex: number
  zoomSteps: number[]
  // Metadata functionality
  metadata: WebsiteMetadata | null
  metadataLoading: boolean
  metadataError: string | null
  fetchMetadata: (url?: string) => Promise<void>
  clearMetadata: () => void
  // Iframe preview functionality
  updateViewIframeStatus: (id: number, status: IframeStatus, result?: IframeDetectionResult) => void
  // Navigation
  clearSite: () => void
  // Tab management
  selectedTab: TabType
  setSelectedTab: (tab: TabType) => void
}

const WebsiteViewerContext = createContext<
  WebsiteViewerContextType | undefined
>(undefined)

export function WebsiteViewerProvider ({ children }: { children: ReactNode }) {
  const [url, setUrl] = useState('')
  const [currentSite, setCurrentSite] = useState<string | null>(null)
  const [views, setViews] = useState<View[]>([])
  const [nextId, setNextId] = useState(1)
  const [isInputHighlighted, setIsInputHighlighted] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([])
  
  // Tab state
  const [selectedTab, setSelectedTab] = useState<TabType>('viewports')
  
  // Metadata state
  const [metadata, setMetadata] = useState<WebsiteMetadata | null>(null)
  const [metadataLoading, setMetadataLoading] = useState(false)
  const [metadataError, setMetadataError] = useState<string | null>(null)


  const { favorites } = useFavorites()
  const { history, addToHistory } = useHistory()

  // Load site from URL params on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const siteParam = urlParams.get('site')
    
    if (siteParam) {
      // Auto-add protocol based on domain
      const fullUrl = addProtocolFromDomain(siteParam)
      if (isValidUrl(fullUrl)) {
        setUrl(fullUrl)
        loadSiteInternal(fullUrl)
      }
    }
  }, [])

  // Update URL parameters when URL input changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const urlParams = new URLSearchParams(window.location.search)
      
      if (url && url.trim()) {
        const formattedUrl = formatUrl(url)
        if (formattedUrl) {
          const cleanDomain = stripUrlForParams(formattedUrl)
          urlParams.set('site', cleanDomain)
        } else {
          urlParams.delete('site')
        }
      } else {
        urlParams.delete('site')
      }
      
      const paramString = urlParams.toString()
      const finalUrl = paramString ? `${window.location.pathname}?${paramString}` : window.location.pathname
      window.history.pushState({}, '', finalUrl)
    }, 300) // Debounce for 300ms
    
    return () => clearTimeout(timeoutId)
  }, [url])

  // Global zoom state
  const zoomSteps = [0.5, 0.75, 1, 1.25, 1.5, 2]
  const [globalZoomStepIndex, setGlobalZoomStepIndex] = useState(2) // Default to 100%
  const globalZoom = zoomSteps[globalZoomStepIndex]

  const setUrlWithHighlight = (url: string) => {
    setUrl(url)
    setIsInputHighlighted(true)
    setTimeout(() => setIsInputHighlighted(false), 1000)
  }

  const loadSiteInternal = async (formattedUrl: string) => {
    // Just create views as loaded - no more broken detection
    const newViews = [
      { id: nextId, url: formattedUrl, type: 'desktop' as ViewType, iframeStatus: 'loaded' as IframeStatus },
      { id: nextId + 1, url: formattedUrl, type: 'tablet' as ViewType, iframeStatus: 'loaded' as IframeStatus },
      { id: nextId + 2, url: formattedUrl, type: 'mobileLarge' as ViewType, iframeStatus: 'loaded' as IframeStatus },
      { id: nextId + 3, url: formattedUrl, type: 'mobile' as ViewType, iframeStatus: 'loaded' as IframeStatus }
    ]
    
    setViews(newViews)
    setCurrentSite(formattedUrl)
    setNextId(nextId + 4)
    addToHistory(formattedUrl)
    setUrl(formattedUrl)
  }

  const updateUrlParams = () => {
    const urlParams = new URLSearchParams(window.location.search)
    
    // Update site param based on current URL input
    if (url && url.trim()) {
      const formattedUrl = formatUrl(url)
      if (formattedUrl) {
        const cleanDomain = stripUrlForParams(formattedUrl)
        urlParams.set('site', cleanDomain)
      } else {
        urlParams.delete('site')
      }
    } else {
      urlParams.delete('site')
    }
    
    // Construct the final URL
    const paramString = urlParams.toString()
    const finalUrl = paramString ? `${window.location.pathname}?${paramString}` : window.location.pathname
    window.history.pushState({}, '', finalUrl)
  }

  const loadSite = (urlOverride?: string) => {
    const urlToUse = urlOverride || url
    const formattedUrl = formatUrl(urlToUse)
    if (formattedUrl) {
      loadSiteInternal(formattedUrl)
      updateUrlParams()
      toast.success('Site loaded in all viewports')
    } else {
      toast.error('Please enter a valid URL')
    }
  }

  const removeView = (id: number) => {
    setViews(views.filter(view => view.id !== id))
  }

  const changeViewType = (id: number, type: ViewType) => {
    setViews(views.map(view => (view.id === id ? { ...view, type } : view)))
  }

  const duplicateView = (view: View) => {
    setViews(prevViews => [{ ...view, id: nextId }, ...prevViews])
    setNextId(nextId + 1)
    toast.success(`New ${view.type} view added`)
  }

  const updateGlobalZoom = (stepIndex: number) => {
    setGlobalZoomStepIndex(stepIndex)
  }

  // Iframe preview functionality
  const updateViewIframeStatus = (id: number, status: IframeStatus, result?: IframeDetectionResult) => {
    setViews(prevViews => 
      prevViews.map(view => 
        view.id === id 
          ? { ...view, iframeStatus: status, iframeResult: result }
          : view
      )
    )
  }

  // Removed broken detection logic

  const clearSite = () => {
    setViews([])
    setCurrentSite(null)
    setUrl('')
    clearMetadata()
    // Clear URL params
    window.history.pushState({}, '', window.location.pathname)
    toast.success('Returned to homepage')
  }

  const handleUrlChange = (value: string) => {
    setUrl(value)
    
    if (value.length > 0) {
      const suggestions = [
        ...history,
        ...favorites,
        ...commonDevPorts.filter(port => !history.includes(port))
      ].filter(item => item.toLowerCase().includes(value.toLowerCase()))
      setFilteredSuggestions(suggestions)
      setShowSuggestions(suggestions.length > 0)
    } else {
      // Show all suggestions when input is empty
      const allSuggestions = [
        ...history,
        ...favorites,
        ...commonDevPorts.filter(port => !history.includes(port))
      ]
      setFilteredSuggestions(allSuggestions)
      setShowSuggestions(allSuggestions.length > 0)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && url.trim()) {
      loadSite()
    }
  }

  const selectSuggestion = (suggestion: string) => {
    setUrl(suggestion)
    setShowSuggestions(false)
  }

  // Metadata functions
  const fetchMetadata = async (urlOverride?: string) => {
    const targetUrl = urlOverride || currentSite
    console.log('fetchMetadata called with:', { targetUrl, currentSite, urlOverride })
    if (!targetUrl) {
      console.log('No target URL, returning early')
      return
    }

    console.log('Starting metadata fetch for:', targetUrl)
    setMetadataLoading(true)
    setMetadataError(null)
    
    try {
      console.log('Making API call to:', `/api/metadata?url=${encodeURIComponent(targetUrl)}`)
      const response = await fetch(`/api/metadata?url=${encodeURIComponent(targetUrl)}`)
      const data = await response.json()
      console.log('API response:', data)
      
      if (data.success && data.data) {
        console.log('Metadata extraction successful, setting data')
        setMetadata(data.data)
      } else {
        console.log('Metadata extraction failed:', data.error)
        setMetadataError(data.error || 'Failed to extract metadata')
        setMetadata(null)
      }
    } catch (error) {
      console.log('Metadata fetch error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setMetadataError(errorMessage)
      setMetadata(null)
    } finally {
      console.log('Setting metadata loading to false')
      setMetadataLoading(false)
    }
  }

  const clearMetadata = () => {
    setMetadata(null)
    setMetadataError(null)
    setMetadataLoading(false)
  }


  const value: WebsiteViewerContextType = {
    url,
    setUrl,
    currentSite,
    views,
    isInputHighlighted,
    showSuggestions,
    filteredSuggestions,
    setShowSuggestions,
    handleUrlChange,
    handleKeyDown,
    selectSuggestion,
    formatUrl,
    loadSite,
    setUrlWithHighlight,
    removeView,
    changeViewType,
    duplicateView,
    globalZoom,
    setGlobalZoomStepIndex: updateGlobalZoom,
    globalZoomStepIndex,
    zoomSteps,
    metadata,
    metadataLoading,
    metadataError,
    fetchMetadata,
    clearMetadata,
    updateViewIframeStatus,
    clearSite,
    selectedTab,
    setSelectedTab
  }

  return (
    <WebsiteViewerContext.Provider value={value}>
      {children}
    </WebsiteViewerContext.Provider>
  )
}

export function useWebsiteViewer () {
  const context = useContext(WebsiteViewerContext)
  if (context === undefined) {
    throw new Error(
      'useWebsiteViewer must be used within a WebsiteViewerProvider'
    )
  }
  return context
}
