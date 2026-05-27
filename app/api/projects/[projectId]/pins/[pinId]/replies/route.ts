import { NextRequest, NextResponse } from 'next/server'
import { nanoid } from 'nanoid'
import { z } from 'zod'
import { and, eq } from 'drizzle-orm'
import { db, schema } from '@/db/client'
import { requireSession } from '@/lib/auth-helpers'
import { loadProjectBundle, toPinReply } from '@/lib/projects'

export const dynamic = 'force-dynamic'

const ReplyBodySchema = z.object({
  body: z.string().trim().min(1).max(4000)
})

export async function POST(
  req: NextRequest,
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

  const parsed = ReplyBodySchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const [created] = await db
    .insert(schema.feedbackPinReply)
    .values({
      id: nanoid(),
      pinId: pin.id,
      userId: session.user.id,
      authorName: session.user.name || session.user.email || 'Reviewer',
      authorEmail: session.user.email ?? null,
      body: parsed.data.body
    })
    .returning()

  return NextResponse.json({ reply: toPinReply(created) })
}
