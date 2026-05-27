'use client'

import { useState } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Inspect, MessageSquare, Trash2 } from 'lucide-react'
import { Pin, Severity } from '@/types/feedback'
import { useFeedback } from '@/contexts/FeedbackContext'
import { cn } from '@/lib/utils'

interface Props {
  pin: Pin
  position?: { x: number; y: number }
  autoOpen?: boolean
}

const severityStyles: Record<Severity, string> = {
  low: 'bg-emerald-500 ring-emerald-500/40',
  medium: 'bg-amber-500 ring-amber-500/40',
  high: 'bg-red-500 ring-red-500/40'
}

const severityLabels: Record<Severity, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High'
}

export default function PinMarker({ pin, position, autoOpen = false }: Props) {
  const { updatePin, removePin, selectedPinId, setSelectedPinId, canEdit } = useFeedback()
  const [open, setOpen] = useState(autoOpen)
  const [comment, setComment] = useState(pin.comment)
  const [severity, setSeverity] = useState<Severity>(pin.severity)
  const [replacementText, setReplacementText] = useState(pin.replacementText || '')
  const [editInstruction, setEditInstruction] = useState(pin.editInstruction || '')
  const isSelected = selectedPinId === pin.id
  const isInspect = pin.kind === 'inspect'

  const handleSave = () => {
    if (!canEdit) {
      setOpen(false)
      return
    }
    updatePin(pin.id, { comment, severity, replacementText, editInstruction })
    setOpen(false)
  }

  return (
    <Popover
      open={open}
      onOpenChange={next => {
        setOpen(next)
        if (next) setSelectedPinId(pin.id)
        else if (canEdit) updatePin(pin.id, { comment, severity, replacementText, editInstruction })
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
            'absolute -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full text-white text-xs font-semibold flex items-center justify-center shadow-md ring-4 ring-offset-0 transition-transform hover:scale-110 z-30 pointer-events-auto',
            severityStyles[pin.severity],
            isSelected && 'scale-110'
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
            {isInspect ? <Inspect className='h-3.5 w-3.5' /> : <MessageSquare className='h-3.5 w-3.5' />}
            Pin {pin.number} · {isInspect ? 'Inspect/Edit' : 'Comment'}
          </span>
          {canEdit && (
            <button
              type='button'
              onClick={() => removePin(pin.id)}
              className='text-muted-foreground hover:text-red-600 transition-colors p-1 rounded'
              aria-label='Delete pin'
            >
              <Trash2 className='h-3.5 w-3.5' />
            </button>
          )}
        </div>

        {canEdit ? (
          <div className='flex gap-1 mb-2'>
            {(['low', 'medium', 'high'] as Severity[]).map(s => (
              <button
                key={s}
                type='button'
                onClick={() => setSeverity(s)}
                className={cn(
                  'flex-1 text-xs py-1 px-2 rounded border transition-all',
                  severity === s
                    ? 'border-foreground/40 bg-foreground/5 font-medium'
                    : 'border-border/40 text-muted-foreground hover:border-border'
                )}
              >
                <span
                  className={cn(
                    'inline-block w-1.5 h-1.5 rounded-full mr-1.5 align-middle',
                    severityStyles[s].split(' ')[0]
                  )}
                />
                {severityLabels[s]}
              </button>
            ))}
          </div>
        ) : (
          <div className='mb-2 text-[10px] uppercase tracking-[0.14em] text-muted-foreground'>
            {severityLabels[pin.severity]} priority
          </div>
        )}

        {isInspect && (
          <div className='space-y-2 mb-2'>
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
              placeholder='Replace selected text with...'
              className='min-h-[70px] text-sm resize-none'
              autoFocus
              readOnly={!canEdit}
            />
            <Textarea
              value={editInstruction}
              onChange={e => setEditInstruction(e.target.value)}
              placeholder='Optional: style/layout instruction for this element'
              className='min-h-[56px] text-xs resize-none'
              readOnly={!canEdit}
            />
          </div>
        )}

        <Textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder={isInspect ? 'Optional note for this edit' : 'What needs to change?'}
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
