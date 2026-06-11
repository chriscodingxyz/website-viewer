import { NextRequest, NextResponse } from 'next/server'
import { nanoid } from 'nanoid'
import { eq } from 'drizzle-orm'
import { db, schema } from '@/db/client'
import { requireSession } from '@/lib/auth-helpers'
import { canManageProject, loadProjectBundle } from '@/lib/projects'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  if (!db) return NextResponse.json({ error: 'DB not configured' }, { status: 503 })

  const session = await requireSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const bundle = await loadProjectBundle(params.projectId, session)
  if (!bundle) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({
    slug: bundle.feedbackSession.slug,
    publicAccess: bundle.project.publicAccess
  })
}

export async function POST(
  _req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  if (!db) return NextResponse.json({ error: 'DB not configured' }, { status: 503 })

  const session = await requireSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const bundle = await loadProjectBundle(params.projectId, session)
  if (!bundle) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!canManageProject(bundle.member)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const slug = nanoid(10)
  await db
    .update(schema.feedbackSession)
    .set({ slug, updatedAt: new Date() })
    .where(eq(schema.feedbackSession.projectId, params.projectId))

  return NextResponse.json({ slug })
}
