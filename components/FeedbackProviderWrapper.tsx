'use client'

import { ReactNode } from 'react'
import { useWebsiteViewer } from '@/contexts/WebsiteViewerContext'
import { FeedbackProvider } from '@/contexts/FeedbackContext'

export default function FeedbackProviderWrapper({
  children
}: {
  children: ReactNode
}) {
  const { currentSite } = useWebsiteViewer()
  return <FeedbackProvider currentUrl={currentSite}>{children}</FeedbackProvider>
}
