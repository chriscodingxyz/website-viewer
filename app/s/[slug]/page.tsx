import { eq, and, inArray } from 'drizzle-orm'
import { db, schema } from '@/db/client'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import type { FeedbackSession, Pin } from '@/types/feedback'
import { toMarkdown } from '@/lib/feedback/export'
import { toPinSnapshot, toFeedbackSession } from '@/lib/projects'
import { publicAccessAllowsView, publicAccessAllowsComment } from '@/lib/projects'
import ProjectWorkspace from '@/components/bugsmash/ProjectWorkspace'
import ShareView from './ShareView'

export const dynamic = 'force-dynamic'
export const revalidate = 0

async function loadBySlug(slug: string) {
  if (!db) return null

  const [sess] = await db
    .select()
    .from(schema.feedbackSession)
    .where(
      and(
        eq(schema.feedbackSession.slug, slug),
        eq(schema.feedbackSession.isPublic, true)
      )
    )
    .limit(1)

  if (!sess) return null

  const pins = await db
    .select()
    .from(schema.feedbackPin)
    .where(eq(schema.feedbackPin.sessionId, sess.id))

  const pinIds = pins.map(p => p.id)

  const replies = pinIds.length
    ? await db
        .select()
        .from(schema.feedbackPinReply)
        .where(inArray(schema.feedbackPinReply.pinId, pinIds))
    : []

  const snapshots = pinIds.length
    ? await db
        .select()
        .from(schema.feedbackPinSnapshot)
        .where(inArray(schema.feedbackPinSnapshot.pinId, pinIds))
    : []

  // For project sessions, load project and check publicAccess
  let project: typeof schema.project.$inferSelect | null = null
  if (sess.projectId) {
    const [proj] = await db
      .select()
      .from(schema.project)
      .where(eq(schema.project.id, sess.projectId))
      .limit(1)
    if (!proj || !publicAccessAllowsView(proj.publicAccess)) return null
    project = proj
  }

  return { sess, pins, replies, snapshots, project }
}

export async function generateMetadata({
  params
}: {
  params: { slug: string }
}): Promise<Metadata> {
  const data = await loadBySlug(params.slug)
  if (!data) return { title: 'Feedback not found' }
  return {
    title: `Feedback — ${data.sess.title || data.sess.url}`,
    description: `${data.pins.length} pins for ${data.sess.url}`
  }
}

export default async function SharePage({
  params,
  searchParams
}: {
  params: { slug: string }
  searchParams: { view?: string }
}) {
  const data = await loadBySlug(params.slug)
  if (!data) notFound()

  const { sess, pins, replies, snapshots, project } = data

  // Project session + not requesting report view → full interactive canvas
  if (project && searchParams.view !== 'report') {
    const initialSession = toFeedbackSession(sess, pins, replies, snapshots)
    const accessLevel = publicAccessAllowsComment(project.publicAccess) ? 'comment' : 'view'
    const canEdit = accessLevel === 'comment'

    return (
      <ProjectWorkspace
        project={{
          id: project.id,
          name: project.name,
          websiteUrl: project.websiteUrl,
          publicAccess: project.publicAccess
        }}
        role={null}
        canEdit={canEdit}
        publicView
        initialSession={initialSession}
        aiVerifyEnabled={false}
        guest={{ slug: params.slug, accessLevel }}
      />
    )
  }

  // Legacy non-project session or ?view=report → existing ShareView
  const session: FeedbackSession = {
    id: sess.id,
    url: sess.url,
    createdAt: sess.createdAt.toISOString(),
    updatedAt: sess.updatedAt.toISOString(),
    pins: pins.map<Pin>(p => ({
      id: p.id,
      number: p.number,
      kind: (p.kind as Pin['kind']) ?? 'comment',
      status: (p.status as Pin['status']) ?? 'open',
      authorName: p.authorName ?? undefined,
      authorEmail: p.authorEmail ?? undefined,
      authorUserId: p.authorUserId ?? undefined,
      isGuest: p.guestToken != null || undefined,
      url: p.url,
      viewportId: p.viewportId,
      viewportType: p.viewportType as Pin['viewportType'],
      viewportWidth: p.viewportWidth,
      viewportHeight: p.viewportHeight,
      x: p.x,
      y: p.y,
      cssSelector: p.cssSelector ?? undefined,
      playwrightLocator: p.playwrightLocator ?? undefined,
      elementText: p.elementText ?? undefined,
      elementTag: p.elementTag ?? undefined,
      elementAttributes: (p.elementAttributes as Record<string, string> | null) ?? undefined,
      elementHtml: p.elementHtml ?? undefined,
      ancestorChain: (p.ancestorChain as string[] | null) ?? undefined,
      replacementText: p.replacementText ?? undefined,
      editInstruction: p.editInstruction ?? undefined,
      documentX: p.documentX ?? undefined,
      documentY: p.documentY ?? undefined,
      scrollX: p.scrollX ?? undefined,
      scrollY: p.scrollY ?? undefined,
      severity: p.severity as Pin['severity'],
      comment: p.comment,
      assetUrl: p.assetUrl ?? undefined,
      anchorStatus: (p.anchorStatus as Pin['anchorStatus']) ?? undefined,
      anchorCheckedAt: p.anchorCheckedAt?.toISOString(),
      verificationState: (p.verificationState as Pin['verificationState']) ?? undefined,
      verifiedBy: (p.verifiedBy as Pin['verifiedBy']) ?? undefined,
      verifiedAt: p.verifiedAt?.toISOString(),
      verificationReason: p.verificationReason ?? undefined,
      snapshot: (() => {
        const row = snapshots.find(s => s.pinId === p.id)
        return row ? toPinSnapshot(row) : undefined
      })(),
      createdAt: p.createdAt.toISOString()
    })),
    meta: {
      title: sess.title ?? undefined,
      userAgent: sess.userAgent ?? '',
      capturedViewports: (sess.capturedViewports as FeedbackSession['meta']['capturedViewports']) ?? []
    }
  }

  const markdown = toMarkdown(session, session.meta.title)
  return <ShareView session={session} markdown={markdown} />
}
