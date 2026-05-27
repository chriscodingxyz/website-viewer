import { FeedbackSession, Pin, Severity } from '@/types/feedback'

const severityLabel: Record<Severity, string> = {
  low: 'low',
  medium: 'medium',
  high: 'high'
}

const safeHost = (url: string): string => {
  try {
    return new URL(url).hostname
  } catch {
    return url
  }
}

const pinBlock = (pin: Pin): string => {
  const lines: string[] = []
  const kind = pin.kind === 'inspect' ? 'inspect/edit' : 'comment'
  lines.push(`### Pin ${pin.number} — ${kind} — ${severityLabel[pin.severity]} severity`)
  if (pin.elementTag) {
    const txt = pin.elementText ? ` "${pin.elementText}"` : ''
    lines.push(`- **Element:** \`<${pin.elementTag}>\`${txt}`)
  }
  if (pin.kind === 'inspect') {
    lines.push('- **Requested action:** Inspect this element and apply the requested edit.')
    if (pin.elementText) lines.push(`- **Current text:** ${pin.elementText}`)
    if (pin.replacementText?.trim()) {
      lines.push(`- **Replace text with:** ${pin.replacementText.trim()}`)
    }
    if (pin.editInstruction?.trim()) {
      lines.push(`- **Edit instruction:** ${pin.editInstruction.trim()}`)
    }
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
    `- **Location:** ${pin.x.toFixed(1)}% × ${pin.y.toFixed(1)}% on ${pin.viewportType} (${pin.viewportWidth}×${pin.viewportHeight})`
  )
  if (
    typeof pin.documentX === 'number' &&
    typeof pin.documentY === 'number'
  ) {
    lines.push(`- **Document coordinates:** ${Math.round(pin.documentX)}px × ${Math.round(pin.documentY)}px`)
  }
  const comment = pin.comment.trim() || '_(no comment provided)_'
  lines.push(`- **Comment:**`)
  lines.push(comment.split('\n').map(l => `  ${l}`).join('\n'))
  return lines.join('\n')
}

export function toMarkdown(session: FeedbackSession, pageTitle?: string): string {
  const host = safeHost(session.url)
  const lines: string[] = []
  lines.push(`# UI Feedback — ${host}`)
  lines.push('')
  lines.push(`**Target URL:** ${session.url}`)
  if (pageTitle) lines.push(`**Page title:** ${pageTitle}`)
  lines.push(`**Captured:** ${session.updatedAt}`)
  lines.push(`**Pin count:** ${session.pins.length}`)
  const viewports = Array.from(new Set(session.pins.map(p => p.viewportType)))
  if (viewports.length) lines.push(`**Viewports used:** ${viewports.join(', ')}`)
  lines.push('')

  if (session.pins.length === 0) {
    lines.push('_No pins yet._')
    return lines.join('\n')
  }

  lines.push('## Pins')
  lines.push('')
  for (const pin of session.pins) {
    lines.push(pinBlock(pin))
    lines.push('')
  }

  lines.push('## Instructions for the dev / LLM')
  lines.push('')
  lines.push(
    'Apply the changes above to the codebase. For comment pins, use the comment as review context. For inspect/edit pins, locate the element using the CSS selector, Playwright locator, ancestor chain, attributes, or HTML snippet, then apply the replacement text and edit instruction. Match existing styling conventions. Group related pins into a single PR when reasonable.'
  )
  return lines.join('\n')
}

export function toJson(session: FeedbackSession): string {
  return JSON.stringify(session, null, 2)
}
