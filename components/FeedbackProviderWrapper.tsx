'use client'

import { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { useWebsiteViewer } from '@/contexts/WebsiteViewerContext'
import { FeedbackProvider } from '@/contexts/FeedbackContext'

const workspacePrefixes = ['/dashboard', '/projects', '/p/']

export default function FeedbackProviderWrapper({
  children
}: {
  children: ReactNode
}) {
  const pathname = usePathname()
  const isWorkspace =
    pathname === '/' ||
    workspacePrefixes.some(prefix => pathname?.startsWith(prefix))

  const { currentSite } = useWebsiteViewer()

  if (isWorkspace) {
    return <>{children}</>
  }

  return <FeedbackProvider currentUrl={currentSite}>{children}</FeedbackProvider>
}
