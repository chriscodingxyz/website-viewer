'use client'

import React from 'react'
import AuthDialog from './AuthDialog'
import { useWebsiteViewer } from '@/contexts/WebsiteViewerContext'

export default function AuthDialogWrapper() {
  const context = useWebsiteViewer()

  // Context not available during SSR or on error pages
  if (!context) return null

  const { showAuthDialog, setShowAuthDialog, authDialogUrl } = context

  return (
    <AuthDialog
      isOpen={showAuthDialog}
      onClose={() => setShowAuthDialog(false)}
      url={authDialogUrl}
    />
  )
}