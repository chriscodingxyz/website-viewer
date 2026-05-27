import Link from 'next/link'
import { requireSession } from '@/lib/auth-helpers'
import { isProjectCreatorEmail } from '@/lib/auth'
import { listProjectsForUser } from '@/lib/projects'
import HomeHero from '@/components/bugsmash/HomeHero'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const session = await requireSession()
  const projectCount = session ? (await listProjectsForUser(session.user.id)).length : 0
  const canCreate = isProjectCreatorEmail(session?.user.email)

  return (
    <HomeHero
      signedInEmail={session?.user.email ?? null}
      signedInName={session?.user.name ?? null}
      projectCount={projectCount}
      canCreate={canCreate}
    />
  )
}
