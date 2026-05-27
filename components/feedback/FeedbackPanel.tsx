'use client'

import { useFeedback } from '@/contexts/FeedbackContext'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Trash2, Monitor, Tablet, Smartphone, Download, Inspect, MessageSquare } from 'lucide-react'
import { Severity, FeedbackViewportType } from '@/types/feedback'
import { cn } from '@/lib/utils'

const severityDot: Record<Severity, string> = {
  low: 'bg-emerald-500',
  medium: 'bg-amber-500',
  high: 'bg-red-500'
}

const viewportIcon: Record<FeedbackViewportType, typeof Monitor> = {
  desktop: Monitor,
  tablet: Tablet,
  mobile: Smartphone
}

export default function FeedbackPanel() {
  const {
    isPanelOpen,
    setPanelOpen,
    pins,
    updatePin,
    removePin,
    selectedPinId,
    setSelectedPinId,
    setExportOpen
  } = useFeedback()

  return (
    <Sheet open={isPanelOpen} onOpenChange={setPanelOpen}>
      <SheetContent side='right' className='w-full sm:max-w-md flex flex-col p-0'>
        <SheetHeader className='px-6 pt-6 pb-3 border-b border-border/40'>
          <SheetTitle className='flex items-center justify-between'>
            <span>Feedback items ({pins.length})</span>
            <Button
              size='sm'
              variant='outline'
              className='gap-2'
              disabled={pins.length === 0}
              onClick={() => setExportOpen(true)}
            >
              <Download className='h-3.5 w-3.5' />
              Export
            </Button>
          </SheetTitle>
          <SheetDescription className='text-xs'>
            Comments are notes. Inspect/Edit items include selectors and replacement text for an LLM or developer.
          </SheetDescription>
        </SheetHeader>

        <div className='flex-1 overflow-y-auto px-6 py-4 space-y-3'>
          {pins.length === 0 && (
            <div className='text-sm text-muted-foreground text-center py-12'>
              Enable feedback mode, choose Comment or Inspect/Edit, then click inside a viewport.
            </div>
          )}

          {pins.map(pin => {
            const Icon = viewportIcon[pin.viewportType]
            const isSelected = pin.id === selectedPinId
            return (
              <div
                key={pin.id}
                onClick={() => setSelectedPinId(pin.id)}
                className={cn(
                  'rounded-lg border bg-card transition-all cursor-pointer p-3',
                  isSelected
                    ? 'border-foreground/30 shadow-sm'
                    : 'border-border/40 hover:border-border/80'
                )}
              >
                <div className='flex items-start justify-between gap-2 mb-2'>
                  <div className='flex items-center gap-2 min-w-0'>
                    <span
                      className={cn(
                        'w-6 h-6 rounded-full text-white text-xs font-semibold flex items-center justify-center flex-shrink-0',
                        severityDot[pin.severity]
                      )}
                    >
                      {pin.number}
                    </span>
                    <Icon className='h-3.5 w-3.5 text-muted-foreground flex-shrink-0' />
                    {pin.kind === 'inspect' ? (
                      <Inspect className='h-3.5 w-3.5 text-muted-foreground flex-shrink-0' />
                    ) : (
                      <MessageSquare className='h-3.5 w-3.5 text-muted-foreground flex-shrink-0' />
                    )}
                    {pin.elementTag && (
                      <code className='text-[10px] font-mono text-muted-foreground truncate'>
                        &lt;{pin.elementTag}&gt;{pin.elementText && ` "${pin.elementText.slice(0, 40)}"`}
                      </code>
                    )}
                  </div>
                  <button
                    onClick={e => {
                      e.stopPropagation()
                      removePin(pin.id)
                    }}
                    className='text-muted-foreground hover:text-red-600 p-1 rounded transition-colors flex-shrink-0'
                    aria-label='Delete pin'
                  >
                    <Trash2 className='h-3.5 w-3.5' />
                  </button>
                </div>

                <div className='flex gap-1 mb-2'>
                  {(['low', 'medium', 'high'] as Severity[]).map(s => (
                    <button
                      key={s}
                      onClick={e => {
                        e.stopPropagation()
                        updatePin(pin.id, { severity: s })
                      }}
                      className={cn(
                        'text-[10px] px-2 py-0.5 rounded border transition-all capitalize',
                        pin.severity === s
                          ? 'border-foreground/40 bg-foreground/5 font-medium'
                          : 'border-border/40 text-muted-foreground hover:border-border'
                      )}
                    >
                      <span className={cn('inline-block w-1 h-1 rounded-full mr-1 align-middle', severityDot[s])} />
                      {s}
                    </button>
                  ))}
                </div>

                <Textarea
                  value={pin.comment}
                  onChange={e => updatePin(pin.id, { comment: e.target.value })}
                  onClick={e => e.stopPropagation()}
                  placeholder={pin.kind === 'inspect' ? 'Optional note for this edit' : 'What needs to change?'}
                  className='min-h-[60px] text-sm resize-none'
                />

                {pin.kind === 'inspect' && (
                  <div className='space-y-2 mt-2'>
                    {pin.elementText && (
                      <div className='rounded-md border border-border/40 bg-muted/30 p-2'>
                        <p className='text-[10px] uppercase tracking-[0.14em] text-muted-foreground mb-1'>
                          Current text
                        </p>
                        <p className='text-xs leading-relaxed line-clamp-3'>
                          {pin.elementText}
                        </p>
                      </div>
                    )}
                    <Textarea
                      value={pin.replacementText || ''}
                      onChange={e => updatePin(pin.id, { replacementText: e.target.value })}
                      onClick={e => e.stopPropagation()}
                      placeholder='Replace selected text with...'
                      className='min-h-[64px] text-sm resize-none'
                    />
                    <Textarea
                      value={pin.editInstruction || ''}
                      onChange={e => updatePin(pin.id, { editInstruction: e.target.value })}
                      onClick={e => e.stopPropagation()}
                      placeholder='Optional: style/layout instruction for this element'
                      className='min-h-[52px] text-xs resize-none'
                    />
                  </div>
                )}

                {pin.cssSelector && (
                  <p className='text-[10px] text-muted-foreground mt-2 font-mono truncate'>
                    {pin.cssSelector}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </SheetContent>
    </Sheet>
  )
}
