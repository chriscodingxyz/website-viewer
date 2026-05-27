import { NextRequest, NextResponse } from 'next/server'
import { nanoid } from 'nanoid'
import { eq, desc } from 'drizzle-orm'
import { db, schema } from '@/db/client'
import {
  getActiveProjectId,
  requireProjectMember,
  requireSession
} from '@/lib/auth-helpers'
import { FeedbackSessionSchema } from '@/types/feedback'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  if (!db) return NextResponse.json({ error: 'DB not configured' }, { status: 503 })
  const session = await requireSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const projectId =
    req.nextUrl.searchParams.get('projectId') || getActiveProjectId(session)
  if (!projectId) {
    return NextResponse.json({ error: 'Project required' }, { status: 400 })
  }

  const access = await requireProjectMember(projectId)
  if (!access) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const rows = await db
    .select()
    .from(schema.feedbackSession)
    .where(eq(schema.feedbackSession.organizationId, projectId))
    .orderBy(desc(schema.feedbackSession.updatedAt))

  return NextResponse.json({ sessions: rows })
}

export async function POST(req: NextRequest) {
  if (!db) return NextResponse.json({ error: 'DB not configured' }, { status: 503 })
  const session = await requireSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = FeedbackSessionSchema.partial({ id: true }).safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }
  const data = parsed.data
  const projectId = data.projectId || getActiveProjectId(session)
  if (!projectId) {
    return NextResponse.json({ error: 'Project required' }, { status: 400 })
  }

  const access = await requireProjectMember(projectId)
  if (!access) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const id = data.id || nanoid()
  const slug = nanoid(10)

  const [row] = await db
    .insert(schema.feedbackSession)
    .values({
      id,
      slug,
      userId: session.user.id,
      organizationId: projectId,
      url: data.url,
      title: data.meta?.title,
      userAgent: data.meta?.userAgent,
      capturedViewports: data.meta?.capturedViewports ?? []
    })
    .returning()

  return NextResponse.json({ session: row })
}
