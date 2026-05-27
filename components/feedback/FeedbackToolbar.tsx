'use client'

import { useFeedback } from '@/contexts/FeedbackContext'
import { useWebsiteViewer } from '@/contexts/WebsiteViewerContext'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Inspect, MessageSquare, MessageSquarePlus, Trash2, Download, List, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export default function FeedbackToolbar() {
  const { currentSite } = useWebsiteViewer()
  const {
    feedbackMode,
    toggleFeedbackMode,
    pins,
    clearPins,
    isPanelOpen,
    setPanelOpen,
    setExportOpen,
    activeTool,
    setActiveTool,
    canEdit
  } = useFeedback()

  if (!currentSite) return null

  const handleClear = () => {
    if (pins.length === 0) return
    if (confirm(`Remove all ${pins.length} pins?`)) {
      clearPins()
      toast.success('All pins cleared')
    }
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div
        className={cn(
          'fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1 bg-card/95 backdrop-blur-md border border-border/60 rounded-full px-2 py-1.5 shadow-lg transition-all',
          feedbackMode && 'border-accent/60 shadow-accent/20'
        )}
      >
        {canEdit && (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size='sm'
                  variant={feedbackMode ? 'default' : 'ghost'}
                  onClick={toggleFeedbackMode}
                  className='rounded-full gap-2 h-8 px-3'
                >
                  {feedbackMode ? (
                    <>
                      <X className='h-3.5 w-3.5' />
                      <span className='text-xs'>Exit feedback</span>
                    </>
                  ) : (
                    <>
                      <MessageSquarePlus className='h-3.5 w-3.5' />
                      <span className='text-xs'>Feedback mode</span>
                    </>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <kbd className='text-[10px]'>F</kbd> Toggle feedback mode
              </TooltipContent>
            </Tooltip>

            <div className='w-px h-5 bg-border/60 mx-0.5' />
          </>
        )}

        {canEdit && feedbackMode && (
          <>
            <div className='flex items-center gap-1 rounded-full bg-muted/60 p-0.5'>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size='sm'
                    variant={activeTool === 'comment' ? 'default' : 'ghost'}
                    onClick={() => setActiveTool('comment')}
                    className='rounded-full h-7 px-2.5 gap-1.5'
                  >
                    <MessageSquare className='h-3.5 w-3.5' />
                    <span className='text-xs'>Comment</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Drop a normal feedback comment</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size='sm'
                    variant={activeTool === 'inspect' ? 'default' : 'ghost'}
                    onClick={() => setActiveTool('inspect')}
                    className='rounded-full h-7 px-2.5 gap-1.5'
                  >
                    <Inspect className='h-3.5 w-3.5' />
                    <span className='text-xs'>Inspect/Edit</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Capture selectors and propose a text replacement</TooltipContent>
              </Tooltip>
            </div>

            <div className='w-px h-5 bg-border/60 mx-0.5' />
          </>
        )}

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size='sm'
              variant='ghost'
              onClick={() => setPanelOpen(!isPanelOpen)}
              className='rounded-full h-8 px-2.5 gap-1.5'
              disabled={pins.length === 0}
            >
              <List className='h-3.5 w-3.5' />
              <span className='text-xs font-medium tabular-nums'>{pins.length}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Pins panel</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size='sm'
              variant='ghost'
              onClick={() => setExportOpen(true)}
              className='rounded-full h-8 w-8 p-0'
              disabled={pins.length === 0}
            >
              <Download className='h-3.5 w-3.5' />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <kbd className='text-[10px]'>E</kbd> Export for LLM
          </TooltipContent>
        </Tooltip>

        {canEdit && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size='sm'
                variant='ghost'
                onClick={handleClear}
                className='rounded-full h-8 w-8 p-0 text-muted-foreground hover:text-red-600'
                disabled={pins.length === 0}
              >
                <Trash2 className='h-3.5 w-3.5' />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Clear all pins</TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  )
}
