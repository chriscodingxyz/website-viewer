import type { AnchorStatus, Pin } from '@/types/feedback'
import { findInspectAction, inferInspectAction } from '@/lib/feedback/inspectActions'

const normalize = (value: string) => value.replace(/\s+/g, ' ').trim().toLowerCase()

const actionFor = (pin: Pin) => findInspectAction(pin) ?? inferInspectAction(pin)

/**
 * Compare a pin's selector against the live document. Returns undefined when
 * the pin has no selector or the document cannot be queried (cross-origin).
 */
export function classifyPinAnchor(pin: Pin, doc: Document): AnchorStatus | undefined {
  if (!pin.cssSelector) return undefined

  let element: Element | null = null
  try {
    element = doc.querySelector(pin.cssSelector)
  } catch {
    return undefined
  }
  if (!element) return 'missing'

  const action = actionFor(pin)
  const replacement = pin.replacementText?.trim()

  if (action?.id === 'replace-text' || action?.id === 'rewrite-copy') {
    if (replacement) {
      const live = normalize(element.textContent ?? '')
      if (live && live === normalize(replacement)) return 'matches-target'
    }
  } else if (action?.id === 'update-alt') {
    if (replacement && normalize(element.getAttribute('alt') ?? '') === normalize(replacement)) {
      return 'matches-target'
    }
  } else if (action?.id === 'update-link') {
    if (replacement) {
      const href = element.getAttribute('href') ?? ''
      if (href && (href === replacement || normalize(href) === normalize(replacement))) {
        return 'matches-target'
      }
    }
  } else if (action?.id === 'replace-image') {
    const target = pin.assetUrl?.trim()
    if (target) {
      const src = element.getAttribute('src') ?? ''
      if (src && (src === target || src.endsWith(target.split('/').pop() ?? ''))) {
        return 'matches-target'
      }
    }
  }

  return 'found'
}

const REMOVAL_ACTIONS = new Set(['remove-element', 'remove-image'])

/**
 * Heuristic "possibly implemented" signal, derived at render time.
 * A human "Still open" dismissal (verificationState) always wins.
 */
export function isPossiblyDone(pin: Pin): boolean {
  if ((pin.status ?? 'open') !== 'open') return false
  if (pin.verificationState === 'still-open') return false
  if (
    pin.verificationState === 'possibly-done' ||
    pin.verificationState === 'confirmed-done'
  ) {
    return true
  }

  const action = actionFor(pin)
  if (pin.anchorStatus === 'missing' && action && REMOVAL_ACTIONS.has(action.id)) {
    return true
  }
  return pin.anchorStatus === 'matches-target'
}

/** Anchor lost but the intent was not a removal: likely moved or already rebuilt. */
export function isAnchorLost(pin: Pin): boolean {
  if ((pin.status ?? 'open') !== 'open') return false
  if (pin.anchorStatus !== 'missing') return false
  return !isPossiblyDone(pin)
}

export function possiblyDoneReason(pin: Pin): string {
  if (pin.verificationState === 'confirmed-done') {
    return pin.verificationReason?.trim() || 'Confirmed done.'
  }
  if (pin.verificationState === 'possibly-done' && pin.verificationReason?.trim()) {
    return pin.verificationReason.trim()
  }
  const action = actionFor(pin)
  if (pin.anchorStatus === 'missing' && action && REMOVAL_ACTIONS.has(action.id)) {
    return 'Element no longer found on the live page; removal was requested.'
  }
  if (pin.anchorStatus === 'matches-target') {
    return 'Live element already matches the requested change.'
  }
  return 'Flagged as possibly implemented.'
}
