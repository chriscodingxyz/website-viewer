import Link from 'next/link'
import { requireSession } from '@/lib/auth-helpers'
import { isProjectCreatorEmail } from '@/lib/auth'
import NewProjectForm from '@/components/bugsmash/NewProjectForm'
import DashboardSignInPrompt from '@/components/bugsmash/DashboardSignInPrompt'

export const dynamic = 'force-dynamic'

export default async function NewProjectPage() {
  const session = await requireSession()

  if (!session) {
    return <DashboardSignInPrompt />
  }

  const canCreate = isProjectCreatorEmail(session.user.email)

  if (!canCreate) {
    return (
      <div className='mx-auto max-w-md px-6 py-24 text-center'>
        <h1 className='text-xl font-semibold tracking-tight'>Project creation is restricted</h1>
        <p className='mt-2 text-sm text-muted-foreground'>
          Your account is signed in as {session.user.email} but is not in the project creator
          allowlist. Ask an owner to add your email.
        </p>
        <Link
          href='/dashboard'
          className='mt-6 inline-block text-xs font-medium text-muted-foreground hover:text-foreground'
        >
          Back to dashboard
        </Link>
      </div>
    )
  }

  return (
    <div className='mx-auto max-w-xl px-4 py-16 sm:px-6'>
      <div className='mb-8'>
        <Link
          href='/dashboard'
          className='text-xs font-medium text-muted-foreground hover:text-foreground'
        >
          ← Dashboard
        </Link>
        <h1 className='mt-3 text-2xl font-semibold tracking-tight'>New project</h1>
        <p className='mt-1 text-sm text-muted-foreground'>
          Add the website you want to review. We&apos;ll create a workspace at a stable URL you can
          share with your team.
        </p>
      </div>
      <NewProjectForm />
    </div>
  )
}
