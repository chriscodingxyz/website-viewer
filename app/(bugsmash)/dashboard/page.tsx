import Link from 'next/link'
import { requireSession } from '@/lib/auth-helpers'
import { isProjectCreatorEmail } from '@/lib/auth'
import { listProjectsForUser } from '@/lib/projects'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import {
  ArrowSquareOut,
  Folder,
  Globe,
  PlusCircle,
  Users
} from '@phosphor-icons/react/ssr'
import DashboardSignInPrompt from '@/components/bugsmash/DashboardSignInPrompt'

export const dynamic = 'force-dynamic'

function formatDate(date: Date | null) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

function hostFor(websiteUrl: string) {
  try {
    return new URL(websiteUrl).hostname.replace(/^www\./, '')
  } catch {
    return websiteUrl
  }
}

export default async function DashboardPage() {
  const session = await requireSession()

  if (!session) {
    return <DashboardSignInPrompt />
  }

  const projects = await listProjectsForUser(session.user.id)
  const canCreate = isProjectCreatorEmail(session.user.email)

  return (
    <div className='mx-auto max-w-[1500px] px-4 py-8 sm:px-6 lg:px-8'>
      <div className='mb-8 flex flex-wrap items-end justify-between gap-4'>
        <div>
          <h1 className='text-2xl font-semibold tracking-tight'>Projects</h1>
          <p className='mt-1 text-sm text-muted-foreground'>
            {projects.length} {projects.length === 1 ? 'project' : 'projects'}
          </p>
        </div>
        {canCreate && (
          <Button asChild size='sm' className='h-9 gap-2 rounded-md'>
            <Link href='/projects/new'>
              <PlusCircle className='h-3.5 w-3.5' />
              New project
            </Link>
          </Button>
        )}
      </div>

      {projects.length === 0 ? (
        <Card className='flex flex-col items-center border-dashed border-border/70 bg-background/50 px-6 py-16 text-center'>
          <Folder className='h-8 w-8 text-muted-foreground/60' />
          <p className='mt-3 text-sm font-medium'>No projects yet</p>
          <p className='mt-1 text-xs text-muted-foreground'>
            {canCreate
              ? 'Create one to start collecting feedback.'
              : 'Ask an owner to add you to a project.'}
          </p>
          {canCreate && (
            <Button asChild size='sm' className='mt-5 h-8 gap-2 rounded-md text-xs'>
              <Link href='/projects/new'>
                <PlusCircle className='h-3.5 w-3.5' />
                New project
              </Link>
            </Button>
          )}
        </Card>
      ) : (
        <Card className='overflow-hidden'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project</TableHead>
                <TableHead>Website</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className='text-right'>Pins</TableHead>
                <TableHead className='text-right'>Updated</TableHead>
                <TableHead className='w-[80px]' />
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map(({ project, role, pinCount, feedbackUpdatedAt }) => {
                const host = hostFor(project.websiteUrl)
                return (
                  <TableRow key={project.id}>
                    <TableCell>
                      <Link
                        href={`/p/${project.id}`}
                        className='inline-flex items-center gap-2 font-medium hover:underline'
                      >
                        <Globe className='h-3.5 w-3.5 text-muted-foreground' />
                        {project.name}
                      </Link>
                    </TableCell>
                    <TableCell className='text-muted-foreground'>
                      <a
                        href={project.websiteUrl}
                        target='_blank'
                        rel='noreferrer'
                        className='inline-flex items-center gap-1 hover:text-foreground'
                      >
                        {host}
                        <ArrowSquareOut className='h-3 w-3' />
                      </a>
                    </TableCell>
                    <TableCell>
                      <Badge variant='secondary' className='gap-1 capitalize'>
                        <Users className='h-3 w-3' />
                        {role ?? '—'}
                      </Badge>
                    </TableCell>
                    <TableCell className='text-right tabular-nums text-muted-foreground'>
                      {pinCount}
                    </TableCell>
                    <TableCell className='text-right text-muted-foreground'>
                      {formatDate(feedbackUpdatedAt ?? project.updatedAt)}
                    </TableCell>
                    <TableCell className='text-right'>
                      <Button asChild variant='ghost' size='sm' className='h-7 rounded-md text-xs'>
                        <Link href={`/p/${project.id}`}>Open</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  )
}
