'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react'
import { toast } from 'sonner'
import { useFavorites } from '@/contexts/FavoritesContext'
import { useHistory } from '@/contexts/HistoryContext'

export type ViewType = 'desktop' | 'tablet' | 'mobileLarge' | 'mobile'

export interface View {
  id: number
  url: string
  type: ViewType
  refreshKey?: number
}

const isValidUrl = (url: string): boolean => {
  const urlPattern =
    /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/
  const localhostPattern =
    /^(https?:\/\/)?(localhost|127\.0\.0\.1)(:\d+)?(\/.*)?$/
  return urlPattern.test(url) || localhostPattern.test(url)
}

const formatUrl = (inputUrl: string): string | null => {
  let formattedUrl = inputUrl.trim().toLowerCase()

  if (
    formattedUrl.includes('localhost') ||
    formattedUrl.includes('127.0.0.1')
  ) {
    if (
      !formattedUrl.startsWith('http://') &&
      !formattedUrl.startsWith('https://')
    ) {
      formattedUrl = 'http://' + formattedUrl
    }
    return isValidUrl(formattedUrl) ? formattedUrl : null
  }

  if (
    !formattedUrl.startsWith('http://') &&
    !formattedUrl.startsWith('https://')
  ) {
    formattedUrl = 'https://' + formattedUrl
  }

  return isValidUrl(formattedUrl) ? formattedUrl : null
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
  views: View[]
  isInputHighlighted: boolean
  showSuggestions: boolean
  filteredSuggestions: string[]
  setShowSuggestions: (show: boolean) => void
  handleUrlChange: (value: string) => void
  handleKeyDown: (e: React.KeyboardEvent) => void
  selectSuggestion: (suggestion: string) => void
  formatUrl: (url: string) => string | null
  addAllViews: () => void
  addView: (type: ViewType) => void
  setUrlWithHighlight: (url: string) => void
  clearAllViews: () => void
  removeView: (id: number) => void
  changeViewType: (id: number, type: ViewType) => void
  duplicateView: (view: View) => void
  openAccordionItems: string[]
  setOpenAccordionItems: (items: string[] | ((prev: string[]) => string[])) => void
  globalZoom: number
  setGlobalZoomStepIndex: (index: number) => void
  globalZoomStepIndex: number
  zoomSteps: number[]
}

const WebsiteViewerContext = createContext<WebsiteViewerContextType | undefined>(undefined)

export function WebsiteViewerProvider({ children }: { children: ReactNode }) {
  const [url, setUrl] = useState('')
  const [views, setViews] = useState<View[]>([])
  const [nextId, setNextId] = useState(1)
  const [isInputHighlighted, setIsInputHighlighted] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([])
  const [openAccordionItems, setOpenAccordionItems] = useState<string[]>([])
  
  const { favorites } = useFavorites()
  const { history, addToHistory } = useHistory()

  // Global zoom state
  const zoomSteps = [0.5, 0.75, 1, 1.25, 1.5, 2]
  const [globalZoomStepIndex, setGlobalZoomStepIndex] = useState(2) // Default to 100%
  const globalZoom = zoomSteps[globalZoomStepIndex]

  const setUrlWithHighlight = (url: string) => {
    setUrl(url)
    setIsInputHighlighted(true)
    setTimeout(() => setIsInputHighlighted(false), 1000)
    toast.success('URL added to the viewer')
  }

  const addView = (viewType: ViewType = 'desktop') => {
    const formattedUrl = formatUrl(url)
    if (formattedUrl) {
      setViews(prevViews => [
        { id: nextId, url: formattedUrl, type: viewType },
        ...prevViews
      ])
      setNextId(nextId + 1)
      addToHistory(formattedUrl)
      setUrl('')
      // Auto-open accordion for this URL
      setOpenAccordionItems(prev =>
        prev.includes(formattedUrl) ? prev : [...prev, formattedUrl]
      )
      toast.success(`New ${viewType} view added`)
    } else {
      toast.error('Please enter a valid URL')
    }
  }

  const addAllViews = () => {
    const formattedUrl = formatUrl(url)
    if (formattedUrl) {
      setViews(prevViews => [
        { id: nextId, url: formattedUrl, type: 'desktop' },
        { id: nextId + 1, url: formattedUrl, type: 'tablet' },
        { id: nextId + 2, url: formattedUrl, type: 'mobileLarge' },
        { id: nextId + 3, url: formattedUrl, type: 'mobile' },
        ...prevViews
      ])
      setNextId(nextId + 4)
      addToHistory(formattedUrl)
      setUrl('')
      // Auto-open accordion for this URL
      setOpenAccordionItems(prev =>
        prev.includes(formattedUrl) ? prev : [...prev, formattedUrl]
      )
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

  const clearAllViews = () => {
    setViews([])
    setOpenAccordionItems([])
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
      setShowSuggestions(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && url.trim()) {
      addAllViews()
    }
  }

  const selectSuggestion = (suggestion: string) => {
    setUrl(suggestion)
    setShowSuggestions(false)
  }

  const value: WebsiteViewerContextType = {
    url,
    setUrl,
    views,
    isInputHighlighted,
    showSuggestions,
    filteredSuggestions,
    setShowSuggestions,
    handleUrlChange,
    handleKeyDown,
    selectSuggestion,
    formatUrl,
    addAllViews,
    addView,
    setUrlWithHighlight,
    clearAllViews,
    removeView,
    changeViewType,
    duplicateView,
    openAccordionItems,
    setOpenAccordionItems,
    globalZoom,
    setGlobalZoomStepIndex,
    globalZoomStepIndex,
    zoomSteps
  }

  return (
    <WebsiteViewerContext.Provider value={value}>
      {children}
    </WebsiteViewerContext.Provider>
  )
}

export function useWebsiteViewer() {
  const context = useContext(WebsiteViewerContext)
  if (context === undefined) {
    throw new Error('useWebsiteViewer must be used within a WebsiteViewerProvider')
  }
  return context
}