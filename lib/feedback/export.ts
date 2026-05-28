import { FeedbackSession, Pin } from '@/types/feedback'
import { feedbackPath } from '@/lib/feedback/url'

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
    lines.push('- **Requested action:** Inspect this element and apply the requested edit.')
    if (pin.elementText) lines.push(`- **Current text:** ${pin.elementText}`)
    if (pin.replacementText?.trim()) {
      lines.push(`- **Details / desired result:** ${pin.replacementText.trim()}`)
    }
    if (pin.editInstruction?.trim()) {
      lines.push(`- **Edit instruction:** ${pin.editInstruction.trim()}`)
    }
  } else if (pin.elementText) {
    lines.push(`- **Captured text:** ${pin.elementText}`)
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
  if (pin.elementHtml) {
    lines.push('- **Element HTML:**')
    lines.push('```html')
    lines.push(pin.elementHtml)
    lines.push('```')
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

  lines.push('## Tasks By Page')
  lines.push('')
  for (const [url, pagePins] of pinsByPage(session.pins)) {
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
      `- [ ] Pin ${pin.number}: ${action} on ${feedbackPath(pin.url)} (${pin.cssSelector || 'coordinate fallback'})`
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
