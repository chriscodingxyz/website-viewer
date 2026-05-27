'use client'

import { useEffect } from 'react'
import { useFeedback } from '@/contexts/FeedbackContext'
import { useWebsiteViewer } from '@/contexts/WebsiteViewerContext'

const isTypingTarget = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true
  if (target.isContentEditable) return true
  return false
}

export default function FeedbackKeyboard() {
  const { currentSite } = useWebsiteViewer()
  const {
    feedbackMode,
    toggleFeedbackMode,
    setFeedbackMode,
    setExportOpen,
    setActiveTool,
    pins,
    canEdit
  } = useFeedback()

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (isTypingTarget(e.target)) return
      if (!currentSite) return

      if (canEdit && (e.key === 'f' || e.key === 'F')) {
        e.preventDefault()
        toggleFeedbackMode()
      } else if (canEdit && e.key === 'Escape' && feedbackMode) {
        e.preventDefault()
        setFeedbackMode(false)
      } else if (canEdit && (e.key === 'c' || e.key === 'C') && feedbackMode) {
        e.preventDefault()
        setActiveTool('comment')
      } else if (canEdit && (e.key === 'i' || e.key === 'I') && feedbackMode) {
        e.preventDefault()
        setActiveTool('inspect')
      } else if ((e.key === 'e' || e.key === 'E') && pins.length > 0) {
        e.preventDefault()
        setExportOpen(true)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [
    currentSite,
    feedbackMode,
    toggleFeedbackMode,
    setFeedbackMode,
    setExportOpen,
    setActiveTool,
    pins.length,
    canEdit
  ])

  return null
}
