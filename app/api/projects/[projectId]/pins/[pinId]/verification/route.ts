import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { and, eq } from 'drizzle-orm'
import { db, schema } from '@/db/client'
import { requireSession } from '@/lib/auth-helpers'
import { loadProjectBundle } from '@/lib/projects'
import { VerificationStateEnum } from '@/types/feedback'

export const dynamic = 'force-dynamic'

const VerificationBodySchema = z.object({
  state: VerificationStateEnum,
  reason: z.string().trim().max(2000).optional()
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

  const parsed = VerificationBodySchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const [updated] = await db
    .update(schema.feedbackPin)
    .set({
      verificationState: parsed.data.state,
      verifiedBy: 'human',
      verifiedAt: new Date(),
      verificationReason: parsed.data.reason ?? null,
      updatedAt: new Date()
    })
    .where(
      and(
        eq(schema.feedbackPin.id, params.pinId),
        eq(schema.feedbackPin.sessionId, bundle.feedbackSession.id)
      )
    )
    .returning()

  if (!updated) return NextResponse.json({ error: 'Pin not found' }, { status: 404 })

  return NextResponse.json({
    verification: {
      verificationState: updated.verificationState,
      verifiedBy: updated.verifiedBy,
      verifiedAt: updated.verifiedAt?.toISOString(),
      verificationReason: updated.verificationReason ?? undefined
    }
  })
}
