import { FeedbackSession, Pin } from '@/types/feedback'
import { feedbackPath } from '@/lib/feedback/url'
import { findInspectAction } from '@/lib/feedback/inspectActions'
import { isPossiblyDone, possiblyDoneReason } from '@/lib/feedback/verification'

const safeHost = (url: string): string => {
  try {
    return new URL(url).hostname
  } catch {
    return url
  }
}

const repliesBlock = (pin: Pin): string[] => {
  const replies = pin.replies ?? []
  if (!replies.length) return []

  const lines = ['- **Replies / discussion:**']
  for (const reply of replies) {
    lines.push(`  - ${reply.authorName} (${reply.createdAt}): ${reply.body}`)
  }
  return lines
}

export function aiReadinessFor(pin: Pin) {
  const action = pin.kind === 'inspect' ? findInspectAction(pin) : undefined
  const hasInstruction = Boolean(
    pin.comment.trim() ||
      pin.editInstruction?.trim() ||
      pin.replacementText?.trim()
  )
  const hasTarget = Boolean(pin.cssSelector || pin.playwrightLocator)
  const hasViewport = Boolean(pin.url && pin.viewportType && pin.viewportWidth && pin.viewportHeight)
  const isOpen = (pin.status ?? 'open') !== 'closed'
  const imageNeedsAsset =
    action?.id === 'replace-image' &&
    !pin.assetUrl?.trim() &&
    !pin.replacementText?.trim()

  const checks = {
    clearInstruction: hasInstruction,
    target: hasTarget,
    viewport: hasViewport,
    open: isOpen,
    assetReady: !imageNeedsAsset
  }

  return {
    ready: Object.values(checks).every(Boolean),
    checks
  }
}

export const pinBlock = (pin: Pin): string => {
  const lines: string[] = []
  const kind = pin.kind === 'inspect' ? 'inspect/edit' : 'comment'

  lines.push(`### Pin ${pin.number} - ${kind}`)
  lines.push(`- **Status:** ${pin.status ?? 'open'}`)
  lines.push(`- **Page:** ${pin.url}`)
  lines.push(`- **Path:** ${feedbackPath(pin.url)}`)

  if (pin.elementTag) {
    const txt = pin.elementText ? ` "${pin.elementText}"` : ''
    lines.push(`- **Element:** \`<${pin.elementTag}>\`${txt}`)
  }

  if (pin.kind === 'inspect') {
    const action = findInspectAction(pin)
    lines.push(`- **Intent:** ${action?.label ?? 'Inspect/edit'}`)
    lines.push('- **Requested action:** Inspect this element and apply the requested edit.')
    if (pin.elementText) lines.push(`- **Current text:** ${pin.elementText}`)
    if (pin.replacementText?.trim()) {
      lines.push(`- **Details / desired result:** ${pin.replacementText.trim()}`)
    }
    if (pin.editInstruction?.trim()) {
      lines.push(`- **Edit instruction:** ${pin.editInstruction.trim()}`)
    }
    if (pin.assetUrl?.trim()) {
      lines.push(`- **Replacement asset (public URL):** ${pin.assetUrl.trim()}`)
      lines.push('  Use this exact URL as the new asset source (download or hotlink as the project convention dictates).')
    }
  } else if (pin.elementText) {
    lines.push(`- **Captured text:** ${pin.elementText}`)
  }

  if (pin.verificationState && pin.verificationState !== 'unverified') {
    lines.push(
      `- **Verification:** ${pin.verificationState}${pin.verifiedBy ? ` (by ${pin.verifiedBy})` : ''}${pin.verificationReason ? ` - ${pin.verificationReason}` : ''}`
    )
  }
  if (pin.cssSelector) lines.push(`- **CSS selector:** \`${pin.cssSelector}\``)
  if (pin.playwrightLocator) lines.push(`- **Playwright:** \`${pin.playwrightLocator}\``)
  if (pin.elementAttributes && Object.keys(pin.elementAttributes).length) {
    const attrs = Object.entries(pin.elementAttributes)
      .map(([k, v]) => `${k}="${v}"`)
      .join(' ')
    lines.push(`- **Attributes:** \`${attrs}\``)
  }
  if (pin.ancestorChain?.length) {
    lines.push(`- **Ancestor chain:** \`${pin.ancestorChain.join(' > ')}\``)
  }
  const snapshotHtml = pin.snapshot?.elementHtml || pin.elementHtml
  if (snapshotHtml) {
    lines.push('- **Element HTML (captured at request time):**')
    lines.push('```html')
    lines.push(snapshotHtml)
    lines.push('```')
  }
  if (pin.snapshot?.elementScreenshotUrl) {
    lines.push(`- **Element screenshot (at request time):** ${pin.snapshot.elementScreenshotUrl}`)
  }
  if (pin.snapshot?.pageScreenshotUrl) {
    lines.push(`- **Full page screenshot (at request time):** ${pin.snapshot.pageScreenshotUrl}`)
  }

  lines.push(
    `- **Location:** ${pin.x.toFixed(1)}% x ${pin.y.toFixed(1)}% on ${pin.viewportType} (${pin.viewportWidth}x${pin.viewportHeight})`
  )

  if (
    typeof pin.documentX === 'number' &&
    typeof pin.documentY === 'number'
  ) {
    lines.push(
      `- **Document coordinates:** ${Math.round(pin.documentX)}px x ${Math.round(pin.documentY)}px`
    )
  }

  const comment = pin.comment.trim() || '_(no comment provided)_'
  const readiness = aiReadinessFor(pin)
  lines.push(`- **Ready for AI:** ${readiness.ready ? 'yes' : 'needs detail'}`)
  lines.push('- **Comment:**')
  lines.push(comment.split('\n').map(line => `  ${line}`).join('\n'))
  lines.push(...repliesBlock(pin))

  return lines.join('\n')
}

const pinsByPage = (pins: Pin[]) => {
  const groups = new Map<string, Pin[]>()

  for (const pin of pins) {
    const list = groups.get(pin.url) ?? []
    list.push(pin)
    groups.set(pin.url, list)
  }

  return Array.from(groups.entries()).sort(([aUrl, aPins], [bUrl, bPins]) => {
    if (aPins.length !== bPins.length) return bPins.length - aPins.length
    return feedbackPath(aUrl).localeCompare(feedbackPath(bUrl))
  })
}

export function toMarkdown(session: FeedbackSession, pageTitle?: string): string {
  const host = safeHost(session.url)
  const lines: string[] = []

  lines.push(`# Implementation Brief - ${host}`)
  lines.push('')
  lines.push(`**Target URL:** ${session.url}`)
  if (pageTitle) lines.push(`**Page title:** ${pageTitle}`)
  lines.push(`**Captured:** ${session.updatedAt}`)
  lines.push(`**Pin count:** ${session.pins.length}`)
  lines.push(`**Pages with feedback:** ${new Set(session.pins.map(pin => pin.url)).size}`)

  const viewports = Array.from(new Set(session.pins.map(pin => pin.viewportType)))
  if (viewports.length) lines.push(`**Viewports used:** ${viewports.join(', ')}`)
  lines.push('')

  if (session.pins.length === 0) {
    lines.push('_No pins yet._')
    return lines.join('\n')
  }

  lines.push('## Implementation Rules')
  lines.push('')
  lines.push('- Use the page URL/path first, then the selector/locator/context to find the intended element.')
  lines.push('- Treat inspect/edit pins as concrete change requests. Use the details and instruction fields as the client intent.')
  lines.push('- Treat comment pins as review notes anchored to the captured element or coordinates.')
  lines.push('- Preserve the existing design system and nearby copy style unless a pin explicitly asks otherwise.')
  lines.push('')

  const possiblyDonePins = session.pins.filter(isPossiblyDone)
  const actionablePins = session.pins.filter(pin => !isPossiblyDone(pin))

  lines.push('## Tasks By Page')
  lines.push('')
  for (const [url, pagePins] of pinsByPage(actionablePins)) {
    lines.push(`## ${feedbackPath(url)}`)
    lines.push('')
    lines.push(`**URL:** ${url}`)
    lines.push(`**Pins:** ${pagePins.map(pin => `#${pin.number}`).join(', ')}`)
    lines.push('')

    for (const pin of pagePins.slice().sort((a, b) => a.number - b.number)) {
      lines.push(pinBlock(pin))
      lines.push('')
    }
  }

  if (possiblyDonePins.length) {
    lines.push('## Possibly Already Implemented - Verify, Do Not Re-Do')
    lines.push('')
    lines.push(
      'These tasks look already applied on the live site (element removed as requested, or live content matches the requested change). Verify each one instead of re-implementing it.'
    )
    lines.push('')
    for (const pin of possiblyDonePins.slice().sort((a, b) => a.number - b.number)) {
      lines.push(`- Pin ${pin.number} on ${feedbackPath(pin.url)}: ${possiblyDoneReason(pin)}`)
      lines.push(pinBlock(pin))
      lines.push('')
    }
  }

  lines.push('## Machine-Readable Checklist')
  lines.push('')
  for (const pin of session.pins.slice().sort((a, b) => a.number - b.number)) {
    const action = pin.kind === 'inspect'
      ? pin.replacementText?.trim()
        ? 'apply details'
        : pin.editInstruction?.trim()
          ? 'apply instruction'
          : 'inspect/edit'
      : 'review comment'

    lines.push(
      `- [ ] Pin ${pin.number} [${pin.status ?? 'open'} / ${pin.severity}]: ${action} on ${feedbackPath(pin.url)} (${pin.cssSelector || 'coordinate fallback'})`
    )
  }

  lines.push('')
  lines.push('## Instructions for the dev / LLM')
  lines.push('')
  lines.push(
    'Apply the changes above to the codebase. For each task, find the matching component/template/content source, make the smallest coherent change, then verify the affected page at the captured viewport. If a selector points to generated HTML, map it back to the source component before editing.'
  )

  return lines.join('\n')
}

export function toAgentPrompt(session: FeedbackSession, pageTitle?: string): string {
  const host = safeHost(session.url)
  const skippedPossiblyDone = session.pins.filter(
    pin => (pin.status ?? 'open') !== 'closed' && isPossiblyDone(pin)
  )
  const openPins = session.pins
    .filter(pin => (pin.status ?? 'open') !== 'closed' && !isPossiblyDone(pin))
    .sort((a, b) => {
      const severityOrder = { blocking: 0, high: 1, medium: 2, low: 3 }
      return severityOrder[a.severity] - severityOrder[b.severity] || a.number - b.number
    })

  const lines: string[] = []
  lines.push(`# Agent Implementation Prompt - ${host}`)
  lines.push('')
  lines.push('You are implementing visual review feedback from Bugsmash.')
  lines.push(`Target site: ${session.url}`)
  if (pageTitle) lines.push(`Project/page title: ${pageTitle}`)
  lines.push('')
  lines.push('## Acceptance Rules')
  lines.push('- Implement only open or implemented tasks; do not change closed tasks unless explicitly requested.')
  lines.push('- Prioritize blocking and high severity tasks first.')
  lines.push('- Use selector/locator/HTML context to map generated DOM back to source components.')
  lines.push('- Verify each changed page at the captured viewport size.')
  lines.push('- Mark tasks as implemented only after code and visual verification are complete.')
  lines.push('')

  for (const [url, pagePins] of pinsByPage(openPins)) {
    lines.push(`## ${feedbackPath(url)}`)
    lines.push(`URL: ${url}`)
    lines.push('')
    for (const pin of pagePins.sort((a, b) => a.number - b.number)) {
      const readiness = aiReadinessFor(pin)
      const action = pin.kind === 'inspect' ? findInspectAction(pin) : null
      lines.push(`### Pin ${pin.number} - ${action?.label ?? pin.kind ?? 'comment'}`)
      lines.push(`Priority: ${pin.severity}`)
      lines.push(`Status: ${pin.status ?? 'open'}`)
      lines.push(`Ready for AI: ${readiness.ready ? 'yes' : 'needs detail'}`)
      lines.push(`Viewport: ${pin.viewportType} ${pin.viewportWidth}x${pin.viewportHeight}`)
      if (pin.cssSelector) lines.push(`CSS selector: ${pin.cssSelector}`)
      if (pin.playwrightLocator) lines.push(`Playwright locator: ${pin.playwrightLocator}`)
      if (pin.elementTag) lines.push(`Element: <${pin.elementTag}>`)
      if (pin.elementText) lines.push(`Captured text: ${pin.elementText}`)
      if (pin.editInstruction) lines.push(`Instruction: ${pin.editInstruction}`)
      if (pin.replacementText) lines.push(`Desired result/details: ${pin.replacementText}`)
      if (pin.assetUrl) lines.push(`Replacement asset (public URL): ${pin.assetUrl}`)
      lines.push(`Reviewer note: ${pin.comment || '(no comment provided)'}`)
      lines.push('')
    }
  }

  if (openPins.length === 0) lines.push('_No open tasks._')
  if (skippedPossiblyDone.length) {
    lines.push('')
    lines.push(
      `Note: ${skippedPossiblyDone.length} task(s) were skipped because they appear already implemented on the live site (pins ${skippedPossiblyDone
        .map(pin => `#${pin.number}`)
        .join(', ')}). Verify them instead of re-doing them.`
    )
  }
  return lines.join('\n')
}

export function toAcceptanceMarkdown(session: FeedbackSession): string {
  const lines = ['# Acceptance Checklist', '']
  for (const pin of session.pins.slice().sort((a, b) => a.number - b.number)) {
    if ((pin.status ?? 'open') === 'closed') continue
    const action = pin.kind === 'inspect' ? findInspectAction(pin)?.label ?? 'Inspect/edit' : 'Comment'
    lines.push(
      `- [ ] Pin ${pin.number} (${pin.severity}, ${pin.status ?? 'open'}): ${action} on ${feedbackPath(pin.url)} at ${pin.viewportType} ${pin.viewportWidth}x${pin.viewportHeight}`
    )
  }
  if (lines.length === 2) lines.push('_No open acceptance items._')
  return lines.join('\n')
}

export function toTasksJson(session: FeedbackSession): string {
  const pins = session.pins.slice().sort((a, b) => a.number - b.number)
  return JSON.stringify(
    {
      schemaVersion: 3,
      project: {
        targetUrl: session.url,
        capturedAt: session.updatedAt,
        title: session.meta.title ?? null
      },
      tasks: pins.map(pin => {
        const action = pin.kind === 'inspect' ? findInspectAction(pin) : undefined
        return {
          id: pin.id,
          pin: pin.number,
          status: pin.status ?? 'open',
          severity: pin.severity,
          kind: pin.kind ?? 'comment',
          intent: action?.id ?? null,
          intentLabel: action?.label ?? null,
          readyForAi: aiReadinessFor(pin),
          page: {
            url: pin.url,
            path: feedbackPath(pin.url)
          },
          viewport: {
            type: pin.viewportType,
            width: pin.viewportWidth,
            height: pin.viewportHeight
          },
          target: {
            cssSelector: pin.cssSelector ?? null,
            playwrightLocator: pin.playwrightLocator ?? null,
            elementTag: pin.elementTag ?? null,
            elementText: pin.elementText ?? null,
            elementAttributes: pin.elementAttributes ?? {},
            elementHtml: pin.snapshot?.elementHtml ?? pin.elementHtml ?? null,
            ancestorChain: pin.ancestorChain ?? []
          },
          snapshot: pin.snapshot
            ? {
                status: pin.snapshot.status,
                capturedAt: pin.snapshot.capturedAt ?? null,
                capturedUrl: pin.snapshot.capturedUrl ?? null,
                fullElementHtml: pin.snapshot.elementHtml ?? null,
                elementScreenshotUrl: pin.snapshot.elementScreenshotUrl ?? null,
                pageScreenshotUrl: pin.snapshot.pageScreenshotUrl ?? null
              }
            : null,
          expectedOutcome: {
            editInstruction: pin.editInstruction ?? null,
            replacementText: pin.replacementText ?? null,
            assetUrl: pin.assetUrl ?? null,
            reviewerComment: pin.comment
          },
          verification: {
            state: pin.verificationState ?? 'unverified',
            by: pin.verifiedBy ?? null,
            at: pin.verifiedAt ?? null,
            reason: pin.verificationReason ?? null,
            anchorStatus: pin.anchorStatus ?? null
          },
          discussion: pin.replies ?? [],
          author: {
            name: pin.authorName ?? null,
            email: pin.authorEmail ?? null,
            userId: pin.authorUserId ?? null
          },
          createdAt: pin.createdAt
        }
      })
    },
    null,
    2
  )
}

export function toJson(session: FeedbackSession): string {
  const pins = session.pins.slice().sort((a, b) => a.number - b.number)
  const pages = pinsByPage(pins).map(([url, pagePins]) => ({
    url,
    path: feedbackPath(url),
    pinNumbers: pagePins.map(pin => pin.number).sort((a, b) => a - b),
    tasks: pagePins
      .slice()
      .sort((a, b) => a.number - b.number)
      .map(pin => ({
        pin: pin.number,
        id: pin.id,
        kind: pin.kind ?? 'comment',
        status: pin.status ?? 'open',
        viewport: {
          type: pin.viewportType,
          width: pin.viewportWidth,
          height: pin.viewportHeight
        },
        target: {
          cssSelector: pin.cssSelector ?? null,
          playwrightLocator: pin.playwrightLocator ?? null,
          elementTag: pin.elementTag ?? null,
          elementText: pin.elementText ?? null,
          elementAttributes: pin.elementAttributes ?? {},
          ancestorChain: pin.ancestorChain ?? [],
          documentCoordinates:
            typeof pin.documentY === 'number'
              ? {
                  x: Math.round(pin.documentX ?? 0),
                  y: Math.round(pin.documentY)
                }
              : null
        },
        requestedChange: {
          comment: pin.comment,
          replacementText: pin.replacementText ?? null,
          editInstruction: pin.editInstruction ?? null
        },
        replies: pin.replies ?? [],
        capturedAt: pin.createdAt
      }))
  }))

  return JSON.stringify(
    {
      schemaVersion: 1,
      targetUrl: session.url,
      capturedAt: session.updatedAt,
      summary: {
        pinCount: pins.length,
        openCount: pins.filter(pin => (pin.status ?? 'open') !== 'closed').length,
        closedCount: pins.filter(pin => pin.status === 'closed').length,
        pageCount: pages.length,
        inspectEditCount: pins.filter(pin => pin.kind === 'inspect').length,
        commentCount: pins.filter(pin => pin.kind !== 'inspect').length
      },
      pages,
      rawSession: session
    },
    null,
    2
  )
}
