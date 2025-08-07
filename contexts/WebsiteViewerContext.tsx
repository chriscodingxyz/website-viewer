'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { toast } from 'sonner'
import { useFavorites } from '@/contexts/FavoritesContext'
import { useHistory } from '@/contexts/HistoryContext'
import { WebsiteMetadata, LighthouseReport } from '@/types/metadata'
import { IframeStatus, IframeDetectionResult, iframeDetectionService } from '@/services/IframeDetectionService'

// Function to sanitize Lighthouse data and remove circular references
function sanitizeLighthouseData(data: any): LighthouseReport {
  // More aggressive sanitization to completely prevent circular references
  const sanitize = (obj: any, depth = 0, maxDepth = 10): any => {
    // Prevent infinite recursion
    if (depth > maxDepth) {
      return '[Max Depth Exceeded]'
    }
    
    // Handle primitives
    if (obj === null || obj === undefined) {
      return obj
    }
    
    if (typeof obj !== 'object') {
      return obj
    }
    
    // Check for DOM elements, React elements, or other problematic objects
    if (obj instanceof Element || 
        obj instanceof Node || 
        obj instanceof HTMLElement ||
        obj.constructor?.name?.includes('HTML') ||
        obj.constructor?.name?.includes('Element') ||
        obj.constructor?.name?.includes('Node') ||
        obj.constructor?.name?.includes('Fiber') ||
        obj._reactInternalFiber ||
        obj._reactFiber ||
        obj.stateNode ||
        obj.type?.$$typeof ||
        obj.$$typeof) {
      return '[DOM/React Element Removed]'
    }
    
    // Handle arrays
    if (Array.isArray(obj)) {
      return obj.slice(0, 50).map(item => sanitize(item, depth + 1, maxDepth))
    }
    
    // Handle objects
    const sanitized: any = {}
    const entries = Object.entries(obj).slice(0, 100) // Limit object size
    
    for (const [key, value] of entries) {
      // Skip problematic keys more aggressively
      if (key.startsWith('_') || 
          key.includes('fiber') || 
          key.includes('Fiber') ||
          key.includes('react') ||
          key.includes('React') ||
          key.includes('node') ||
          key.includes('Node') ||
          key.includes('element') ||
          key.includes('Element') ||
          key.includes('dom') ||
          key.includes('DOM') ||
          key.includes('$$') ||
          key === 'stateNode' ||
          key === 'type' ||
          key === 'key' ||
          key === 'ref') {
        continue
      }
      
      // For details field, be extra cautious
      if (key === 'details') {
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          const simpleDetails: any = {}
          // Only keep very basic properties for details
          const allowedDetailKeys = ['type', 'headings', 'items', 'summary', 'overallSavingsMs', 'overallSavingsBytes']
          
          for (const [detailKey, detailValue] of Object.entries(value)) {
            if (allowedDetailKeys.includes(detailKey) && 
                (typeof detailValue === 'string' || 
                 typeof detailValue === 'number' || 
                 typeof detailValue === 'boolean' ||
                 detailValue === null)) {
              simpleDetails[detailKey] = detailValue
            }
          }
          sanitized[key] = simpleDetails
        } else {
          sanitized[key] = null // Remove complex details entirely
        }
      } else {
        try {
          sanitized[key] = sanitize(value, depth + 1, maxDepth)
        } catch (error) {
          // If sanitization fails for any property, skip it
          console.warn(`Skipping property ${key} due to sanitization error:`, error)
          continue
        }
      }
    }
    
    return sanitized
  }
  
  try {
    return sanitize(data) as LighthouseReport
  } catch (error) {
    console.error('Sanitization failed completely, returning minimal report:', error)
    // Return a minimal safe report if all else fails
    return {
      requestedUrl: data?.requestedUrl || 'unknown',
      finalUrl: data?.finalUrl || 'unknown',
      fetchTime: new Date().toISOString(),
      gatherMode: 'navigation',
      lighthouseVersion: '12.0.0',
      userAgent: 'sanitized',
      environment: {
        networkUserAgent: 'sanitized',
        hostUserAgent: 'sanitized',
        benchmarkIndex: 1000,
      },
      configSettings: {
        emulatedFormFactor: 'desktop',
        locale: 'en-US',
        onlyCategories: ['performance'],
      },
      scores: data?.scores || {},
      coreWebVitals: data?.coreWebVitals || {},
      audits: [],
      opportunities: [],
      diagnostics: [],
      timing: { total: 0 },
    } as LighthouseReport
  }
}

export type ViewType = 'desktop' | 'tablet' | 'mobileLarge' | 'mobile'

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
  // Performance analysis functionality
  lighthouseReports: Record<ViewType, LighthouseReport | null>
  lighthouseLoading: boolean
  lighthouseError: string | null
  fetchLighthouseReport: (viewport?: ViewType, url?: string) => Promise<void>
  fetchAllLighthouseReports: (url?: string) => Promise<void>
  clearLighthouseReports: () => void
  // Iframe preview functionality
  updateViewIframeStatus: (id: number, status: IframeStatus, result?: IframeDetectionResult) => void
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

  // Performance analysis state
  const [lighthouseReports, setLighthouseReports] = useState<Record<ViewType, LighthouseReport | null>>({
    desktop: null,
    tablet: null,
    mobileLarge: null,
    mobile: null
  })
  const [lighthouseLoading, setLighthouseLoading] = useState(false)
  const [lighthouseError, setLighthouseError] = useState<string | null>(null)

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
    // Start with loading status while we check
    const newViews = [
      { id: nextId, url: formattedUrl, type: 'desktop' as ViewType, iframeStatus: 'loading' as IframeStatus },
      { id: nextId + 1, url: formattedUrl, type: 'tablet' as ViewType, iframeStatus: 'loading' as IframeStatus },
      { id: nextId + 2, url: formattedUrl, type: 'mobileLarge' as ViewType, iframeStatus: 'loading' as IframeStatus },
      { id: nextId + 3, url: formattedUrl, type: 'mobile' as ViewType, iframeStatus: 'loading' as IframeStatus }
    ]
    
    setViews(newViews)
    setCurrentSite(formattedUrl)
    setNextId(nextId + 4)
    addToHistory(formattedUrl)
    // Keep the URL in the field instead of clearing it
    setUrl(formattedUrl)
    
    // Run iframe detection immediately for all views
    runIframeDetectionForAllViews(formattedUrl, newViews)
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

  // Run iframe detection for all views immediately when URL is loaded
  const runIframeDetectionForAllViews = async (url: string, views: View[]) => {
    // Create a temporary container for detection
    const tempContainer = document.createElement('div')
    tempContainer.style.position = 'absolute'
    tempContainer.style.top = '-9999px'
    tempContainer.style.left = '-9999px'
    tempContainer.style.width = '100px'
    tempContainer.style.height = '100px'
    document.body.appendChild(tempContainer)

    try {
      // Run detection just once - all viewports will have the same blocking behavior
      const result = await iframeDetectionService.detectIframeStatus(url, tempContainer, { timeout: 5000 })
      
      // Update all views with the same result
      views.forEach(view => {
        updateViewIframeStatus(view.id, result.status, result)
      })
      
      if (result.status === 'blocked') {
        toast.info('Website blocks iframe embedding - good security practice! For testing, consider disabling X-Frame-Options in dev/staging environments.')
      }
    } catch (error) {
      console.error('Detection failed:', error)
      // Mark all views as error
      views.forEach(view => {
        updateViewIframeStatus(view.id, 'error')
      })
    } finally {
      // Clean up temp container
      document.body.removeChild(tempContainer)
    }
  }

  const clearSite = () => {
    setViews([])
    setCurrentSite(null)
    setUrl('')
    clearMetadata()
    clearLighthouseReports()
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

  // Performance analysis functions
  const fetchLighthouseReport = async (viewport: ViewType = 'desktop', urlOverride?: string) => {
    const targetUrl = urlOverride || currentSite
    if (!targetUrl) return

    // Clear any potentially contaminated state before starting
    setLighthouseReports(prev => {
      const cleanState: Record<ViewType, LighthouseReport | null> = {
        desktop: null,
        tablet: null,
        mobileLarge: null,
        mobile: null
      }
      
      // Only keep data from other viewports if they're clean
      for (const [key, value] of Object.entries(prev)) {
        if (key !== viewport && value !== null) {
          try {
            cleanState[key as ViewType] = JSON.parse(JSON.stringify(value))
          } catch (e) {
            console.warn(`Removing contaminated data for ${key}:`, e)
            cleanState[key as ViewType] = null
          }
        }
      }
      
      return cleanState
    })

    setLighthouseLoading(true)
    setLighthouseError(null)
    
    try {
      const response = await fetch(`/api/lighthouse?url=${encodeURIComponent(targetUrl)}&viewport=${viewport}`)
      const data = await response.json()
      
      if (data.success && data.data) {
        try {
          const sanitizedData = sanitizeLighthouseData(data.data)
          // Additional JSON stringify test to catch any remaining circular references
          const serializedString = JSON.stringify(sanitizedData)
          // Parse it back to ensure completely clean data
          const finalCleanData = JSON.parse(serializedString)
          
          setLighthouseReports(prev => {
            // Create completely new object to avoid spreading potentially contaminated state
            const newState: Record<ViewType, LighthouseReport | null> = {
              desktop: null,
              tablet: null,
              mobileLarge: null,
              mobile: null
            }
            
            // Copy only the clean data from previous state
            for (const [key, value] of Object.entries(prev)) {
              if (key !== viewport && value !== null) {
                try {
                  // Double-sanitize existing data
                  newState[key as ViewType] = JSON.parse(JSON.stringify(value))
                } catch (e) {
                  console.warn(`Skipping contaminated data for ${key}:`, e)
                  newState[key as ViewType] = null
                }
              }
            }
            
            // Set the new clean data
            newState[viewport] = finalCleanData
            
            return newState
          })
          toast.success(`${viewport} Lighthouse analysis completed`)
        } catch (serializationError) {
          console.error('Serialization test failed for lighthouse data:', serializationError)
          setLighthouseError(`Failed to process ${viewport} Lighthouse data`)
          toast.error(`Failed to process ${viewport} viewport data`)
        }
      } else {
        setLighthouseError(data.error || 'Failed to run Lighthouse analysis')
        toast.error(`Failed to analyze ${viewport} viewport`)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setLighthouseError(errorMessage)
      toast.error('Failed to run Lighthouse analysis')
    } finally {
      setLighthouseLoading(false)
    }
  }

  const fetchAllLighthouseReports = async (urlOverride?: string) => {
    const targetUrl = urlOverride || currentSite
    if (!targetUrl) return

    // Completely clear state before batch analysis
    setLighthouseReports({
      desktop: null,
      tablet: null,
      mobileLarge: null,
      mobile: null
    })

    setLighthouseLoading(true)
    setLighthouseError(null)
    
    try {
      const response = await fetch('/api/lighthouse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: targetUrl,
          viewports: ['desktop', 'tablet', 'mobileLarge', 'mobile']
        })
      })
      
      const data = await response.json()
      
      if (data.success && data.data) {
        try {
          const newReports: Record<ViewType, LighthouseReport | null> = {
            desktop: data.data.desktop ? sanitizeLighthouseData(data.data.desktop) : null,
            tablet: data.data.tablet ? sanitizeLighthouseData(data.data.tablet) : null,
            mobileLarge: data.data.mobileLarge ? sanitizeLighthouseData(data.data.mobileLarge) : null,
            mobile: data.data.mobile ? sanitizeLighthouseData(data.data.mobile) : null
          }
          
          // Test serialization of all reports to catch any circular references
          const serializedString = JSON.stringify(newReports)
          // Parse it back to ensure completely clean data
          const finalCleanReports = JSON.parse(serializedString)
          
          // Completely replace state instead of merging
          setLighthouseReports(() => finalCleanReports)
          
          const successCount = Object.values(finalCleanReports).filter(report => report !== null).length
          toast.success(`Lighthouse analysis completed for ${successCount} viewport${successCount !== 1 ? 's' : ''}`)
        } catch (serializationError) {
          console.error('Serialization test failed for batch lighthouse data:', serializationError)
          setLighthouseError('Failed to process Lighthouse batch data')
          toast.error('Failed to process Lighthouse batch data')
          return
        }
      } else {
        setLighthouseError(data.error || 'Failed to run Lighthouse analysis')
        toast.error('Failed to run Lighthouse analysis')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setLighthouseError(errorMessage)
      toast.error('Failed to run Lighthouse analysis')
    } finally {
      setLighthouseLoading(false)
    }
  }

  const clearLighthouseReports = () => {
    setLighthouseReports({
      desktop: null,
      tablet: null,
      mobileLarge: null,
      mobile: null
    })
    setLighthouseError(null)
    setLighthouseLoading(false)
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
    lighthouseReports,
    lighthouseLoading,
    lighthouseError,
    fetchLighthouseReport,
    fetchAllLighthouseReports,
    clearLighthouseReports,
    updateViewIframeStatus,
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
