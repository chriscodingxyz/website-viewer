'use client'

import { FeedbackSession } from '@/types/feedback'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Copy, Check, ExternalLink, Inspect, MessageSquare } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

interface Props {
  session: FeedbackSession
  markdown: string
}

const severityDot: Record<string, string> = {
  low: 'bg-emerald-500',
  medium: 'bg-amber-500',
  high: 'bg-red-500'
}

export default function ShareView({ session, markdown }: Props) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(markdown)
      setCopied(true)
      toast.success('Markdown copied — paste into Claude/Cursor')
      setTimeout(() => setCopied(false), 1500)
    } catch {
      toast.error('Copy failed')
    }
  }

  return (
    <div className='max-w-4xl mx-auto px-6 py-12'>
      <header className='mb-8'>
        <p className='text-xs text-muted-foreground uppercase tracking-wider mb-2'>
          Shared feedback session
        </p>
        <h1 className='text-3xl font-semibold mb-2'>
          {session.meta.title || new URL(session.url).hostname}
        </h1>
        <a
          href={session.url}
          target='_blank'
          rel='noreferrer'
          className='text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5'
        >
          {session.url}
          <ExternalLink className='h-3 w-3' />
        </a>
        <p className='text-xs text-muted-foreground mt-3'>
          {session.pins.length} pins · captured{' '}
          {new Date(session.updatedAt).toLocaleString()}
        </p>
      </header>

      <Tabs defaultValue='pins'>
        <TabsList className='grid w-full grid-cols-2 max-w-xs'>
          <TabsTrigger value='pins'>Pins</TabsTrigger>
          <TabsTrigger value='markdown'>LLM markdown</TabsTrigger>
        </TabsList>

        <TabsContent value='pins' className='mt-6 space-y-3'>
          {session.pins.map(pin => (
            <div key={pin.id} className='border border-border/40 rounded-lg p-4 bg-card'>
              <div className='flex items-center gap-3 mb-2'>
                <span
                  className={`w-7 h-7 rounded-full text-white text-xs font-semibold flex items-center justify-center ${
                    severityDot[pin.severity] || 'bg-muted'
                  }`}
                >
                  {pin.number}
                </span>
                <span className='text-xs uppercase tracking-wider text-muted-foreground'>
                  {pin.severity} · {pin.viewportType} · {pin.kind === 'inspect' ? 'inspect/edit' : 'comment'}
                </span>
                {pin.kind === 'inspect' ? (
                  <Inspect className='h-3.5 w-3.5 text-muted-foreground' />
                ) : (
                  <MessageSquare className='h-3.5 w-3.5 text-muted-foreground' />
                )}
                {pin.elementTag && (
                  <code className='text-xs font-mono text-muted-foreground'>
                    &lt;{pin.elementTag}&gt;{pin.elementText ? ` "${pin.elementText}"` : ''}
                  </code>
                )}
              </div>
              {pin.comment && <p className='text-sm mb-2'>{pin.comment}</p>}
              {pin.kind === 'inspect' && (
                <div className='rounded-md border border-border/40 bg-muted/30 p-3 mb-2 text-sm'>
                  {pin.elementText && (
                    <p className='text-muted-foreground'>
                      Current: <span className='text-foreground'>{pin.elementText}</span>
                    </p>
                  )}
                  {pin.replacementText && (
                    <p className='mt-1 text-muted-foreground'>
                      Replace with: <span className='text-foreground'>{pin.replacementText}</span>
                    </p>
                  )}
                  {pin.editInstruction && (
                    <p className='mt-1 text-muted-foreground'>
                      Instruction: <span className='text-foreground'>{pin.editInstruction}</span>
                    </p>
                  )}
                </div>
              )}
              {pin.cssSelector && (
                <p className='text-[10px] text-muted-foreground font-mono break-all'>
                  {pin.cssSelector}
                </p>
              )}
            </div>
          ))}
        </TabsContent>

        <TabsContent value='markdown' className='mt-6'>
          <div className='flex justify-end mb-3'>
            <Button onClick={handleCopy} size='sm' className='gap-2'>
              {copied ? <Check className='h-3.5 w-3.5' /> : <Copy className='h-3.5 w-3.5' />}
              {copied ? 'Copied' : 'Copy for LLM'}
            </Button>
          </div>
          <pre className='text-xs bg-muted/40 border border-border/40 rounded-md p-4 whitespace-pre-wrap font-mono max-h-[70vh] overflow-auto'>
            {markdown}
          </pre>
        </TabsContent>
      </Tabs>
    </div>
  )
}
