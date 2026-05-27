'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { useFeedback } from '@/contexts/FeedbackContext'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import {
  CaretLeft,
  ChatText,
  CircleNotch,
  Code,
  CopySimple,
  DownloadSimple,
  FileText,
  House,
  PaperPlaneTilt,
  SelectionPlus,
  Target,
  Trash,
  X
} from '@phosphor-icons/react'
import type { Pin, PinReply } from '@/types/feedback'
import { toMarkdown } from '@/lib/feedback/export'
import { canonicalFeedbackUrl, feedbackPath, sameFeedbackUrl } from '@/lib/feedback/url'

interface Props {
  projectId: string
  currentPageUrl?: string
  projectWebsiteUrl?: string
  onJumpToPin?: (pin: Pin) => void
}

const SEVERITY_STYLES: Record<Pin['severity'], string> = {
  low: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  medium: 'border-amber-200 bg-amber-50 text-amber-900',
  high: 'border-rose-200 bg-rose-50 text-rose-900'
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function pathOf(url: string) {
  return feedbackPath(url)
}

function initialsFor(name: string | null | undefined) {
  if (!name) return '·'
  const parts = name.split(/\s+/).filter(Boolean)
  if (!parts.length) return '·'
  return parts
    .slice(0, 2)
    .map(part => part.charAt(0).toUpperCase())
    .join('')
}

export default function ProjectCommentPanel({
  projectId,
  currentPageUrl,
  projectWebsiteUrl,
  onJumpToPin
}: Props) {
  const {
    pins,
    selectedPinId,
    setSelectedPinId,
    canEdit,
    removePin,
    updatePin,
    setExportOpen,
    session
  } = useFeedback()

  const handlePinClick = (pin: Pin) => {
    setSelectedPinId(pin.id)
    onJumpToPin?.(pin)
  }
  const [replyDraft, setReplyDraft] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [localReplies, setLocalReplies] = useState<Record<string, PinReply[]>>({})
  const [expandedPages, setExpandedPages] = useState<string[]>([])

  const selectedPin = pins.find(p => p.id === selectedPinId) ?? null

  const copyText = async (text: string, success: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(success)
    } catch {
      toast.error('Copy failed')
    }
  }

  const copySessionBrief = () => {
    if (!session || session.pins.length === 0) return
    void copyText(toMarkdown(session), 'LLM brief copied')
  }

  const copyPinBrief = (pin: Pin) => {
    if (!session) return
    void copyText(
      toMarkdown({
        ...session,
        pins: [pin],
        updatedAt: pin.createdAt
      }),
      `Pin ${pin.number} brief copied`
    )
  }

  const movePinToCurrentPage = (pin: Pin) => {
    if (!currentPageUrl || !canEdit) return
    const url = canonicalFeedbackUrl(currentPageUrl, projectWebsiteUrl)
    updatePin(pin.id, { url })
    toast.success(`Pin ${pin.number} moved to ${feedbackPath(url)}`)
  }

  type PageGroup = {
    url: string
    pins: Pin[]
    counts: Record<Pin['severity'], number>
    lastUpdated: string
  }

  const pageGroups = useMemo<PageGroup[]>(() => {
    const groups = new Map<string, PageGroup>()

    if (projectWebsiteUrl) {
      const url = canonicalFeedbackUrl(projectWebsiteUrl)
      groups.set(url, {
        url,
        pins: [],
        counts: { low: 0, medium: 0, high: 0 },
        lastUpdated: ''
      })
    }
    if (currentPageUrl) {
      const url = canonicalFeedbackUrl(currentPageUrl, projectWebsiteUrl)
      groups.set(url, groups.get(url) ?? {
        url,
        pins: [],
        counts: { low: 0, medium: 0, high: 0 },
        lastUpdated: ''
      })
    }

    for (const pin of pins) {
      const url = canonicalFeedbackUrl(pin.url, projectWebsiteUrl)
      const existing = groups.get(url) ?? {
        url,
        pins: [],
        counts: { low: 0, medium: 0, high: 0 },
        lastUpdated: ''
      }
      existing.pins.push(pin)
      existing.counts[pin.severity]++
      if (pin.createdAt > existing.lastUpdated) {
        existing.lastUpdated = pin.createdAt
      }
      groups.set(url, existing)
    }

    return Array.from(groups.values()).sort((a, b) => {
      if (sameFeedbackUrl(a.url, currentPageUrl)) return -1
      if (sameFeedbackUrl(b.url, currentPageUrl)) return 1
      if (a.pins.length !== b.pins.length) return b.pins.length - a.pins.length
      return b.lastUpdated.localeCompare(a.lastUpdated)
    })
  }, [pins, currentPageUrl, projectWebsiteUrl])

  useEffect(() => {
    if (!currentPageUrl) return
    const url = canonicalFeedbackUrl(currentPageUrl, projectWebsiteUrl)
    setExpandedPages(prev => (prev.includes(url) ? prev : [...prev, url]))
  }, [currentPageUrl, projectWebsiteUrl])

  useEffect(() => {
    if (!selectedPin) return
    const url = canonicalFeedbackUrl(selectedPin.url, projectWebsiteUrl)
    setExpandedPages(prev => (prev.includes(url) ? prev : [...prev, url]))
  }, [selectedPin, projectWebsiteUrl])

  const allRepliesFor = (pin: Pin) => {
    const fromServer = pin.replies ?? []
    const local = localReplies[pin.id] ?? []
    return [...fromServer, ...local].sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  }

  const submitReply = async (e: FormEvent) => {
    e.preventDefault()
    if (!selectedPin || !replyDraft.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch(
        `/api/projects/${projectId}/pins/${selectedPin.id}/replies`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ body: replyDraft.trim() })
        }
      )
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        toast.error(
          typeof data?.error === 'string' ? data.error : 'Could not post reply'
        )
        return
      }
      const data = await res.json()
      setLocalReplies(prev => ({
        ...prev,
        [selectedPin.id]: [...(prev[selectedPin.id] ?? []), data.reply]
      }))
      setReplyDraft('')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Network error')
    } finally {
      setSubmitting(false)
    }
  }

  const deleteReply = async (pinId: string, replyId: string) => {
    try {
      const res = await fetch(
        `/api/projects/${projectId}/pins/${pinId}/replies/${replyId}`,
        { method: 'DELETE' }
      )
      if (!res.ok) {
        toast.error('Could not delete reply')
        return
      }
      setLocalReplies(prev => ({
        ...prev,
        [pinId]: (prev[pinId] ?? []).filter(reply => reply.id !== replyId)
      }))
      toast.success('Reply deleted')
    } catch {
      toast.error('Network error')
    }
  }

  if (selectedPin) {
    const replies = allRepliesFor(selectedPin)
    return (
      <aside className='flex w-[340px] shrink-0 flex-col border-l border-border/60 bg-background'>
        <header className='flex items-center justify-between border-b border-border/60 px-4 py-3'>
          <Button
            variant='ghost'
            size='sm'
            className='h-7 gap-1.5 px-2 text-xs'
            onClick={() => setSelectedPinId(null)}
          >
            <CaretLeft className='h-3.5 w-3.5' />
            All comments
          </Button>
          <div className='flex items-center gap-1'>
            <Button
              variant='ghost'
              size='sm'
              className='h-7 gap-1.5 px-2 text-xs'
              onClick={() => onJumpToPin?.(selectedPin)}
            >
              <Target className='h-3.5 w-3.5' />
              Focus
            </Button>
            <Button
              variant='ghost'
              size='icon'
              className='size-7 text-muted-foreground'
              onClick={() => copyPinBrief(selectedPin)}
              title='Copy pin brief'
            >
              <CopySimple className='h-3.5 w-3.5' />
            </Button>
            {canEdit && (
              <Button
                variant='ghost'
                size='icon'
                className='size-7 text-muted-foreground hover:text-rose-600'
                onClick={() => {
                  removePin(selectedPin.id)
                  setSelectedPinId(null)
                }}
                title='Delete pin'
              >
                <Trash className='h-3.5 w-3.5' />
              </Button>
            )}
          </div>
        </header>

        <div className='border-b border-border/60 px-4 py-3'>
          <div className='flex items-center justify-between gap-2'>
            <div className='flex items-center gap-2'>
              <span className='inline-flex h-6 w-6 items-center justify-center rounded-md bg-amber-400 text-[11px] font-semibold text-amber-950'>
                {selectedPin.number}
              </span>
              <Badge
                variant='outline'
                className={cn('text-[10px] font-semibold uppercase tracking-wide', SEVERITY_STYLES[selectedPin.severity])}
              >
                {selectedPin.severity}
              </Badge>
            </div>
            <span className='text-[11px] text-muted-foreground'>
              {timeAgo(selectedPin.createdAt)}
            </span>
          </div>
          {canEdit ? (
            <Textarea
              value={selectedPin.comment}
              onChange={event =>
                updatePin(selectedPin.id, { comment: event.target.value })
              }
              placeholder={
                selectedPin.kind === 'inspect'
                  ? 'Optional context for this edit'
                  : 'Describe what should change here'
              }
              rows={3}
              className='mt-3 resize-y'
            />
          ) : (
            <p className='mt-3 whitespace-pre-wrap text-sm text-foreground'>
              {selectedPin.comment || (
                <span className='text-muted-foreground'>No description.</span>
              )}
            </p>
          )}
          {selectedPin.kind === 'inspect' && (
            <div className='mt-3 space-y-2 rounded-lg border border-border/60 bg-muted/20 p-3'>
              <div className='flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground'>
                <SelectionPlus className='h-3.5 w-3.5' />
                Implementation edit
              </div>
              {selectedPin.elementText && (
                <div className='rounded-md border border-border/50 bg-background p-2'>
                  <p className='text-[10px] font-medium uppercase tracking-wide text-muted-foreground'>
                    Current text
                  </p>
                  <p className='mt-1 line-clamp-4 text-xs leading-relaxed text-foreground'>
                    {selectedPin.elementText}
                  </p>
                </div>
              )}
              {canEdit ? (
                <>
                  <Textarea
                    value={selectedPin.replacementText || ''}
                    onChange={event =>
                      updatePin(selectedPin.id, {
                        replacementText: event.target.value
                      })
                    }
                    placeholder='Replacement text, or leave blank if this is a remove/style task'
                    rows={3}
                    className='resize-y text-sm'
                  />
                  <Textarea
                    value={selectedPin.editInstruction || ''}
                    onChange={event =>
                      updatePin(selectedPin.id, {
                        editInstruction: event.target.value
                      })
                    }
                    placeholder='Exact developer instruction, e.g. remove this image, change spacing, update CTA'
                    rows={2}
                    className='resize-y text-xs'
                  />
                </>
              ) : (
                <>
                  {selectedPin.replacementText && (
                    <div className='rounded-md border border-border/50 bg-background p-2'>
                      <p className='text-[10px] font-medium uppercase tracking-wide text-muted-foreground'>
                        Replacement
                      </p>
                      <p className='mt-1 whitespace-pre-wrap text-xs text-foreground'>
                        {selectedPin.replacementText}
                      </p>
                    </div>
                  )}
                  {selectedPin.editInstruction && (
                    <div className='rounded-md border border-border/50 bg-background p-2'>
                      <p className='text-[10px] font-medium uppercase tracking-wide text-muted-foreground'>
                        Instruction
                      </p>
                      <p className='mt-1 whitespace-pre-wrap text-xs text-foreground'>
                        {selectedPin.editInstruction}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
          {canEdit &&
            currentPageUrl &&
            !sameFeedbackUrl(selectedPin.url, currentPageUrl) && (
              <Button
                variant='outline'
                size='sm'
                className='mt-3 h-8 w-full gap-1.5 rounded-md text-xs'
                onClick={() => movePinToCurrentPage(selectedPin)}
              >
                <Target className='h-3.5 w-3.5' />
                Move pin to active page ({pathOf(currentPageUrl)})
              </Button>
            )}
          <Separator className='my-3' />
          <dl className='space-y-1 text-[11px] text-muted-foreground'>
            <div className='flex gap-2'>
              <dt className='shrink-0 font-medium uppercase tracking-wide'>Page</dt>
              <dd className='truncate font-mono' title={selectedPin.url}>
                {pathOf(selectedPin.url)}
              </dd>
            </div>
            <div className='flex gap-2'>
              <dt className='shrink-0 font-medium uppercase tracking-wide'>View</dt>
              <dd className='capitalize'>{selectedPin.viewportType}</dd>
            </div>
            {selectedPin.elementTag && (
              <div className='flex gap-2'>
                <dt className='shrink-0 font-medium uppercase tracking-wide'>El</dt>
                <dd className='truncate font-mono'>{`<${selectedPin.elementTag}>`}</dd>
              </div>
            )}
            {selectedPin.cssSelector && (
              <div className='flex gap-2'>
                <dt className='shrink-0 font-medium uppercase tracking-wide'>Sel</dt>
                <dd className='truncate font-mono'>{selectedPin.cssSelector}</dd>
              </div>
            )}
            {selectedPin.playwrightLocator && (
              <div className='flex gap-2'>
                <dt className='shrink-0 font-medium uppercase tracking-wide'>Test</dt>
                <dd className='truncate font-mono'>{selectedPin.playwrightLocator}</dd>
              </div>
            )}
            {typeof selectedPin.documentY === 'number' && (
              <div className='flex gap-2'>
                <dt className='shrink-0 font-medium uppercase tracking-wide'>Doc</dt>
                <dd className='font-mono'>
                  {Math.round(selectedPin.documentX ?? 0)}×{Math.round(selectedPin.documentY)}
                </dd>
              </div>
            )}
          </dl>
        </div>

        <ScrollArea className='flex-1'>
          <div className='space-y-3 px-4 py-3'>
            {replies.length === 0 ? (
              <p className='py-6 text-center text-xs text-muted-foreground'>
                No replies yet.
              </p>
            ) : (
              replies.map(reply => (
                <div key={reply.id} className='group flex items-start gap-2'>
                  <Avatar className='size-7'>
                    <AvatarFallback className='bg-foreground/10 text-[10px] font-semibold'>
                      {initialsFor(reply.authorName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className='min-w-0 flex-1'>
                    <div className='flex items-baseline justify-between gap-2'>
                      <span className='truncate text-xs font-medium'>
                        {reply.authorName}
                      </span>
                      <span className='shrink-0 text-[10px] text-muted-foreground'>
                        {timeAgo(reply.createdAt)}
                      </span>
                    </div>
                    <p className='mt-0.5 whitespace-pre-wrap text-sm text-foreground'>
                      {reply.body}
                    </p>
                  </div>
                  {canEdit && (
                    <Button
                      variant='ghost'
                      size='icon'
                      className='size-6 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 hover:text-rose-600'
                      onClick={() => deleteReply(selectedPin.id, reply.id)}
                      title='Delete reply'
                    >
                      <X className='h-3.5 w-3.5' />
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {canEdit ? (
          <form onSubmit={submitReply} className='border-t border-border/60 p-3'>
            <Textarea
              value={replyDraft}
              onChange={event => setReplyDraft(event.target.value)}
              placeholder='Reply…'
              rows={2}
              className='resize-none'
            />
            <div className='mt-2 flex items-center justify-end'>
              <Button
                type='submit'
                size='sm'
                className='h-8 gap-1.5 rounded-md text-xs'
                disabled={submitting || !replyDraft.trim()}
              >
                {submitting ? (
                  <CircleNotch className='h-3.5 w-3.5 animate-spin' />
                ) : (
                  <>
                    <PaperPlaneTilt weight='fill' className='h-3.5 w-3.5' />
                    Reply
                  </>
                )}
              </Button>
            </div>
          </form>
        ) : (
          <div className='border-t border-border/60 px-4 py-3 text-center text-xs text-muted-foreground'>
            Sign in as a project member to reply.
          </div>
        )}
      </aside>
    )
  }

  return (
    <aside className='flex w-[340px] shrink-0 flex-col border-l border-border/60 bg-background'>
      <header className='flex items-center justify-between border-b border-border/60 px-4 py-3'>
        <div>
          <h2 className='text-sm font-semibold tracking-tight'>Tasks</h2>
          <p className='text-[11px] text-muted-foreground'>
            {pins.length} {pins.length === 1 ? 'pin' : 'pins'} ·{' '}
            {pageGroups.filter(g => g.pins.length > 0).length}{' '}
            {pageGroups.filter(g => g.pins.length > 0).length === 1 ? 'page' : 'pages'}
          </p>
        </div>
        <div className='flex items-center gap-1'>
          <Button
            variant='ghost'
            size='icon'
            className='size-8 text-muted-foreground'
            onClick={copySessionBrief}
            disabled={pins.length === 0}
            title='Copy LLM brief'
          >
            <CopySimple className='h-4 w-4' />
          </Button>
          <Button
            variant='ghost'
            size='icon'
            className='size-8 text-muted-foreground'
            onClick={() => setExportOpen(true)}
            disabled={pins.length === 0}
            title='Export feedback'
          >
            <DownloadSimple className='h-4 w-4' />
          </Button>
        </div>
      </header>

      <ScrollArea className='flex-1'>
        {pins.length === 0 ? (
          <div className='flex flex-col items-center justify-center px-6 py-16 text-center text-xs text-muted-foreground'>
            <ChatText className='h-6 w-6 text-muted-foreground/60' />
            <p className='mt-3'>No comments yet.</p>
            <p className='mt-1 text-[11px]'>
              {canEdit
                ? 'Switch to Comment mode and click anywhere on the page.'
                : 'Project members can drop pins to start a discussion.'}
            </p>
          </div>
        ) : (
          <Accordion
            type='multiple'
            value={expandedPages}
            onValueChange={setExpandedPages}
            className='space-y-2 bg-muted/30 p-2'
          >
            {pageGroups.map(group => {
              const isActive = sameFeedbackUrl(group.url, currentPageUrl)
              const isHome = sameFeedbackUrl(group.url, projectWebsiteUrl)
              const path = pathOf(group.url)
              const groupPins = [...group.pins].sort((a, b) =>
                b.createdAt.localeCompare(a.createdAt)
              )

              return (
                <AccordionItem
                  key={group.url}
                  value={group.url}
                  className={cn(
                    'overflow-hidden rounded-lg border bg-background shadow-sm transition-colors',
                    isActive
                      ? 'border-blue-300 ring-2 ring-blue-200/60'
                      : 'border-border/70'
                  )}
                >
                  <AccordionTrigger
                    className={cn(
                      'px-3 py-2.5 hover:no-underline',
                      isActive ? 'bg-blue-50/70' : 'bg-muted/20'
                    )}
                  >
                    <div className='flex min-w-0 flex-1 items-center justify-between gap-2 pr-2'>
                      <div className='flex min-w-0 items-center gap-2'>
                        {isHome && (
                          <House
                            weight='fill'
                            className='h-3.5 w-3.5 shrink-0 text-muted-foreground'
                          />
                        )}
                        <span
                          className='truncate font-mono text-xs font-medium'
                          title={group.url}
                        >
                          {path}
                        </span>
                        {isActive && (
                          <Badge className='border-blue-200 bg-blue-100 text-[9px] font-semibold uppercase tracking-wide text-blue-900 hover:bg-blue-100'>
                            Active
                          </Badge>
                        )}
                      </div>
                      <div className='flex shrink-0 items-center gap-1'>
                        {group.counts.high > 0 && (
                          <span className='inline-flex h-4 min-w-4 items-center justify-center rounded-sm bg-rose-100 px-1 text-[9px] font-semibold text-rose-900'>
                            {group.counts.high}
                          </span>
                        )}
                        {group.counts.medium > 0 && (
                          <span className='inline-flex h-4 min-w-4 items-center justify-center rounded-sm bg-amber-100 px-1 text-[9px] font-semibold text-amber-900'>
                            {group.counts.medium}
                          </span>
                        )}
                        {group.counts.low > 0 && (
                          <span className='inline-flex h-4 min-w-4 items-center justify-center rounded-sm bg-emerald-100 px-1 text-[9px] font-semibold text-emerald-900'>
                            {group.counts.low}
                          </span>
                        )}
                        <span className='ml-1 text-[10px] tabular-nums text-muted-foreground'>
                          {group.pins.length}
                        </span>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className='px-0 pb-0'>
                    {groupPins.length === 0 ? (
                      <p className='border-t border-border/50 bg-background px-4 py-4 text-center text-[11px] text-muted-foreground'>
                        No comments on this page yet.
                      </p>
                    ) : (
                      <ul className='divide-y divide-border/50 border-t border-border/50 bg-background'>
                        {groupPins.map(pin => {
                          const replies = allRepliesFor(pin)
                          const canMoveToActivePage =
                            canEdit &&
                            Boolean(currentPageUrl) &&
                            !sameFeedbackUrl(pin.url, currentPageUrl)
                          return (
                            <li key={pin.id}>
                              <div
                                role='button'
                                tabIndex={0}
                                onClick={() => handlePinClick(pin)}
                                onKeyDown={event => {
                                  if (event.key === 'Enter' || event.key === ' ') {
                                    event.preventDefault()
                                    handlePinClick(pin)
                                  }
                                }}
                                className={cn(
                                  'block w-full cursor-pointer px-4 py-3 text-left transition-colors hover:bg-muted/30',
                                  selectedPinId === pin.id && 'bg-blue-50/70'
                                )}
                              >
                                <div className='flex items-center justify-between gap-2'>
                                  <span className='inline-flex items-center gap-2'>
                                    <span className='inline-flex h-5 w-5 items-center justify-center rounded-md bg-amber-400 text-[10px] font-semibold text-amber-950'>
                                      {pin.number}
                                    </span>
                                    {pin.kind === 'inspect' ? (
                                      <SelectionPlus className='h-3.5 w-3.5 text-muted-foreground' />
                                    ) : (
                                      <FileText className='h-3.5 w-3.5 text-muted-foreground' />
                                    )}
                                    <Badge
                                      variant='outline'
                                      className={cn(
                                        'text-[9px] font-semibold uppercase tracking-wide',
                                        SEVERITY_STYLES[pin.severity]
                                      )}
                                    >
                                      {pin.severity}
                                    </Badge>
                                    <span className='text-[10px] capitalize text-muted-foreground'>
                                      {pin.viewportType}
                                    </span>
                                  </span>
                                  <span className='text-[10px] text-muted-foreground'>
                                    {timeAgo(pin.createdAt)}
                                  </span>
                                </div>
                                <p className='mt-1.5 line-clamp-2 text-sm text-foreground'>
                                  {pin.comment || (
                                    <span className='text-muted-foreground'>
                                      No description.
                                    </span>
                                  )}
                                </p>
                                {pin.elementTag && (
                                  <p className='mt-1 flex items-center gap-1.5 truncate text-[11px] text-muted-foreground'>
                                    <Code className='h-3 w-3 shrink-0' />
                                    <span className='truncate font-mono'>
                                      &lt;{pin.elementTag}&gt;
                                      {pin.elementText ? ` ${pin.elementText}` : ''}
                                    </span>
                                  </p>
                                )}
                                {pin.kind === 'inspect' && (
                                  <p className='mt-1 line-clamp-2 text-[11px] text-muted-foreground'>
                                    {pin.replacementText?.trim()
                                      ? `Replace with: ${pin.replacementText.trim()}`
                                      : pin.editInstruction?.trim() || 'Inspect/edit task'}
                                  </p>
                                )}
                                {(replies.length > 0 || pin.cssSelector || canMoveToActivePage) && (
                                  <div className='mt-1 flex items-center justify-between gap-2 text-[11px] text-muted-foreground'>
                                    <span className='flex min-w-0 items-center gap-2'>
                                      {replies.length > 0 && (
                                        <span>
                                          {replies.length}{' '}
                                          {replies.length === 1 ? 'reply' : 'replies'}
                                        </span>
                                      )}
                                      {pin.cssSelector && <span>selector captured</span>}
                                    </span>
                                    {canMoveToActivePage && (
                                      <span
                                        role='button'
                                        tabIndex={0}
                                        className='shrink-0 rounded border border-border/70 px-1.5 py-0.5 text-[10px] font-medium text-foreground hover:bg-muted'
                                        onClick={event => {
                                          event.stopPropagation()
                                          movePinToCurrentPage(pin)
                                        }}
                                        onKeyDown={event => {
                                          if (event.key === 'Enter' || event.key === ' ') {
                                            event.preventDefault()
                                            event.stopPropagation()
                                            movePinToCurrentPage(pin)
                                          }
                                        }}
                                      >
                                        Move here
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </li>
                          )
                        })}
                      </ul>
                    )}
                  </AccordionContent>
                </AccordionItem>
              )
            })}
          </Accordion>
        )}
      </ScrollArea>
    </aside>
  )
}
