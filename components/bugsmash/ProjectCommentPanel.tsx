'use client'

import { FormEvent, ReactNode, useEffect, useState } from 'react'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import {
  ArrowCounterClockwise,
  ArrowDown,
  ArrowRight,
  ArrowsOutCardinal,
  CaretDown,
  CaretLeft,
  ChatText,
  CheckCircle,
  CircleNotch,
  CopySimple,
  DeviceMobile,
  DotsThreeVertical,
  DownloadSimple,
  FileText,
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
  findInspectAction,
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

type PinSummary =
  | { type: 'diff'; from: string; to: string }
  | { type: 'text'; text: string; muted?: boolean }

function truncateText(value: string, max: number) {
  return value.length > max ? `${value.slice(0, max - 1).trimEnd()}…` : value
}

function pinSummary(pin: Pin, action: InspectAction | undefined): PinSummary {
  const comment = pin.comment?.trim()
  if (pin.kind !== 'inspect') {
    return comment
      ? { type: 'text', text: comment }
      : { type: 'text', text: 'No description', muted: true }
  }
  const detail = pin.replacementText?.trim()
  const currentText = pin.elementText?.trim()
  switch (action?.id) {
    case 'replace-text':
    case 'rewrite-copy':
      if (detail && currentText) return { type: 'diff', from: currentText, to: detail }
      if (detail) return { type: 'text', text: detail }
      break
    case 'update-link':
      if (detail) return { type: 'diff', from: currentText || 'Current link', to: detail }
      break
    case 'update-alt':
      if (detail) return { type: 'text', text: `Alt text: ${detail}` }
      break
    case 'remove-element':
    case 'remove-image':
      return {
        type: 'text',
        text: `Remove ${pin.elementTag ? `<${pin.elementTag}>` : 'element'}${
          currentText ? ` "${truncateText(currentText, 40)}"` : ''
        }`
      }
    case 'style-layout':
    case 'layout-issue':
      if (detail) return { type: 'text', text: detail }
      break
  }
  if (comment) return { type: 'text', text: comment }
  if (detail) return { type: 'text', text: detail }
  return { type: 'text', text: 'No details yet', muted: true }
}

function elementSnippet(pin: Pin, summary: PinSummary): string | null {
  if (summary.type === 'diff') return null
  if (summary.type === 'text' && summary.text.startsWith('Remove ')) return null
  if (!pin.elementTag) return null
  const text = pin.elementText?.trim()
  return `<${pin.elementTag}>${text ? ` ${truncateText(text, 50)}` : ''}`
}

function statusAccent(pin: Pin): string {
  if (pin.status === 'implemented') return 'border-l-blue-500'
  if (pin.status === 'closed') return 'border-l-emerald-500/50'
  if (isPossiblyDone(pin)) return 'border-l-amber-400'
  if (pin.severity === 'blocking') return 'border-l-red-500'
  return 'border-l-transparent'
}

function SectionLabel({
  children,
  className
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <p className={cn('text-[10px] font-medium text-muted-foreground', className)}>
      {children}
    </p>
  )
}

function PinStatusBadges({ pin, closed }: { pin: Pin; closed?: boolean }) {
  return (
    <>
      {pin.severity === 'blocking' && (
        <span className='rounded-sm bg-red-600 px-1 py-px text-[9px] font-semibold text-white'>
          Blocking
        </span>
      )}
      {pin.status === 'implemented' && (
        <span className='rounded-sm bg-blue-600 px-1 py-px text-[9px] font-semibold text-white'>
          Done
        </span>
      )}
      {isPossiblyDone(pin) && (
        <span className='rounded-sm bg-amber-500 px-1 py-px text-[9px] font-semibold text-white'>
          Possibly done
        </span>
      )}
      {isAnchorLost(pin) && (
        <span className='rounded-sm border border-amber-500/60 px-1 py-px text-[9px] font-semibold text-amber-600'>
          Anchor lost
        </span>
      )}
      {closed && <CheckCircle className='h-3 w-3 text-emerald-600' />}
    </>
  )
}

export default function ProjectCommentPanel({
  projectId,
  currentPageUrl,
  projectWebsiteUrl,
  onJumpToPin,
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
    setFeedbackMode,
    triggerSnapshots,
    projectMode
  } = useFeedback()

  const handlePinClick = (pin: Pin) => {
    setSelectedPinId(pin.id)
    onJumpToPin?.(pin)
  }
  const [replyDraft, setReplyDraft] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [replyOpen, setReplyOpen] = useState(false)
  const [verifyingPinId, setVerifyingPinId] = useState<string | null>(null)
  const [localReplies, setLocalReplies] = useState<Record<string, PinReply[]>>({})
  const [taskFilter, setTaskFilter] = useState<'open' | 'done' | 'all'>('open')
  const [intentPickerOpen, setIntentPickerOpen] = useState(false)

  useEffect(() => {
    setReplyOpen(false)
    setReplyDraft('')
    setIntentPickerOpen(false)
  }, [selectedPinId])

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
    const selectedInspectAction = findInspectAction(selectedPin)
    const showCurrentText =
      selectedInspectAction?.id === 'replace-text' ||
      selectedInspectAction?.id === 'rewrite-copy'
    const showBeforeAfter = showCurrentText && Boolean(selectedPin.elementText)
    const detailTone = actionTone(selectedInspectAction?.id)
    const DetailIcon = selectedInspectAction
      ? actionIcon(selectedInspectAction.id)
      : selectedPin.kind === 'inspect'
        ? SelectionPlus
        : FileText
    const detailChipLabel =
      selectedInspectAction?.label ??
      (selectedPin.kind === 'inspect' ? 'Inspect' : 'Comment')

    return (
      <TooltipProvider delayDuration={300}>
      <aside className='flex h-full w-full flex-col border-l border-border/60 bg-background'>
        <header className='flex items-center justify-between gap-2 border-b border-border/60 px-3 py-2'>
          <Button
            variant='ghost'
            size='sm'
            className='h-7 shrink-0 gap-1 px-1.5 text-xs'
            onClick={() => setSelectedPinId(null)}
          >
            <CaretLeft className='h-3.5 w-3.5' />
            Tasks
          </Button>
          <div className='flex shrink-0 items-center gap-1'>
            {canEdit && selectedPin.status !== 'implemented' && selectedPin.status !== 'closed' && (
              <Button
                variant='outline'
                size='sm'
                className='h-7 gap-1.5 px-2 text-xs'
                onClick={() => setPinStatus(selectedPin, 'implemented')}
              >
                <CheckCircle className='h-3.5 w-3.5' />
                Mark implemented
              </Button>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant='ghost'
                  size='icon'
                  className='size-7 text-muted-foreground'
                  onClick={() => onJumpToPin?.(selectedPin)}
                >
                  <Target className='h-3.5 w-3.5' />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Focus pin on page</TooltipContent>
            </Tooltip>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant='ghost'
                  size='icon'
                  className='size-7 text-muted-foreground'
                >
                  <DotsThreeVertical weight='bold' className='h-4 w-4' />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end' className='w-48'>
                {canEdit && (
                  <DropdownMenuItem
                    className='gap-2 text-xs'
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
                    {selectedPin.status === 'closed' ? 'Reopen task' : 'Close task'}
                  </DropdownMenuItem>
                )}
                {canEdit && aiVerifyEnabled && selectedPin.cssSelector && (
                  <DropdownMenuItem
                    className='gap-2 text-xs'
                    disabled={verifyingPinId === selectedPin.id}
                    onClick={() => void verifyWithAi(selectedPin)}
                  >
                    {verifyingPinId === selectedPin.id ? (
                      <CircleNotch className='h-3.5 w-3.5 animate-spin' />
                    ) : (
                      <Sparkle className='h-3.5 w-3.5' />
                    )}
                    Verify with AI
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  className='gap-2 text-xs'
                  onClick={() => copyPinBrief(selectedPin)}
                >
                  <CopySimple className='h-3.5 w-3.5' />
                  Copy pin brief
                </DropdownMenuItem>
                {canEdit && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className='gap-2 text-xs text-destructive focus:text-destructive'
                      onClick={() => {
                        removePin(selectedPin.id)
                        setSelectedPinId(null)
                      }}
                    >
                      <Trash className='h-3.5 w-3.5' />
                      Delete pin
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
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
            <div className='flex min-w-0 items-center gap-2'>
              <span className='inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-zinc-950 text-[11px] font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900'>
                {selectedPin.number}
              </span>
              <span
                className={cn(
                  'inline-flex min-w-0 items-center gap-1 rounded-sm border px-1.5 py-0.5 text-[10px] font-medium',
                  detailTone.chip
                )}
              >
                <DetailIcon className='h-3 w-3 shrink-0' />
                <span className='truncate'>{detailChipLabel}</span>
              </span>
            </div>
            <span className='shrink-0 text-[11px] text-muted-foreground'>
              {timeAgo(selectedPin.createdAt)}
            </span>
          </div>
          {selectedPin.authorName && (
            <div className='mt-2.5 flex items-center gap-2'>
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
            </div>
          )}
          {canEdit && (
            <div className='mt-3 flex items-center gap-2'>
              <SectionLabel className='w-12 shrink-0 text-[11px]'>
                Priority
              </SectionLabel>
              <div className='inline-flex h-6 overflow-hidden rounded-md border border-border'>
                {(['low', 'medium', 'high', 'blocking'] as const).map(level => (
                  <button
                    key={level}
                    type='button'
                    onClick={() => updatePin(selectedPin.id, { severity: level })}
                    className={cn(
                      'border-r border-border px-2 text-[11px] font-medium capitalize transition-colors last:border-r-0',
                      selectedPin.severity === level
                        ? level === 'blocking'
                          ? 'bg-red-600 text-white'
                          : 'bg-foreground text-background'
                        : 'bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    )}
                  >
                    {level}
                  </button>
                ))}
              </div>
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
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground'>
                  <SelectionPlus className='h-3.5 w-3.5' />
                  Intent
                </div>
                {canEdit && selectedInspectAction && !intentPickerOpen && (
                  <button
                    type='button'
                    className='text-[11px] text-muted-foreground underline-offset-2 hover:text-foreground hover:underline'
                    onClick={() => setIntentPickerOpen(true)}
                  >
                    Change
                  </button>
                )}
              </div>
              {selectedInspectAction && !intentPickerOpen ? (
                <div>
                  <span
                    className={cn(
                      'inline-flex h-7 items-center gap-1 rounded-md border px-2 text-[11px] font-medium',
                      detailTone.active
                    )}
                  >
                    <DetailIcon className='h-3.5 w-3.5' />
                    {selectedInspectAction.label}
                  </span>
                </div>
              ) : (
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
                        onClick={() => {
                          applyInspectAction(selectedPin, action)
                          setIntentPickerOpen(false)
                        }}
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
              )}
              {showBeforeAfter && (
                <div className='overflow-hidden rounded-md border border-border/60 bg-background'>
                  <div className='border-l-2 border-l-zinc-300 px-2.5 py-2 dark:border-l-zinc-600'>
                    <SectionLabel>Current</SectionLabel>
                    <p className='mt-0.5 max-h-32 overflow-y-auto whitespace-pre-wrap break-words text-xs leading-relaxed text-muted-foreground'>
                      {selectedPin.elementText}
                    </p>
                  </div>
                  <div className='flex items-center gap-1.5 border-y border-border/60 bg-muted/30 px-2.5 py-1 text-[10px] font-medium text-emerald-700 dark:text-emerald-400'>
                    <ArrowDown className='h-3 w-3' />
                    {detailLabelFor(selectedInspectAction?.id) ?? 'Replacement'}
                  </div>
                  <div className='border-l-2 border-l-emerald-500 px-2.5 py-2'>
                    {canEdit ? (
                      <Textarea
                        value={selectedPin.replacementText || ''}
                        onChange={event =>
                          updatePin(selectedPin.id, {
                            replacementText: event.target.value
                          })
                        }
                        placeholder={selectedInspectAction?.detailPlaceholder}
                        rows={3}
                        className='min-h-16 resize-y rounded-none border-0 p-0 text-xs shadow-none focus-visible:ring-0'
                      />
                    ) : (
                      <p className='whitespace-pre-wrap text-xs text-foreground'>
                        {selectedPin.replacementText || (
                          <span className='text-muted-foreground'>
                            Not provided yet.
                          </span>
                        )}
                      </p>
                    )}
                  </div>
                </div>
              )}
              {!showCurrentText && selectedPin.elementText && (
                <p className='rounded-md border border-border/50 bg-background px-2 py-1.5 text-[11px] text-muted-foreground'>
                  Captured text saved for context.
                </p>
              )}
              {canEdit ? (
                <>
                  {!showBeforeAfter && (selectedInspectAction ? (
                    detailLabelFor(selectedInspectAction.id) ? (
                      <div className='space-y-1'>
                        <SectionLabel>
                          {detailLabelFor(selectedInspectAction.id)}
                        </SectionLabel>
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
                  ))}
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
                    <SectionLabel>Notes</SectionLabel>
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
                  {!showBeforeAfter && selectedPin.replacementText && (
                    <div className='rounded-md border border-border/50 bg-background p-2'>
                      <SectionLabel>
                        {detailLabelFor(selectedInspectAction?.id)}
                      </SectionLabel>
                      <p className='mt-1 whitespace-pre-wrap text-xs text-foreground'>
                        {selectedPin.replacementText}
                      </p>
                    </div>
                  )}
                  {selectedPin.editInstruction && !selectedInspectAction && (
                    <div className='rounded-md border border-border/50 bg-background p-2'>
                      <SectionLabel>Instruction</SectionLabel>
                      <p className='mt-1 whitespace-pre-wrap text-xs text-foreground'>
                        {selectedPin.editInstruction}
                      </p>
                    </div>
                  )}
                  {selectedPin.comment && (
                    <div className='rounded-md border border-border/50 bg-background p-2'>
                      <SectionLabel>Context</SectionLabel>
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
              <SectionLabel>
                Snapshot at capture time
                {selectedPin.snapshot.capturedAt
                  ? ` · ${timeAgo(selectedPin.snapshot.capturedAt)}`
                  : ''}
              </SectionLabel>
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
          <Collapsible className='mt-3'>
            <CollapsibleTrigger className='inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground hover:text-foreground [&[data-state=open]>svg]:rotate-180'>
              <CaretDown className='h-3 w-3 transition-transform' />
              Technical details
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

          {replies.length > 0 && (
          <div className='space-y-3 px-4 py-3'>
            {replies.map(reply => (
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
              ))}
          </div>
          )}
        </div>

        <div className='border-t border-border/60 p-3'>
          {canEdit && (replies.length > 0 || replyOpen) && (
            <form onSubmit={submitReply} className='mb-2'>
              <Textarea
                value={replyDraft}
                onChange={event => setReplyDraft(event.target.value)}
                placeholder='Reply…'
                rows={2}
                className='resize-none'
                autoFocus={replyOpen}
              />
              <div className='mt-2 flex items-center justify-between'>
                {replyOpen && replies.length === 0 && (
                  <button
                    type='button'
                    className='text-[11px] text-muted-foreground hover:text-foreground'
                    onClick={() => { setReplyOpen(false); setReplyDraft('') }}
                  >
                    Cancel
                  </button>
                )}
                <Button
                  type='submit'
                  size='sm'
                  variant='outline'
                  className='ml-auto h-8 gap-1.5 rounded-md text-xs'
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
          )}
          <div className='flex items-center gap-2'>
            {canEdit && replies.length === 0 && !replyOpen && (
              <Button
                variant='ghost'
                size='sm'
                className='h-8 shrink-0 gap-1.5 px-2 text-xs text-muted-foreground'
                onClick={() => setReplyOpen(true)}
              >
                <ChatText className='h-3.5 w-3.5' />
                Reply
              </Button>
            )}
            <Button
              className='h-8 flex-1 gap-1.5 rounded-md text-xs'
              size='sm'
              onClick={() => {
                setFeedbackMode(false)
                setSelectedPinId(null)
                toast.success(`Pin ${selectedPin.number} saved`)
                if (projectMode) void triggerSnapshots()
              }}
            >
              <CheckCircle className='h-3.5 w-3.5' />
              Save and back to tasks
            </Button>
          </div>
          {!canEdit && replies.length > 0 && (
            <p className='mt-2 text-center text-xs text-muted-foreground'>
              Sign in as a project member to reply.
            </p>
          )}
        </div>
      </aside>
      </TooltipProvider>
    )
  }

  const currentCanonicalUrl = currentPageUrl
    ? canonicalFeedbackUrl(currentPageUrl, projectWebsiteUrl)
    : projectWebsiteUrl ?? '/'
  const currentPins = pins.filter(pin =>
    sameFeedbackUrl(pin.url, currentCanonicalUrl)
  )
  const currentOpenPins = currentPins.filter(pin => (pin.status ?? 'open') === 'open')
  const currentImplementedPins = currentPins.filter(pin => pin.status === 'implemented')
  const currentClosedPins = currentPins.filter(pin => pin.status === 'closed')
  const currentDonePins = currentImplementedPins.length + currentClosedPins.length
  const currentPath = pathOf(currentCanonicalUrl)

  return (
    <TooltipProvider delayDuration={300}>
    <aside className='flex h-full w-full flex-col border-l border-border/60 bg-background'>
      <header className='border-b border-border/60'>
        <div className='flex items-center justify-between px-4 pb-1 pt-3'>
          <div className='flex items-baseline gap-2'>
            <h2 className='text-sm font-semibold tracking-tight'>Tasks</h2>
            <span className='text-[11px] text-muted-foreground'>
              {currentPins.length} on page · {pins.length} total
            </span>
          </div>
          <div className='flex items-center gap-0.5'>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant='ghost'
                  size='icon'
                  className='size-7 text-muted-foreground'
                  onClick={copySessionBrief}
                  disabled={pins.length === 0}
                >
                  <CopySimple className='h-4 w-4' />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Copy LLM brief</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant='ghost'
                  size='icon'
                  className='size-7 text-muted-foreground'
                  onClick={() => setExportOpen(true)}
                  disabled={pins.length === 0}
                >
                  <DownloadSimple className='h-4 w-4' />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Export feedback</TooltipContent>
            </Tooltip>
          </div>
        </div>
        <div className='px-4 pb-2.5 pt-1'>
          <div className='grid h-8 grid-cols-3 gap-0.5 rounded-lg bg-muted p-0.5'>
            {(['open', 'done', 'all'] as const).map(filter => {
              const count =
                filter === 'open'
                  ? currentOpenPins.length
                  : filter === 'done'
                    ? currentDonePins
                    : currentPins.length
              return (
                <button
                  key={filter}
                  type='button'
                  onClick={() => setTaskFilter(filter)}
                  className={cn(
                    'flex items-center justify-center gap-1 rounded-md text-[11px] font-medium capitalize transition-colors',
                    taskFilter === filter
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {filter}
                  <span
                    className={cn(
                      'text-[10px] tabular-nums',
                      taskFilter === filter
                        ? 'text-muted-foreground'
                        : 'text-muted-foreground/70'
                    )}
                  >
                    {count}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
        <div className='flex min-w-0 items-center justify-between gap-3 border-t border-border/60 bg-muted/20 px-4 py-2'>
          <span className='min-w-0 truncate font-mono text-[11px] text-foreground' title={currentCanonicalUrl}>
            {currentPath}
          </span>
          <span className='shrink-0 text-[10px] text-muted-foreground'>
            {currentOpenPins.length} open · {currentDonePins} done
          </span>
        </div>
      </header>

      <div className='min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden'>
        {pins.length === 0 ? (
          <div className='flex flex-col items-center justify-center px-6 py-16 text-center text-xs text-muted-foreground'>
            <ChatText className='h-6 w-6 text-muted-foreground/60' />
            <p className='mt-3'>No tasks yet.</p>
            <p className='mt-1 text-[11px]'>
              {canEdit
                ? 'Switch to Comment mode and click anywhere on the page.'
                : 'Project members can drop pins to start a discussion.'}
            </p>
          </div>
        ) : (
          (() => {
            const scopedPins = (() => {
              if (taskFilter === 'all') return currentPins
              if (taskFilter === 'done') return [...currentImplementedPins, ...currentClosedPins]
              return currentOpenPins
            })()
            const activePins = [...scopedPins].sort((a, b) =>
              b.createdAt.localeCompare(a.createdAt)
            )

            if (activePins.length === 0) {
              return (
                <div className='flex flex-col items-center justify-center px-6 py-12 text-center text-xs text-muted-foreground'>
                  <ChatText className='h-6 w-6 text-muted-foreground/60' />
                  <p className='mt-3'>No tasks match this filter on this page.</p>
                  <p className='mt-1 text-[11px]'>
                    Switch filters, annotate an element, or choose another page from the Pages rail.
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
                  const pinAction =
                    pin.kind === 'inspect' ? findInspectAction(pin) : undefined
                  const tone = actionTone(pinAction?.id)
                  const IntentIcon = pinAction
                    ? actionIcon(pinAction.id)
                    : pin.kind === 'inspect'
                      ? SelectionPlus
                      : ChatText
                  const summary = pinSummary(pin, pinAction)
                  const snippet = elementSnippet(pin, summary)
                  const hasFooter =
                    Boolean(snippet) ||
                    pin.viewportType !== 'desktop' ||
                    replies.length > 0 ||
                    canEdit
                  return (
                    <li key={pin.id} className={closed ? 'opacity-60' : undefined}>
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
                          'group block w-full min-w-0 cursor-pointer overflow-hidden border-l-2 px-4 py-3 text-left transition-colors hover:bg-muted/40',
                          statusAccent(pin),
                          selectedPinId === pin.id && 'bg-muted/50'
                        )}
                      >
                        <div className='flex items-center gap-2'>
                          <span className='inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-zinc-950 text-[10px] font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900'>
                            {pin.number}
                          </span>
                          <span
                            className={cn(
                              'inline-flex min-w-0 items-center gap-1 rounded-sm border px-1.5 py-0.5 text-[10px] font-medium',
                              tone.chip
                            )}
                          >
                            <IntentIcon className='h-3 w-3 shrink-0' />
                            <span className='truncate'>
                              {pinAction?.label ??
                                (pin.kind === 'inspect' ? 'Inspect' : 'Comment')}
                            </span>
                          </span>
                          <span className='ml-auto inline-flex shrink-0 items-center gap-1.5 text-[10px] text-muted-foreground'>
                            <PinStatusBadges pin={pin} closed={closed} />
                            {timeAgo(pin.createdAt)}
                          </span>
                        </div>
                        <p
                          className={cn(
                            'mt-1.5 line-clamp-2 break-words text-sm leading-snug text-foreground',
                            closed && 'line-through decoration-muted-foreground/50'
                          )}
                        >
                          {summary.type === 'diff' ? (
                            <>
                              <span className='text-muted-foreground line-through decoration-muted-foreground/40'>
                                {summary.from}
                              </span>
                              <ArrowRight className='mx-1 inline h-3 w-3 align-[-1px] text-emerald-600 dark:text-emerald-400' />
                              <span className='font-medium'>{summary.to}</span>
                            </>
                          ) : (
                            <span className={cn(summary.muted && 'text-muted-foreground')}>
                              {summary.text}
                            </span>
                          )}
                        </p>
                        {summary.type === 'diff' && pin.comment?.trim() && (
                          <p className='mt-0.5 line-clamp-1 break-words text-[11px] text-muted-foreground'>
                            {pin.comment.trim()}
                          </p>
                        )}
                        {hasFooter && (
                          <div className='mt-1.5 flex h-5 min-w-0 items-center gap-2 text-[11px] text-muted-foreground'>
                            {snippet && (
                              <span className='min-w-0 truncate font-mono text-[10px]'>
                                {snippet}
                              </span>
                            )}
                            {pin.viewportType !== 'desktop' && (
                              <span className='inline-flex shrink-0 items-center gap-0.5 capitalize'>
                                <DeviceMobile className='h-3 w-3' />
                                {pin.viewportType}
                              </span>
                            )}
                            {replies.length > 0 && (
                              <span className='inline-flex shrink-0 items-center gap-1'>
                                <ChatText className='h-3 w-3' />
                                {replies.length}
                              </span>
                            )}
                            <span className='ml-auto flex shrink-0 items-center gap-1 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100'>
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
                        )}
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
                <div className='sticky top-0 z-10 border-b border-border/60 bg-background/95 px-4 py-1.5 text-[11px] font-medium text-muted-foreground backdrop-blur'>
                  Open · {activeOpenPins.length}
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
                    <div className='sticky top-0 z-10 border-y border-border/60 bg-background/95 px-4 py-1.5 text-[11px] font-medium text-muted-foreground backdrop-blur'>
                      Implemented · {activeImplementedPins.length}
                    </div>
                    {renderPins(activeImplementedPins)}
                  </>
                )}
                {activeClosedPins.length > 0 && (
                  <>
                    <div className='sticky top-0 z-10 border-y border-border/60 bg-background/95 px-4 py-1.5 text-[11px] font-medium text-muted-foreground backdrop-blur'>
                      Closed · {activeClosedPins.length}
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
    </TooltipProvider>
  )
}
