import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireSession } from '@/lib/auth-helpers'
import { loadProjectBundle } from '@/lib/projects'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import ProjectOwnerActions from '@/components/bugsmash/ProjectOwnerActions'
import SiteFavicon from '@/components/SiteFavicon'
import { ArrowSquareOut, CaretLeft } from '@phosphor-icons/react/ssr'

export const dynamic = 'force-dynamic'

export default async function ProjectSettingsPage({
  params
}: {
  params: { projectId: string }
}) {
  const session = await requireSession()
  const bundle = await loadProjectBundle(params.projectId, session)

  if (!bundle) notFound()

  const members = bundle.member
    ? await import('@/lib/projects').then(async ({ listProjectsForUser }) => {
        if (!session) return []
        const projects = await listProjectsForUser(session.user.id)
        return projects.find(item => item.project.id === bundle.project.id)?.members ?? []
      })
    : []
  const invitations = session
    ? await import('@/lib/projects').then(async ({ listProjectsForUser }) => {
        const projects = await listProjectsForUser(session.user.id)
        return projects.find(item => item.project.id === bundle.project.id)?.invitations ?? []
      })
    : []

  return (
    <div className='mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8'>
      <Button asChild variant='ghost' size='sm' className='mb-4 h-8 gap-1.5 text-xs'>
        <Link href={`/p/${bundle.project.id}`}>
          <CaretLeft className='h-3.5 w-3.5' />
          Workspace
        </Link>
      </Button>

      <div className='mb-6 flex flex-wrap items-start justify-between gap-4'>
        <div className='flex min-w-0 items-center gap-3'>
          <SiteFavicon siteUrl={bundle.project.websiteUrl} className='size-10 rounded-lg' />
          <div className='min-w-0'>
            <h1 className='truncate text-2xl font-semibold tracking-tight'>
              {bundle.project.name}
            </h1>
            <a
              href={bundle.project.websiteUrl}
              target='_blank'
              rel='noreferrer'
              className='mt-1 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground'
            >
              {bundle.project.websiteUrl}
              <ArrowSquareOut className='h-3.5 w-3.5' />
            </a>
          </div>
        </div>
        <ProjectOwnerActions
          projectId={bundle.project.id}
          organizationId={bundle.project.organizationId}
          projectName={bundle.project.name}
          publicAccess={bundle.project.publicAccess}
          shareSlug={bundle.feedbackSession.slug}
          members={members}
          invitations={invitations}
          canManage={bundle.canManage}
        />
      </div>

      <div className='grid gap-4 md:grid-cols-3'>
        <Card className='p-4'>
          <p className='text-xs text-muted-foreground'>Access</p>
          <Badge variant='secondary' className='mt-2 capitalize'>
            {bundle.project.publicAccess === 'comment'
              ? 'Public comment'
              : bundle.project.publicAccess === 'view'
              ? 'Public view'
              : 'Private'}
          </Badge>
        </Card>
        <Card className='p-4'>
          <p className='text-xs text-muted-foreground'>Members</p>
          <p className='mt-1 text-2xl font-semibold tabular-nums'>{members.length}</p>
        </Card>
        <Card className='p-4'>
          <p className='text-xs text-muted-foreground'>Default reviewer role</p>
          <p className='mt-2 text-sm font-medium'>Reviewer</p>
        </Card>
      </div>

      <Card className='mt-4 p-4'>
        <h2 className='text-sm font-semibold'>Team</h2>
        <div className='mt-3 grid gap-2'>
          {members.map(member => (
            <div key={member.id} className='flex items-center justify-between rounded-md border border-border/70 px-3 py-2'>
              <div className='min-w-0'>
                <p className='truncate text-sm font-medium'>{member.name || member.email}</p>
                <p className='truncate text-xs text-muted-foreground'>{member.email}</p>
              </div>
              <Badge variant='outline' className='capitalize'>{member.role}</Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
