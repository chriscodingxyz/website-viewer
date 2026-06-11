import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { db, schema } from '@/db/client'
import { requireSession } from '@/lib/auth-helpers'
import {
  canManageProject,
  loadProjectBundle,
  normalizeWebsiteUrl,
  toFeedbackSession
} from '@/lib/projects'

export const dynamic = 'force-dynamic'

const UpdateProjectSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  websiteUrl: z.string().min(1).optional(),
  publicAccess: z.enum(['view', 'private', 'comment']).optional()
})

export async function GET(
  _: NextRequest,
  { params }: { params: { projectId: string } }
) {
  if (!db) return NextResponse.json({ error: 'DB not configured' }, { status: 503 })

  const session = await requireSession()
  const bundle = await loadProjectBundle(params.projectId, session)
  if (!bundle) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({
    project: bundle.project,
    role: bundle.member?.role ?? null,
    canEdit: bundle.canEdit,
    canManage: bundle.canManage,
    publicView: bundle.publicView,
    session: toFeedbackSession(
      bundle.feedbackSession,
      bundle.pins,
      bundle.replies,
      bundle.snapshots
    )
  })
}

export async function PATCH(
  req: NextRequest,
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

  const parsed = UpdateProjectSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const patch = parsed.data
  let websiteUrl: string | undefined
  if (patch.websiteUrl) {
    try {
      websiteUrl = normalizeWebsiteUrl(patch.websiteUrl)
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Invalid URL' },
        { status: 400 }
      )
    }
  }

  const [project] = await db
    .update(schema.project)
    .set({
      ...(patch.name ? { name: patch.name } : {}),
      ...(websiteUrl ? { websiteUrl } : {}),
      ...(patch.publicAccess ? { publicAccess: patch.publicAccess } : {}),
      updatedAt: new Date()
    })
    .where(eq(schema.project.id, params.projectId))
    .returning()

  if (websiteUrl || patch.name) {
    await db
      .update(schema.feedbackSession)
      .set({
        ...(websiteUrl ? { url: websiteUrl } : {}),
        ...(patch.name ? { title: patch.name } : {}),
        updatedAt: new Date()
      })
      .where(eq(schema.feedbackSession.projectId, params.projectId))
  }

  return NextResponse.json({ project })
}
