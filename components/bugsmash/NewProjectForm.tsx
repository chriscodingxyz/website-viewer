'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import { ArrowRight, CircleNotch } from '@phosphor-icons/react'

export default function NewProjectForm() {
  const router = useRouter()
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)

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
          name: name.trim() || undefined
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
