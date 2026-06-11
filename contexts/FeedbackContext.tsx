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
import { toast } from 'sonner'
import { FeedbackSession, FeedbackTool, Pin, Severity } from '@/types/feedback'
import { useActiveOrganization, useSession } from '@/lib/auth-client'
import { useGuestIdentity, type GuestProfile } from '@/hooks/useGuestIdentity'

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
    .map((p, i) => ({ ...p, status: p.status ?? 'open', number: i + 1 }))

const normalizeSession = (session: FeedbackSession): FeedbackSession => ({
  ...session,
  pins: renumber(session.pins)
})

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
  addPin: (pin: Omit<Pin, 'id' | 'number' | 'status' | 'createdAt'>) => Pin
  updatePin: (id: string, patch: Partial<Pin>) => void
  removePin: (id: string) => void
  clearPins: () => void
  isPanelOpen: boolean
  setPanelOpen: (open: boolean) => void
  isExportOpen: boolean
  setExportOpen: (open: boolean) => void
  syncEnabled: boolean
  isSyncing: boolean
  canEdit: boolean
  projectMode: boolean
  createShareLink: () => Promise<string | null>
  triggerSnapshots: () => Promise<void>
  // Guest mode
  isGuest: boolean
  guest: { slug: string; accessLevel: 'view' | 'comment' } | null
  guestProfile: GuestProfile | null
  saveGuestProfile: (name: string, email?: string) => void
  identityPromptOpen: boolean
  setIdentityPromptOpen: (open: boolean) => void
  canModifyPin: (pin: Pin) => boolean
  canChangeStatus: boolean
}

const FeedbackContext = createContext<FeedbackContextValue | undefined>(
  undefined
)

interface ProviderProps {
  children: ReactNode
  currentUrl: string | null
  projectId?: string
  initialSession?: FeedbackSession | null
  canEdit?: boolean
  guest?: { slug: string; accessLevel: 'view' | 'comment' }
}

export function FeedbackProvider({
  children,
  currentUrl,
  projectId,
  initialSession,
  canEdit = true,
  guest
}: ProviderProps) {
  const [feedbackMode, setFeedbackModeState] = useState(false)
  const [activeTool, setActiveTool] = useState<FeedbackTool>('comment')
  const [session, setSession] = useState<FeedbackSession | null>(null)
  const [selectedPinId, setSelectedPinId] = useState<string | null>(null)
  const [isPanelOpen, setPanelOpen] = useState(false)
  const [isExportOpen, setExportOpen] = useState(false)
  const [identityPromptOpen, setIdentityPromptOpen] = useState(false)
  const lastUrlRef = useRef<string | null>(null)
  const projectMode = Boolean(projectId)
  const skipNextProjectSyncRef = useRef(false)

  const isGuest = Boolean(guest)
  const guestCanComment = guest?.accessLevel === 'comment'

  // Always call hook — hooks must not be conditional
  const { profile: guestProfile, saveProfile, ownPinIds, registerOwnPin, unregisterOwnPin } =
    useGuestIdentity(guest?.slug)

  useEffect(() => {
    if (projectMode) {
      if (!currentUrl) {
        setSession(null)
        lastUrlRef.current = null
        return
      }

      const seededSession = initialSession ?? {
        ...emptySession(currentUrl),
        projectId
      }
      setSession(normalizeSession(seededSession))
      lastUrlRef.current = currentUrl
      skipNextProjectSyncRef.current = true
      return
    }

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
        setSession(normalizeSession(parsed))
      } else {
        setSession(emptySession(currentUrl))
      }
    } catch {
      setSession(emptySession(currentUrl))
    }
  }, [currentUrl, initialSession, projectId, projectMode])

  useEffect(() => {
    if (!session || projectMode) return
    try {
      window.localStorage.setItem(sessionKey(session.url), JSON.stringify(session))
    } catch {
      // localStorage full or unavailable; silent fail
    }
  }, [session, projectMode])

  const toggleFeedbackMode = useCallback(() => {
    if (!canEdit) return
    if (isGuest && guestCanComment && !guestProfile) {
      setIdentityPromptOpen(true)
      return
    }
    setFeedbackModeState(v => !v)
  }, [canEdit, isGuest, guestCanComment, guestProfile])

  const setFeedbackMode = useCallback((on: boolean) => {
    if (!canEdit && on) return
    if (on && isGuest && guestCanComment && !guestProfile) {
      setIdentityPromptOpen(true)
      return
    }
    setFeedbackModeState(on)
  }, [canEdit, isGuest, guestCanComment, guestProfile])

  const authSession = useSession()
  const activeProject = useActiveOrganization()
  const signedInUser = authSession.data?.user ?? null

  const saveGuestProfile = useCallback((name: string, email?: string) => {
    saveProfile(name, email)
  }, [saveProfile])

  // Per-pin guest update debounce map
  const guestUpdateTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  const addPin: FeedbackContextValue['addPin'] = useCallback(input => {
    const dummyPin = {
      ...input,
      id: '',
      number: 0,
      status: 'open' as const,
      createdAt: new Date().toISOString()
    }

    if (!canEdit) return dummyPin

    // Guest path
    if (isGuest && guest) {
      if (!guestProfile) {
        setIdentityPromptOpen(true)
        return dummyPin
      }
      const created: Pin = {
        ...input,
        id: newId(),
        number: 0,
        status: 'open',
        authorUserId: undefined,
        authorName: guestProfile.name,
        authorEmail: guestProfile.email,
        isGuest: true,
        createdAt: new Date().toISOString()
      }
      setSession(prev => {
        if (!prev) return prev
        const pins = renumber([...prev.pins, created])
        return { ...prev, pins, updatedAt: new Date().toISOString() }
      })
      setSelectedPinId(created.id)
      registerOwnPin(guest.slug, created.id)

      // Fire-and-forget to guest API
      fetch(`/api/share/${guest.slug}/pins`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-guest-token': guestProfile.token
        },
        body: JSON.stringify({
          ...created,
          authorName: guestProfile.name,
          authorEmail: guestProfile.email
        })
      }).then(res => {
        if (!res.ok) {
          setSession(prev => {
            if (!prev) return prev
            const pins = renumber(prev.pins.filter(p => p.id !== created.id))
            return { ...prev, pins, updatedAt: new Date().toISOString() }
          })
          unregisterOwnPin(guest.slug, created.id)
          toast.error('Could not save pin')
        }
      }).catch(() => {
        setSession(prev => {
          if (!prev) return prev
          const pins = renumber(prev.pins.filter(p => p.id !== created.id))
          return { ...prev, pins, updatedAt: new Date().toISOString() }
        })
        unregisterOwnPin(guest.slug, created.id)
        toast.error('Could not save pin')
      })

      return created
    }

    // Member path
    const created: Pin = {
      ...input,
      id: newId(),
      number: 0,
      status: 'open',
      authorUserId: signedInUser?.id,
      authorName: signedInUser?.name ?? signedInUser?.email ?? undefined,
      authorEmail: signedInUser?.email ?? undefined,
      createdAt: new Date().toISOString()
    }
    setSession(prev => {
      if (!prev) return prev
      const pins = renumber([...prev.pins, created])
      return { ...prev, pins, updatedAt: new Date().toISOString() }
    })
    setSelectedPinId(created.id)
    return created
  }, [canEdit, isGuest, guest, guestProfile, signedInUser, registerOwnPin, unregisterOwnPin])

  const updatePin = useCallback((id: string, patch: Partial<Pin>) => {
    if (isGuest) {
      if (!guestCanComment || !ownPinIds.has(id)) return
      // Apply locally
      setSession(prev => {
        if (!prev) return prev
        const pins = prev.pins.map(p => (p.id === id ? { ...p, ...patch } : p))
        return { ...prev, pins, updatedAt: new Date().toISOString() }
      })
      // Debounced PATCH to guest API
      if (!guest || !guestProfile) return
      const timers = guestUpdateTimersRef.current
      const existing = timers.get(id)
      if (existing) clearTimeout(existing)
      const timer = setTimeout(() => {
        timers.delete(id)
        fetch(`/api/share/${guest.slug}/pins/${id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'x-guest-token': guestProfile.token
          },
          body: JSON.stringify({
            comment: patch.comment,
            severity: patch.severity,
            replacementText: patch.replacementText,
            editInstruction: patch.editInstruction
          })
        }).catch(() => {})
      }, 1000)
      timers.set(id, timer)
      return
    }
    if (!canEdit) return
    setSession(prev => {
      if (!prev) return prev
      const pins = prev.pins.map(p => (p.id === id ? { ...p, ...patch } : p))
      return { ...prev, pins, updatedAt: new Date().toISOString() }
    })
  }, [canEdit, isGuest, guestCanComment, ownPinIds, guest, guestProfile])

  const removePin = useCallback((id: string) => {
    if (isGuest) {
      if (!guestCanComment || !ownPinIds.has(id)) return
      const removedPin = session?.pins.find(p => p.id === id)
      setSession(prev => {
        if (!prev) return prev
        const pins = renumber(prev.pins.filter(p => p.id !== id))
        return { ...prev, pins, updatedAt: new Date().toISOString() }
      })
      setSelectedPinId(curr => (curr === id ? null : curr))
      if (guest) {
        unregisterOwnPin(guest.slug, id)
        if (guestProfile) {
          fetch(`/api/share/${guest.slug}/pins/${id}`, {
            method: 'DELETE',
            headers: { 'x-guest-token': guestProfile.token }
          }).catch(() => {})
        }
      }
      void removedPin
      return
    }
    if (!canEdit) return
    const removedPin = session?.pins.find(p => p.id === id)
    setSession(prev => {
      if (!prev) return prev
      const pins = renumber(prev.pins.filter(p => p.id !== id))
      return { ...prev, pins, updatedAt: new Date().toISOString() }
    })
    setSelectedPinId(curr => (curr === id ? null : curr))
    // Member deleting a guest pin: bulk sync skips guest pins so fire explicit DELETE
    if (projectMode && projectId && removedPin?.isGuest) {
      fetch(`/api/projects/${projectId}/pins/${id}`, { method: 'DELETE' }).catch(() => {})
    }
  }, [canEdit, isGuest, guestCanComment, ownPinIds, guest, guestProfile, session, projectMode, projectId, unregisterOwnPin])

  const clearPins = useCallback(() => {
    if (!canEdit) return
    setSession(prev => {
      if (!prev) return prev
      return { ...prev, pins: [], updatedAt: new Date().toISOString() }
    })
    setSelectedPinId(null)
  }, [canEdit])

  const pins = useMemo(() => session?.pins ?? [], [session])

  const activeProjectId =
    activeProject.data?.id ??
    authSession.data?.session.activeOrganizationId ??
    null

  // Guests never hit the bulk PUT
  const canSync = projectMode
    ? Boolean(projectId && canEdit && !isGuest)
    : SYNC_ENABLED && !!signedInUser && !!activeProjectId

  const [isSyncing, setIsSyncing] = useState(false)
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const snapshotRunRef = useRef(false)

  const triggerSnapshots = useCallback(async () => {
    if (isGuest) return
    if (!projectMode || !projectId || snapshotRunRef.current) return
    snapshotRunRef.current = true
    try {
      const res = await fetch(`/api/projects/${projectId}/snapshots`, {
        method: 'POST'
      })
      if (!res.ok) return
      const data = (await res.json()) as {
        snapshots?: Array<{ pinId: string; snapshot: Pin['snapshot'] }>
      }
      const byPin = new Map(
        (data.snapshots ?? []).map(item => [item.pinId, item.snapshot])
      )
      if (!byPin.size) return
      setSession(prev => {
        if (!prev) return prev
        let changed = false
        const pins = prev.pins.map(pin => {
          const next = byPin.get(pin.id)
          if (!next) return pin
          if (JSON.stringify(pin.snapshot ?? null) === JSON.stringify(next ?? null)) {
            return pin
          }
          changed = true
          return { ...pin, snapshot: next }
        })
        if (!changed) return prev
        skipNextProjectSyncRef.current = true
        return { ...prev, pins }
      })
    } catch {
      // capture is best-effort; pins remain fully usable without snapshots
    } finally {
      snapshotRunRef.current = false
    }
  }, [isGuest, projectId, projectMode])

  useEffect(() => {
    if (!canSync || !session) return
    if (!projectMode && session.pins.length === 0) return
    if (projectMode && skipNextProjectSyncRef.current) {
      skipNextProjectSyncRef.current = false
      return
    }

    if (syncTimerRef.current) clearTimeout(syncTimerRef.current)
    syncTimerRef.current = setTimeout(async () => {
      try {
        setIsSyncing(true)
        const syncUrl = projectMode && projectId
          ? `/api/projects/${projectId}/feedback`
          : `/api/feedback/sessions/${session.id}`

        await fetch(syncUrl, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...session,
            projectId: projectMode ? projectId : activeProjectId
          })
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
  }, [session, canSync, activeProjectId, projectId, projectMode, triggerSnapshots])

  const createShareLink = useCallback(async (): Promise<string | null> => {
    // Guest mode: share the current /s/ URL
    if (isGuest && guest) {
      return `${window.location.origin}/s/${guest.slug}`
    }

    if (projectMode && projectId) {
      if (canEdit && session) {
        try {
          await fetch(`/api/projects/${projectId}/feedback`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...session, projectId })
          })
        } catch {
          // Link is still useful; sync failures are reflected by stale content.
        }
      }
      return `${window.location.origin}/p/${projectId}`
    }

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
  }, [isGuest, guest, canSync, session, activeProjectId, projectId, projectMode, canEdit])

  const canModifyPin = useCallback((pin: Pin): boolean => {
    if (isGuest) return guestCanComment && ownPinIds.has(pin.id)
    return canEdit
  }, [isGuest, guestCanComment, ownPinIds, canEdit])

  const canChangeStatus = canEdit && !isGuest

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
    syncEnabled: projectMode || canSync,
    isSyncing,
    canEdit,
    projectMode,
    createShareLink,
    triggerSnapshots,
    isGuest,
    guest: guest ?? null,
    guestProfile,
    saveGuestProfile,
    identityPromptOpen,
    setIdentityPromptOpen,
    canModifyPin,
    canChangeStatus
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
      canEdit: false,
      projectMode: false,
      createShareLink: async () => null,
      triggerSnapshots: async () => {},
      isGuest: false,
      guest: null,
      guestProfile: null,
      saveGuestProfile: () => {},
      identityPromptOpen: false,
      setIdentityPromptOpen: () => {},
      canModifyPin: () => false,
      canChangeStatus: false
    }
  }
  return ctx
}

export type { Severity }
