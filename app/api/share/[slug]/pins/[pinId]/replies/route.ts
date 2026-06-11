import { NextRequest, NextResponse } from 'next/server'
import { nanoid } from 'nanoid'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { db, schema } from '@/db/client'
import { loadShareBundle, getGuestToken, GuestIdentitySchema } from '@/lib/share-access'
import { toPinReply } from '@/lib/projects'

export const dynamic = 'force-dynamic'

const GuestReplyBodySchema = z
  .object({ body: z.string().trim().min(1).max(4000) })
  .merge(GuestIdentitySchema)

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string; pinId: string } }
) {
  if (!db) return NextResponse.json({ error: 'DB not configured' }, { status: 503 })

  const bundle = await loadShareBundle(params.slug)
  if (!bundle) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (bundle.accessLevel !== 'comment') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const token = getGuestToken(req)
  if (!token) return NextResponse.json({ error: 'Missing guest token' }, { status: 401 })

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

  const parsed = GuestReplyBodySchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const [created] = await db
    .insert(schema.feedbackPinReply)
    .values({
      id: nanoid(),
      pinId: pin.id,
      userId: null,
      authorName: parsed.data.authorName,
      authorEmail: parsed.data.authorEmail ?? null,
      body: parsed.data.body
    })
    .returning()

  return NextResponse.json({ reply: toPinReply(created) })
}
