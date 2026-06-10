import { createHash } from 'crypto'
import { mkdirSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { getBrowser } from '@/lib/snapshot/browser'
import { s3, s3Bucket, storageMode } from '@/lib/s3'
import { inferInspectAction } from '@/lib/feedback/inspectActions'
import type { DbFeedbackPin } from '@/db/schema'

const PAGE_LOAD_TIMEOUT_MS = 30_000
const NETWORK_IDLE_TIMEOUT_MS = 8_000
const SETTLE_DELAY_MS = 500
const MAX_ELEMENT_HTML_CHARS = 20_000

export function snapshotSelectorHash(pin: Pick<DbFeedbackPin, 'url' | 'cssSelector' | 'viewportWidth'>) {
  return createHash('sha1')
    .update(`${pin.url}|${pin.cssSelector ?? ''}|${pin.viewportWidth}`)
    .digest('hex')
}

export interface PinCaptureResult {
  pinId: string
  status: 'captured' | 'element-missing' | 'failed'
  pageScreenshotKey?: string
  elementScreenshotKey?: string
  elementHtml?: string
  boundingBox?: { x: number; y: number; width: number; height: number }
  error?: string
}

interface CapturePageArgs {
  projectId: string
  url: string
  viewportWidth: number
  viewportHeight: number
  pins: DbFeedbackPin[]
}

async function storeScreenshot(key: string, body: Buffer) {
  if (storageMode === 'local') {
    const dest = join(process.cwd(), 'public', 'snapshots', key)
    mkdirSync(dirname(dest), { recursive: true })
    writeFileSync(dest, body)
    return
  }
  if (!s3) throw new Error('Storage not configured')
  await s3.send(
    new PutObjectCommand({
      Bucket: s3Bucket,
      Key: key,
      Body: body,
      ContentType: 'image/png'
    })
  )
}

/**
 * Visits one page at one viewport and captures a full-page screenshot plus a
 * crop and full outerHTML for each pin. A pin whose element cannot be located
 * still gets the page screenshot (status 'element-missing').
 */
export async function capturePinsForPage({
  projectId,
  url,
  viewportWidth,
  viewportHeight,
  pins
}: CapturePageArgs): Promise<PinCaptureResult[]> {
  const browser = await getBrowser()
  const context = await browser.newContext({
    viewport: { width: viewportWidth, height: viewportHeight }
  })

  try {
    const page = await context.newPage()
    await page.goto(url, { waitUntil: 'load', timeout: PAGE_LOAD_TIMEOUT_MS })
    await page
      .waitForLoadState('networkidle', { timeout: NETWORK_IDLE_TIMEOUT_MS })
      .catch(() => {})
    await page.waitForTimeout(SETTLE_DELAY_MS)

    const ts = Date.now()
    const urlHash = createHash('sha1').update(url).digest('hex').slice(0, 12)
    const pageKey = `projects/${projectId}/snapshots/${urlHash}-${viewportWidth}-${ts}.png`
    const pageShot = await page.screenshot({ fullPage: true, type: 'png' })
    await storeScreenshot(pageKey, pageShot)

    const results: PinCaptureResult[] = []
    for (const pin of pins) {
      try {
        let locator = pin.cssSelector ? page.locator(pin.cssSelector).first() : null
        if (locator && (await locator.count()) === 0) locator = null
        if (!locator && pin.elementText && pin.elementText.length >= 4) {
          const byText = page.getByText(pin.elementText, { exact: false }).first()
          if ((await byText.count()) > 0) locator = byText
        }

        if (!locator) {
          results.push({ pinId: pin.id, status: 'element-missing', pageScreenshotKey: pageKey })
          continue
        }

        await locator.scrollIntoViewIfNeeded({ timeout: 5_000 }).catch(() => {})
        const boundingBox = (await locator.boundingBox()) ?? undefined
        const elementHtml = await locator
          .evaluate(el => el.outerHTML.slice(0, 20_000), undefined, { timeout: 5_000 })
          .catch(() => undefined)

        // Viewport shot with element highlighted — outline + badge label, then clean up
        let elementKey: string | undefined
        try {
          const action = inferInspectAction({
            editInstruction: pin.editInstruction ?? undefined,
            elementTag: pin.elementTag ?? undefined,
            elementText: pin.elementText ?? undefined
          })
          const badgeLabel = `${pin.number} ${action.label}`
          const bbox = boundingBox

          await page.evaluate(({ sel, label, box }) => {
            if (sel) {
              const el = document.querySelector(sel) as HTMLElement | null
              if (el) {
                el.style.setProperty('outline', '3px solid #ef4444', 'important')
                el.style.setProperty('outline-offset', '2px', 'important')
              }
            }
            if (box) {
              const badge = document.createElement('div')
              badge.id = '__bugsmash_badge__'
              const top = Math.max(0, box.y - 24)
              Object.assign(badge.style, {
                position: 'fixed',
                top: `${top}px`,
                left: `${box.x}px`,
                background: '#ef4444',
                color: '#fff',
                fontSize: '11px',
                fontWeight: '600',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                padding: '2px 7px',
                borderRadius: '4px',
                zIndex: '2147483647',
                lineHeight: '1.6',
                whiteSpace: 'nowrap',
                pointerEvents: 'none',
              })
              badge.textContent = label
              document.body.appendChild(badge)
            }
          }, { sel: pin.cssSelector, label: badgeLabel, box: bbox ?? null })

          const viewportShot = await page.screenshot({ fullPage: false, type: 'png', timeout: 8_000 })

          await page.evaluate(({ sel }) => {
            if (sel) {
              const el = document.querySelector(sel) as HTMLElement | null
              if (el) {
                el.style.removeProperty('outline')
                el.style.removeProperty('outline-offset')
              }
            }
            document.getElementById('__bugsmash_badge__')?.remove()
          }, { sel: pin.cssSelector }).catch(() => {})

          elementKey = `projects/${projectId}/snapshots/pins/${pin.id}-${ts}.png`
          await storeScreenshot(elementKey, viewportShot)
        } catch {
          // best-effort; HTML still counts
        }

        results.push({
          pinId: pin.id,
          status: 'captured',
          pageScreenshotKey: pageKey,
          elementScreenshotKey: elementKey,
          elementHtml: elementHtml?.slice(0, MAX_ELEMENT_HTML_CHARS),
          boundingBox
        })
      } catch (error) {
        results.push({
          pinId: pin.id,
          status: 'failed',
          pageScreenshotKey: pageKey,
          error: error instanceof Error ? error.message : 'capture failed'
        })
      }
    }
    return results
  } finally {
    await context.close().catch(() => {})
  }
}
