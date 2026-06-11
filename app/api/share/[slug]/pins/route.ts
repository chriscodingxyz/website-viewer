import { NextRequest, NextResponse } from 'next/server'
import { nanoid } from 'nanoid'
import { eq, max } from 'drizzle-orm'
import { db, schema } from '@/db/client'
import { PinSchema } from '@/types/feedback'
import { loadShareBundle, getGuestToken, GuestIdentitySchema } from '@/lib/share-access'
import { toFeedbackSession } from '@/lib/projects'

export const dynamic = 'force-dynamic'

const GuestPinCreateSchema = PinSchema.omit({
  status: true,
  replies: true,
  snapshot: true,
  verificationState: true,
  verifiedBy: true,
  verifiedAt: true,
  verificationReason: true,
  authorUserId: true,
  isGuest: true
}).merge(GuestIdentitySchema)

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  if (!db) return NextResponse.json({ error: 'DB not configured' }, { status: 503 })

  const bundle = await loadShareBundle(params.slug)
  if (!bundle) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (bundle.accessLevel !== 'comment') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const token = getGuestToken(req)
  if (!token) return NextResponse.json({ error: 'Missing guest token' }, { status: 401 })

  const parsed = GuestPinCreateSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }
  const pin = parsed.data
  const sessionId = bundle.feedbackSession.id

  // Compute canonical URL
  const pinUrl = (() => {
    try {
      const url = new URL(pin.url, bundle.project.websiteUrl)
      url.hash = ''
      return url.toString()
    } catch {
      return bundle.project.websiteUrl
    }
  })()

  // Server-side renumber to avoid guest/member races
  const [maxRow] = await db
    .select({ maxNum: max(schema.feedbackPin.number) })
    .from(schema.feedbackPin)
    .where(eq(schema.feedbackPin.sessionId, sessionId))
  const nextNumber = (maxRow?.maxNum ?? 0) + 1

  const [created] = await db
    .insert(schema.feedbackPin)
    .values({
      id: pin.id,
      sessionId,
      number: nextNumber,
      kind: pin.kind ?? 'comment',
      status: 'open',
      authorUserId: null,
      authorName: pin.authorName,
      authorEmail: pin.authorEmail ?? null,
      guestToken: token,
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
      assetUrl: pin.assetUrl ?? null,
      anchorStatus: pin.anchorStatus ?? null,
      anchorCheckedAt: pin.anchorCheckedAt ? new Date(pin.anchorCheckedAt) : null,
      updatedAt: new Date()
    })
    .returning()

  if (!created) return NextResponse.json({ error: 'Insert failed' }, { status: 500 })

  await db
    .update(schema.feedbackSession)
    .set({ updatedAt: new Date() })
    .where(eq(schema.feedbackSession.id, sessionId))

  const mapped = toFeedbackSession(bundle.feedbackSession, [created]).pins[0]
  return NextResponse.json({ pin: mapped })
}
