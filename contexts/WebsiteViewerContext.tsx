'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react'
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
  loadingDelay?: number // Delay in ms before starting to load iframe
  shouldLoad?: boolean // Whether iframe should start loading
}

const isValidUrl = (url: string): boolean => {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

const formatUrl = (inputUrl: string, username?: string, password?: string): string | null => {
  if (!inputUrl || inputUrl.trim() === '') return null

  let formattedUrl = inputUrl.trim()

  // Check if URL already has credentials to avoid duplication
  const hasCredentials = formattedUrl.includes('@') && (formattedUrl.includes('http://') || formattedUrl.includes('https://'))

  // Add protocol if missing
  if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
    // Use http:// for localhost, https:// for everything else
    if (formattedUrl.includes('localhost') || formattedUrl.includes('127.0.0.1')) {
      formattedUrl = `http://${formattedUrl}`
    } else {
      formattedUrl = `https://${formattedUrl}`
    }
  }

  // Add credentials if provided and not already present
  if (username && password && !hasCredentials) {
    try {
      const url = new URL(formattedUrl)
      url.username = username
      url.password = password
      formattedUrl = url.toString()
    } catch (error) {
      console.error('Error adding credentials to URL:', error)
      return null
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
  // Loading state
  isInitialLoad: boolean
  // Authentication
  username: string
  password: string
  showAuthFields: boolean
  showAuthDialog: boolean
  authDialogUrl: string
  setUsername: (username: string) => void
  setPassword: (password: string) => void
  setShowAuthFields: (show: boolean) => void
  setShowAuthDialog: (show: boolean) => void
  setAuthDialogUrl: (url: string) => void
  clearCredentials: () => void
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

  // Authentication state
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showAuthFields, setShowAuthFields] = useState(false)
  const [showAuthDialog, setShowAuthDialog] = useState(false)
  const [authDialogUrl, setAuthDialogUrl] = useState('')
  
  // Tab state - determine initial tab from URL
  const getInitialTab = (): TabType => {
    if (typeof window === 'undefined') return 'seo'

    const path = window.location.pathname
    if (path === '/seo') return 'seo'
    if (path === '/social') return 'social'
    if (path === '/technical') return 'technical'
    if (path === '/viewports') return 'viewports'
    return 'seo' // default
  }

  const [selectedTab, setSelectedTab] = useState<TabType>(getInitialTab)

  // Track if we've done the initial redirect for this site
  const hasRedirected = useRef(false)

  // Metadata state
  const [metadata, setMetadata] = useState<WebsiteMetadata | null>(null)
  const [metadataLoading, setMetadataLoading] = useState(false)
  const [metadataError, setMetadataError] = useState<string | null>(null)
  const [isInitialLoad, setIsInitialLoad] = useState(false)


  const { favorites } = useFavorites()
  const { history, addToHistory } = useHistory()

  // Load site from URL params on mount
  useEffect(() => {
    if (typeof window === 'undefined') return

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

  // Use metadata API to determine iframe status and auto-switch tabs
  useEffect(() => {
    if (metadata && views.length > 0) {
      const xFrameOptions = metadata.headers?.xFrameOptions
      const url = new URL(metadata.url)

      // Allow iframes for local/staging environments (likely user's own sites)
      const isLocalOrStaging =
        url.hostname === 'localhost' ||
        url.hostname === '127.0.0.1' ||
        url.hostname.includes('staging') ||
        url.hostname.includes('dev') ||
        url.hostname.includes('test') ||
        url.hostname.endsWith('.local')

      // If X-Frame-Options blocks iframe embedding and it's not a local/staging site
      if ((xFrameOptions === 'DENY' || xFrameOptions === 'SAMEORIGIN') && !isLocalOrStaging) {
        setViews(prevViews =>
          prevViews.map(view => ({
            ...view,
            iframeStatus: 'blocked' as IframeStatus,
            shouldLoad: false
          }))
        )
        // Only auto-switch to social tab if currently on viewports tab AND we haven't redirected yet
        if (selectedTab === 'viewports' && !hasRedirected.current && typeof window !== 'undefined') {
          hasRedirected.current = true
          setSelectedTab('social')
          // Update URL to match the new tab
          const searchParams = new URLSearchParams(window.location.search)
          const siteParam = searchParams.get('site')
          const newPath = `/social${siteParam ? `?site=${siteParam}` : ''}`
          window.history.pushState({}, '', newPath)
          toast.info('Viewports blocked by website - switched to social preview')
        }
      } else {
        // No blocking headers or local/staging site, allow iframes to load
        // Only set shouldLoad to true if it's currently false to prevent unnecessary rerenders
        setViews(prevViews =>
          prevViews.map(view => ({
            ...view,
            shouldLoad: view.shouldLoad !== false ? view.shouldLoad : true
          }))
        )
      }
    }
  }, [metadata])

  // Update URL parameters when URL input changes
  useEffect(() => {
    if (typeof window === 'undefined') return

    const timeoutId = setTimeout(() => {
      const urlParams = new URLSearchParams(window.location.search)

      if (url && url.trim()) {
        const formattedUrl = formatUrl(url, username, password)
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

  // Global zoom state - only 100% and above
  const zoomSteps = [1, 1.25, 1.5, 1.75, 2, 2.5, 3]
  const [globalZoomStepIndex, setGlobalZoomStepIndex] = useState(0) // Default to 100%
  const globalZoom = zoomSteps[globalZoomStepIndex]

  const setUrlWithHighlight = (url: string) => {
    setUrl(url)
    setIsInputHighlighted(true)
    setTimeout(() => setIsInputHighlighted(false), 1000)
  }


  const loadSiteInternal = async (formattedUrl: string) => {
    // Create all 4 viewports for comprehensive device testing
    // Start with shouldLoad: false to wait for X-Frame-Options check
    const newViews = [
      {
        id: nextId,
        url: formattedUrl,
        type: 'desktop' as ViewType,
        iframeStatus: 'loading' as IframeStatus,
        shouldLoad: false
      },
      {
        id: nextId + 1,
        url: formattedUrl,
        type: 'tablet' as ViewType,
        iframeStatus: 'loading' as IframeStatus,
        shouldLoad: false
      },
      {
        id: nextId + 2,
        url: formattedUrl,
        type: 'mobileLarge' as ViewType,
        iframeStatus: 'loading' as IframeStatus,
        shouldLoad: false
      },
      {
        id: nextId + 3,
        url: formattedUrl,
        type: 'mobile' as ViewType,
        iframeStatus: 'loading' as IframeStatus,
        shouldLoad: false
      }
    ]
    
    setViews(newViews)
    setCurrentSite(formattedUrl)
    setNextId(nextId + 4) // Increment by 4 for all viewports
    addToHistory(formattedUrl)
    setUrl(formattedUrl)

    // Reset redirect tracking for new site
    hasRedirected.current = false
    setIsInitialLoad(true)

    // Don't force reset to viewports - respect current URL/tab

    // Automatically start metadata extraction in the background
    fetchMetadata(formattedUrl)
  }

  const updateUrlParams = () => {
    if (typeof window === 'undefined') return

    const urlParams = new URLSearchParams(window.location.search)

    // Update site param based on current URL input
    if (url && url.trim()) {
      const formattedUrl = formatUrl(url, username, password)
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
    const formattedUrl = formatUrl(urlToUse, username, password)
    if (formattedUrl) {
      loadSiteInternal(formattedUrl)
      updateUrlParams()
      toast.success('Site loaded - analyzing...')
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
    const newView = { 
      ...view, 
      id: nextId
    }
    setViews(prevViews => [newView, ...prevViews])
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
    clearCredentials()
    // Clear URL params
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', window.location.pathname)
    }
    toast.success('Returned to homepage')
  }

  const clearCredentials = () => {
    setUsername('')
    setPassword('')
    setShowAuthFields(false)
    setShowAuthDialog(false)
    setAuthDialogUrl('')
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
    if (!targetUrl) {
      return
    }
    setMetadataLoading(true)
    setMetadataError(null)

    try {
      const response = await fetch(`/api/metadata?url=${encodeURIComponent(targetUrl)}`)
      const data = await response.json()

      if (data.success && data.data) {
        setMetadata(data.data)
      } else {
        // Check if this is a 401 authentication error
        if (data.status === 401 && !username && !password) {
          setAuthDialogUrl(targetUrl)
          setShowAuthDialog(true)
          return
        }
        setMetadataError(data.error || 'Failed to extract metadata')
        setMetadata(null)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setMetadataError(errorMessage)
      setMetadata(null)
    } finally {
      setMetadataLoading(false)
      setIsInitialLoad(false)
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
    formatUrl: (url) => formatUrl(url, username, password),
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
    setSelectedTab,
    isInitialLoad,
    username,
    password,
    showAuthFields,
    showAuthDialog,
    authDialogUrl,
    setUsername,
    setPassword,
    setShowAuthFields,
    setShowAuthDialog,
    setAuthDialogUrl,
    clearCredentials
  }

  return (
    <WebsiteViewerContext.Provider value={value}>
      {children}
    </WebsiteViewerContext.Provider>
  )
}

// Default context value for SSR/prerendering
const defaultContextValue: WebsiteViewerContextType = {
  url: '',
  setUrl: () => {},
  currentSite: null,
  views: [],
  isInputHighlighted: false,
  showSuggestions: false,
  filteredSuggestions: [],
  setShowSuggestions: () => {},
  handleUrlChange: () => {},
  handleKeyDown: () => {},
  selectSuggestion: () => {},
  formatUrl: () => null,
  loadSite: () => {},
  setUrlWithHighlight: () => {},
  removeView: () => {},
  changeViewType: () => {},
  duplicateView: () => {},
  globalZoom: 1,
  setGlobalZoomStepIndex: () => {},
  globalZoomStepIndex: 0,
  zoomSteps: [1],
  metadata: null,
  metadataLoading: false,
  metadataError: null,
  fetchMetadata: async () => {},
  clearMetadata: () => {},
  updateViewIframeStatus: () => {},
  clearSite: () => {},
  selectedTab: 'seo',
  setSelectedTab: () => {},
  isInitialLoad: true,
  username: '',
  password: '',
  showAuthFields: false,
  showAuthDialog: false,
  authDialogUrl: '',
  setUsername: () => {},
  setPassword: () => {},
  setShowAuthFields: () => {},
  setShowAuthDialog: () => {},
  setAuthDialogUrl: () => {},
  clearCredentials: () => {}
}

export function useWebsiteViewer () {
  const context = useContext(WebsiteViewerContext)
  if (context === undefined) {
    // Return default values during SSR/prerender
    return defaultContextValue
  }
  return context
}
