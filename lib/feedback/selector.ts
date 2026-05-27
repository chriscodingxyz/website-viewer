export interface SelectorResult {
  cssSelector?: string
  playwrightLocator?: string
  elementText?: string
  elementTag?: string
  elementAttributes?: Record<string, string>
  elementHtml?: string
  ancestorChain?: string[]
  elementRect?: {
    x: number
    y: number
    width: number
    height: number
  }
  documentX?: number
  documentY?: number
  scrollX?: number
  scrollY?: number
  sameOrigin: boolean
}

const TEXT_LIMIT = 120
const HTML_LIMIT = 900
const ROLE_TAGS: Record<string, string> = {
  button: 'button',
  a: 'link',
  input: 'textbox',
  select: 'combobox',
  textarea: 'textbox',
  nav: 'navigation',
  header: 'banner',
  footer: 'contentinfo',
  main: 'main',
  aside: 'complementary',
  img: 'img'
}

const escapeIdent = (raw: string) =>
  raw.replace(/([!"#$%&'()*+,./:;<=>?@[\\\]^`{|}~])/g, '\\$1')

const cssPath = (el: Element): string => {
  const parts: string[] = []
  let cur: Element | null = el
  while (cur && cur.nodeType === 1 && cur !== cur.ownerDocument?.documentElement) {
    let seg = cur.tagName.toLowerCase()
    if (cur.id) {
      seg += `#${escapeIdent(cur.id)}`
      parts.unshift(seg)
      break
    }
    if (cur.classList.length) {
      const cls = Array.from(cur.classList).slice(0, 2).map(escapeIdent).join('.')
      seg += `.${cls}`
    }
    const parent = cur.parentElement
    if (parent) {
      const siblings = Array.from(parent.children).filter(c => c.tagName === cur!.tagName)
      if (siblings.length > 1) {
        seg += `:nth-of-type(${siblings.indexOf(cur) + 1})`
      }
    }
    parts.unshift(seg)
    cur = cur.parentElement
  }
  return parts.join(' > ')
}

const truncText = (raw: string): string => {
  const trimmed = raw.replace(/\s+/g, ' ').trim()
  if (!trimmed) return ''
  return trimmed.length > TEXT_LIMIT ? `${trimmed.slice(0, TEXT_LIMIT)}…` : trimmed
}

const playwrightFor = (el: Element, text: string): string => {
  const tag = el.tagName.toLowerCase()
  const role = el.getAttribute('role') || ROLE_TAGS[tag]
  const ariaLabel = el.getAttribute('aria-label')
  const placeholder = el.getAttribute('placeholder')
  const testid = el.getAttribute('data-testid') || el.getAttribute('data-test-id')
  const id = el.id

  if (testid) return `page.getByTestId('${testid.replace(/'/g, "\\'")}')`
  if (id) return `page.locator('#${escapeIdent(id).replace(/'/g, "\\'")}')`
  if (ariaLabel) return `page.getByLabel('${ariaLabel.replace(/'/g, "\\'")}')`
  if (placeholder) return `page.getByPlaceholder('${placeholder.replace(/'/g, "\\'")}')`
  if (role && text) {
    return `page.getByRole('${role}', { name: '${text.replace(/'/g, "\\'")}' })`
  }
  if (role) return `page.getByRole('${role}')`
  if (text) return `page.getByText('${text.replace(/'/g, "\\'")}')`
  return `page.locator('${cssPath(el).replace(/'/g, "\\'")}')`
}

const interestingAttrs = (el: Element): Record<string, string> => {
  const out: Record<string, string> = {}
  const wanted = ['id', 'role', 'aria-label', 'data-testid', 'data-test-id', 'href', 'name', 'type', 'placeholder']
  for (const attr of wanted) {
    const v = el.getAttribute(attr)
    if (v) out[attr] = v
  }
  return out
}

const compactHtml = (el: Element): string => {
  const raw = el.outerHTML.replace(/\s+/g, ' ').trim()
  return raw.length > HTML_LIMIT ? `${raw.slice(0, HTML_LIMIT)}…` : raw
}

const describeElement = (el: Element): string => {
  let label = el.tagName.toLowerCase()
  if (el.id) label += `#${el.id}`
  if (el.classList.length) {
    label += `.${Array.from(el.classList).slice(0, 3).join('.')}`
  }

  const attrs = ['data-testid', 'data-test-id', 'role', 'aria-label', 'name']
    .map(attr => {
      const value = el.getAttribute(attr)
      return value ? `[${attr}="${value}"]` : null
    })
    .filter(Boolean)
    .join('')

  return `${label}${attrs}`
}

const ancestorChain = (el: Element): string[] => {
  const chain: string[] = []
  let cur: Element | null = el
  while (cur && cur.nodeType === 1 && chain.length < 6) {
    chain.unshift(describeElement(cur))
    cur = cur.parentElement
    if (cur === cur?.ownerDocument?.documentElement) break
  }
  return chain
}

export function inspectElementAtPoint(
  iframe: HTMLIFrameElement,
  xPct: number,
  yPct: number
): SelectorResult {
  let doc: Document | null = null
  try {
    doc = iframe.contentDocument
  } catch {
    return { sameOrigin: false }
  }
  if (!doc) return { sameOrigin: false }

  const w = doc.documentElement.clientWidth || iframe.clientWidth
  const h = doc.documentElement.clientHeight || iframe.clientHeight
  const x = (xPct / 100) * w
  const y = (yPct / 100) * h
  const scrollX = doc.defaultView?.scrollX || doc.documentElement.scrollLeft || doc.body?.scrollLeft || 0
  const scrollY = doc.defaultView?.scrollY || doc.documentElement.scrollTop || doc.body?.scrollTop || 0

  let el: Element | null = null
  try {
    el = doc.elementFromPoint(x, y)
  } catch {
    return { sameOrigin: false }
  }
  if (!el) return { sameOrigin: true }

  const rawText = (el as HTMLElement).innerText ?? el.textContent ?? ''
  const text = truncText(rawText)
  const rect = el.getBoundingClientRect()
  return {
    sameOrigin: true,
    cssSelector: cssPath(el),
    playwrightLocator: playwrightFor(el, text),
    elementText: text,
    elementTag: el.tagName.toLowerCase(),
    elementAttributes: interestingAttrs(el),
    elementHtml: compactHtml(el),
    ancestorChain: ancestorChain(el),
    elementRect: {
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height
    },
    documentX: scrollX + x,
    documentY: scrollY + y,
    scrollX,
    scrollY
  }
}
