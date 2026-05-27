'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { signInWithGoogle } from '@/lib/auth-client'
import { toast } from 'sonner'
import { UserCircle } from '@phosphor-icons/react'

export default function DashboardSignInPrompt() {
  const [googleConfigured, setGoogleConfigured] = useState(false)

  useEffect(() => {
    fetch('/api/projects/config')
      .then(res => (res.ok ? res.json() : null))
      .then(data => setGoogleConfigured(Boolean(data?.googleConfigured)))
      .catch(() => {})
  }, [])

  const signIn = async () => {
    if (!googleConfigured) {
      toast.error('Google OAuth is not configured yet.')
      return
    }
    await signInWithGoogle(window.location.href)
  }

  return (
    <div className='mx-auto flex max-w-md flex-col items-center px-6 py-24 text-center'>
      <Card className='w-full border-border/70'>
        <CardContent className='flex flex-col items-center p-8 text-center'>
          <div className='flex h-12 w-12 items-center justify-center rounded-full border border-border/70 bg-muted/30'>
            <UserCircle className='h-6 w-6 text-muted-foreground' />
          </div>
          <h1 className='mt-5 text-xl font-semibold tracking-tight'>
            Sign in to view projects
          </h1>
          <p className='mt-2 text-sm text-muted-foreground'>
            Bugsmash projects are private to their members. Sign in to see the projects
            you belong to.
          </p>
          <Button
            size='sm'
            className='mt-6 h-9 gap-2 rounded-md'
            onClick={signIn}
            disabled={!googleConfigured}
          >
            <UserCircle className='h-4 w-4' />
            {googleConfigured ? 'Continue with Google' : 'Google not configured'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
