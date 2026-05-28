import { nanoid } from 'nanoid'
import { randomUUID } from 'crypto'
import { and, desc, eq, inArray } from 'drizzle-orm'
import { db, schema } from '@/db/client'
import type {
  DbFeedbackPin,
  DbFeedbackPinReply,
  DbFeedbackSession,
  DbMember,
  DbProject
} from '@/db/schema'
import type { ProjectRole } from '@/lib/project-access'
import { hasProjectRole, parseProjectRoles, type AuthSession } from '@/lib/auth-helpers'
import type { FeedbackSession, Pin, PinReply } from '@/types/feedback'

export const PROJECT_PUBLIC_ACCESS_VIEW = 'view'

export type ProjectWithRole = {
  project: DbProject
  role: string | null
  canEdit: boolean
  pinCount: number
  openPinCount: number
  closedPinCount: number
  feedbackUpdatedAt: Date | null
  memberCount: number
  members: Array<{
    id: string
    userId: string
    role: string
    name: string | null
    email: string | null
    image: string | null
  }>
  invitations: Array<{
    id: string
    email: string
    role: string
    status: string
    expiresAt: Date
    createdAt: Date
  }>
}

export function normalizeWebsiteUrl(value: string) {
  const trimmed = value.trim()
  if (!trimmed) throw new Error('Website URL is required')

  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`

  const parsed = new URL(withProtocol)
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('Use an http or https URL')
  }

  parsed.hash = ''
  return parsed.toString()
}

export function nameFromWebsiteUrl(websiteUrl: string) {
  try {
    const host = new URL(websiteUrl).hostname.replace(/^www\./, '')
    const base = host.split('.')[0] || host
    return base
      .split(/[-_]/g)
      .filter(Boolean)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ') || host
  } catch {
    return 'Website Project'
  }
}

export function projectSlugFromName(name: string) {
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
  return `${slug || 'project'}-${nanoid(6).toLowerCase()}`
}

export function toPinReply(reply: DbFeedbackPinReply): PinReply {
  return {
    id: reply.id,
    body: reply.body,
    authorName: reply.authorName,
    authorEmail: reply.authorEmail ?? undefined,
    userId: reply.userId ?? undefined,
    createdAt: reply.createdAt.toISOString()
  }
}

export function toFeedbackSession(
  session: DbFeedbackSession,
  pins: DbFeedbackPin[],
  replies: DbFeedbackPinReply[] = []
): FeedbackSession {
  const repliesByPin = new Map<string, PinReply[]>()
  for (const reply of replies) {
    const list = repliesByPin.get(reply.pinId) ?? []
    list.push(toPinReply(reply))
    repliesByPin.set(reply.pinId, list)
  }

  return {
    id: session.id,
    projectId: session.projectId ?? undefined,
    url: session.url,
    createdAt: session.createdAt.toISOString(),
    updatedAt: session.updatedAt.toISOString(),
    pins: pins.map<Pin>(pin => ({
      id: pin.id,
      number: pin.number,
      kind: (pin.kind as Pin['kind']) ?? 'comment',
      status: (pin.status as Pin['status']) ?? 'open',
      url: pin.url,
      viewportId: pin.viewportId,
      viewportType: pin.viewportType as Pin['viewportType'],
      viewportWidth: pin.viewportWidth,
      viewportHeight: pin.viewportHeight,
      x: pin.x,
      y: pin.y,
      documentX: pin.documentX ?? undefined,
      documentY: pin.documentY ?? undefined,
      scrollX: pin.scrollX ?? undefined,
      scrollY: pin.scrollY ?? undefined,
      cssSelector: pin.cssSelector ?? undefined,
      playwrightLocator: pin.playwrightLocator ?? undefined,
      elementText: pin.elementText ?? undefined,
      elementTag: pin.elementTag ?? undefined,
      elementAttributes:
        (pin.elementAttributes as Record<string, string> | null) ?? undefined,
      elementHtml: pin.elementHtml ?? undefined,
      ancestorChain: (pin.ancestorChain as string[] | null) ?? undefined,
      replacementText: pin.replacementText ?? undefined,
      editInstruction: pin.editInstruction ?? undefined,
      severity: pin.severity as Pin['severity'],
      comment: pin.comment,
      screenshotDataUrl: pin.screenshotKey ?? undefined,
      createdAt: pin.createdAt.toISOString(),
      replies: (repliesByPin.get(pin.id) ?? []).sort((a, b) =>
        a.createdAt.localeCompare(b.createdAt)
      )
    })),
    meta: {
      title: session.title ?? undefined,
      userAgent: session.userAgent ?? '',
      capturedViewports:
        (session.capturedViewports as FeedbackSession['meta']['capturedViewports']) ?? []
    }
  }
}

export async function getProjectMembership(
  organizationId: string,
  session: AuthSession | null
) {
  if (!db || !session) return null
  const [member] = await db
    .select()
    .from(schema.member)
    .where(
      and(
        eq(schema.member.organizationId, organizationId),
        eq(schema.member.userId, session.user.id)
      )
    )
    .limit(1)
  return member ?? null
}

export function canEditProjectFeedback(member: DbMember | null) {
  return hasProjectRole(member?.role, ['owner', 'dev', 'client'])
}

export function canManageProject(member: DbMember | null) {
  return hasProjectRole(member?.role, ['owner'])
}

export async function loadProjectBundle(
  projectId: string,
  session: AuthSession | null
) {
  if (!db) return null

  const [project] = await db
    .select()
    .from(schema.project)
    .where(eq(schema.project.id, projectId))
    .limit(1)

  if (!project) return null

  const member = await getProjectMembership(project.organizationId, session)
  const isPublic = project.publicAccess === PROJECT_PUBLIC_ACCESS_VIEW
  if (!isPublic && !member) return null

  const [feedbackSession] = await db
    .select()
    .from(schema.feedbackSession)
    .where(eq(schema.feedbackSession.projectId, project.id))
    .limit(1)

  if (!feedbackSession) return null

  const pins = await db
    .select()
    .from(schema.feedbackPin)
    .where(eq(schema.feedbackPin.sessionId, feedbackSession.id))

  const pinIds = pins.map(pin => pin.id)
  const replies = pinIds.length
    ? await db
        .select()
        .from(schema.feedbackPinReply)
        .where(inArray(schema.feedbackPinReply.pinId, pinIds))
    : []

  return {
    project,
    feedbackSession,
    pins,
    replies,
    member,
    role: parseProjectRoles(member?.role)[0] as ProjectRole | undefined,
    canEdit: canEditProjectFeedback(member),
    canManage: canManageProject(member),
    publicView: !member && isPublic
  }
}

export async function listProjectsForUser(userId: string): Promise<ProjectWithRole[]> {
  if (!db) return []

  const rows = await db
    .select({
      project: schema.project,
      member: schema.member
    })
    .from(schema.project)
    .innerJoin(
      schema.member,
      eq(schema.project.organizationId, schema.member.organizationId)
    )
    .where(eq(schema.member.userId, userId))
    .orderBy(desc(schema.project.updatedAt))

  if (!rows.length) return []

  const projectIds = rows.map(row => row.project.id)
  const sessions = await db
    .select()
    .from(schema.feedbackSession)
    .where(inArray(schema.feedbackSession.projectId, projectIds))

  const sessionIds = sessions.map(session => session.id)
  const pins = sessionIds.length
    ? await db
        .select()
        .from(schema.feedbackPin)
        .where(inArray(schema.feedbackPin.sessionId, sessionIds))
    : []

  const organizationIds = rows.map(row => row.project.organizationId)
  const memberRows = organizationIds.length
    ? await db
        .select({
          member: schema.member,
          user: schema.user
        })
        .from(schema.member)
        .innerJoin(schema.user, eq(schema.member.userId, schema.user.id))
        .where(inArray(schema.member.organizationId, organizationIds))
    : []
  const invitations = organizationIds.length
    ? await db
        .select()
        .from(schema.invitation)
        .where(inArray(schema.invitation.organizationId, organizationIds))
    : []

  return rows.map(row => {
    const feedbackSession = sessions.find(item => item.projectId === row.project.id)
    const projectPins = feedbackSession
      ? pins.filter(pin => pin.sessionId === feedbackSession.id)
      : []
    const projectMembers = memberRows
      .filter(item => item.member.organizationId === row.project.organizationId)
      .map(item => ({
        id: item.member.id,
        userId: item.member.userId,
        role: item.member.role,
        name: item.user.name,
        email: item.user.email,
        image: item.user.image
      }))
    const projectInvitations = invitations
      .filter(invitation => invitation.organizationId === row.project.organizationId)
      .map(invitation => ({
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        status: invitation.status,
        expiresAt: invitation.expiresAt,
        createdAt: invitation.createdAt
      }))

    return {
      project: row.project,
      role: row.member.role,
      canEdit: canEditProjectFeedback(row.member),
      pinCount: projectPins.length,
      openPinCount: projectPins.filter(pin => (pin.status ?? 'open') !== 'closed').length,
      closedPinCount: projectPins.filter(pin => pin.status === 'closed').length,
      feedbackUpdatedAt: feedbackSession?.updatedAt ?? null,
      memberCount: projectMembers.length,
      members: projectMembers,
      invitations: projectInvitations
    }
  })
}

export function newProjectId() {
  return randomUUID()
}
