'use client'

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  ReactNode
} from 'react'
import { FeedbackSession, FeedbackTool, Pin, Severity } from '@/types/feedback'
import { useActiveOrganization, useSession } from '@/lib/auth-client'

const STORAGE_PREFIX = 'feedback:session:'
const SYNC_ENABLED = process.env.NEXT_PUBLIC_FEEDBACK_SYNC === 'on'
const SYNC_DEBOUNCE_MS = 1500

const hashUrl = (url: string): string => {
  let hash = 0
  for (let i = 0; i < url.length; i++) {
    hash = (hash << 5) - hash + url.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash).toString(36)
}

const sessionKey = (url: string) => `${STORAGE_PREFIX}${hashUrl(url)}`

const newId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

const emptySession = (url: string): FeedbackSession => ({
  id: newId(),
  url,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  pins: [],
  meta: {
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    capturedViewports: []
  }
})

const renumber = (pins: Pin[]): Pin[] =>
  pins
    .slice()
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .map((p, i) => ({ ...p, number: i + 1 }))

interface FeedbackContextValue {
  feedbackMode: boolean
  toggleFeedbackMode: () => void
  setFeedbackMode: (on: boolean) => void
  activeTool: FeedbackTool
  setActiveTool: (t: FeedbackTool) => void
  session: FeedbackSession | null
  pins: Pin[]
  selectedPinId: string | null
  setSelectedPinId: (id: string | null) => void
  addPin: (pin: Omit<Pin, 'id' | 'number' | 'createdAt'>) => Pin
  updatePin: (id: string, patch: Partial<Pin>) => void
  removePin: (id: string) => void
  clearPins: () => void
  isPanelOpen: boolean
  setPanelOpen: (open: boolean) => void
  isExportOpen: boolean
  setExportOpen: (open: boolean) => void
  syncEnabled: boolean
  isSyncing: boolean
  createShareLink: () => Promise<string | null>
}

const FeedbackContext = createContext<FeedbackContextValue | undefined>(
  undefined
)

interface ProviderProps {
  children: ReactNode
  currentUrl: string | null
}

export function FeedbackProvider({ children, currentUrl }: ProviderProps) {
  const [feedbackMode, setFeedbackModeState] = useState(false)
  const [activeTool, setActiveTool] = useState<FeedbackTool>('comment')
  const [session, setSession] = useState<FeedbackSession | null>(null)
  const [selectedPinId, setSelectedPinId] = useState<string | null>(null)
  const [isPanelOpen, setPanelOpen] = useState(false)
  const [isExportOpen, setExportOpen] = useState(false)
  const lastUrlRef = useRef<string | null>(null)

  useEffect(() => {
    if (!currentUrl) {
      setSession(null)
      lastUrlRef.current = null
      return
    }
    if (lastUrlRef.current === currentUrl) return
    lastUrlRef.current = currentUrl

    try {
      const raw = window.localStorage.getItem(sessionKey(currentUrl))
      if (raw) {
        const parsed = JSON.parse(raw) as FeedbackSession
        setSession(parsed)
      } else {
        setSession(emptySession(currentUrl))
      }
    } catch {
      setSession(emptySession(currentUrl))
    }
  }, [currentUrl])

  useEffect(() => {
    if (!session) return
    try {
      window.localStorage.setItem(sessionKey(session.url), JSON.stringify(session))
    } catch {
      // localStorage full or unavailable; silent fail
    }
  }, [session])

  const toggleFeedbackMode = useCallback(() => {
    setFeedbackModeState(v => !v)
  }, [])

  const setFeedbackMode = useCallback((on: boolean) => {
    setFeedbackModeState(on)
  }, [])

  const addPin: FeedbackContextValue['addPin'] = useCallback(input => {
    const created: Pin = {
      ...input,
      id: newId(),
      number: 0,
      createdAt: new Date().toISOString()
    }
    setSession(prev => {
      if (!prev) return prev
      const pins = renumber([...prev.pins, created])
      return { ...prev, pins, updatedAt: new Date().toISOString() }
    })
    setSelectedPinId(created.id)
    return created
  }, [])

  const updatePin = useCallback((id: string, patch: Partial<Pin>) => {
    setSession(prev => {
      if (!prev) return prev
      const pins = prev.pins.map(p => (p.id === id ? { ...p, ...patch } : p))
      return { ...prev, pins, updatedAt: new Date().toISOString() }
    })
  }, [])

  const removePin = useCallback((id: string) => {
    setSession(prev => {
      if (!prev) return prev
      const pins = renumber(prev.pins.filter(p => p.id !== id))
      return { ...prev, pins, updatedAt: new Date().toISOString() }
    })
    setSelectedPinId(curr => (curr === id ? null : curr))
  }, [])

  const clearPins = useCallback(() => {
    setSession(prev => {
      if (!prev) return prev
      return { ...prev, pins: [], updatedAt: new Date().toISOString() }
    })
    setSelectedPinId(null)
  }, [])

  const pins = useMemo(() => session?.pins ?? [], [session])

  const authSession = useSession()
  const activeProject = useActiveOrganization()
  const signedInUser = authSession.data?.user ?? null
  const activeProjectId =
    activeProject.data?.id ??
    authSession.data?.session.activeOrganizationId ??
    null
  const canSync = SYNC_ENABLED && !!signedInUser && !!activeProjectId
  const [isSyncing, setIsSyncing] = useState(false)
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!canSync || !session || session.pins.length === 0) return
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current)
    syncTimerRef.current = setTimeout(async () => {
      try {
        setIsSyncing(true)
        await fetch(`/api/feedback/sessions/${session.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...session, projectId: activeProjectId })
        })
      } catch {
        // silent — localStorage still holds truth
      } finally {
        setIsSyncing(false)
      }
    }, SYNC_DEBOUNCE_MS)
    return () => {
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current)
    }
  }, [session, canSync, activeProjectId])

  const createShareLink = useCallback(async (): Promise<string | null> => {
    if (!canSync || !session || !activeProjectId) return null
    try {
      const res = await fetch(`/api/feedback/sessions/${session.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...session, projectId: activeProjectId })
      })
      if (!res.ok) return null
      const lookup = await fetch(`/api/feedback/sessions/${session.id}`)
      if (!lookup.ok) return null
      const data = await lookup.json()
      const slug = data.session?.slug
      if (!slug) return null
      return `${window.location.origin}/s/${slug}`
    } catch {
      return null
    }
  }, [canSync, session, activeProjectId])

  const value: FeedbackContextValue = {
    feedbackMode,
    toggleFeedbackMode,
    setFeedbackMode,
    activeTool,
    setActiveTool,
    session,
    pins,
    selectedPinId,
    setSelectedPinId,
    addPin,
    updatePin,
    removePin,
    clearPins,
    isPanelOpen,
    setPanelOpen,
    isExportOpen,
    setExportOpen,
    syncEnabled: canSync,
    isSyncing,
    createShareLink
  }

  return (
    <FeedbackContext.Provider value={value}>
      {children}
    </FeedbackContext.Provider>
  )
}

export function useFeedback(): FeedbackContextValue {
  const ctx = useContext(FeedbackContext)
  if (!ctx) {
    return {
      feedbackMode: false,
      toggleFeedbackMode: () => {},
      setFeedbackMode: () => {},
      activeTool: 'comment',
      setActiveTool: () => {},
      session: null,
      pins: [],
      selectedPinId: null,
      setSelectedPinId: () => {},
      addPin: () => ({
        id: '',
        number: 0,
        kind: 'comment',
        url: '',
        viewportId: 0,
        viewportType: 'desktop',
        viewportWidth: 0,
        viewportHeight: 0,
        x: 0,
        y: 0,
        severity: 'medium',
        comment: '',
        createdAt: new Date().toISOString()
      }),
      updatePin: () => {},
      removePin: () => {},
      clearPins: () => {},
      isPanelOpen: false,
      setPanelOpen: () => {},
      isExportOpen: false,
      setExportOpen: () => {},
      syncEnabled: false,
      isSyncing: false,
      createShareLink: async () => null
    }
  }
  return ctx
}

export type { Severity }
