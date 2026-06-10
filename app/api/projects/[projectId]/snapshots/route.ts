import { NextRequest, NextResponse } from 'next/server'
import { nanoid } from 'nanoid'
import { inArray } from 'drizzle-orm'
import { db, schema } from '@/db/client'
import { requireSession } from '@/lib/auth-helpers'
import { loadProjectBundle, toPinSnapshot } from '@/lib/projects'
import {
  capturePinsForPage,
  snapshotSelectorHash,
  type PinCaptureResult
} from '@/lib/snapshot/capture'
import type { DbFeedbackPin } from '@/db/schema'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

// one capture run per project at a time; concurrent triggers piggyback on the result
const inFlight = new Map<string, Promise<void>>()

export async function GET(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  if (!db) return NextResponse.json({ error: 'DB not configured' }, { status: 503 })

  const session = await requireSession()
  const bundle = await loadProjectBundle(params.projectId, session)
  if (!bundle) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({
    snapshots: bundle.snapshots.map(row => ({
      pinId: row.pinId,
      snapshot: toPinSnapshot(row)
    }))
  })
}

async function runCapture(projectId: string, pins: DbFeedbackPin[]) {
  if (!db) return

  const pinIds = pins.map(pin => pin.id)
  const existing = pinIds.length
    ? await db
        .select()
        .from(schema.feedbackPinSnapshot)
        .where(inArray(schema.feedbackPinSnapshot.pinId, pinIds))
    : []
  const existingByPin = new Map(existing.map(row => [row.pinId, row]))

  const pending = pins.filter(pin => {
    if ((pin.status ?? 'open') === 'closed') return false
    const hash = snapshotSelectorHash(pin)
    const row = existingByPin.get(pin.id)
    if (!row) return true
    if (row.status === 'captured' && row.selectorHash === hash) return false
    // retry missing/failed at most when the selector changed, otherwise leave as-is
    return row.selectorHash !== hash
  })
  if (!pending.length) return

  const groups = new Map<string, DbFeedbackPin[]>()
  for (const pin of pending) {
    const key = `${pin.url}|${pin.viewportWidth}x${pin.viewportHeight}`
    const list = groups.get(key) ?? []
    list.push(pin)
    groups.set(key, list)
  }

  for (const groupPins of Array.from(groups.values())) {
    const { url, viewportWidth, viewportHeight } = groupPins[0]
    let results: PinCaptureResult[]
    try {
      results = await capturePinsForPage({
        projectId,
        url,
        viewportWidth,
        viewportHeight,
        pins: groupPins
      })
    } catch (error) {
      results = groupPins.map<PinCaptureResult>(pin => ({
        pinId: pin.id,
        status: 'failed',
        error: error instanceof Error ? error.message : 'page capture failed'
      }))
    }

    for (const result of results) {
      const pin = groupPins.find(item => item.id === result.pinId)
      if (!pin) continue
      const values = {
        status: result.status,
        pageScreenshotKey: result.pageScreenshotKey ?? null,
        elementScreenshotKey: result.elementScreenshotKey ?? null,
        elementHtml: result.elementHtml ?? null,
        boundingBox: result.boundingBox ?? null,
        capturedUrl: pin.url,
        error: result.error ?? null,
        selectorHash: snapshotSelectorHash(pin),
        capturedAt: new Date(),
        updatedAt: new Date()
      }
      await db
        .insert(schema.feedbackPinSnapshot)
        .values({ id: nanoid(), pinId: pin.id, ...values })
        .onConflictDoUpdate({
          target: schema.feedbackPinSnapshot.pinId,
          set: values
        })
    }
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  if (!db) return NextResponse.json({ error: 'DB not configured' }, { status: 503 })

  const session = await requireSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const bundle = await loadProjectBundle(params.projectId, session)
  if (!bundle) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!bundle.canEdit) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  let run = inFlight.get(params.projectId)
  if (!run) {
    run = runCapture(params.projectId, bundle.pins).finally(() =>
      inFlight.delete(params.projectId)
    )
    inFlight.set(params.projectId, run)
  }
  try {
    await run
  } catch {
    // individual failures already recorded per snapshot row
  }

  const rows = await db
    .select()
    .from(schema.feedbackPinSnapshot)
    .where(
      inArray(
        schema.feedbackPinSnapshot.pinId,
        bundle.pins.length ? bundle.pins.map(pin => pin.id) : ['-']
      )
    )

  return NextResponse.json({
    snapshots: rows.map(row => ({
      pinId: row.pinId,
      snapshot: toPinSnapshot(row)
    }))
  })
}
