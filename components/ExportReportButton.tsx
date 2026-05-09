'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { FileText } from 'lucide-react'
import { useWebsiteViewer } from '@/contexts/WebsiteViewerContext'
import { cn } from '@/lib/utils'

interface Props {
  className?: string
}

export default function ExportReportButton ({ className }: Props) {
  const { currentSite } = useWebsiteViewer()

  if (!currentSite) return null

  const handleExport = () => {
    const cleaned = currentSite.replace(/^https?:\/\//, '').replace(/\/$/, '')
    const url = `/report?site=${encodeURIComponent(cleaned)}&autoprint=1`
    window.open(url, '_blank', 'noopener,noreferrer,width=900,height=1000')
  }

  return (
    <Button
      variant='outline'
      size='sm'
      onClick={handleExport}
      className={cn('h-8 gap-1.5 text-xs', className)}
      title='Export PDF report'
    >
      <FileText className='h-3.5 w-3.5' />
      <span className='hidden sm:inline'>Export</span>
    </Button>
  )
}
