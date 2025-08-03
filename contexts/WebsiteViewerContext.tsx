'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { toast } from 'sonner'
import { useFavorites } from '@/contexts/FavoritesContext'
import { useHistory } from '@/contexts/HistoryContext'
import { WebsiteMetadata } from '@/types/metadata'

export type ViewType = 'desktop' | 'tablet' | 'mobileLarge' | 'mobile'

export interface View {
  id: number
  url: string
  type: ViewType
  refreshKey?: number
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
  // Navigation
  clearSite: () => void
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
  
  // Metadata state
  const [metadata, setMetadata] = useState<WebsiteMetadata | null>(null)
  const [metadataLoading, setMetadataLoading] = useState(false)
  const [metadataError, setMetadataError] = useState<string | null>(null)

  const { favorites } = useFavorites()
  const { history, addToHistory } = useHistory()

  // Load site and zoom from URL params on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const siteParam = urlParams.get('site')
    const zoomParam = urlParams.get('zoom')
    let shouldUpdateUrl = false
    
    if (siteParam) {
      // Auto-add protocol based on domain
      const fullUrl = addProtocolFromDomain(siteParam)
      if (isValidUrl(fullUrl)) {
        setUrl(fullUrl)
        loadSiteInternal(fullUrl)
      }
    }
    
    if (zoomParam) {
      const zoomValue = parseInt(zoomParam)
      const validZooms = [100, 125, 150, 200]
      if (validZooms.includes(zoomValue)) {
        const stepIndex = zoomSteps.findIndex(step => step === zoomValue / 100)
        if (stepIndex !== -1) {
          setGlobalZoomStepIndex(stepIndex)
        }
      } else {
        // Invalid zoom value - remove it from URL
        urlParams.delete('zoom')
        shouldUpdateUrl = true
      }
    }
    
    // Update URL if we removed invalid zoom parameter
    if (shouldUpdateUrl) {
      window.history.replaceState({}, '', `${window.location.pathname}?${urlParams}`)
    }
  }, [])

  // Global zoom state
  const zoomSteps = [0.5, 0.75, 1, 1.25, 1.5, 2]
  const [globalZoomStepIndex, setGlobalZoomStepIndex] = useState(2) // Default to 100%
  const globalZoom = zoomSteps[globalZoomStepIndex]

  const setUrlWithHighlight = (url: string) => {
    setUrl(url)
    setIsInputHighlighted(true)
    setTimeout(() => setIsInputHighlighted(false), 1000)
  }

  const loadSiteInternal = (formattedUrl: string) => {
    // Replace all views with new site's 4 viewports
    setViews([
      { id: nextId, url: formattedUrl, type: 'desktop' },
      { id: nextId + 1, url: formattedUrl, type: 'tablet' },
      { id: nextId + 2, url: formattedUrl, type: 'mobileLarge' },
      { id: nextId + 3, url: formattedUrl, type: 'mobile' }
    ])
    setCurrentSite(formattedUrl)
    setNextId(nextId + 4)
    addToHistory(formattedUrl)
    // Keep the URL in the field instead of clearing it
    setUrl(formattedUrl)
  }

  const updateUrlParams = () => {
    const urlParams = new URLSearchParams(window.location.search)
    
    // Update site param if we have a current site
    if (currentSite) {
      const cleanDomain = stripUrlForParams(currentSite)
      urlParams.set('site', cleanDomain)
    }
    
    // Update zoom param if not default (100%)
    const zoomPercent = Math.round(globalZoom * 100)
    const validZooms = [100, 125, 150, 200]
    if (validZooms.includes(zoomPercent) && zoomPercent !== 100) {
      urlParams.set('zoom', zoomPercent.toString())
    } else {
      urlParams.delete('zoom')
    }
    
    window.history.pushState({}, '', `${window.location.pathname}?${urlParams}`)
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
    // Update URL params after state is set
    setTimeout(() => updateUrlParams(), 0)
  }

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
    if (!targetUrl) return

    setMetadataLoading(true)
    setMetadataError(null)
    
    try {
      const response = await fetch(`/api/metadata?url=${encodeURIComponent(targetUrl)}`)
      const data = await response.json()
      
      if (data.success && data.data) {
        setMetadata(data.data)
        toast.success('Metadata extracted successfully')
      } else {
        setMetadataError(data.error || 'Failed to extract metadata')
        setMetadata(null)
        toast.error('Failed to extract metadata')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setMetadataError(errorMessage)
      setMetadata(null)
      toast.error('Failed to extract metadata')
    } finally {
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
    clearSite
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
