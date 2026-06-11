import { NextRequest, NextResponse } from 'next/server'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { db, schema } from '@/db/client'
import { SeverityEnum } from '@/types/feedback'
import { loadShareBundle, getGuestToken } from '@/lib/share-access'
import { toFeedbackSession } from '@/lib/projects'

export const dynamic = 'force-dynamic'

const GuestPinPatchSchema = z
  .object({
    comment: z.string().max(4000).optional(),
    severity: SeverityEnum.optional(),
    replacementText: z.string().max(4000).optional(),
    editInstruction: z.string().max(400).optional()
  })
  .strict()

async function getGatedPin(
  slug: string,
  pinId: string,
  token: string | null
) {
  const bundle = await loadShareBundle(slug)
  if (!bundle) return { error: 'Not found', status: 404, bundle: null, pin: null }
  if (bundle.accessLevel !== 'comment') return { error: 'Forbidden', status: 403, bundle: null, pin: null }
  if (!token) return { error: 'Missing guest token', status: 401, bundle: null, pin: null }

  const [pin] = await db!
    .select()
    .from(schema.feedbackPin)
    .where(
      and(
        eq(schema.feedbackPin.id, pinId),
        eq(schema.feedbackPin.sessionId, bundle.feedbackSession.id)
      )
    )
    .limit(1)

  if (!pin) return { error: 'Pin not found', status: 404, bundle: null, pin: null }
  if (pin.guestToken !== token) return { error: 'Forbidden', status: 403, bundle: null, pin: null }

  return { error: null, status: 200, bundle, pin }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { slug: string; pinId: string } }
) {
  if (!db) return NextResponse.json({ error: 'DB not configured' }, { status: 503 })

  const token = getGuestToken(req)
  const { error, status, bundle, pin } = await getGatedPin(params.slug, params.pinId, token)
  if (error || !bundle || !pin) return NextResponse.json({ error }, { status })

  const parsed = GuestPinPatchSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const [updated] = await db
    .update(schema.feedbackPin)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(schema.feedbackPin.id, pin.id))
    .returning()

  const mapped = toFeedbackSession(bundle.feedbackSession, [updated]).pins[0]
  return NextResponse.json({ pin: mapped })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { slug: string; pinId: string } }
) {
  if (!db) return NextResponse.json({ error: 'DB not configured' }, { status: 503 })

  const token = getGuestToken(req)
  const { error, status, pin } = await getGatedPin(params.slug, params.pinId, token)
  if (error || !pin) return NextResponse.json({ error }, { status })

  await db.delete(schema.feedbackPin).where(eq(schema.feedbackPin.id, pin.id))

  return NextResponse.json({ ok: true })
}
