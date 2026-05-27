import { auth } from '@/lib/auth'
import { db, schema } from '@/db/client'
import type { Auth } from '@/lib/auth'
import type { ProjectRole } from '@/lib/project-access'
import { and, eq } from 'drizzle-orm'
import { headers } from 'next/headers'

export type AuthSession = NonNullable<
  Awaited<ReturnType<Auth['api']['getSession']>>
>

const defaultProjectRoles: ProjectRole[] = ['owner', 'dev', 'client']

export async function requireSession() {
  if (!auth) return null
  return auth.api.getSession({ headers: headers() })
}

export async function requireUser() {
  const session = await requireSession()
  return session?.user ?? null
}

export async function getOptionalUser() {
  try {
    const session = await requireSession()
    return session?.user ?? null
  } catch {
    return null
  }
}

export function getActiveProjectId(session: AuthSession | null | undefined) {
  return session?.session.activeOrganizationId ?? null
}

export function parseProjectRoles(role: string | null | undefined) {
  return (role || '')
    .split(',')
    .map(part => part.trim())
    .filter(Boolean) as ProjectRole[]
}

export function hasProjectRole(
  role: string | null | undefined,
  allowedRoles: readonly ProjectRole[] = defaultProjectRoles
) {
  const roles = parseProjectRoles(role)
  return roles.some(item => allowedRoles.includes(item))
}

export async function requireProjectMember(
  projectId: string | null | undefined,
  allowedRoles: readonly ProjectRole[] = defaultProjectRoles
) {
  if (!db || !projectId) return null

  const session = await requireSession()
  if (!session) return null

  const [member] = await db
    .select()
    .from(schema.member)
    .where(
      and(
        eq(schema.member.organizationId, projectId),
        eq(schema.member.userId, session.user.id)
      )
    )
    .limit(1)

  if (!member || !hasProjectRole(member.role, allowedRoles)) return null

  return {
    session,
    user: session.user,
    member,
    projectId
  }
}
