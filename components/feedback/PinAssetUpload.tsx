'use client'

import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { Link, Spinner, UploadSimple, X } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

const ALLOWED_IMAGE_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif'
])

const MAX_BYTES = 15 * 1024 * 1024

interface PinAssetUploadProps {
  assetUrl?: string
  canEdit: boolean
  onChange: (assetUrl: string | undefined) => void
  className?: string
}

export function PinAssetUpload({
  assetUrl,
  canEdit,
  onChange,
  className
}: PinAssetUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [tab, setTab] = useState<'upload' | 'url'>('upload')
  const [urlDraft, setUrlDraft] = useState('')

  const handleFile = async (file: File) => {
    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      toast.error('Use a PNG, JPEG, WebP or GIF image')
      return
    }
    if (file.size > MAX_BYTES) {
      toast.error('Image too large (max 15 MB)')
      return
    }

    setUploading(true)
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
      const presign = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentType: file.type, ext })
      })
      if (!presign.ok) {
        const body = await presign.json().catch(() => null)
        toast.error(body?.error ?? 'Could not start upload')
        return
      }
      const { uploadUrl, publicUrl } = await presign.json()

      const put = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file
      })
      if (!put.ok) {
        toast.error('Upload failed')
        return
      }

      onChange(publicUrl)
      toast.success('Replacement image attached')
    } catch {
      toast.error('Network error during upload')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const handleUrlSubmit = () => {
    const url = urlDraft.trim()
    if (!url) return
    if (!/^https?:\/\/.+/.test(url)) {
      toast.error('Enter a valid image URL starting with http:// or https://')
      return
    }
    onChange(url)
    setUrlDraft('')
    toast.success('Replacement image URL set')
  }

  if (!canEdit && !assetUrl) return null

  return (
    <div className={cn('space-y-1', className)}>
      <p className='text-[10px] font-medium uppercase tracking-wide text-muted-foreground'>
        Replacement image
      </p>
      {assetUrl ? (
        <div className='relative overflow-hidden rounded-md border border-border/50 bg-background'>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={assetUrl}
            alt='Replacement asset'
            className='max-h-40 w-full object-contain'
          />
          <div className='flex items-center justify-between gap-2 border-t border-border/50 px-2 py-1.5'>
            <a
              href={assetUrl}
              target='_blank'
              rel='noreferrer'
              className='truncate text-[11px] text-muted-foreground underline-offset-2 hover:underline'
            >
              {assetUrl}
            </a>
            {canEdit && (
              <Button
                variant='ghost'
                size='icon'
                className='size-6 shrink-0 text-muted-foreground hover:text-rose-600'
                onClick={() => onChange(undefined)}
                title='Remove replacement image'
              >
                <X className='h-3.5 w-3.5' />
              </Button>
            )}
          </div>
        </div>
      ) : canEdit ? (
        <div className='space-y-2'>
          <div className='flex rounded-md border border-border/50 bg-muted/20 p-0.5'>
            <button
              type='button'
              onClick={() => setTab('upload')}
              className={cn(
                'flex-1 rounded-sm py-1 text-[11px] font-medium transition-colors',
                tab === 'upload'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Upload file
            </button>
            <button
              type='button'
              onClick={() => setTab('url')}
              className={cn(
                'flex-1 rounded-sm py-1 text-[11px] font-medium transition-colors',
                tab === 'url'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Paste URL
            </button>
          </div>

          {tab === 'upload' ? (
            <Button
              variant='outline'
              size='sm'
              className='h-8 w-full gap-1.5 border-dashed text-xs'
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
            >
              {uploading ? (
                <Spinner className='h-3.5 w-3.5 animate-spin' />
              ) : (
                <UploadSimple className='h-3.5 w-3.5' />
              )}
              {uploading ? 'Uploading…' : 'Upload replacement image'}
            </Button>
          ) : (
            <div className='flex gap-1.5'>
              <Input
                value={urlDraft}
                onChange={e => setUrlDraft(e.target.value)}
                placeholder='https://example.com/image.jpg'
                className='h-8 text-xs'
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleUrlSubmit()
                  }
                }}
              />
              <Button
                type='button'
                size='sm'
                className='h-8 shrink-0 gap-1 px-2 text-xs'
                disabled={!urlDraft.trim()}
                onClick={handleUrlSubmit}
              >
                <Link className='h-3.5 w-3.5' />
                Use
              </Button>
            </div>
          )}
        </div>
      ) : null}
      <input
        ref={inputRef}
        type='file'
        accept='image/png,image/jpeg,image/webp,image/gif'
        className='hidden'
        onChange={event => {
          const file = event.target.files?.[0]
          if (file) void handleFile(file)
        }}
      />
    </div>
  )
}
