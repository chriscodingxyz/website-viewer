import { NextRequest, NextResponse } from 'next/server'
import { and, eq } from 'drizzle-orm'
import { db, schema } from '@/db/client'
import { requireSession } from '@/lib/auth-helpers'
import { loadProjectBundle } from '@/lib/projects'

export const dynamic = 'force-dynamic'

export async function DELETE(
  _req: NextRequest,
  {
    params
  }: {
    params: { projectId: string; pinId: string; replyId: string }
  }
) {
  if (!db) return NextResponse.json({ error: 'DB not configured' }, { status: 503 })

  const session = await requireSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const bundle = await loadProjectBundle(params.projectId, session)
  if (!bundle) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!bundle.canEdit) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const [reply] = await db
    .select()
    .from(schema.feedbackPinReply)
    .where(eq(schema.feedbackPinReply.id, params.replyId))
    .limit(1)

  if (!reply || reply.pinId !== params.pinId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const isAuthor = reply.userId === session.user.id
  if (!isAuthor && !bundle.canManage) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await db
    .delete(schema.feedbackPinReply)
    .where(eq(schema.feedbackPinReply.id, params.replyId))

  return NextResponse.json({ ok: true })
}
