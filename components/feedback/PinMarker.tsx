'use client'

import { useState } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import {
  ArrowsOutCardinal,
  ChatText,
  Image,
  Link,
  PaintBrush,
  SelectionPlus,
  TextT,
  Trash
} from '@phosphor-icons/react'
import type { Pin } from '@/types/feedback'
import { useFeedback } from '@/contexts/FeedbackContext'
import { cn } from '@/lib/utils'
import {
  getInspectActions,
  type InspectAction,
  type InspectActionId
} from '@/lib/feedback/inspectActions'

interface Props {
  pin: Pin
  position?: { x: number; y: number }
  autoOpen?: boolean
}

const actionIcon = (id: InspectActionId) => {
  switch (id) {
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
    case 'style-layout':
      return PaintBrush
    default:
      return ArrowsOutCardinal
  }
}

export default function PinMarker({ pin, position, autoOpen = false }: Props) {
  const { updatePin, removePin, selectedPinId, setSelectedPinId, canEdit } = useFeedback()
  const [open, setOpen] = useState(autoOpen)
  const [comment, setComment] = useState(pin.comment)
  const [replacementText, setReplacementText] = useState(pin.replacementText || '')
  const [editInstruction, setEditInstruction] = useState(pin.editInstruction || '')
  const [selectedActionId, setSelectedActionId] = useState<InspectActionId | null>(null)
  const isSelected = selectedPinId === pin.id
  const isInspect = pin.kind === 'inspect'
  const inspectActions = isInspect ? getInspectActions(pin) : []
  const savedAction = inspectActions.find(action => action.instruction === editInstruction)
  const selectedAction =
    inspectActions.find(action => action.id === selectedActionId) ?? savedAction
  const placeholderAction = selectedAction ?? inspectActions[0]

  const applyAction = (action: InspectAction) => {
    setSelectedActionId(action.id)
    setEditInstruction(action.instruction)
    if (action.id === 'remove-image' || action.id === 'remove-element') {
      setReplacementText('')
    }
  }

  const handleSave = () => {
    if (!canEdit) {
      setOpen(false)
      return
    }
    updatePin(pin.id, { comment, replacementText, editInstruction })
    setOpen(false)
  }

  return (
    <Popover
      open={open}
      onOpenChange={next => {
        setOpen(next)
        if (next) setSelectedPinId(pin.id)
        else if (canEdit) updatePin(pin.id, { comment, replacementText, editInstruction })
      }}
    >
      <PopoverTrigger asChild>
        <button
          type='button'
          onClick={e => e.stopPropagation()}
          style={{
            left: `${position?.x ?? pin.x}%`,
            top: `${position?.y ?? pin.y}%`
          }}
          className={cn(
            'absolute z-30 flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-zinc-950 text-xs font-semibold text-white shadow-md ring-4 ring-white/70 transition-transform hover:scale-110 pointer-events-auto',
            isSelected && 'scale-110 ring-blue-200'
          )}
          aria-label={`Pin ${pin.number}`}
        >
          {pin.number}
        </button>
      </PopoverTrigger>
      <PopoverContent
        side='right'
        align='start'
        className='w-72 p-3'
        onClick={e => e.stopPropagation()}
      >
        <div className='flex items-center justify-between mb-2'>
          <span className='text-xs font-semibold text-foreground flex items-center gap-1.5'>
            {isInspect ? <SelectionPlus className='h-3.5 w-3.5' /> : <ChatText className='h-3.5 w-3.5' />}
            Pin {pin.number} · {isInspect ? 'Inspect/Edit' : 'Comment'}
          </span>
          {canEdit && (
            <button
              type='button'
              onClick={() => removePin(pin.id)}
              className='text-muted-foreground hover:text-red-600 transition-colors p-1 rounded'
              aria-label='Delete pin'
            >
              <Trash className='h-3.5 w-3.5' />
            </button>
          )}
        </div>

        {isInspect && (
          <div className='space-y-2 mb-2'>
            <div className='flex flex-wrap gap-1'>
              {inspectActions.map(action => {
                const ActionIcon = actionIcon(action.id)
                const active = selectedActionId === action.id ||
                  (!selectedActionId && editInstruction === action.instruction)
                return (
                  <button
                    key={action.id}
                    type='button'
                    onClick={() => applyAction(action)}
                    className={cn(
                      'inline-flex h-7 items-center gap-1 rounded-md border px-2 text-[11px] font-medium transition-colors',
                      active
                        ? 'border-zinc-900 bg-zinc-900 text-white'
                        : 'border-border/70 bg-background text-muted-foreground hover:border-zinc-400 hover:text-foreground'
                    )}
                  >
                    <ActionIcon className='h-3.5 w-3.5' />
                    {action.label}
                  </button>
                )
              })}
            </div>
            {pin.elementText && (
              <div className='rounded-md border border-border/50 bg-muted/30 p-2'>
                <p className='text-[10px] uppercase tracking-[0.14em] text-muted-foreground mb-1'>
                  Current text
                </p>
                <p className='text-xs text-foreground leading-relaxed line-clamp-4'>
                  {pin.elementText}
                </p>
              </div>
            )}
            <Textarea
              value={replacementText}
              onChange={e => setReplacementText(e.target.value)}
              placeholder={placeholderAction?.detailPlaceholder ?? 'Describe the requested change or desired result'}
              className='min-h-[70px] text-sm resize-none'
              autoFocus
              readOnly={!canEdit}
            />
          </div>
        )}

        <Textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder={isInspect ? placeholderAction?.notePlaceholder ?? 'Optional context for this edit' : 'What needs to change?'}
          className='min-h-[72px] text-sm resize-none'
          autoFocus={!isInspect}
          readOnly={!canEdit}
        />

        {pin.cssSelector && (
          <p className='text-[10px] text-muted-foreground mt-2 font-mono truncate'>
            {pin.elementTag && <span className='text-foreground'>&lt;{pin.elementTag}&gt; </span>}
            {pin.cssSelector}
          </p>
        )}

        <div className='flex gap-2 mt-3'>
          <Button
            size='sm'
            variant='outline'
            className='flex-1'
            onClick={() => setOpen(false)}
          >
            {canEdit ? 'Cancel' : 'Close'}
          </Button>
          {canEdit && (
            <Button size='sm' className='flex-1' onClick={handleSave}>
              Save
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
