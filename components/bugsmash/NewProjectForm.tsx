'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { toast } from 'sonner'
import { ArrowRight, CircleNotch, Globe, Lock, Users } from '@phosphor-icons/react'
import SiteFavicon from '@/components/SiteFavicon'

function normalizePreviewUrl(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return ''
  try {
    const withProtocol = /^https?:\/\//i.test(trimmed)
      ? trimmed
      : `https://${trimmed}`
    const url = new URL(withProtocol)
    if (!['http:', 'https:'].includes(url.protocol)) return ''
    url.hash = ''
    return url.toString()
  } catch {
    return ''
  }
}

function nameFromUrl(value: string) {
  try {
    const host = new URL(value).hostname.replace(/^www\./, '')
    const base = host.split('.')[0] || host
    return base
      .split(/[-_]/g)
      .filter(Boolean)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ') || host
  } catch {
    return 'Website Project'
  }
}

export default function NewProjectForm() {
  const router = useRouter()
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [name, setName] = useState('')
  const [publicAccess, setPublicAccess] = useState<'view' | 'private'>('view')
  const [submitting, setSubmitting] = useState(false)
  const previewUrl = normalizePreviewUrl(websiteUrl)
  const previewName = name.trim() || (previewUrl ? nameFromUrl(previewUrl) : 'New website project')

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!websiteUrl.trim()) {
      toast.error('Add the website URL first.')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          websiteUrl: websiteUrl.trim(),
          name: name.trim() || undefined,
          publicAccess
        })
      })

      if (!res.ok) {
        const error = await res.json().catch(() => null)
        const message =
          typeof error?.error === 'string' ? error.error : 'Could not create project'
        toast.error(message)
        return
      }

      const data = await res.json()
      toast.success('Project created')
      router.push(`/p/${data.projectId}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Network error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card className='border-border/70 shadow-sm'>
      <CardContent className='p-6'>
        <form onSubmit={handleSubmit} className='space-y-6'>
          <div className='rounded-lg border border-border/70 bg-muted/20 p-4'>
            <div className='flex items-center gap-3'>
              {previewUrl ? (
                <SiteFavicon siteUrl={previewUrl} className='size-10 rounded-lg' />
              ) : (
                <span className='flex size-10 items-center justify-center rounded-lg border border-border/70 bg-background text-muted-foreground'>
                  <Globe className='h-5 w-5' />
                </span>
              )}
              <div className='min-w-0'>
                <p className='truncate text-sm font-semibold'>{previewName}</p>
                <p className='truncate text-xs text-muted-foreground'>
                  {previewUrl || 'Add a URL to preview the project identity'}
                </p>
              </div>
            </div>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='websiteUrl'>Website URL</Label>
            <Input
              id='websiteUrl'
              type='text'
              placeholder='https://example.com'
              value={websiteUrl}
              onChange={event => setWebsiteUrl(event.target.value)}
              required
              autoFocus
              className='h-10'
            />
            <p className='text-xs text-muted-foreground'>
              The site your team will leave feedback on.
            </p>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='name'>
              Project name <span className='text-muted-foreground'>(optional)</span>
            </Label>
            <Input
              id='name'
              type='text'
              placeholder='Auto-derived from the URL'
              value={name}
              onChange={event => setName(event.target.value)}
              maxLength={80}
              className='h-10'
            />
          </div>

          <div className='space-y-2'>
            <Label>Access</Label>
            <Select
              value={publicAccess}
              onValueChange={value => setPublicAccess(value as 'view' | 'private')}
            >
              <SelectTrigger className='h-10'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='view'>
                  <span className='inline-flex items-center gap-2'>
                    <Users className='h-3.5 w-3.5' />
                    Public view link
                  </span>
                </SelectItem>
                <SelectItem value='private'>
                  <span className='inline-flex items-center gap-2'>
                    <Lock className='h-3.5 w-3.5' />
                    Private to members
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className='text-xs text-muted-foreground'>
              You can invite reviewers and developers from the dashboard after creating it.
            </p>
          </div>

          <Button type='submit' size='sm' className='h-10 w-full gap-2 rounded-md' disabled={submitting}>
            {submitting ? (
              <CircleNotch className='h-4 w-4 animate-spin' />
            ) : (
              <>
                Create project
                <ArrowRight className='h-3.5 w-3.5' />
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
