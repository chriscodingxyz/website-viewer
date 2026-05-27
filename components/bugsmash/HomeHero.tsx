'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { signInWithGoogle, signOut } from '@/lib/auth-client'
import { toast } from 'sonner'
import {
  ArrowRight,
  Bug,
  ChatCircle,
  Cursor,
  Kanban,
  Share,
  SignOut,
  Sparkle,
  SquaresFour,
  UserCircle
} from '@phosphor-icons/react'

interface Props {
  signedInEmail: string | null
  signedInName: string | null
  projectCount: number
  canCreate: boolean
}

const FEATURES = [
  {
    icon: Cursor,
    title: 'Pin anywhere',
    desc: 'Click on a rendered preview to leave precise visual feedback tied to the exact element.'
  },
  {
    icon: ChatCircle,
    title: 'Thread per pin',
    desc: 'Reply, ask follow-ups, and resolve discussions next to the page they refer to.'
  },
  {
    icon: Share,
    title: 'One link to share',
    desc: 'Every project has a stable URL anyone can open to view the feedback canvas read-only.'
  }
]

export default function HomeHero({
  signedInEmail,
  signedInName,
  projectCount,
  canCreate
}: Props) {
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
    <div className='min-h-screen bg-[#f7f7f4] text-foreground'>
      <header className='border-b border-border/60 bg-[#f7f7f4]/90 backdrop-blur'>
        <div className='mx-auto flex h-14 max-w-[1500px] items-center justify-between px-4 sm:px-6 lg:px-8'>
          <div className='flex items-center gap-2'>
            <span className='flex h-7 w-7 items-center justify-center rounded-md bg-foreground text-background'>
              <Bug weight='fill' className='h-4 w-4' />
            </span>
            <span className='text-sm font-semibold tracking-tight'>Bugsmash</span>
          </div>

          <nav className='hidden items-center gap-1 text-xs font-medium md:flex'>
            <Button asChild variant='ghost' size='sm' className='h-8 rounded-md'>
              <Link href='/viewer'>Free viewer</Link>
            </Button>
            {signedInEmail ? (
              <Button asChild variant='ghost' size='sm' className='h-8 rounded-md'>
                <Link href='/dashboard'>Dashboard</Link>
              </Button>
            ) : null}
          </nav>

          <div className='flex items-center gap-2'>
            {signedInEmail ? (
              <>
                <span className='hidden text-xs text-muted-foreground sm:inline'>
                  {signedInName || signedInEmail}
                </span>
                <Button
                  variant='ghost'
                  size='sm'
                  className='h-8 gap-1.5 rounded-md text-xs'
                  onClick={() => signOut()}
                >
                  <SignOut className='h-3.5 w-3.5' />
                  Sign out
                </Button>
              </>
            ) : (
              <Button
                variant='outline'
                size='sm'
                className='h-8 gap-1.5 rounded-md text-xs'
                onClick={signIn}
                disabled={!googleConfigured}
              >
                <UserCircle className='h-3.5 w-3.5' />
                {googleConfigured ? 'Sign in' : 'Google not set'}
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className='mx-auto max-w-5xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8'>
        <section className='text-center'>
          <Badge variant='outline' className='gap-1.5 px-3 py-1 text-xs font-medium'>
            <Sparkle weight='fill' className='h-3 w-3' />
            Visual review for real teams
          </Badge>
          <h1 className='mt-6 text-4xl tracking-tight text-foreground sm:text-6xl'>
            Bug reports your team{' '}
            <span className='font-serif italic font-normal'>actually replies to</span>.
          </h1>
          <p className='mx-auto mt-5 max-w-xl text-base text-muted-foreground sm:text-lg'>
            Drop pins on any page, leave threaded feedback, and share a single URL with
            clients or developers. Built for design reviews, not screenshots.
          </p>

          <div className='mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row'>
            {signedInEmail ? (
              <>
                {canCreate && (
                  <Button asChild size='lg' className='h-11 gap-2 rounded-md'>
                    <Link href='/projects/new'>
                      <Kanban weight='fill' className='h-4 w-4' />
                      New project
                    </Link>
                  </Button>
                )}
                <Button asChild variant='outline' size='lg' className='h-11 gap-2 rounded-md'>
                  <Link href='/dashboard'>
                    <SquaresFour className='h-4 w-4' />
                    {projectCount > 0
                      ? `Open dashboard (${projectCount})`
                      : 'Open dashboard'}
                  </Link>
                </Button>
              </>
            ) : (
              <>
                <Button
                  size='lg'
                  className='h-11 gap-2 rounded-md'
                  onClick={signIn}
                  disabled={!googleConfigured}
                >
                  <UserCircle className='h-4 w-4' />
                  Get started with Google
                </Button>
                <Button asChild variant='outline' size='lg' className='h-11 gap-2 rounded-md'>
                  <Link href='/viewer'>
                    Try the free viewer
                    <ArrowRight className='h-4 w-4' />
                  </Link>
                </Button>
              </>
            )}
          </div>

          {!signedInEmail && (
            <p className='mt-4 text-xs text-muted-foreground'>
              No card required. The free viewer works without an account.
            </p>
          )}
        </section>

        <section className='mt-24 grid grid-cols-1 gap-6 sm:grid-cols-3'>
          {FEATURES.map(feature => {
            const Icon = feature.icon
            return (
              <Card key={feature.title} className='border-border/60 bg-background'>
                <CardContent className='p-6'>
                  <div className='flex h-8 w-8 items-center justify-center rounded-md border border-border/70 bg-muted/40'>
                    <Icon weight='regular' className='h-4 w-4' />
                  </div>
                  <h3 className='mt-4 text-sm font-semibold tracking-tight'>{feature.title}</h3>
                  <p className='mt-1 text-sm text-muted-foreground'>{feature.desc}</p>
                </CardContent>
              </Card>
            )
          })}
        </section>
      </main>
    </div>
  )
}
