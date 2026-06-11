'use client'

import { useState, useEffect, useCallback } from 'react'

export type GuestProfile = { token: string; name: string; email?: string }

const PROFILE_KEY = 'bugsmash:guest:profile'
const PINS_KEY = 'bugsmash:guest:pins'

function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function writeStorage(key: string, value: unknown) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {}
}

export function useGuestIdentity(activeSlug?: string) {
  const [profile, setProfile] = useState<GuestProfile | null>(null)
  const [pinRegistry, setPinRegistry] = useState<Record<string, string[]>>({})

  useEffect(() => {
    setProfile(readStorage<GuestProfile | null>(PROFILE_KEY, null))
    setPinRegistry(readStorage<Record<string, string[]>>(PINS_KEY, {}))
  }, [])

  const saveProfile = useCallback((name: string, email?: string) => {
    setProfile(prev => {
      const token = prev?.token ?? crypto.randomUUID()
      const next: GuestProfile = { token, name, email }
      writeStorage(PROFILE_KEY, next)
      return next
    })
  }, [])

  const registerOwnPin = useCallback((slug: string, id: string) => {
    setPinRegistry(prev => {
      const next = { ...prev, [slug]: [...(prev[slug] ?? []), id] }
      writeStorage(PINS_KEY, next)
      return next
    })
  }, [])

  const unregisterOwnPin = useCallback((slug: string, id: string) => {
    setPinRegistry(prev => {
      const next = { ...prev, [slug]: (prev[slug] ?? []).filter(x => x !== id) }
      writeStorage(PINS_KEY, next)
      return next
    })
  }, [])

  const ownPinIds: Set<string> = new Set(activeSlug ? (pinRegistry[activeSlug] ?? []) : [])

  return { profile, saveProfile, ownPinIds, registerOwnPin, unregisterOwnPin }
}
