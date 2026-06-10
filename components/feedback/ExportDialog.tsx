'use client'

import { useMemo, useState } from 'react'
import { useFeedback } from '@/contexts/FeedbackContext'
import { useWebsiteViewer } from '@/contexts/WebsiteViewerContext'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Copy, Download, Check, Link2 } from 'lucide-react'
import {
  toAcceptanceMarkdown,
  toAgentPrompt,
  toMarkdown,
  toJson,
  toTasksJson
} from '@/lib/feedback/export'
import { saveAs } from 'file-saver'
import { toast } from 'sonner'

export default function ExportDialog() {
  const { isExportOpen, setExportOpen, session, syncEnabled, createShareLink } = useFeedback()
  const { metadata } = useWebsiteViewer()
  const [copied, setCopied] = useState<'md' | 'json' | 'agent' | 'tasks' | 'acceptance' | null>(null)
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [generatingShare, setGeneratingShare] = useState(false)

  const handleShare = async () => {
    setGeneratingShare(true)
    const url = await createShareLink()
    setGeneratingShare(false)
    if (!url) {
      toast.error('Could not create share link')
      return
    }
    setShareUrl(url)
    try {
      await navigator.clipboard.writeText(url)
      toast.success('Share link copied')
    } catch {
      toast.success('Share link ready')
    }
  }

  const markdown = useMemo(
    () => (session ? toMarkdown(session, metadata?.seo?.title) : ''),
    [session, metadata]
  )
  const json = useMemo(() => (session ? toJson(session) : ''), [session])
  const agentPrompt = useMemo(
    () => (session ? toAgentPrompt(session, metadata?.seo?.title) : ''),
    [session, metadata]
  )
  const tasksJson = useMemo(() => (session ? toTasksJson(session) : ''), [session])
  const acceptance = useMemo(
    () => (session ? toAcceptanceMarkdown(session) : ''),
    [session]
  )

  const handleCopy = async (
    text: string,
    kind: 'md' | 'json' | 'agent' | 'tasks' | 'acceptance'
  ) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(kind)
      toast.success('Copied to clipboard')
      setTimeout(() => setCopied(null), 1500)
    } catch {
      toast.error('Copy failed')
    }
  }

  const handleDownload = (
    text: string,
    kind: 'md' | 'json' | 'agent' | 'tasks' | 'acceptance'
  ) => {
    if (!session) return
    const host = (() => {
      try {
        return new URL(session.url).hostname
      } catch {
        return 'feedback'
      }
    })()
    const date = session.updatedAt.slice(0, 10)
    const extension = kind === 'json' || kind === 'tasks' ? 'json' : 'md'
    const filename =
      kind === 'tasks'
        ? `tasks-${host}-${date}.json`
        : kind === 'acceptance'
          ? `acceptance-${host}-${date}.md`
          : kind === 'agent'
            ? `agent-prompt-${host}-${date}.md`
            : `feedback-${host}-${date}.${extension}`
    const blob = new Blob([text], {
      type: extension === 'md' ? 'text/markdown;charset=utf-8' : 'application/json;charset=utf-8'
    })
    saveAs(blob, filename)
  }

  return (
    <Dialog open={isExportOpen} onOpenChange={setExportOpen}>
      <DialogContent className='max-w-2xl'>
        <DialogHeader>
          <DialogTitle>Export feedback</DialogTitle>
          <DialogDescription>
            Export human feedback, agent prompts, task JSON, and acceptance
            criteria for implementation workflows.
          </DialogDescription>
        </DialogHeader>

        {syncEnabled && (
          <div className='flex items-center gap-2 p-2 rounded-md border border-border/40 bg-muted/30'>
            <Button
              size='sm'
              variant='outline'
              className='gap-2'
              onClick={handleShare}
              disabled={generatingShare || !session?.pins.length}
            >
              <Link2 className='h-3.5 w-3.5' />
              {generatingShare ? 'Generating…' : 'Create share link'}
            </Button>
            {shareUrl && (
              <input
                readOnly
                value={shareUrl}
                onClick={e => (e.target as HTMLInputElement).select()}
                className='flex-1 bg-transparent text-xs font-mono text-muted-foreground outline-none'
              />
            )}
          </div>
        )}

        <Tabs defaultValue='md' className='mt-2'>
          <TabsList className='grid w-full grid-cols-5'>
            <TabsTrigger value='md'>Handoff.md</TabsTrigger>
            <TabsTrigger value='agent'>AI Brief</TabsTrigger>
            <TabsTrigger value='tasks'>Tasks JSON</TabsTrigger>
            <TabsTrigger value='acceptance'>Acceptance</TabsTrigger>
            <TabsTrigger value='json'>JSON</TabsTrigger>
          </TabsList>

          <TabsContent value='agent' className='mt-3'>
            <pre className='max-h-[55vh] overflow-auto text-xs bg-muted/40 border border-border/40 rounded-md p-3 whitespace-pre-wrap font-mono'>
              {agentPrompt || '_No feedback yet._'}
            </pre>
            <div className='flex gap-2 mt-3'>
              <Button
                variant='outline'
                className='flex-1 gap-2'
                onClick={() => handleCopy(agentPrompt, 'agent')}
                disabled={!agentPrompt}
              >
                {copied === 'agent' ? <Check className='h-3.5 w-3.5' /> : <Copy className='h-3.5 w-3.5' />}
                {copied === 'agent' ? 'Copied' : 'Copy agent prompt'}
              </Button>
              <Button
                className='flex-1 gap-2'
                onClick={() => handleDownload(agentPrompt, 'agent')}
                disabled={!agentPrompt}
              >
                <Download className='h-3.5 w-3.5' />
                Download prompt
              </Button>
            </div>
          </TabsContent>

          <TabsContent value='tasks' className='mt-3'>
            <pre className='max-h-[55vh] overflow-auto text-xs bg-muted/40 border border-border/40 rounded-md p-3 font-mono'>
              {tasksJson}
            </pre>
            <div className='flex gap-2 mt-3'>
              <Button
                variant='outline'
                className='flex-1 gap-2'
                onClick={() => handleCopy(tasksJson, 'tasks')}
                disabled={!tasksJson}
              >
                {copied === 'tasks' ? <Check className='h-3.5 w-3.5' /> : <Copy className='h-3.5 w-3.5' />}
                {copied === 'tasks' ? 'Copied' : 'Copy tasks JSON'}
              </Button>
              <Button
                className='flex-1 gap-2'
                onClick={() => handleDownload(tasksJson, 'tasks')}
                disabled={!tasksJson}
              >
                <Download className='h-3.5 w-3.5' />
                Download tasks.json
              </Button>
            </div>
          </TabsContent>

          <TabsContent value='acceptance' className='mt-3'>
            <pre className='max-h-[55vh] overflow-auto text-xs bg-muted/40 border border-border/40 rounded-md p-3 whitespace-pre-wrap font-mono'>
              {acceptance}
            </pre>
            <div className='flex gap-2 mt-3'>
              <Button
                variant='outline'
                className='flex-1 gap-2'
                onClick={() => handleCopy(acceptance, 'acceptance')}
                disabled={!acceptance}
              >
                {copied === 'acceptance' ? <Check className='h-3.5 w-3.5' /> : <Copy className='h-3.5 w-3.5' />}
                {copied === 'acceptance' ? 'Copied' : 'Copy acceptance'}
              </Button>
              <Button
                className='flex-1 gap-2'
                onClick={() => handleDownload(acceptance, 'acceptance')}
                disabled={!acceptance}
              >
                <Download className='h-3.5 w-3.5' />
                Download acceptance.md
              </Button>
            </div>
          </TabsContent>

          <TabsContent value='md' className='mt-3'>
            <pre className='max-h-[55vh] overflow-auto text-xs bg-muted/40 border border-border/40 rounded-md p-3 whitespace-pre-wrap font-mono'>
              {markdown || '_No feedback yet._'}
            </pre>
            <div className='flex gap-2 mt-3'>
              <Button
                variant='outline'
                className='flex-1 gap-2'
                onClick={() => handleCopy(markdown, 'md')}
                disabled={!markdown}
              >
                {copied === 'md' ? <Check className='h-3.5 w-3.5' /> : <Copy className='h-3.5 w-3.5' />}
                {copied === 'md' ? 'Copied' : 'Copy markdown'}
              </Button>
              <Button
                className='flex-1 gap-2'
                onClick={() => handleDownload(markdown, 'md')}
                disabled={!markdown}
              >
                <Download className='h-3.5 w-3.5' />
                Download .md
              </Button>
            </div>
          </TabsContent>

          <TabsContent value='json' className='mt-3'>
            <pre className='max-h-[55vh] overflow-auto text-xs bg-muted/40 border border-border/40 rounded-md p-3 font-mono'>
              {json}
            </pre>
            <div className='flex gap-2 mt-3'>
              <Button
                variant='outline'
                className='flex-1 gap-2'
                onClick={() => handleCopy(json, 'json')}
                disabled={!json}
              >
                {copied === 'json' ? <Check className='h-3.5 w-3.5' /> : <Copy className='h-3.5 w-3.5' />}
                {copied === 'json' ? 'Copied' : 'Copy JSON'}
              </Button>
              <Button
                className='flex-1 gap-2'
                onClick={() => handleDownload(json, 'json')}
                disabled={!json}
              >
                <Download className='h-3.5 w-3.5' />
                Download .json
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
