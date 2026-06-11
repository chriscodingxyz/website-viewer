import { NextRequest, NextResponse } from 'next/server'
import { and, eq } from 'drizzle-orm'
import { db, schema } from '@/db/client'
import { requireSession } from '@/lib/auth-helpers'
import { loadProjectBundle } from '@/lib/projects'

export const dynamic = 'force-dynamic'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { projectId: string; pinId: string } }
) {
  if (!db) return NextResponse.json({ error: 'DB not configured' }, { status: 503 })

  const session = await requireSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const bundle = await loadProjectBundle(params.projectId, session)
  if (!bundle) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!bundle.canEdit) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const [pin] = await db
    .select()
    .from(schema.feedbackPin)
    .where(
      and(
        eq(schema.feedbackPin.id, params.pinId),
        eq(schema.feedbackPin.sessionId, bundle.feedbackSession.id)
      )
    )
    .limit(1)

  if (!pin) return NextResponse.json({ error: 'Pin not found' }, { status: 404 })

  await db.delete(schema.feedbackPin).where(eq(schema.feedbackPin.id, pin.id))

  return NextResponse.json({ ok: true })
}
