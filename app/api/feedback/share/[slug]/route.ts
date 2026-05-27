import { NextRequest, NextResponse } from 'next/server'
import { eq, and } from 'drizzle-orm'
import { db, schema } from '@/db/client'

export const dynamic = 'force-dynamic'

/** Public read-only fetch by slug. Only returns sessions flagged isPublic. */
export async function GET(_: NextRequest, { params }: { params: { slug: string } }) {
  if (!db) return NextResponse.json({ error: 'DB not configured' }, { status: 503 })

  const [sess] = await db
    .select()
    .from(schema.feedbackSession)
    .where(
      and(
        eq(schema.feedbackSession.slug, params.slug),
        eq(schema.feedbackSession.isPublic, true)
      )
    )
    .limit(1)

  if (!sess) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const pins = await db
    .select()
    .from(schema.feedbackPin)
    .where(eq(schema.feedbackPin.sessionId, sess.id))

  return NextResponse.json({ session: sess, pins })
}
