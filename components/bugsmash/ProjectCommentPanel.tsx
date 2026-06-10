'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { useFeedback } from '@/contexts/FeedbackContext'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import {
  ArrowsOutCardinal,
  CaretDown,
  CaretLeft,
  ArrowCounterClockwise,
  ChatText,
  CheckCircle,
  CircleNotch,
  Code,
  CopySimple,
  DownloadSimple,
  FileText,
  House,
  Image,
  Link,
  PaintBrush,
  PaperPlaneTilt,
  SelectionPlus,
  Sparkle,
  Target,
  TextT,
  Trash,
  WarningCircle,
  X
} from '@phosphor-icons/react'
import type { Pin, PinReply } from '@/types/feedback'
import { toMarkdown } from '@/lib/feedback/export'
import { canonicalFeedbackUrl, feedbackPath, sameFeedbackUrl } from '@/lib/feedback/url'
import {
  getInspectActions,
  type InspectAction,
  type InspectActionId
} from '@/lib/feedback/inspectActions'
import { PinAssetUpload } from '@/components/feedback/PinAssetUpload'
import {
  isAnchorLost,
  isPossiblyDone,
  possiblyDoneReason
} from '@/lib/feedback/verification'

interface Props {
  projectId: string
  currentPageUrl?: string
  projectWebsiteUrl?: string
  onJumpToPin?: (pin: Pin) => void
  onNavigateToPage?: (url: string) => void
  aiVerifyEnabled?: boolean
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

const actionIcon = (id: InspectActionId) => {
  switch (id) {
    case 'comment':
      return ChatText
    case 'replace-image':
    case 'remove-image':
    case 'update-alt':
      return Image
    case 'replace-text':
    case 'rewrite-copy':
      return TextT
    case 'update-link':
      return Link
    case 'remove-element':
      return Trash
    case 'layout-issue':
      return WarningCircle
    case 'style-layout':
      return PaintBrush
    default:
      return ArrowsOutCardinal
  }
}

const actionTone = (id: InspectActionId | undefined) => {
  switch (id) {
    case 'remove-image':
    case 'remove-element':
      return {
        chip: 'border-red-200 bg-red-50 text-red-700 dark:border-red-950 dark:bg-red-950/30 dark:text-red-300',
        active: 'border-red-600 bg-red-600 text-white'
      }
    case 'replace-image':
    case 'replace-text':
    case 'rewrite-copy':
    case 'update-alt':
      return {
        chip: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-950 dark:bg-emerald-950/30 dark:text-emerald-300',
        active: 'border-emerald-600 bg-emerald-600 text-white'
      }
    case 'update-link':
      return {
        chip: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-950 dark:bg-blue-950/30 dark:text-blue-300',
        active: 'border-blue-600 bg-blue-600 text-white'
      }
    case 'style-layout':
    case 'layout-issue':
      return {
        chip: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-950 dark:bg-amber-950/30 dark:text-amber-300',
        active: 'border-amber-600 bg-amber-600 text-white'
      }
    default:
      return {
        chip: 'border-border bg-background text-muted-foreground',
        active: 'border-foreground bg-foreground text-background'
      }
  }
}

function pathOf(url: string) {
  return feedbackPath(url)
}

function detailLabelFor(id: InspectActionId | undefined): string | null {
  switch (id) {
    case 'comment':
      return null
    case 'replace-text':
      return 'Replacement text'
    case 'rewrite-copy':
      return 'New copy'
    case 'replace-image':
      return 'Replacement image'
    case 'update-alt':
      return 'New alt text'
    case 'update-link':
      return 'New URL'
    case 'style-layout':
    case 'layout-issue':
      return 'Desired change'
    case 'remove-image':
    case 'remove-element':
      return 'Removal notes'
    default:
      return 'Details'
  }
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
  onJumpToPin,
  onNavigateToPage,
  aiVerifyEnabled = false
}: Props) {
  const {
    pins,
    selectedPinId,
    setSelectedPinId,
    canEdit,
    removePin,
    updatePin,
    setExportOpen,
    session,
    setFeedbackMode
  } = useFeedback()

  const handlePinClick = (pin: Pin) => {
    setSelectedPinId(pin.id)
    onJumpToPin?.(pin)
  }
  const [replyDraft, setReplyDraft] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [verifyingPinId, setVerifyingPinId] = useState<string | null>(null)
  const [localReplies, setLocalReplies] = useState<Record<string, PinReply[]>>({})
  const [taskFilter, setTaskFilter] = useState<'open' | 'done' | 'all'>('open')

  const selectedPin = pins.find(p => p.id === selectedPinId) ?? null
  const openPins = pins.filter(pin => (pin.status ?? 'open') === 'open')
  const implementedPins = pins.filter(pin => pin.status === 'implemented')
  const closedPins = pins.filter(pin => pin.status === 'closed')

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

  const setVerification = async (
    pin: Pin,
    state: 'still-open' | 'confirmed-done',
    reason?: string
  ) => {
    try {
      const res = await fetch(
        `/api/projects/${projectId}/pins/${pin.id}/verification`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ state, reason })
        }
      )
      if (!res.ok) {
        toast.error('Could not save verification')
        return
      }
      const { verification } = await res.json()
      updatePin(pin.id, verification)
    } catch {
      toast.error('Network error')
    }
  }

  const verifyWithAi = async (pin: Pin) => {
    setVerifyingPinId(pin.id)
    try {
      const res = await fetch(
        `/api/projects/${projectId}/pins/${pin.id}/verify`,
        { method: 'POST' }
      )
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        toast.error(data?.error ?? 'AI verification failed')
        return
      }
      updatePin(pin.id, data.verification)
      const verdict = data.verdict?.verdict
      toast.success(
        verdict === 'implemented'
          ? `Pin ${pin.number}: AI confirmed the change is implemented`
          : verdict === 'not-implemented'
            ? `Pin ${pin.number}: AI says the change is still open`
            : `Pin ${pin.number}: AI could not decide`
      )
    } catch {
      toast.error('Network error during AI verification')
    } finally {
      setVerifyingPinId(null)
    }
  }

  const applyInspectAction = (pin: Pin, action: InspectAction) => {
    updatePin(pin.id, {
      editInstruction: action.instruction,
      replacementText:
        action.id === 'remove-image' || action.id === 'remove-element'
          ? ''
          : pin.replacementText
    })
  }

  const setPinStatus = (pin: Pin, status: 'open' | 'implemented' | 'closed') => {
    updatePin(pin.id, { status })
    toast.success(
      `Pin ${pin.number} ${
        status === 'closed'
          ? 'closed'
          : status === 'implemented'
            ? 'marked implemented'
            : 'reopened'
      }`
    )
  }

  type PageGroup = {
    url: string
    pins: Pin[]
    lastUpdated: string
  }

  const pageGroups = useMemo<PageGroup[]>(() => {
    const groups = new Map<string, PageGroup>()

    if (projectWebsiteUrl) {
      const url = canonicalFeedbackUrl(projectWebsiteUrl)
      groups.set(url, {
        url,
        pins: [],
        lastUpdated: ''
      })
    }
    if (currentPageUrl) {
      const url = canonicalFeedbackUrl(currentPageUrl, projectWebsiteUrl)
      groups.set(url, groups.get(url) ?? {
        url,
        pins: [],
        lastUpdated: ''
      })
    }

    for (const pin of pins) {
      const url = canonicalFeedbackUrl(pin.url, projectWebsiteUrl)
      const existing = groups.get(url) ?? {
        url,
        pins: [],
        lastUpdated: ''
      }
      existing.pins.push(pin)
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
    const inspectActions =
      selectedPin.kind === 'inspect' ? getInspectActions(selectedPin) : []
    const selectedInspectAction =
      inspectActions.find(action => action.instruction === selectedPin.editInstruction)
    const showCurrentText =
      selectedInspectAction?.id === 'replace-text' ||
      selectedInspectAction?.id === 'rewrite-copy'

    return (
      <aside className='flex h-full w-full flex-col border-l border-border/60 bg-background'>
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
            {canEdit && (
              <Button
                variant='ghost'
                size='sm'
                className='h-7 gap-1.5 px-2 text-xs'
                onClick={() =>
                  setPinStatus(
                    selectedPin,
                    selectedPin.status === 'closed' ? 'open' : 'closed'
                  )
                }
              >
                {selectedPin.status === 'closed' ? (
                  <ArrowCounterClockwise className='h-3.5 w-3.5' />
                ) : (
                  <CheckCircle className='h-3.5 w-3.5' />
                )}
                {selectedPin.status === 'closed' ? 'Reopen' : 'Close'}
              </Button>
            )}
            {canEdit && selectedPin.status !== 'implemented' && selectedPin.status !== 'closed' && (
              <Button
                variant='ghost'
                size='sm'
                className='h-7 gap-1.5 px-2 text-xs'
                onClick={() => setPinStatus(selectedPin, 'implemented')}
              >
                <CheckCircle className='h-3.5 w-3.5' />
                Implemented
              </Button>
            )}
            {canEdit && aiVerifyEnabled && selectedPin.cssSelector && (
              <Button
                variant='ghost'
                size='sm'
                className='h-7 gap-1.5 px-2 text-xs'
                disabled={verifyingPinId === selectedPin.id}
                onClick={() => void verifyWithAi(selectedPin)}
                title='Compare the snapshot with the live page using AI'
              >
                {verifyingPinId === selectedPin.id ? (
                  <CircleNotch className='h-3.5 w-3.5 animate-spin' />
                ) : (
                  <Sparkle className='h-3.5 w-3.5' />
                )}
                Verify
              </Button>
            )}
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

        <div className='min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden'>
        {isPossiblyDone(selectedPin) && (
          <div className='border-b border-amber-300/60 bg-amber-50 px-4 py-3 dark:border-amber-500/30 dark:bg-amber-500/10'>
            <div className='flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400'>
              <WarningCircle className='h-3.5 w-3.5' />
              Possibly implemented
              {selectedPin.verifiedBy === 'ai' && ' (AI)'}
            </div>
            <p className='mt-1 text-xs text-amber-800 dark:text-amber-200'>
              {possiblyDoneReason(selectedPin)}
            </p>
            {canEdit && (
              <div className='mt-2 flex gap-1.5'>
                <Button
                  size='sm'
                  className='h-7 px-2 text-xs'
                  onClick={() => {
                    setPinStatus(selectedPin, 'implemented')
                    void setVerification(selectedPin, 'confirmed-done')
                  }}
                >
                  Confirm implemented
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  className='h-7 px-2 text-xs'
                  onClick={() =>
                    void setVerification(
                      selectedPin,
                      'still-open',
                      'Reviewer marked the task as still open.'
                    )
                  }
                >
                  Still open
                </Button>
              </div>
            )}
          </div>
        )}
        {isAnchorLost(selectedPin) && (
          <div className='border-b border-border/60 bg-muted/40 px-4 py-3'>
            <div className='flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground'>
              <WarningCircle className='h-3.5 w-3.5' />
              Element not found on live page
            </div>
            <p className='mt-1 text-xs text-muted-foreground'>
              The page may have changed since this pin was created. The captured
              element details below remain the source of truth.
            </p>
          </div>
        )}
        <div className='border-b border-border/60 px-4 py-3'>
          <div className='flex items-center justify-between gap-2'>
            <div className='flex items-center gap-2'>
              <span className='inline-flex h-6 w-6 items-center justify-center rounded-md bg-zinc-950 text-[11px] font-semibold text-white'>
                {selectedPin.number}
              </span>
              <span className='inline-flex items-center gap-1 rounded-md border border-border/70 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground'>
                {selectedPin.kind === 'inspect' ? (
                  <SelectionPlus className='h-3 w-3' />
                ) : (
                  <FileText className='h-3 w-3' />
                )}
                {selectedPin.kind === 'inspect' ? 'Inspect' : 'Comment'}
              </span>
            </div>
            <span className='text-[11px] text-muted-foreground'>
              {timeAgo(selectedPin.createdAt)}
            </span>
          </div>
          {selectedPin.authorName && (
            <div className='mt-2 flex items-center gap-2'>
              <Avatar className='size-6'>
                <AvatarFallback className='bg-foreground/10 text-[10px] font-semibold'>
                  {initialsFor(selectedPin.authorName)}
                </AvatarFallback>
              </Avatar>
              <div className='flex min-w-0 flex-col leading-tight'>
                <span className='truncate text-xs font-medium text-foreground'>
                  {selectedPin.authorName}
                </span>
                {selectedPin.authorEmail && (
                  <span className='truncate text-[10px] text-muted-foreground'>
                    {selectedPin.authorEmail}
                  </span>
                )}
              </div>
              {canEdit && (
                <div className='space-y-1'>
                  <p className='text-[10px] font-medium uppercase tracking-wide text-muted-foreground'>
                    Priority
                  </p>
                  <div className='flex flex-wrap gap-1'>
                    {(['low', 'medium', 'high', 'blocking'] as const).map(level => (
                      <button
                        key={level}
                        type='button'
                        onClick={() => updatePin(selectedPin.id, { severity: level })}
                        className={cn(
                          'h-7 rounded-md border px-2 text-[11px] font-medium capitalize transition-colors',
                          selectedPin.severity === level
                            ? 'border-foreground bg-foreground text-background'
                            : 'border-border bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                          level === 'blocking' && selectedPin.severity === level && 'bg-red-600 text-white border-red-600'
                        )}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          {canEdit && selectedPin.kind !== 'inspect' ? (
            <Textarea
              value={selectedPin.comment}
              onChange={event =>
                updatePin(selectedPin.id, { comment: event.target.value })
              }
              placeholder='Describe what should change here'
              rows={3}
              className='mt-3 resize-y'
            />
          ) : selectedPin.kind !== 'inspect' ? (
            <p className='mt-3 whitespace-pre-wrap text-sm text-foreground'>
              {selectedPin.comment || (
                <span className='text-muted-foreground'>No description.</span>
              )}
            </p>
          ) : null}
          {selectedPin.kind === 'inspect' && (
            <div className='mt-3 space-y-2 rounded-lg border border-border/60 bg-muted/20 p-3'>
              <div className='flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground'>
                <SelectionPlus className='h-3.5 w-3.5' />
                Intent
              </div>
              <div className='flex flex-wrap gap-1'>
                {inspectActions.map(action => {
                  const ActionIcon = actionIcon(action.id)
                  const active = selectedPin.editInstruction === action.instruction
                  const tone = actionTone(action.id)
                  return (
                    <button
                      key={action.id}
                      type='button'
                      disabled={!canEdit}
                      onClick={() => applyInspectAction(selectedPin, action)}
                      className={cn(
                        'inline-flex h-7 items-center gap-1 rounded-md border px-2 text-[11px] font-medium transition-colors',
                        active
                          ? tone.active
                          : `${tone.chip} hover:bg-accent hover:text-accent-foreground`
                      )}
                    >
                      <ActionIcon className='h-3.5 w-3.5' />
                      {action.label}
                    </button>
                  )
                })}
              </div>
              {showCurrentText && selectedPin.elementText && (
                <div className='rounded-md border border-border/50 bg-background p-2'>
                  <p className='text-[10px] font-medium uppercase tracking-wide text-muted-foreground'>
                    Current text
                  </p>
                  <p className='mt-1 max-h-40 overflow-y-auto whitespace-pre-wrap break-words text-xs leading-relaxed text-foreground'>
                    {selectedPin.elementText}
                  </p>
                </div>
              )}
              {!showCurrentText && selectedPin.elementText && (
                <p className='rounded-md border border-border/50 bg-background px-2 py-1.5 text-[11px] text-muted-foreground'>
                  Captured text saved for context.
                </p>
              )}
              {canEdit ? (
                <>
                  {selectedInspectAction ? (
                    detailLabelFor(selectedInspectAction.id) ? (
                      <div className='space-y-1'>
                        <p className='text-[10px] font-medium uppercase tracking-wide text-muted-foreground'>
                          {detailLabelFor(selectedInspectAction.id)}
                        </p>
                        <Textarea
                          value={selectedPin.replacementText || ''}
                          onChange={event =>
            updatePin(selectedPin.id, {
              replacementText: event.target.value
            })
                          }
                          placeholder={selectedInspectAction.detailPlaceholder}
                          rows={3}
                          className='resize-y text-sm'
                        />
                      </div>
                    ) : null
                  ) : (
                    <p className='rounded-md border border-dashed border-border/60 bg-background px-2 py-2 text-[11px] text-muted-foreground'>
                      Pick an intent above to add a replacement, asset, or removal note.
                    </p>
                  )}
                  {selectedInspectAction?.id === 'replace-image' && (
                    <PinAssetUpload
                      assetUrl={selectedPin.assetUrl}
                      canEdit={canEdit}
                      onChange={url =>
                        updatePin(selectedPin.id, { assetUrl: url })
                      }
                    />
                  )}
                  <div className='space-y-1'>
                    <p className='text-[10px] font-medium uppercase tracking-wide text-muted-foreground'>
                      Notes
                    </p>
                    <Textarea
                      value={selectedPin.comment}
                      onChange={event =>
                        updatePin(selectedPin.id, {
                          comment: event.target.value
                        })
                      }
                      placeholder={
                        selectedInspectAction?.notePlaceholder ??
                        'Add any context, asset reference, or acceptance detail'
                      }
                      rows={2}
                      className='resize-y text-xs'
                    />
                  </div>
                </>
              ) : (
                <>
                  {selectedPin.assetUrl && (
                    <PinAssetUpload
                      assetUrl={selectedPin.assetUrl}
                      canEdit={false}
                      onChange={() => {}}
                    />
                  )}
                  {selectedPin.replacementText && (
                    <div className='rounded-md border border-border/50 bg-background p-2'>
                      <p className='text-[10px] font-medium uppercase tracking-wide text-muted-foreground'>
                        {detailLabelFor(selectedInspectAction?.id)}
                      </p>
                      <p className='mt-1 whitespace-pre-wrap text-xs text-foreground'>
                        {selectedPin.replacementText}
                      </p>
                    </div>
                  )}
                  {selectedPin.editInstruction && !selectedInspectAction && (
                    <div className='rounded-md border border-border/50 bg-background p-2'>
                      <p className='text-[10px] font-medium uppercase tracking-wide text-muted-foreground'>
                        Instruction
                      </p>
                      <p className='mt-1 whitespace-pre-wrap text-xs text-foreground'>
                        {selectedPin.editInstruction}
                      </p>
                    </div>
                  )}
                  {selectedPin.comment && (
                    <div className='rounded-md border border-border/50 bg-background p-2'>
                      <p className='text-[10px] font-medium uppercase tracking-wide text-muted-foreground'>
                        Context
                      </p>
                      <p className='mt-1 whitespace-pre-wrap text-xs text-foreground'>
                        {selectedPin.comment}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
          {selectedPin.snapshot?.elementScreenshotUrl && (
            <div className='mt-3 space-y-1'>
              <p className='text-[10px] font-medium uppercase tracking-wide text-muted-foreground'>
                Snapshot at capture time
                {selectedPin.snapshot.capturedAt
                  ? ` · ${timeAgo(selectedPin.snapshot.capturedAt)}`
                  : ''}
              </p>
              <a
                href={selectedPin.snapshot.elementScreenshotUrl}
                target='_blank'
                rel='noreferrer'
                className='block overflow-hidden rounded-md border border-border/50 bg-background'
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selectedPin.snapshot.elementScreenshotUrl}
                  alt={`Pin ${selectedPin.number} element snapshot`}
                  className='max-h-44 w-full object-contain'
                />
              </a>
              {selectedPin.snapshot.pageScreenshotUrl && (
                <a
                  href={selectedPin.snapshot.pageScreenshotUrl}
                  target='_blank'
                  rel='noreferrer'
                  className='text-[11px] text-muted-foreground underline-offset-2 hover:underline'
                >
                  View full page screenshot
                </a>
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
          <Collapsible className='mt-3'>
            <CollapsibleTrigger className='inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground hover:text-foreground [&[data-state=open]>svg]:rotate-180'>
              <CaretDown className='h-3 w-3 transition-transform' />
              Technical metadata
            </CollapsibleTrigger>
            <CollapsibleContent>
              <dl className='mt-2 space-y-1 rounded-md border border-border/50 bg-muted/30 p-2 text-[11px] text-muted-foreground'>
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
            </CollapsibleContent>
          </Collapsible>
        </div>

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
        </div>

        <div className='border-t border-border/60 p-3'>
          <Button
            className='h-8 w-full gap-1.5 rounded-md text-xs'
            size='sm'
            onClick={() => {
              setFeedbackMode(false)
              setSelectedPinId(null)
              toast.success(`Pin ${selectedPin.number} saved`)
            }}
          >
            <CheckCircle className='h-3.5 w-3.5' />
            Save &amp; back to comments
          </Button>
        </div>

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
    <aside className='flex h-full w-full flex-col border-l border-border/60 bg-background'>
      <header className='flex items-center justify-between border-b border-border/60 px-4 py-3'>
        <div>
          <h2 className='text-sm font-semibold tracking-tight'>Tasks</h2>
          <p className='text-[11px] text-muted-foreground'>
            {openPins.length} open · {implementedPins.length + closedPins.length} done ·{' '}
            {pageGroups.filter(g => g.pins.length > 0).length}{' '}
            {pageGroups.filter(g => g.pins.length > 0).length === 1 ? 'page' : 'pages'}
          </p>
        </div>
        <div className='flex items-center gap-1'>
          {(['open', 'done', 'all'] as const).map(filter => (
            <button
              key={filter}
              type='button'
              onClick={() => setTaskFilter(filter)}
              className={cn(
                'h-7 shrink-0 rounded-md border px-2 text-[11px] font-medium capitalize transition-colors',
                taskFilter === filter
                  ? 'border-foreground bg-foreground text-background'
                  : 'border-border bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              {filter}
            </button>
          ))}
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

      {pageGroups.length > 1 && (
        <div className='border-b border-border/60 bg-muted/30 px-2 py-1.5'>
          <div className='flex items-center gap-1 overflow-x-auto scrollbar-hide'>
            {pageGroups.map(group => {
              const isActive = sameFeedbackUrl(group.url, currentPageUrl)
              const isProjectHome = sameFeedbackUrl(group.url, projectWebsiteUrl)
              const path = pathOf(group.url)
              return (
                <button
                  key={group.url}
                  type='button'
                  onClick={() => onNavigateToPage?.(group.url)}
                  title={group.url}
                  className={cn(
                    'inline-flex h-7 shrink-0 items-center gap-1.5 rounded-md border px-2 text-[11px] font-medium transition-colors',
                    isActive
                      ? 'border-foreground bg-foreground text-background'
                      : 'border-border bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  {isProjectHome && <House weight='fill' className='h-3 w-3' />}
                  <span className='max-w-[120px] truncate font-mono'>{path}</span>
                  {group.pins.length > 0 && (
                    <span
                      className={cn(
                        'inline-flex h-4 min-w-4 items-center justify-center rounded-sm px-1 text-[9px] font-bold tabular-nums',
                        isActive ? 'bg-background/20 text-background' : 'bg-muted text-foreground'
                      )}
                    >
                      {group.pins.length}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      <div className='min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden'>
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
          (() => {
            const activeGroup = pageGroups.find(g => sameFeedbackUrl(g.url, currentPageUrl))
            const scopedPins = (() => {
              if (taskFilter === 'all') return pins
              if (taskFilter === 'done') return [...implementedPins, ...closedPins]
              return openPins
            })()
            const activePins = [...scopedPins].sort((a, b) =>
              b.createdAt.localeCompare(a.createdAt)
            )

            if (activePins.length === 0) {
              return (
                <div className='flex flex-col items-center justify-center px-6 py-12 text-center text-xs text-muted-foreground'>
                  <ChatText className='h-6 w-6 text-muted-foreground/60' />
                  <p className='mt-3'>No tasks match this filter.</p>
                  <p className='mt-1 text-[11px]'>
                    Switch filters, annotate an element, or pick another page above.
                  </p>
                </div>
              )
            }

            const activeOpenPins = activePins.filter(pin => (pin.status ?? 'open') === 'open')
            const activeImplementedPins = activePins.filter(pin => pin.status === 'implemented')
            const activeClosedPins = activePins.filter(pin => pin.status === 'closed')
            const renderPins = (items: Pin[], closed = false) => (
              <ul className='w-full divide-y divide-border/50 overflow-hidden bg-background'>
                {items.map(pin => {
                  const replies = allRepliesFor(pin)
                  const pinAction = pin.kind === 'inspect'
                    ? getInspectActions(pin).find(action => action.instruction === pin.editInstruction)
                    : undefined
                  const tone = actionTone(pinAction?.id)
                  const canMoveToActivePage =
                    canEdit &&
                    Boolean(currentPageUrl) &&
                    !sameFeedbackUrl(pin.url, currentPageUrl)
                  return (
                    <li key={pin.id} className={closed ? 'opacity-70' : undefined}>
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
                          'block w-full min-w-0 cursor-pointer overflow-hidden px-4 py-3 text-left transition-colors hover:bg-muted/30',
                          selectedPinId === pin.id && 'bg-muted/40'
                        )}
                      >
                        <div className='flex items-center justify-between gap-2'>
                          <span className='inline-flex items-center gap-2'>
                            <span className='inline-flex h-5 w-5 items-center justify-center rounded-md bg-zinc-950 text-[10px] font-semibold text-white'>
                              {pin.number}
                            </span>
                            {pin.kind === 'inspect' ? (
                              <SelectionPlus className='h-3.5 w-3.5 text-muted-foreground' />
                            ) : (
                              <FileText className='h-3.5 w-3.5 text-muted-foreground' />
                            )}
                            <span className='text-[10px] capitalize text-muted-foreground'>
                              {pin.viewportType}
                            </span>
                            {pinAction && (
                              <span className={cn('rounded-sm border px-1.5 py-0.5 text-[10px] font-medium', tone.chip)}>
                                {pinAction.label}
                              </span>
                            )}
                          </span>
                          <span className='inline-flex items-center gap-1.5 text-[10px] text-muted-foreground'>
                            {pin.severity === 'blocking' && (
                              <span className='rounded-sm bg-red-600 px-1 text-[9px] font-semibold text-white'>
                                Blocking
                              </span>
                            )}
                            {pin.status === 'implemented' && (
                              <span className='rounded-sm bg-blue-600 px-1 text-[9px] font-semibold text-white'>
                                Done
                              </span>
                            )}
                            {isPossiblyDone(pin) && (
                              <span className='rounded-sm bg-amber-500 px-1 text-[9px] font-semibold text-white'>
                                Possibly done
                              </span>
                            )}
                            {isAnchorLost(pin) && (
                              <span className='rounded-sm border border-amber-500/60 px-1 text-[9px] font-semibold text-amber-600'>
                                Anchor lost
                              </span>
                            )}
                            {closed && <CheckCircle className='h-3 w-3 text-emerald-600' />}
                            {timeAgo(pin.createdAt)}
                          </span>
                        </div>
                        <p className={cn('mt-1.5 line-clamp-2 break-words text-sm text-foreground', closed && 'line-through decoration-muted-foreground/50')}>
                          {pin.comment || (pin.kind === 'inspect' ? (
                            pinAction?.label || 'Inspect/edit task'
                          ) : (
                            <span className='text-muted-foreground'>
                              No description.
                            </span>
                          ))}
                        </p>
                        {pin.elementTag && (
                          <p className='mt-1 flex min-w-0 items-center gap-1.5 text-[11px] text-muted-foreground'>
                            <Code className='h-3 w-3 shrink-0' />
                            <span className='min-w-0 flex-1 truncate font-mono'>
                              &lt;{pin.elementTag}&gt;
                              {pin.elementText ? ` ${pin.elementText}` : ''}
                            </span>
                          </p>
                        )}
                        {pin.kind === 'inspect' && (
                          <p className='mt-1 line-clamp-2 break-words text-[11px] text-muted-foreground'>
                            {pin.replacementText?.trim()
                              ? `Details: ${pin.replacementText.trim()}`
                              : pinAction?.label || pin.editInstruction?.trim() || 'Inspect/edit task'}
                          </p>
                        )}
                        <div className='mt-2 flex items-center justify-between gap-2 text-[11px] text-muted-foreground'>
                          <span className='flex min-w-0 items-center gap-2'>
                            {replies.length > 0 && (
                              <span>
                                {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
                              </span>
                            )}
                            {pin.cssSelector && <span>selector</span>}
                          </span>
                          <span className='flex shrink-0 items-center gap-1'>
                            {canMoveToActivePage && (
                              <button
                                type='button'
                                className='rounded border border-border/70 px-1.5 py-0.5 text-[10px] font-medium text-foreground hover:bg-muted'
                                onClick={event => {
                                  event.stopPropagation()
                                  movePinToCurrentPage(pin)
                                }}
                              >
                                Move here
                              </button>
                            )}
                            {canEdit && (
                              <button
                                type='button'
                                title='Delete pin'
                                className='rounded p-0.5 text-muted-foreground/50 hover:bg-destructive/10 hover:text-destructive'
                                onClick={event => {
                                  event.stopPropagation()
                                  removePin(pin.id)
                                }}
                              >
                                <Trash className='h-3 w-3' />
                              </button>
                            )}
                          </span>
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )

            if (taskFilter === 'open') {
              return (
                <div>
                  {activeOpenPins.length > 0 ? (
                    renderPins(activeOpenPins)
                  ) : (
                    <p className='px-4 py-6 text-center text-xs text-muted-foreground'>
                      No open tasks.
                    </p>
                  )}
                </div>
              )
            }

            if (taskFilter === 'done') {
              return (
                <div>
                  {activeImplementedPins.length > 0 && renderPins(activeImplementedPins)}
                  {activeClosedPins.length > 0 && renderPins(activeClosedPins, true)}
                </div>
              )
            }

            return (
              <div>
                <div className='border-b border-border/60 bg-muted/20 px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground'>
                  Open ({activeOpenPins.length})
                </div>
                {activeOpenPins.length > 0 ? (
                  renderPins(activeOpenPins)
                ) : (
                  <p className='px-4 py-6 text-center text-xs text-muted-foreground'>
                    No open tasks on this page.
                  </p>
                )}
                {activeImplementedPins.length > 0 && (
                  <>
                    <div className='border-y border-border/60 bg-muted/20 px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground'>
                      Implemented ({activeImplementedPins.length})
                    </div>
                    {renderPins(activeImplementedPins)}
                  </>
                )}
                {activeClosedPins.length > 0 && (
                  <>
                    <div className='border-y border-border/60 bg-muted/20 px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground'>
                      Closed ({activeClosedPins.length})
                    </div>
                    {renderPins(activeClosedPins, true)}
                  </>
                )}
              </div>
            )
          })()
        )}
      </div>
    </aside>
  )
}
