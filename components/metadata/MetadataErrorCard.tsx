'use client'

import React from 'react'
import { AlertTriangle, RotateCw, ArrowRight, ShieldAlert, Clock, Lock, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useWebsiteViewer } from '@/contexts/WebsiteViewerContext'
import type { MetadataErrorCode } from '@/types/metadata'

interface Props {
  sectionName: string
  error: string
}

const errorMeta: Record<MetadataErrorCode, { icon: React.ElementType, title: string, hint: string }> = {
  blocked: {
    icon: ShieldAlert,
    title: 'This site blocks automated requests',
    hint: 'Some sites refuse bots. Viewports still render through our proxy.'
  },
  timeout: {
    icon: Clock,
    title: 'The site took too long to respond',
    hint: 'It may be slow or temporarily unreachable. Retry, or skip to viewports.'
  },
  auth_required: {
    icon: Lock,
    title: 'Authentication required',
    hint: 'This URL needs login credentials.'
  },
  invalid_html: {
    icon: AlertTriangle,
    title: "We couldn't parse this site's HTML",
    hint: 'The response wasn\'t valid HTML. Viewports may still render.'
  },
  invalid_url: {
    icon: Globe,
    title: 'Invalid URL',
    hint: 'Check the URL and try again.'
  },
  fetch_failed: {
    icon: AlertTriangle,
    title: "We couldn't read this site's metadata",
    hint: 'Network error or unreachable host.'
  },
  unknown: {
    icon: AlertTriangle,
    title: 'Something went wrong',
    hint: 'Retry, or continue without metadata.'
  }
}

export default function MetadataErrorCard ({ sectionName, error }: Props) {
  const { retryMetadata, setSelectedTab, metadataErrorCode, metadataLoading } = useWebsiteViewer()
  const meta = errorMeta[metadataErrorCode || 'unknown']
  const Icon = meta.icon

  return (
    <div className='w-full min-h-[400px] flex items-center justify-center'>
      <div className='max-w-md w-full bg-card border border-border rounded-2xl p-8 text-center shadow-sm'>
        <div className='mx-auto mb-5 w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center'>
          <Icon className='h-7 w-7 text-accent' />
        </div>
        <h3 className='text-lg font-bold text-foreground mb-1'>
          {meta.title}
        </h3>
        <p className='text-sm text-muted-foreground mb-2'>
          {meta.hint}
        </p>
        <p className='text-xs text-muted-foreground/70 mb-6 break-words'>
          {sectionName} · {error}
        </p>
        <div className='flex flex-col sm:flex-row gap-2 justify-center'>
          <Button
            onClick={() => retryMetadata()}
            disabled={metadataLoading}
            className='gap-2'
          >
            <RotateCw className={`h-4 w-4 ${metadataLoading ? 'animate-spin' : ''}`} />
            {metadataLoading ? 'Retrying…' : 'Retry'}
          </Button>
          <Button
            variant='outline'
            onClick={() => setSelectedTab('viewports')}
            className='gap-2'
          >
            Continue to viewports
            <ArrowRight className='h-4 w-4' />
          </Button>
        </div>
      </div>
    </div>
  )
}
