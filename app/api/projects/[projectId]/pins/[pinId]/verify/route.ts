import { NextRequest, NextResponse } from 'next/server'
import { and, eq } from 'drizzle-orm'
import { db, schema } from '@/db/client'
import { requireSession } from '@/lib/auth-helpers'
import { loadProjectBundle } from '@/lib/projects'
import { getBrowser } from '@/lib/snapshot/browser'
import { aiVerifyEnabled, verifyPin } from '@/lib/ai/verifyPin'
import { findInspectAction, inferInspectAction } from '@/lib/feedback/inspectActions'
import { publicUrlFor } from '@/lib/s3'
import type { Pin } from '@/types/feedback'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

async function fetchImage(url: string | null): Promise<Buffer | undefined> {
  if (!url) return undefined
  try {
    const res = await fetch(url)
    if (!res.ok) return undefined
    return Buffer.from(await res.arrayBuffer())
  } catch {
    return undefined
  }
}

async function captureLiveElement(args: {
  url: string
  cssSelector?: string | null
  viewportWidth: number
  viewportHeight: number
}) {
  const browser = await getBrowser()
  const context = await browser.newContext({
    viewport: { width: args.viewportWidth, height: args.viewportHeight }
  })
  try {
    const page = await context.newPage()
    await page.goto(args.url, { waitUntil: 'load', timeout: 30_000 })
    await page.waitForLoadState('networkidle', { timeout: 8_000 }).catch(() => {})
    await page.waitForTimeout(500)

    if (!args.cssSelector) return { found: false }
    const locator = page.locator(args.cssSelector).first()
    if ((await locator.count()) === 0) return { found: false }

    await locator.scrollIntoViewIfNeeded({ timeout: 5_000 }).catch(() => {})
    const html = await locator
      .evaluate(el => el.outerHTML.slice(0, 20_000), undefined, { timeout: 5_000 })
      .catch(() => undefined)
    const image = await locator
      .screenshot({ type: 'png', timeout: 8_000 })
      .catch(() => undefined)
    return { found: true, html, image }
  } finally {
    await context.close().catch(() => {})
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { projectId: string; pinId: string } }
) {
  if (!db) return NextResponse.json({ error: 'DB not configured' }, { status: 503 })
  if (!aiVerifyEnabled()) {
    return NextResponse.json({ error: 'AI verify not configured' }, { status: 503 })
  }

  const session = await requireSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const bundle = await loadProjectBundle(params.projectId, session)
  if (!bundle) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!bundle.canEdit) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const pin = bundle.pins.find(item => item.id === params.pinId)
  if (!pin) return NextResponse.json({ error: 'Pin not found' }, { status: 404 })
  const snapshot = bundle.snapshots.find(item => item.pinId === pin.id)

  const actionInput = {
    editInstruction: pin.editInstruction ?? undefined,
    elementTag: pin.elementTag ?? undefined,
    elementText: pin.elementText ?? undefined
  } as Pick<Pin, 'editInstruction' | 'elementTag' | 'elementText'>
  const action = findInspectAction(actionInput) ?? inferInspectAction(actionInput)

  let live: { found: boolean; html?: string; image?: Buffer } = { found: false }
  try {
    live = await captureLiveElement({
      url: pin.url,
      cssSelector: pin.cssSelector,
      viewportWidth: pin.viewportWidth,
      viewportHeight: pin.viewportHeight
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: `Could not load the live page: ${
          error instanceof Error ? error.message : 'unknown error'
        }`
      },
      { status: 502 }
    )
  }

  const snapshotImage = await fetchImage(
    snapshot?.elementScreenshotKey ? publicUrlFor(snapshot.elementScreenshotKey) : null
  )

  let verdict
  try {
    verdict = await verifyPin({
      intentLabel: action?.label ?? (pin.kind === 'inspect' ? 'Inspect/edit' : 'Review comment'),
      editInstruction: pin.editInstruction ?? undefined,
      replacementText: pin.replacementText ?? undefined,
      assetUrl: pin.assetUrl ?? undefined,
      reviewerComment: pin.comment || undefined,
      elementTag: pin.elementTag ?? undefined,
      cssSelector: pin.cssSelector ?? undefined,
      snapshotHtml: snapshot?.elementHtml ?? pin.elementHtml ?? undefined,
      liveHtml: live.html,
      liveElementFound: live.found,
      snapshotImage,
      liveImage: live.image
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: `AI verification failed: ${
          error instanceof Error ? error.message : 'unknown error'
        }`
      },
      { status: 502 }
    )
  }

  const verificationState =
    verdict.verdict === 'implemented'
      ? 'confirmed-done'
      : verdict.verdict === 'not-implemented'
        ? 'still-open'
        : 'unverified'

  const [updated] = await db
    .update(schema.feedbackPin)
    .set({
      verificationState,
      verifiedBy: 'ai',
      verifiedAt: new Date(),
      verificationReason: `${verdict.reason} (confidence: ${verdict.confidence})`,
      updatedAt: new Date()
    })
    .where(
      and(
        eq(schema.feedbackPin.id, pin.id),
        eq(schema.feedbackPin.sessionId, bundle.feedbackSession.id)
      )
    )
    .returning()

  return NextResponse.json({
    verdict,
    verification: {
      verificationState: updated?.verificationState,
      verifiedBy: updated?.verifiedBy,
      verifiedAt: updated?.verifiedAt?.toISOString(),
      verificationReason: updated?.verificationReason ?? undefined
    }
  })
}
