'use client'

import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import type { Pin } from '@/types/feedback'
import { FeedbackProvider, useFeedback } from '@/contexts/FeedbackContext'
import type { FeedbackSession } from '@/types/feedback'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
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
import { GuestIdentityDialog } from '@/components/bugsmash/GuestIdentityDialog'

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
  guest?: { slug: string; accessLevel: 'view' | 'comment' }
}

// Shared header control styles so every button/chip shares one height,
// padding, radius, and type scale.
const ACTION_BTN = 'h-8 gap-1.5 rounded-md px-2.5 text-xs font-medium'
const STATUS_CHIP =
  'inline-flex h-8 items-center gap-1.5 rounded-md bg-muted px-2.5 text-xs font-medium text-muted-foreground'

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
  aiVerifyEnabled = false,
  guest
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
      guest={guest}
    >
      <div className='flex h-[calc(100vh-3.5rem)] flex-col overflow-hidden bg-background'>
        {/* Header actions render into the global top bar (no second band). */}
        <WorkspaceHeader
          project={project}
          host={host}
          role={role}
          canEdit={canEdit}
          publicView={publicView}
          currentPageUrl={currentPageUrl}
          guest={guest}
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
              onNavigateToPage={handleNavigateToPage}
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
            onNavigateToPage={handleNavigateToPage}
            aiVerifyEnabled={aiVerifyEnabled}
          />
        </div>

        <ExportDialog />
        <FeedbackKeyboard />
        <GuestIdentityDialog />
      </div>
    </FeedbackProvider>
  )
}

function WorkspaceHeader({
  project,
  host,
  role,
  canEdit,
  publicView,
  currentPageUrl,
  guest
}: {
  project: ProjectSummary
  host: string
  role: string | null
  canEdit: boolean
  publicView: boolean
  currentPageUrl: string
  guest?: { slug: string; accessLevel: 'view' | 'comment' }
}) {
  const { setExportOpen, guestProfile, setIdentityPromptOpen, createShareLink } = useFeedback()
  const [copied, setCopied] = useState(false)
  const [slot, setSlot] = useState<HTMLElement | null>(null)

  useEffect(() => {
    setSlot(document.getElementById('ws-header-slot'))
  }, [])

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
      const url = await createShareLink()
      await navigator.clipboard.writeText(url ?? `${window.location.origin}/p/${project.id}`)
      setCopied(true)
      toast.success('Share link copied')
      setTimeout(() => setCopied(false), 1500)
    } catch {
      toast.error('Could not copy link')
    }
  }

  if (!slot) return null

  const actions = (
    <div className='flex min-w-0 items-center gap-2'>
      <a
        href={currentPageUrl}
        target='_blank'
        rel='noreferrer'
        className='hidden min-w-0 items-center gap-1 text-xs text-muted-foreground hover:text-foreground sm:inline-flex'
        title={currentPageUrl}
      >
        <span className='shrink-0'>{host}</span>
        {!isHome && (
          <span className='truncate font-mono text-foreground'>{currentPath}</span>
        )}
        <ArrowSquareOut className='h-3 w-3 shrink-0' />
      </a>
      <Separator orientation='vertical' className='mx-0.5 hidden h-5 sm:block' />
      {/* Status chips: same height as the action buttons, but a quieter
          'information' treatment (muted fill, no border) so they read as
          state rather than actions. */}
      <div className='hidden items-center gap-1.5 md:flex'>
        {guest ? (
          <span className={STATUS_CHIP}>
            {guest.accessLevel === 'comment' ? (
              <><Users className='h-3.5 w-3.5' />Comment link</>
            ) : (
              <><Eye className='h-3.5 w-3.5' />View link</>
            )}
          </span>
        ) : (
          <>
            {(project.publicAccess === 'view' || project.publicAccess === 'comment') && (
              <span className={STATUS_CHIP}>
                <Eye className='h-3.5 w-3.5' />
                {project.publicAccess === 'comment' ? 'Public comments' : 'Public view'}
              </span>
            )}
            {role && (
              <span className={cn(STATUS_CHIP, 'capitalize')}>
                <Users className='h-3.5 w-3.5' />
                {role}
              </span>
            )}
            {publicView && !canEdit && (
              <span className={cn(STATUS_CHIP, 'text-amber-700 dark:text-amber-400')}>
                <ShieldCheck className='h-3.5 w-3.5' />
                Read-only
              </span>
            )}
          </>
        )}
      </div>
      {guest && guestProfile && (
        <Button
          variant='ghost'
          size='sm'
          className={cn(ACTION_BTN, 'text-muted-foreground')}
          onClick={() => setIdentityPromptOpen(true)}
        >
          {guestProfile.name}
        </Button>
      )}
      <Separator orientation='vertical' className='hidden h-5 md:block' />
      {/* Action buttons: uniform height, padding, and type. */}
      <div className='flex items-center gap-1.5'>
        <ProjectSeoPreview pageUrl={currentPageUrl} />
        {guest ? (
          <Button asChild variant='outline' size='sm' className={ACTION_BTN}>
            <a href={`/s/${guest.slug}?view=report`} target='_blank' rel='noreferrer'>
              <ListBullets className='h-3.5 w-3.5' />
              Report
            </a>
          </Button>
        ) : (
          canEdit && (
            <Button asChild variant='outline' size='sm' className={ACTION_BTN}>
              <a href={`/p/${project.id}/settings`}>
                <Gear className='h-3.5 w-3.5' />
                Settings
              </a>
            </Button>
          )
        )}
        <Button
          variant='outline'
          size='sm'
          className={ACTION_BTN}
          onClick={copyShareLink}
        >
          <LinkSimple className='h-3.5 w-3.5' />
          {copied ? 'Copied' : 'Share'}
        </Button>
        {!guest && (
          <Button size='sm' className={ACTION_BTN} onClick={() => setExportOpen(true)}>
            <Export className='h-3.5 w-3.5' />
            Export Handoff
          </Button>
        )}
      </div>
    </div>
  )

  return createPortal(actions, slot)
}

function CompactTasksTrigger({
  open,
  onOpenChange,
  projectId,
  currentPageUrl,
  projectWebsiteUrl,
  onJumpToPin,
  onNavigateToPage,
  aiVerifyEnabled
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  currentPageUrl: string
  projectWebsiteUrl: string
  onJumpToPin: (pin: Pin) => void
  onNavigateToPage: (url: string) => void
  aiVerifyEnabled?: boolean
}) {
  const { pins } = useFeedback()

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <div className='flex items-center justify-between border-t border-border/60 bg-background px-3 py-2'>
        <span className='text-xs text-muted-foreground'>
          {pins.length} {pins.length === 1 ? 'task' : 'tasks'}
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
            onNavigateToPage={onNavigateToPage}
            aiVerifyEnabled={aiVerifyEnabled}
          />
        </div>
      </SheetContent>
    </Sheet>
  )
}
