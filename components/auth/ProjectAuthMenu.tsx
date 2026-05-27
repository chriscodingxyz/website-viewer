'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  authClient,
  signInWithGoogle,
  signOut,
  useActiveMember,
  useActiveOrganization,
  useListOrganizations,
  useSession
} from '@/lib/auth-client'
import type { ProjectRole } from '@/lib/project-access'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Copy,
  FolderKanban,
  LogOut,
  MailPlus,
  Plus,
  UserCircle
} from 'lucide-react'
import { toast } from 'sonner'

type ProjectConfig = {
  googleConfigured: boolean
  canCreateProjects: boolean
  syncEnabled: boolean
}

type ClientProject = {
  id: string
  name: string
  slug: string
}

const roleLabels: Record<ProjectRole, string> = {
  owner: 'Owner',
  dev: 'Developer',
  client: 'Client'
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
}

function responseError(result: any, fallback: string) {
  return (
    result?.error?.message ||
    result?.error?.statusText ||
    result?.error?.code ||
    fallback
  )
}

function hasRole(role: string | undefined, expected: ProjectRole) {
  return (role || '')
    .split(',')
    .map(part => part.trim())
    .includes(expected)
}

export default function ProjectAuthMenu() {
  const sessionQuery = useSession()
  const projectsQuery = useListOrganizations()
  const activeProjectQuery = useActiveOrganization()
  const activeMemberQuery = useActiveMember()

  const session = sessionQuery.data
  const user = session?.user ?? null
  const projects = useMemo(
    () => (projectsQuery.data ?? []) as ClientProject[],
    [projectsQuery.data]
  )
  const activeProject = activeProjectQuery.data as ClientProject | null
  const activeProjectId =
    activeProject?.id ?? session?.session.activeOrganizationId ?? null
  const activeMemberRole =
    activeMemberQuery.data?.role ??
    activeProjectQuery.data?.members?.find(member => member.userId === user?.id)
      ?.role

  const [config, setConfig] = useState<ProjectConfig>({
    googleConfigured: false,
    canCreateProjects: false,
    syncEnabled: false
  })
  const [createOpen, setCreateOpen] = useState(false)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [projectName, setProjectName] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<ProjectRole>('client')
  const [inviteLink, setInviteLink] = useState('')
  const [busy, setBusy] = useState(false)

  const projectSlug = useMemo(() => slugify(projectName), [projectName])
  const isOwner = hasRole(activeMemberRole, 'owner')

  useEffect(() => {
    let ignore = false

    fetch('/api/projects/config')
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (!ignore && data) setConfig(data)
      })
      .catch(() => {})

    return () => {
      ignore = true
    }
  }, [user?.email])

  useEffect(() => {
    if (!user || activeProjectId || projects.length !== 1) return
    authClient.organization.setActive({ organizationId: projects[0].id })
  }, [activeProjectId, projects, user])

  const handleSignIn = async () => {
    if (!config.googleConfigured) {
      toast.error('Google OAuth is not configured yet.')
      return
    }
    await signInWithGoogle(window.location.href)
  }

  const handleSignOut = async () => {
    await signOut()
    toast.success('Signed out')
  }

  const handleProjectChange = async (projectId: string) => {
    if (!projectId || projectId === activeProjectId) return
    const result = await authClient.organization.setActive({
      organizationId: projectId
    })
    if (result?.error) {
      toast.error(responseError(result, 'Could not switch project.'))
      return
    }
    toast.success('Project switched')
  }

  const handleCreateProject = async () => {
    if (!projectName.trim() || !projectSlug) return
    setBusy(true)
    const result = await authClient.organization.create({
      name: projectName.trim(),
      slug: projectSlug
    })
    setBusy(false)

    if (result?.error || !result?.data) {
      toast.error(responseError(result, 'Could not create project.'))
      return
    }

    await authClient.organization.setActive({
      organizationId: result.data.id
    })
    setProjectName('')
    setCreateOpen(false)
    toast.success('Project created')
  }

  const handleCreateInvite = async () => {
    if (!inviteEmail.trim() || !activeProjectId) return
    setBusy(true)
    const result = await authClient.organization.inviteMember({
      email: inviteEmail.trim(),
      role: inviteRole,
      organizationId: activeProjectId
    })
    setBusy(false)

    if (result?.error || !result?.data) {
      toast.error(responseError(result, 'Could not create invite.'))
      return
    }

    const link = `${window.location.origin}/invite/${result.data.id}`
    setInviteLink(link)
    toast.success('Invite link ready')
  }

  const copyInviteLink = async () => {
    if (!inviteLink) return
    await navigator.clipboard.writeText(inviteLink)
    toast.success('Invite link copied')
  }

  if (!user) {
    return (
      <Button
        variant='outline'
        size='sm'
        className='h-8 gap-2 rounded-lg'
        onClick={handleSignIn}
        disabled={!config.googleConfigured}
        title={
          config.googleConfigured
            ? 'Connect with Google'
            : 'Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET'
        }
      >
        <UserCircle className='h-4 w-4' />
        <span className='hidden md:inline'>
          {config.googleConfigured ? 'Connect Google' : 'Google not set'}
        </span>
      </Button>
    )
  }

  return (
    <>
      <div className='hidden lg:flex items-center gap-2'>
        {projects.length > 0 && (
          <Select
            value={activeProjectId ?? undefined}
            onValueChange={handleProjectChange}
          >
            <SelectTrigger className='h-8 w-[180px] rounded-lg bg-background text-xs shadow-none'>
              <SelectValue placeholder='Project' />
            </SelectTrigger>
            <SelectContent align='end'>
              {projects.map(project => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant='ghost' size='sm' className='h-8 gap-2 rounded-lg'>
            <UserCircle className='h-4 w-4' />
            <span className='hidden md:inline max-w-28 truncate'>
              {user.name || user.email}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end' className='w-64'>
          <DropdownMenuLabel className='space-y-0.5'>
            <span className='block truncate text-sm'>{user.name}</span>
            <span className='block truncate text-xs font-normal text-muted-foreground'>
              {user.email}
            </span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          <div className='px-2 py-1.5 lg:hidden'>
            {projects.length > 0 ? (
              <Select
                value={activeProjectId ?? undefined}
                onValueChange={handleProjectChange}
              >
                <SelectTrigger className='h-8 rounded-lg text-xs shadow-none'>
                  <SelectValue placeholder='Project' />
                </SelectTrigger>
                <SelectContent align='end'>
                  {projects.map(project => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                <FolderKanban className='h-3.5 w-3.5' />
                No project selected
              </div>
            )}
          </div>

          {config.canCreateProjects && (
            <DropdownMenuItem
              onSelect={event => {
                event.preventDefault()
                setCreateOpen(true)
              }}
            >
              <Plus className='mr-2 h-4 w-4' />
              New Project
            </DropdownMenuItem>
          )}

          {isOwner && activeProjectId && (
            <DropdownMenuItem
              onSelect={event => {
                event.preventDefault()
                setInviteOpen(true)
              }}
            >
              <MailPlus className='mr-2 h-4 w-4' />
              Invite Member
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={handleSignOut}>
            <LogOut className='mr-2 h-4 w-4' />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>New Project</DialogTitle>
          </DialogHeader>
          <div className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='project-name'>Name</Label>
              <Input
                id='project-name'
                value={projectName}
                onChange={event => setProjectName(event.target.value)}
                placeholder='Acme Website'
              />
            </div>
            {projectSlug && (
              <div className='rounded-md border bg-muted/40 px-3 py-2 text-xs text-muted-foreground'>
                {projectSlug}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              onClick={handleCreateProject}
              disabled={!projectSlug || busy}
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={inviteOpen}
        onOpenChange={open => {
          setInviteOpen(open)
          if (!open) {
            setInviteEmail('')
            setInviteLink('')
            setInviteRole('client')
          }
        }}
      >
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>Invite Member</DialogTitle>
          </DialogHeader>
          <div className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='invite-email'>Email</Label>
              <Input
                id='invite-email'
                type='email'
                value={inviteEmail}
                onChange={event => setInviteEmail(event.target.value)}
                placeholder='client@example.com'
              />
            </div>
            <div className='space-y-2'>
              <Label>Role</Label>
              <Select
                value={inviteRole}
                onValueChange={value => setInviteRole(value as ProjectRole)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(['client', 'dev'] as ProjectRole[]).map(role => (
                    <SelectItem key={role} value={role}>
                      {roleLabels[role]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {inviteLink && (
              <div className='flex gap-2'>
                <Input value={inviteLink} readOnly className='text-xs' />
                <Button
                  type='button'
                  variant='outline'
                  size='icon'
                  onClick={copyInviteLink}
                  title='Copy invite link'
                >
                  <Copy className='h-4 w-4' />
                </Button>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              onClick={handleCreateInvite}
              disabled={!inviteEmail.trim() || busy}
            >
              Create Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
