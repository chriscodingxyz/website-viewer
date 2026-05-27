import { eq, and } from 'drizzle-orm'
import { db, schema } from '@/db/client'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { FeedbackSession, Pin } from '@/types/feedback'
import { toMarkdown } from '@/lib/feedback/export'
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

  return { sess, pins }
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

export default async function SharePage({ params }: { params: { slug: string } }) {
  const data = await loadBySlug(params.slug)
  if (!data) notFound()

  const session: FeedbackSession = {
    id: data.sess.id,
    url: data.sess.url,
    createdAt: data.sess.createdAt.toISOString(),
    updatedAt: data.sess.updatedAt.toISOString(),
    pins: data.pins.map<Pin>(p => ({
      id: p.id,
      number: p.number,
      kind: (p.kind as Pin['kind']) ?? 'comment',
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
      elementAttributes:
        (p.elementAttributes as Record<string, string> | null) ?? undefined,
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
      screenshotDataUrl: p.screenshotKey ?? undefined,
      createdAt: p.createdAt.toISOString()
    })),
    meta: {
      title: data.sess.title ?? undefined,
      userAgent: data.sess.userAgent ?? '',
      capturedViewports:
        (data.sess.capturedViewports as FeedbackSession['meta']['capturedViewports']) ?? []
    }
  }

  const markdown = toMarkdown(session, session.meta.title)
  return <ShareView session={session} markdown={markdown} />
}
