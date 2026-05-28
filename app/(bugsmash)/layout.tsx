import { ReactNode } from 'react'
import { requireSession } from '@/lib/auth-helpers'
import { isProjectCreatorEmail } from '@/lib/auth'
import { listProjectsForUser } from '@/lib/projects'
import BugsmashShell from '@/components/bugsmash/BugsmashShell'

export const dynamic = 'force-dynamic'

export default async function BugsmashLayout({ children }: { children: ReactNode }) {
  const session = await requireSession()
  const projects = session ? await listProjectsForUser(session.user.id) : []
  const navProjects = projects.map(item => ({
    id: item.project.id,
    name: item.project.name,
    websiteUrl: item.project.websiteUrl,
    pinCount: item.pinCount
  }))

  return (
    <BugsmashShell
      user={
        session
          ? {
              name: session.user.name ?? null,
              email: session.user.email ?? null,
              image: session.user.image ?? null
            }
          : null
      }
      canCreate={isProjectCreatorEmail(session?.user.email)}
      projects={navProjects}
    >
      {children}
    </BugsmashShell>
  )
}
