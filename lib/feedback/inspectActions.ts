import type { Pin } from '@/types/feedback'

export type InspectActionId =
  | 'comment'
  | 'replace-text'
  | 'rewrite-copy'
  | 'replace-image'
  | 'remove-image'
  | 'update-alt'
  | 'remove-element'
  | 'layout-issue'
  | 'style-layout'
  | 'update-link'

export type InspectAction = {
  id: InspectActionId
  label: string
  instruction: string
  detailPlaceholder: string
  notePlaceholder: string
}

const TEXT_TAGS = new Set([
  'a',
  'button',
  'figcaption',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'label',
  'li',
  'p',
  'span',
  'strong',
  'td',
  'th'
])

const IMAGE_TAGS = new Set(['img', 'picture', 'source'])
const MEDIA_TAGS = new Set(['img', 'picture', 'source', 'video'])
const CONTAINER_TAGS = new Set([
  'article',
  'aside',
  'div',
  'figure',
  'footer',
  'header',
  'main',
  'nav',
  'section',
  'table',
  'tbody',
  'thead',
  'tr',
  'ul',
  'ol'
])

function elementName(pin: Pick<Pin, 'elementTag'>) {
  return pin.elementTag ? `<${pin.elementTag}>` : 'selected element'
}

function action(
  id: InspectActionId,
  label: string,
  instruction: string,
  detailPlaceholder: string,
  notePlaceholder = 'Add any context, asset reference, or acceptance detail'
): InspectAction {
  return { id, label, instruction, detailPlaceholder, notePlaceholder }
}

export function getInspectActions(pin: Pick<Pin, 'elementTag' | 'elementText'>): InspectAction[] {
  const tag = pin.elementTag?.toLowerCase()
  const isTextElement = Boolean(tag && TEXT_TAGS.has(tag))
  const actions: InspectAction[] = []

  if (tag && IMAGE_TAGS.has(tag)) {
    actions.push(
      action(
        'replace-image',
        'Replace image',
        `Replace this ${elementName(pin)} with the image/reference provided in the details.`,
        'Paste the new image URL, asset name, or describe the replacement image'
      ),
      action(
        'remove-image',
        'Remove image',
        `Remove this ${elementName(pin)} from the page.`,
        'Optional: explain whether surrounding spacing/layout should collapse'
      ),
      action(
        'update-alt',
        'Update alt text',
        `Update the alt text for this ${elementName(pin)}.`,
        'Write the new alt text'
      )
    )
  }

  if (isTextElement) {
    actions.push(
      action(
        'replace-text',
        'Replace text',
        'Replace the selected text with the text provided in the details.',
        'Write the replacement text'
      ),
      action(
        'rewrite-copy',
        'Rewrite copy',
        'Rewrite this copy using the direction provided in the details.',
        'Describe the desired copy change or paste draft copy'
      )
    )
  }

  if (tag === 'a' || tag === 'button') {
    actions.push(
      action(
        'update-link',
        'Update link',
        `Update the destination or behavior for this ${elementName(pin)}.`,
        'Paste the new URL or describe the target behavior'
      )
    )
  }

  if (!tag || CONTAINER_TAGS.has(tag)) {
    actions.push(
      action(
        'layout-issue',
        'Layout issue',
        `Fix the layout issue around this ${elementName(pin)}.`,
        'Describe the overflow, spacing, alignment, crop, z-index, or responsive issue',
        'Add viewport/page context and the expected visual result'
      )
    )
  }

  actions.push(
    action(
      'remove-element',
      MEDIA_TAGS.has(tag ?? '') ? 'Remove element' : 'Remove',
      `Remove this ${elementName(pin)} from the page.`,
      'Optional: explain how the surrounding layout should close up'
    ),
    action(
      'style-layout',
      'Style/layout',
      `Adjust the styling or layout of this ${elementName(pin)}.`,
      'Describe the visual/layout change'
    )
  )

  actions.unshift(
    action(
      'comment',
      'Comment',
      'Leave a comment or open a discussion on this element.',
      '',
      'Write your comment or question'
    )
  )

  const seen = new Set<InspectActionId>()
  return actions.filter(item => {
    if (seen.has(item.id)) return false
    seen.add(item.id)
    return true
  })
}

export function inferInspectAction(pin: Pick<Pin, 'editInstruction' | 'elementTag' | 'elementText'>) {
  const instruction = pin.editInstruction?.toLowerCase() ?? ''
  return (
    getInspectActions(pin).find(item => instruction.includes(item.instruction.toLowerCase())) ??
    getInspectActions(pin)[0]
  )
}

export function findInspectAction(pin: Pick<Pin, 'editInstruction' | 'elementTag' | 'elementText'>) {
  return getInspectActions(pin).find(item => item.instruction === pin.editInstruction)
}
