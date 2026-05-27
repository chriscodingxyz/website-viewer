'use client'

import { useCallback, useState } from 'react'
import type { Pin } from '@/types/feedback'
import { FeedbackProvider } from '@/contexts/FeedbackContext'
import type { FeedbackSession } from '@/types/feedback'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import {
  ArrowSquareOut,
  Eye,
  LinkSimple,
  ShieldCheck,
  Users
} from '@phosphor-icons/react'
import ProjectCanvas from './ProjectCanvas'
import ProjectCommentPanel from './ProjectCommentPanel'

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
  const [pendingJumpPin, setPendingJumpPin] = useState<Pin | null>(null)
  const handlePageUrlChange = useCallback((url: string) => {
    setCurrentPageUrl(url)
  }, [])
  const handleJumpToPin = useCallback((pin: Pin) => {
    setPendingJumpPin(pin)
  }, [])
  const handleJumpHandled = useCallback(() => {
    setPendingJumpPin(null)
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
    <div className='flex h-[calc(100vh-3.5rem)] flex-col bg-muted/30'>
      <div className='flex flex-wrap items-center justify-between gap-3 border-b border-border/60 bg-background px-4 py-3 sm:px-6'>
        <div className='flex min-w-0 items-center gap-3'>
          <div className='min-w-0'>
            <h1 className='truncate text-sm font-semibold tracking-tight'>{project.name}</h1>
            <a
              href={project.websiteUrl}
              target='_blank'
              rel='noreferrer'
              className='mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground'
            >
              {host}
              <ArrowSquareOut className='h-3 w-3' />
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
            <Badge className='gap-1 border-amber-200 bg-amber-50 text-[11px] font-medium text-amber-900 hover:bg-amber-50'>
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
        <div className='flex flex-1 min-h-0'>
          <div className='min-w-0 flex-1'>
            <ProjectCanvas
              websiteUrl={project.websiteUrl}
              onPageUrlChange={handlePageUrlChange}
              jumpToPin={pendingJumpPin}
              onJumpHandled={handleJumpHandled}
            />
          </div>
          <ProjectCommentPanel
            projectId={project.id}
            currentPageUrl={currentPageUrl}
            projectWebsiteUrl={project.websiteUrl}
            onJumpToPin={handleJumpToPin}
          />
        </div>
      </FeedbackProvider>
    </div>
  )
}
