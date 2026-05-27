import { NextRequest, NextResponse } from 'next/server'
import { eq, and } from 'drizzle-orm'
import { db, schema } from '@/db/client'
import {
  getActiveProjectId,
  requireProjectMember,
  requireSession
} from '@/lib/auth-helpers'
import type { ProjectRole } from '@/lib/project-access'
import { FeedbackSessionSchema } from '@/types/feedback'

export const dynamic = 'force-dynamic'

async function resolveProjectAccess(
  req: NextRequest,
  bodyProjectId?: string,
  allowedRoles?: readonly ProjectRole[]
) {
  const session = await requireSession()
  if (!session) {
    return {
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const projectId =
    bodyProjectId ||
    req.nextUrl.searchParams.get('projectId') ||
    getActiveProjectId(session)

  if (!projectId) {
    return {
      response: NextResponse.json({ error: 'Project required' }, { status: 400 })
    }
  }

  const access = await requireProjectMember(projectId, allowedRoles)
  if (!access) {
    return {
      response: NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  return { session, projectId, access }
}

async function loadProjectSession(id: string, projectId: string) {
  if (!db) return null
  const [row] = await db
    .select()
    .from(schema.feedbackSession)
    .where(
      and(
        eq(schema.feedbackSession.id, id),
        eq(schema.feedbackSession.organizationId, projectId)
      )
    )
    .limit(1)
  return row ?? null
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!db) return NextResponse.json({ error: 'DB not configured' }, { status: 503 })

  const resolved = await resolveProjectAccess(req)
  if ('response' in resolved) return resolved.response

  const sess = await loadProjectSession(params.id, resolved.projectId)
  if (!sess) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const pins = await db
    .select()
    .from(schema.feedbackPin)
    .where(eq(schema.feedbackPin.sessionId, sess.id))

  return NextResponse.json({ session: sess, pins })
}

/** Upsert full session + pins. Idempotent - used by client sync. */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!db) return NextResponse.json({ error: 'DB not configured' }, { status: 503 })

  const body = await req.json()
  const parsed = FeedbackSessionSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }
  const data = parsed.data

  const resolved = await resolveProjectAccess(req, data.projectId)
  if ('response' in resolved) return resolved.response

  const existingRows = await db
    .select()
    .from(schema.feedbackSession)
    .where(eq(schema.feedbackSession.id, params.id))
    .limit(1)
  const existing = existingRows[0]

  if (existing?.organizationId && existing.organizationId !== resolved.projectId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  if (
    existing &&
    !existing.organizationId &&
    existing.userId &&
    existing.userId !== resolved.session.user.id
  ) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await db.transaction(async tx => {
    if (!existing) {
      const { nanoid } = await import('nanoid')
      await tx.insert(schema.feedbackSession).values({
        id: params.id,
        slug: nanoid(10),
        projectId: data.projectId,
        userId: resolved.session.user.id,
        organizationId: resolved.projectId,
        url: data.url,
        title: data.meta.title,
        userAgent: data.meta.userAgent,
        capturedViewports: data.meta.capturedViewports
      })
    } else {
      await tx
        .update(schema.feedbackSession)
        .set({
          userId: existing.userId ?? resolved.session.user.id,
          projectId: existing.projectId ?? data.projectId,
          organizationId: resolved.projectId,
          url: data.url,
          title: data.meta.title,
          userAgent: data.meta.userAgent,
          capturedViewports: data.meta.capturedViewports,
          updatedAt: new Date()
        })
        .where(eq(schema.feedbackSession.id, params.id))
    }

    await tx
      .delete(schema.feedbackPin)
      .where(eq(schema.feedbackPin.sessionId, params.id))

    if (data.pins.length) {
      await tx.insert(schema.feedbackPin).values(
        data.pins.map(p => ({
          id: p.id,
          sessionId: params.id,
          number: p.number,
          kind: p.kind ?? 'comment',
          url: p.url,
          viewportId: p.viewportId,
          viewportType: p.viewportType,
          viewportWidth: p.viewportWidth,
          viewportHeight: p.viewportHeight,
          x: p.x,
          y: p.y,
          documentX: p.documentX,
          documentY: p.documentY,
          scrollX: p.scrollX,
          scrollY: p.scrollY,
          cssSelector: p.cssSelector,
          playwrightLocator: p.playwrightLocator,
          elementText: p.elementText,
          elementTag: p.elementTag,
          elementAttributes: p.elementAttributes ?? {},
          elementHtml: p.elementHtml,
          ancestorChain: p.ancestorChain ?? [],
          replacementText: p.replacementText,
          editInstruction: p.editInstruction,
          severity: p.severity,
          comment: p.comment,
          screenshotKey: p.screenshotDataUrl
        }))
      )
    }
  })

  return NextResponse.json({ ok: true })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!db) return NextResponse.json({ error: 'DB not configured' }, { status: 503 })

  const resolved = await resolveProjectAccess(req, undefined, ['owner', 'dev'])
  if ('response' in resolved) return resolved.response

  const sess = await loadProjectSession(params.id, resolved.projectId)
  if (!sess) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await db.delete(schema.feedbackSession).where(eq(schema.feedbackSession.id, sess.id))
  return NextResponse.json({ ok: true })
}
