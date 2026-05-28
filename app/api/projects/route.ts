import { NextRequest, NextResponse } from 'next/server'
import { nanoid } from 'nanoid'
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { db, schema } from '@/db/client'
import { isProjectCreatorEmail } from '@/lib/auth'
import { requireSession } from '@/lib/auth-helpers'
import {
  nameFromWebsiteUrl,
  newProjectId,
  normalizeWebsiteUrl,
  projectSlugFromName,
  listProjectsForUser,
  PROJECT_PUBLIC_ACCESS_VIEW
} from '@/lib/projects'

export const dynamic = 'force-dynamic'

const CreateProjectSchema = z.object({
  websiteUrl: z.string().min(1),
  name: z.string().trim().min(1).max(80).optional(),
  publicAccess: z.enum(['view', 'private']).optional()
})

export async function GET() {
  if (!db) return NextResponse.json({ error: 'DB not configured' }, { status: 503 })

  const session = await requireSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const projects = await listProjectsForUser(session.user.id)
  return NextResponse.json({ projects })
}

export async function POST(req: NextRequest) {
  if (!db) return NextResponse.json({ error: 'DB not configured' }, { status: 503 })

  const session = await requireSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!isProjectCreatorEmail(session.user.email)) {
    return NextResponse.json({ error: 'Project creation is restricted' }, { status: 403 })
  }

  const parsed = CreateProjectSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  let websiteUrl: string
  try {
    websiteUrl = normalizeWebsiteUrl(parsed.data.websiteUrl)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Invalid URL' },
      { status: 400 }
    )
  }

  const name = parsed.data.name?.trim() || nameFromWebsiteUrl(websiteUrl)
  const projectId = newProjectId()
  const organizationId = nanoid()
  const feedbackSessionId = nanoid()
  const now = new Date()

  await db.transaction(async tx => {
    await tx.insert(schema.organization).values({
      id: organizationId,
      name,
      slug: projectSlugFromName(name),
      metadata: JSON.stringify({ projectId, websiteUrl }),
      createdAt: now,
      updatedAt: now
    })

    await tx.insert(schema.member).values({
      id: nanoid(),
      organizationId,
      userId: session.user.id,
      role: 'owner',
      createdAt: now
    })

    await tx.insert(schema.project).values({
      id: projectId,
      organizationId,
      createdByUserId: session.user.id,
      websiteUrl,
      name,
      publicAccess: parsed.data.publicAccess ?? PROJECT_PUBLIC_ACCESS_VIEW,
      createdAt: now,
      updatedAt: now
    })

    await tx.insert(schema.feedbackSession).values({
      id: feedbackSessionId,
      slug: nanoid(10),
      projectId,
      userId: session.user.id,
      organizationId,
      url: websiteUrl,
      title: name,
      userAgent: '',
      capturedViewports: [],
      isPublic: true,
      createdAt: now,
      updatedAt: now
    })

    await tx
      .update(schema.session)
      .set({ activeOrganizationId: organizationId, updatedAt: now })
      .where(eq(schema.session.id, session.session.id))
  })

  return NextResponse.json({
    projectId,
    organizationId,
    websiteUrl,
    name
  })
}
