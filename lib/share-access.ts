import { eq, inArray } from 'drizzle-orm'
import type { NextRequest } from 'next/server'
import { z } from 'zod'
import { db, schema } from '@/db/client'
import { publicAccessAllowsComment, publicAccessAllowsView } from '@/lib/projects'

export type ShareBundle = {
  project: typeof schema.project.$inferSelect
  feedbackSession: typeof schema.feedbackSession.$inferSelect
  pins: (typeof schema.feedbackPin.$inferSelect)[]
  replies: (typeof schema.feedbackPinReply.$inferSelect)[]
  snapshots: (typeof schema.feedbackPinSnapshot.$inferSelect)[]
  accessLevel: 'view' | 'comment'
}

export async function loadShareBundle(slug: string): Promise<ShareBundle | null> {
  if (!db) return null

  const [sess] = await db
    .select()
    .from(schema.feedbackSession)
    .where(eq(schema.feedbackSession.slug, slug))
    .limit(1)

  if (!sess || !sess.projectId) return null

  const [project] = await db
    .select()
    .from(schema.project)
    .where(eq(schema.project.id, sess.projectId))
    .limit(1)

  if (!project || !publicAccessAllowsView(project.publicAccess)) return null

  const pins = await db
    .select()
    .from(schema.feedbackPin)
    .where(eq(schema.feedbackPin.sessionId, sess.id))

  const pinIds = pins.map(p => p.id)
  const replies = pinIds.length
    ? await db
        .select()
        .from(schema.feedbackPinReply)
        .where(inArray(schema.feedbackPinReply.pinId, pinIds))
    : []
  const snapshots = pinIds.length
    ? await db
        .select()
        .from(schema.feedbackPinSnapshot)
        .where(inArray(schema.feedbackPinSnapshot.pinId, pinIds))
    : []

  return {
    project,
    feedbackSession: sess,
    pins,
    replies,
    snapshots,
    accessLevel: publicAccessAllowsComment(project.publicAccess) ? 'comment' : 'view'
  }
}

export function getGuestToken(req: NextRequest): string | null {
  const token = req.headers.get('x-guest-token')?.trim() ?? null
  if (!token || token.length < 16 || token.length > 64) return null
  return token
}

export const GuestIdentitySchema = z.object({
  authorName: z.string().trim().min(1).max(60),
  authorEmail: z.string().trim().email().max(120).optional()
})
