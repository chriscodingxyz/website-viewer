'use client'

import React from 'react'
import AuthDialog from './AuthDialog'
import { useWebsiteViewer } from '@/contexts/WebsiteViewerContext'

export default function AuthDialogWrapper() {
  const { showAuthDialog, setShowAuthDialog, authDialogUrl } = useWebsiteViewer()

  return (
    <AuthDialog
      isOpen={showAuthDialog}
      onClose={() => setShowAuthDialog(false)}
      url={authDialogUrl}
    />
  )
}