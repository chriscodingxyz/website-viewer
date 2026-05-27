import { NextRequest, NextResponse } from 'next/server'
import { and, eq, inArray, notInArray } from 'drizzle-orm'
import { db, schema } from '@/db/client'
import { requireSession } from '@/lib/auth-helpers'
import { FeedbackSessionSchema } from '@/types/feedback'
import { loadProjectBundle } from '@/lib/projects'

export const dynamic = 'force-dynamic'

export async function PUT(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  if (!db) return NextResponse.json({ error: 'DB not configured' }, { status: 503 })

  const session = await requireSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const bundle = await loadProjectBundle(params.projectId, session)
  if (!bundle) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!bundle.canEdit) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const parsed = FeedbackSessionSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }
  const data = parsed.data
  const sessionId = bundle.feedbackSession.id

  await db.transaction(async tx => {
    await tx
      .update(schema.feedbackSession)
      .set({
        userId: session.user.id,
        organizationId: bundle.project.organizationId,
        projectId: bundle.project.id,
        url: bundle.project.websiteUrl,
        title: data.meta.title || bundle.project.name,
        userAgent: data.meta.userAgent,
        capturedViewports: data.meta.capturedViewports,
        updatedAt: new Date()
      })
      .where(eq(schema.feedbackSession.id, sessionId))

    const incomingIds = data.pins.map(pin => pin.id)

    if (incomingIds.length === 0) {
      await tx
        .delete(schema.feedbackPin)
        .where(eq(schema.feedbackPin.sessionId, sessionId))
    } else {
      await tx
        .delete(schema.feedbackPin)
        .where(
          and(
            eq(schema.feedbackPin.sessionId, sessionId),
            notInArray(schema.feedbackPin.id, incomingIds)
          )
        )
    }

    for (const pin of data.pins) {
      const pinUrl = (() => {
        try {
          const url = new URL(pin.url, bundle.project.websiteUrl)
          url.hash = ''
          return url.toString()
        } catch {
          return bundle.project.websiteUrl
        }
      })()

      const values = {
        id: pin.id,
        sessionId,
        number: pin.number,
        kind: pin.kind ?? 'comment',
        url: pinUrl,
        viewportId: pin.viewportId,
        viewportType: pin.viewportType,
        viewportWidth: pin.viewportWidth,
        viewportHeight: pin.viewportHeight,
        x: pin.x,
        y: pin.y,
        documentX: pin.documentX,
        documentY: pin.documentY,
        scrollX: pin.scrollX,
        scrollY: pin.scrollY,
        cssSelector: pin.cssSelector,
        playwrightLocator: pin.playwrightLocator,
        elementText: pin.elementText,
        elementTag: pin.elementTag,
        elementAttributes: pin.elementAttributes ?? {},
        elementHtml: pin.elementHtml,
        ancestorChain: pin.ancestorChain ?? [],
        replacementText: pin.replacementText,
        editInstruction: pin.editInstruction,
        severity: pin.severity,
        comment: pin.comment,
        screenshotKey: pin.screenshotDataUrl,
        updatedAt: new Date()
      }

      await tx
        .insert(schema.feedbackPin)
        .values(values)
        .onConflictDoUpdate({
          target: schema.feedbackPin.id,
          set: {
            number: values.number,
            kind: values.kind,
            url: values.url,
            viewportId: values.viewportId,
            viewportType: values.viewportType,
            viewportWidth: values.viewportWidth,
            viewportHeight: values.viewportHeight,
            x: values.x,
            y: values.y,
            documentX: values.documentX,
            documentY: values.documentY,
            scrollX: values.scrollX,
            scrollY: values.scrollY,
            cssSelector: values.cssSelector,
            playwrightLocator: values.playwrightLocator,
            elementText: values.elementText,
            elementTag: values.elementTag,
            elementAttributes: values.elementAttributes,
            elementHtml: values.elementHtml,
            ancestorChain: values.ancestorChain,
            replacementText: values.replacementText,
            editInstruction: values.editInstruction,
            severity: values.severity,
            comment: values.comment,
            screenshotKey: values.screenshotKey,
            updatedAt: values.updatedAt
          }
        })
    }
  })

  return NextResponse.json({ ok: true })
}
