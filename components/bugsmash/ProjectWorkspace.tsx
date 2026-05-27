'use client'

import { useCallback, useState } from 'react'
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
  Eye,
  LinkSimple,
  ListBullets,
  ShieldCheck,
  Users
} from '@phosphor-icons/react'
import ProjectCanvas from './ProjectCanvas'
import ProjectCommentPanel from './ProjectCommentPanel'
import ExportDialog from '@/components/feedback/ExportDialog'
import FeedbackKeyboard from '@/components/feedback/FeedbackKeyboard'

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
  initialSession
}: Props) {
  const host = hostFor(project.websiteUrl)
  const [copied, setCopied] = useState(false)
  const [currentPageUrl, setCurrentPageUrl] = useState<string>(project.websiteUrl)
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
  const [pendingJump, setPendingJump] = useState<{
    pin: Pin
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
    <div className='flex h-[calc(100vh-3.5rem)] flex-col overflow-hidden bg-background'>
      <div className='flex flex-wrap items-center justify-between gap-3 border-b border-border/60 bg-background px-4 py-3 sm:px-6'>
        <div className='flex min-w-0 items-center gap-3'>
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
          <Button
            variant='outline'
            size='sm'
            className='h-8 gap-1.5 rounded-md text-xs'
            onClick={copyShareLink}
          >
            <LinkSimple className='h-3.5 w-3.5' />
            {copied ? 'Copied' : 'Share'}
          </Button>
        </div>
      </div>

      <FeedbackProvider
        currentUrl={project.websiteUrl}
        projectId={project.id}
        initialSession={initialSession}
        canEdit={canEdit}
      >
        {/* Desktop: side-by-side with fixed tasks width */}
        <div className='hidden min-h-0 flex-1 overflow-hidden xl:flex'>
          <div className='min-w-0 flex-1'>
            <ProjectCanvas
              websiteUrl={project.websiteUrl}
              onPageUrlChange={handlePageUrlChange}
              jumpToPin={pendingJump}
              onJumpHandled={handleJumpHandled}
            />
          </div>
          <aside className='flex h-full w-[340px] shrink-0 flex-col border-l border-border/60 bg-background 2xl:w-[380px]'>
            <ProjectCommentPanel
              projectId={project.id}
              currentPageUrl={currentPageUrl}
              projectWebsiteUrl={project.websiteUrl}
              onJumpToPin={handleJumpToPin}
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
            />
          </div>
          <CompactTasksTrigger
            open={tasksSheetOpen}
            onOpenChange={setTasksSheetOpen}
            projectId={project.id}
            currentPageUrl={currentPageUrl}
            projectWebsiteUrl={project.websiteUrl}
            onJumpToPin={handleJumpToPin}
          />
        </div>

        <ExportDialog />
        <FeedbackKeyboard />
      </FeedbackProvider>
    </div>
  )
}

function CompactTasksTrigger({
  open,
  onOpenChange,
  projectId,
  currentPageUrl,
  projectWebsiteUrl,
  onJumpToPin
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  currentPageUrl: string
  projectWebsiteUrl: string
  onJumpToPin: (pin: Pin) => void
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
        <SheetHeader className='border-b border-border/60 px-4 py-3'>
          <SheetTitle className='text-sm'>Tasks</SheetTitle>
        </SheetHeader>
        <div className='h-[calc(100vh-49px)]'>
          <ProjectCommentPanel
            projectId={projectId}
            currentPageUrl={currentPageUrl}
            projectWebsiteUrl={projectWebsiteUrl}
            onJumpToPin={onJumpToPin}
          />
        </div>
      </SheetContent>
    </Sheet>
  )
}
