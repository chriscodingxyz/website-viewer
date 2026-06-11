'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Pin } from '@/types/feedback'
import { FeedbackProvider, useFeedback } from '@/contexts/FeedbackContext'
import type { FeedbackSession } from '@/types/feedback'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@/components/ui/sheet'
import { toast } from 'sonner'
import {
  ArrowSquareOut,
  Export,
  Eye,
  Gear,
  LinkSimple,
  ListBullets,
  ShieldCheck,
  Users
} from '@phosphor-icons/react'
import ProjectCanvas from './ProjectCanvas'
import ProjectCommentPanel from './ProjectCommentPanel'
import ProjectSeoPreview from './ProjectSeoPreview'
import ExportDialog from '@/components/feedback/ExportDialog'
import FeedbackKeyboard from '@/components/feedback/FeedbackKeyboard'
import SiteFavicon from '@/components/SiteFavicon'
import {
  canonicalFeedbackUrl,
  feedbackPath,
  sameFeedbackUrl
} from '@/lib/feedback/url'
import { useProjectPageNav } from '@/components/bugsmash/ProjectPageNavContext'

type ProjectSummary = {
  id: string
  name: string
  websiteUrl: string
  publicAccess: string
}

interface Props {
  project: ProjectSummary
  role: string | null
  canEdit: boolean
  publicView: boolean
  initialSession: FeedbackSession
  aiVerifyEnabled?: boolean
}

function hostFor(websiteUrl: string) {
  try {
    return new URL(websiteUrl).hostname.replace(/^www\./, '')
  } catch {
    return websiteUrl
  }
}

export default function ProjectWorkspace({
  project,
  role,
  canEdit,
  publicView,
  initialSession,
  aiVerifyEnabled = false
}: Props) {
  const host = hostFor(project.websiteUrl)
  const [currentPageUrl, setCurrentPageUrl] = useState<string>(project.websiteUrl)
  const [pendingJump, setPendingJump] = useState<{
    pin: Pin
    requestId: number
  } | null>(null)
  const [pendingNavigation, setPendingNavigation] = useState<{
    url: string
    requestId: number
  } | null>(null)
  const [tasksSheetOpen, setTasksSheetOpen] = useState(false)

  const handlePageUrlChange = useCallback((url: string) => {
    setCurrentPageUrl(url)
  }, [])
  const handleJumpToPin = useCallback((pin: Pin) => {
    setPendingJump(prev => ({
      pin,
      requestId: (prev?.requestId ?? 0) + 1
    }))
    setTasksSheetOpen(false)
  }, [])
  const handleJumpHandled = useCallback(() => {
    setPendingJump(null)
  }, [])
  const handleNavigateToPage = useCallback((url: string) => {
    setPendingNavigation(prev => ({
      url,
      requestId: (prev?.requestId ?? 0) + 1
    }))
    setTasksSheetOpen(false)
  }, [])
  const handleNavigationHandled = useCallback(() => {
    setPendingNavigation(null)
  }, [])

  return (
    <FeedbackProvider
      currentUrl={project.websiteUrl}
      projectId={project.id}
      initialSession={initialSession}
      canEdit={canEdit}
    >
      <div className='flex h-[calc(100vh-3.5rem)] flex-col overflow-hidden bg-background'>
        <WorkspaceHeader
          project={project}
          host={host}
          role={role}
          canEdit={canEdit}
          publicView={publicView}
          currentPageUrl={currentPageUrl}
        />

        {/* Desktop: side-by-side with fixed tasks width */}
        <div className='hidden min-h-0 flex-1 overflow-hidden xl:flex'>
          <div className='min-w-0 flex-1'>
            <ProjectCanvas
              websiteUrl={project.websiteUrl}
              onPageUrlChange={handlePageUrlChange}
              jumpToPin={pendingJump}
              onJumpHandled={handleJumpHandled}
              pendingNavigation={pendingNavigation}
              onNavigationHandled={handleNavigationHandled}
            />
          </div>
          <aside className='flex h-full w-[340px] shrink-0 flex-col border-l border-border/60 bg-background 2xl:w-[380px]'>
            <ProjectCommentPanel
              projectId={project.id}
              currentPageUrl={currentPageUrl}
              projectWebsiteUrl={project.websiteUrl}
              onJumpToPin={handleJumpToPin}
              aiVerifyEnabled={aiVerifyEnabled}
            />
          </aside>
        </div>

        {/* Compact: canvas full width + Tasks Sheet */}
        <div className='flex min-h-0 flex-1 flex-col overflow-hidden xl:hidden'>
          <div className='min-h-0 flex-1'>
            <ProjectCanvas
              websiteUrl={project.websiteUrl}
              onPageUrlChange={handlePageUrlChange}
              jumpToPin={pendingJump}
              onJumpHandled={handleJumpHandled}
              pendingNavigation={pendingNavigation}
              onNavigationHandled={handleNavigationHandled}
            />
          </div>
          <CompactTasksTrigger
            open={tasksSheetOpen}
            onOpenChange={setTasksSheetOpen}
            projectId={project.id}
            currentPageUrl={currentPageUrl}
            projectWebsiteUrl={project.websiteUrl}
            onJumpToPin={handleJumpToPin}
            aiVerifyEnabled={aiVerifyEnabled}
          />
        </div>

        <ExportDialog />
        <FeedbackKeyboard />
        <ProjectPageNavPublisher
          projectId={project.id}
          currentPageUrl={currentPageUrl}
          projectWebsiteUrl={project.websiteUrl}
          onNavigateToPage={handleNavigateToPage}
        />
      </div>
    </FeedbackProvider>
  )
}

type PageGroup = {
  url: string
  pins: Pin[]
  lastUpdated: string
}

function ProjectPageNavPublisher({
  projectId,
  currentPageUrl,
  projectWebsiteUrl,
  onNavigateToPage
}: {
  projectId: string
  currentPageUrl: string
  projectWebsiteUrl: string
  onNavigateToPage: (url: string) => void
}) {
  const { pins } = useFeedback()
  const { setNav } = useProjectPageNav()

  const pageGroups = useMemo<PageGroup[]>(() => {
    const groups = new Map<string, PageGroup>()
    const homeUrl = canonicalFeedbackUrl(projectWebsiteUrl)
    const activeUrl = canonicalFeedbackUrl(currentPageUrl, projectWebsiteUrl)

    groups.set(homeUrl, { url: homeUrl, pins: [], lastUpdated: '' })
    groups.set(activeUrl, groups.get(activeUrl) ?? { url: activeUrl, pins: [], lastUpdated: '' })

    for (const pin of pins) {
      const url = canonicalFeedbackUrl(pin.url, projectWebsiteUrl)
      const group = groups.get(url) ?? { url, pins: [], lastUpdated: '' }
      group.pins.push(pin)
      if (pin.createdAt > group.lastUpdated) group.lastUpdated = pin.createdAt
      groups.set(url, group)
    }

    return Array.from(groups.values()).sort((a, b) => {
      if (sameFeedbackUrl(a.url, projectWebsiteUrl)) return -1
      if (sameFeedbackUrl(b.url, projectWebsiteUrl)) return 1
      if (a.pins.length !== b.pins.length) return b.pins.length - a.pins.length
      return feedbackPath(a.url).localeCompare(feedbackPath(b.url))
    })
  }, [pins, currentPageUrl, projectWebsiteUrl])

  useEffect(() => {
    const currentUrl = canonicalFeedbackUrl(currentPageUrl, projectWebsiteUrl)
    setNav({
      projectId,
      currentUrl,
      navigateToPage: onNavigateToPage,
      pages: pageGroups.map(group => {
        const openCount = group.pins.filter(pin => (pin.status ?? 'open') === 'open').length
        const totalCount = group.pins.length
        return {
          url: group.url,
          path: feedbackPath(group.url),
          openCount,
          doneCount: totalCount - openCount,
          totalCount,
          isHome: sameFeedbackUrl(group.url, projectWebsiteUrl)
        }
      })
    })

    return () => {
      setNav(prev => (prev?.projectId === projectId ? null : prev))
    }
  }, [currentPageUrl, onNavigateToPage, pageGroups, projectId, projectWebsiteUrl, setNav])

  return null
}

function WorkspaceHeader({
  project,
  host,
  role,
  canEdit,
  publicView,
  currentPageUrl
}: {
  project: ProjectSummary
  host: string
  role: string | null
  canEdit: boolean
  publicView: boolean
  currentPageUrl: string
}) {
  const { setExportOpen } = useFeedback()
  const [copied, setCopied] = useState(false)
  const currentPath = (() => {
    try {
      const u = new URL(currentPageUrl)
      const path = u.pathname + u.search
      return path === '/' ? '/' : path
    } catch {
      return '/'
    }
  })()
  const isHome = currentPath === '/'

  const copyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/p/${project.id}`)
      setCopied(true)
      toast.success('Share link copied')
      setTimeout(() => setCopied(false), 1500)
    } catch {
      toast.error('Could not copy link')
    }
  }

  return (
    <div className='flex flex-wrap items-center justify-between gap-3 border-b border-border/60 bg-background px-4 py-3 sm:px-6'>
      <div className='flex min-w-0 items-center gap-3'>
        <SiteFavicon siteUrl={project.websiteUrl} className='size-8 rounded-lg' />
        <div className='min-w-0'>
          <h1 className='truncate text-sm font-semibold tracking-tight'>{project.name}</h1>
          <a
            href={currentPageUrl}
            target='_blank'
            rel='noreferrer'
            className='mt-0.5 inline-flex max-w-full items-center gap-1 text-xs text-muted-foreground hover:text-foreground'
            title={currentPageUrl}
          >
            <span className='shrink-0'>{host}</span>
            {!isHome && (
              <span className='truncate font-mono text-foreground'>{currentPath}</span>
            )}
            <ArrowSquareOut className='h-3 w-3 shrink-0' />
          </a>
        </div>
      </div>

      <div className='flex flex-wrap items-center gap-2'>
        {project.publicAccess === 'view' && (
          <Badge variant='outline' className='gap-1 text-[11px] font-medium'>
            <Eye className='h-3 w-3' />
            Public view
          </Badge>
        )}
        {role && (
          <Badge variant='secondary' className='gap-1 text-[11px] font-medium capitalize'>
            <Users className='h-3 w-3' />
            {role}
          </Badge>
        )}
        {publicView && !canEdit && (
          <Badge variant='outline' className='gap-1 text-[11px] font-medium'>
            <ShieldCheck className='h-3 w-3' />
            Read-only
          </Badge>
        )}
        <Separator orientation='vertical' className='h-5' />
        <ProjectSeoPreview pageUrl={currentPageUrl} />
        {canEdit && (
          <Button
            asChild
            variant='outline'
            size='sm'
            className='h-8 gap-1.5 rounded-md text-xs'
          >
            <a href={`/p/${project.id}/settings`}>
              <Gear className='h-3.5 w-3.5' />
              Settings
            </a>
          </Button>
        )}
        <Button
          variant='outline'
          size='sm'
          className='h-8 gap-1.5 rounded-md text-xs'
          onClick={copyShareLink}
        >
          <LinkSimple className='h-3.5 w-3.5' />
          {copied ? 'Copied' : 'Share'}
        </Button>
        <Button
          size='sm'
          className='h-8 gap-1.5 rounded-md text-xs'
          onClick={() => setExportOpen(true)}
        >
          <Export className='h-3.5 w-3.5' />
          Export Handoff
        </Button>
      </div>
    </div>
  )
}

function CompactTasksTrigger({
  open,
  onOpenChange,
  projectId,
  currentPageUrl,
  projectWebsiteUrl,
  onJumpToPin,
  aiVerifyEnabled
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  currentPageUrl: string
  projectWebsiteUrl: string
  onJumpToPin: (pin: Pin) => void
  aiVerifyEnabled?: boolean
}) {
  const { pins } = useFeedback()
  const currentCanonicalUrl = canonicalFeedbackUrl(currentPageUrl, projectWebsiteUrl)
  const currentPinCount = pins.filter(pin =>
    sameFeedbackUrl(pin.url, currentCanonicalUrl)
  ).length

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <div className='flex items-center justify-between border-t border-border/60 bg-background px-3 py-2'>
        <span className='text-xs text-muted-foreground'>
          {currentPinCount} on page · {pins.length} total
        </span>
        <SheetTrigger asChild>
          <Button variant='outline' size='sm' className='h-8 gap-1.5 text-xs'>
            <ListBullets className='h-3.5 w-3.5' />
            Tasks
          </Button>
        </SheetTrigger>
      </div>
      <SheetContent side='right' className='w-full max-w-md p-0 sm:max-w-md'>
        <SheetHeader className='sr-only'>
          <SheetTitle className='text-sm'>Tasks</SheetTitle>
        </SheetHeader>
        <div className='h-screen'>
          <ProjectCommentPanel
            projectId={projectId}
            currentPageUrl={currentPageUrl}
            projectWebsiteUrl={projectWebsiteUrl}
            onJumpToPin={onJumpToPin}
            aiVerifyEnabled={aiVerifyEnabled}
          />
        </div>
      </SheetContent>
    </Sheet>
  )
}
