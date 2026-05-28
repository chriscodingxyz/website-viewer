'use client'

import { useState } from 'react'
import { authClient } from '@/lib/auth-client'
import type { ProjectRole } from '@/lib/project-access'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Copy, MailPlus, Settings, Users } from 'lucide-react'
import { toast } from 'sonner'

type MemberSummary = {
  id: string
  role: string
  name: string | null
  email: string | null
}

type InvitationSummary = {
  id: string
  email: string
  role: string
  status: string
  expiresAt: string | Date
}

const roleLabels: Record<ProjectRole, string> = {
  owner: 'Owner',
  dev: 'Developer',
  client: 'Reviewer'
}

function responseError(result: any, fallback: string) {
  return (
    result?.error?.message ||
    result?.error?.statusText ||
    result?.error?.code ||
    fallback
  )
}

interface Props {
  projectId: string
  organizationId: string
  projectName: string
  publicAccess: string
  members: MemberSummary[]
  invitations: InvitationSummary[]
  canManage: boolean
}

export default function ProjectOwnerActions({
  projectId,
  organizationId,
  projectName,
  publicAccess,
  members,
  invitations,
  canManage
}: Props) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<ProjectRole>('client')
  const [inviteLink, setInviteLink] = useState('')
  const [access, setAccess] = useState(publicAccess)
  const [busy, setBusy] = useState(false)

  if (!canManage) {
    return (
      <div className='flex items-center justify-end gap-1 text-xs text-muted-foreground'>
        <Users className='h-3.5 w-3.5' />
        {members.length}
      </div>
    )
  }

  const createInvite = async () => {
    if (!email.trim()) return
    setBusy(true)
    const result = await authClient.organization.inviteMember({
      email: email.trim(),
      role,
      organizationId
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

  const updateAccess = async (nextAccess: string) => {
    setAccess(nextAccess)
    const res = await fetch(`/api/projects/${projectId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ publicAccess: nextAccess })
    })
    if (!res.ok) {
      setAccess(access)
      toast.error('Could not update access')
      return
    }
    toast.success(nextAccess === 'view' ? 'Public view enabled' : 'Project is private')
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant='outline' size='sm' className='h-8 gap-1.5 rounded-md text-xs'>
          <Settings className='h-3.5 w-3.5' />
          Manage
        </Button>
      </DialogTrigger>
      <DialogContent className='max-h-[85vh] overflow-y-auto sm:max-w-2xl'>
        <DialogHeader>
          <DialogTitle>{projectName}</DialogTitle>
        </DialogHeader>

        <div className='grid gap-5'>
          <section className='grid gap-2'>
            <div className='flex items-center justify-between gap-3'>
              <div>
                <h3 className='text-sm font-semibold'>Project access</h3>
                <p className='text-xs text-muted-foreground'>
                  Public view lets anyone with the link inspect tasks read-only.
                </p>
              </div>
              <Select value={access} onValueChange={updateAccess}>
                <SelectTrigger className='h-8 w-32 text-xs'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='view'>Public view</SelectItem>
                  <SelectItem value='private'>Private</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </section>

          <Separator />

          <section className='grid gap-3'>
            <div>
              <h3 className='text-sm font-semibold'>Invite people</h3>
              <p className='text-xs text-muted-foreground'>
                Reviewers can leave feedback. Developers can work with implementation details.
              </p>
            </div>
            <div className='grid gap-2 sm:grid-cols-[1fr_150px_auto]'>
              <div className='space-y-1.5'>
                <Label htmlFor={`invite-${projectId}`} className='text-xs'>Email</Label>
                <Input
                  id={`invite-${projectId}`}
                  type='email'
                  value={email}
                  onChange={event => setEmail(event.target.value)}
                  placeholder='person@example.com'
                  className='h-9'
                />
              </div>
              <div className='space-y-1.5'>
                <Label className='text-xs'>Role</Label>
                <Select value={role} onValueChange={value => setRole(value as ProjectRole)}>
                  <SelectTrigger className='h-9'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='client'>Reviewer</SelectItem>
                    <SelectItem value='dev'>Developer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                className='self-end gap-1.5'
                disabled={!email.trim() || busy}
                onClick={createInvite}
              >
                <MailPlus className='h-4 w-4' />
                Invite
              </Button>
            </div>
            {inviteLink && (
              <div className='flex gap-2'>
                <Input value={inviteLink} readOnly className='h-8 text-xs' />
                <Button variant='outline' size='icon' className='h-8 w-8' onClick={copyInviteLink}>
                  <Copy className='h-3.5 w-3.5' />
                </Button>
              </div>
            )}
          </section>

          <Separator />

          <section className='grid gap-3'>
            <h3 className='text-sm font-semibold'>Members</h3>
            <div className='grid gap-2'>
              {members.map(member => (
                <div key={member.id} className='flex items-center justify-between gap-3 rounded-md border border-border/70 px-3 py-2'>
                  <div className='min-w-0'>
                    <p className='truncate text-sm font-medium'>{member.name || member.email}</p>
                    <p className='truncate text-xs text-muted-foreground'>{member.email}</p>
                  </div>
                  <Badge variant='secondary' className='capitalize'>
                    {roleLabels[(member.role as ProjectRole) || 'client'] ?? member.role}
                  </Badge>
                </div>
              ))}
            </div>
          </section>

          {invitations.length > 0 && (
            <>
              <Separator />
              <section className='grid gap-3'>
                <h3 className='text-sm font-semibold'>Pending invites</h3>
                <div className='grid gap-2'>
                  {invitations
                    .filter(invite => invite.status === 'pending')
                    .map(invite => (
                      <div key={invite.id} className='flex items-center justify-between gap-3 rounded-md border border-dashed border-border/80 px-3 py-2'>
                        <div className='min-w-0'>
                          <p className='truncate text-sm font-medium'>{invite.email}</p>
                          <p className='text-xs text-muted-foreground'>
                            Expires {new Date(invite.expiresAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant='outline' className='capitalize'>
                          {roleLabels[(invite.role as ProjectRole) || 'client'] ?? invite.role}
                        </Badge>
                      </div>
                    ))}
                </div>
              </section>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={() => setOpen(false)}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
