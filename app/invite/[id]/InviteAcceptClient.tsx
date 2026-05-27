'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  authClient,
  signInWithGoogle,
  useSession
} from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { CheckCircle2, UserCircle } from 'lucide-react'
import { toast } from 'sonner'

export default function InviteAcceptClient({
  invitationId
}: {
  invitationId: string
}) {
  const router = useRouter()
  const session = useSession()
  const user = session.data?.user
  const [googleConfigured, setGoogleConfigured] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    fetch('/api/projects/config')
      .then(res => (res.ok ? res.json() : null))
      .then(data => setGoogleConfigured(Boolean(data?.googleConfigured)))
      .catch(() => {})
  }, [])

  const acceptInvite = async () => {
    setBusy(true)
    const result = await authClient.organization.acceptInvitation({
      invitationId
    })
    setBusy(false)

    if (result?.error || !result?.data) {
      toast.error(
        result?.error?.message ||
          result?.error?.statusText ||
          'Could not accept invite.'
      )
      return
    }

    await authClient.organization.setActive({
      organizationId: result.data.member.organizationId
    })
    toast.success('Invite accepted')
    router.push('/')
  }

  return (
    <main className='min-h-[calc(100vh-4rem)] bg-muted/20 px-4 py-24'>
      <section className='mx-auto max-w-md rounded-lg border bg-background p-6 shadow-sm'>
        <div className='flex items-start gap-3'>
          <div className='flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary'>
            <CheckCircle2 className='h-5 w-5' />
          </div>
          <div className='min-w-0 flex-1 space-y-1'>
            <h1 className='text-xl font-semibold tracking-tight'>
              Project Invite
            </h1>
            <p className='text-sm text-muted-foreground'>
              {user
                ? `Signed in as ${user.email}`
                : 'Sign in with Google to continue.'}
            </p>
          </div>
        </div>

        <div className='mt-6'>
          {user ? (
            <Button className='w-full' onClick={acceptInvite} disabled={busy}>
              Accept Invite
            </Button>
          ) : (
            <Button
              className='w-full gap-2'
              onClick={() => signInWithGoogle(window.location.href)}
              disabled={!googleConfigured}
            >
              <UserCircle className='h-4 w-4' />
              {googleConfigured ? 'Connect Google' : 'Google not set'}
            </Button>
          )}
        </div>
      </section>
    </main>
  )
}
