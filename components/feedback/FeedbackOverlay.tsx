'use client'

import { RefObject, useEffect, useMemo, useRef, useState, MouseEvent, WheelEvent } from 'react'
import { useFeedback } from '@/contexts/FeedbackContext'
import { useWebsiteViewer, View } from '@/contexts/WebsiteViewerContext'
import { inspectElementAtPoint } from '@/lib/feedback/selector'
import type { SelectorResult } from '@/lib/feedback/selector'
import { canonicalFeedbackUrl, sameFeedbackUrl } from '@/lib/feedback/url'
import { findInspectAction } from '@/lib/feedback/inspectActions'
import { classifyPinAnchor } from '@/lib/feedback/verification'
import { cn } from '@/lib/utils'
import PinMarker from './PinMarker'

interface Props {
  view: View
  iframeRef: RefObject<HTMLIFrameElement>
  viewportWidth: number
  viewportHeight: number
  showAnnotations?: boolean
}

export default function FeedbackOverlay({
  view,
  iframeRef,
  viewportWidth,
  viewportHeight,
  showAnnotations = true
}: Props) {
  const { feedbackMode, pins, addPin, updatePin, activeTool, canEdit, selectedPinId, setSelectedPinId } = useFeedback()
  const { currentSite } = useWebsiteViewer()
  const [autoOpenPinId, setAutoOpenPinId] = useState<string | null>(null)
  const [iframeScroll, setIframeScroll] = useState({ x: 0, y: 0 })
  const [hoverTarget, setHoverTarget] = useState<{
    x: number
    y: number
    width: number
    height: number
    label: string
  } | null>(null)
  const [pinAnchors, setPinAnchors] = useState<
    Record<string, { x: number; y: number; left: number; top: number; width: number; height: number }>
  >({})
  const lastHoverReadRef = useRef(0)
  const anchorsKeyRef = useRef('')
  const anchorWritesRef = useRef<Record<string, string>>({})
  const pinsForView = useMemo(
    () => pins.filter(
      p =>
        p.viewportId === view.id &&
        sameFeedbackUrl(p.url, view.url) &&
        ((p.status ?? 'open') !== 'closed' || p.id === selectedPinId)
    ),
    [pins, selectedPinId, view.id, view.url]
  )
  const hasDocumentPins = pinsForView.some(
    p => typeof p.documentX === 'number' && typeof p.documentY === 'number'
  )
  const hasSelectorPins = pinsForView.some(p => Boolean(p.cssSelector))

  useEffect(() => {
    if (!feedbackMode && !hasDocumentPins && !hasSelectorPins) return

    const readFrameState = () => {
      const iframe = iframeRef.current
      if (!iframe) return
      try {
        const win = iframe.contentWindow
        const doc = iframe.contentDocument
        if (!win || !doc) return
        const scrollX = win.scrollX || doc.documentElement.scrollLeft || doc.body?.scrollLeft || 0
        const scrollY = win.scrollY || doc.documentElement.scrollTop || doc.body?.scrollTop || 0
        setIframeScroll({
          x: scrollX,
          y: scrollY
        })

        const nextAnchors: Record<string, { x: number; y: number; left: number; top: number; width: number; height: number }> = {}
        for (const pin of pinsForView) {
          if (!pin.cssSelector) continue
          let target: Element | null = null
          try {
            target = doc.querySelector(pin.cssSelector)
          } catch {
            target = null
          }
          if (!target) continue

          const rect = target.getBoundingClientRect()
          if (rect.width <= 0 || rect.height <= 0) continue

          const docLeft = scrollX + rect.left
          const docTop = scrollY + rect.top
          const offsetX = typeof pin.documentX === 'number'
            ? Math.min(Math.max(pin.documentX - docLeft, 0), rect.width)
            : rect.width / 2
          const offsetY = typeof pin.documentY === 'number'
            ? Math.min(Math.max(pin.documentY - docTop, 0), rect.height)
            : rect.height / 2

          nextAnchors[pin.id] = {
            x: ((rect.left + offsetX) / viewportWidth) * 100,
            y: ((rect.top + offsetY) / viewportHeight) * 100,
            left: (rect.left / viewportWidth) * 100,
            top: (rect.top / viewportHeight) * 100,
            width: (rect.width / viewportWidth) * 100,
            height: (rect.height / viewportHeight) * 100
          }
        }

        const nextKey = JSON.stringify(nextAnchors)
        if (nextKey !== anchorsKeyRef.current) {
          anchorsKeyRef.current = nextKey
          setPinAnchors(nextAnchors)
        }

        // Staleness heuristic: only on a fully loaded page so a half-rendered
        // DOM can't flag pins as missing. Skip when preview is active — the DOM
        // has been modified by our own injection and would produce false positives.
        const previewActive = !!doc.querySelector('[data-bugsmash-preview]')
        if (canEdit && doc.readyState === 'complete' && !previewActive) {
          for (const pin of pinsForView) {
            if ((pin.status ?? 'open') !== 'open') continue
            const status = classifyPinAnchor(pin, doc)
            if (!status) continue
            if (status === pin.anchorStatus) continue
            if (anchorWritesRef.current[pin.id] === status) continue
            anchorWritesRef.current[pin.id] = status
            updatePin(pin.id, {
              anchorStatus: status,
              anchorCheckedAt: new Date().toISOString()
            })
          }
        }
      } catch {
        // Cross-origin frames cannot expose scroll state; pins fall back to viewport coords.
      }
    }

    let frame = 0
    const scheduleRead = () => {
      if (frame) return
      frame = window.requestAnimationFrame(() => {
        frame = 0
        readFrameState()
      })
    }

    readFrameState()
    const cleanups: Array<() => void> = []
    try {
      const win = iframeRef.current?.contentWindow
      const doc = iframeRef.current?.contentDocument
      if (win) {
        win.addEventListener('scroll', scheduleRead, { passive: true })
        win.addEventListener('resize', scheduleRead)
        cleanups.push(() => {
          win.removeEventListener('scroll', scheduleRead)
          win.removeEventListener('resize', scheduleRead)
        })
      }
      // Re-anchor the instant the page reflows (accordion expand/collapse,
      // lazy content, font swaps) instead of waiting for the poll. The page
      // height changes frame-by-frame while an accordion animates, so the
      // ResizeObserver keeps markers pinned to their element throughout.
      if (doc && win && 'ResizeObserver' in win) {
        const ResizeObserverCtor = (win as unknown as { ResizeObserver: typeof ResizeObserver }).ResizeObserver
        const ro = new ResizeObserverCtor(scheduleRead)
        if (doc.documentElement) ro.observe(doc.documentElement)
        if (doc.body) ro.observe(doc.body)
        cleanups.push(() => ro.disconnect())
      }
      // Catch the DOM/attribute change that triggers the reflow (the toggled
      // class, data-state, hidden, style, or inserted content).
      if (doc?.body && win && 'MutationObserver' in win) {
        const MutationObserverCtor = (win as unknown as { MutationObserver: typeof MutationObserver }).MutationObserver
        const mo = new MutationObserverCtor(scheduleRead)
        mo.observe(doc.body, {
          subtree: true,
          childList: true,
          attributes: true,
          attributeFilter: ['class', 'style', 'hidden', 'aria-expanded', 'data-state', 'open']
        })
        cleanups.push(() => mo.disconnect())
      }
    } catch {
      // Cross-origin frames cannot expose scroll/observers; polling handles what it can.
    }

    // Safety net for anything the observers miss (and cross-origin frames).
    const interval = window.setInterval(readFrameState, 500)
    return () => {
      if (frame) window.cancelAnimationFrame(frame)
      window.clearInterval(interval)
      cleanups.forEach(fn => fn())
    }
  }, [
    canEdit,
    feedbackMode,
    hasDocumentPins,
    hasSelectorPins,
    iframeRef,
    pinsForView,
    updatePin,
    viewportHeight,
    viewportWidth
  ])

  useEffect(() => {
    if (!feedbackMode || activeTool !== 'inspect') {
      setHoverTarget(null)
    }
  }, [activeTool, feedbackMode])

  const handleClick = (e: MouseEvent<HTMLDivElement>) => {
    if (!canEdit || !feedbackMode || !iframeRef.current) return
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) return
    const xPct = ((e.clientX - rect.left) / rect.width) * 100
    const yPct = ((e.clientY - rect.top) / rect.height) * 100

    const inspection = inspectElementAtPoint(iframeRef.current, xPct, yPct)
    const actualPageUrl = (() => {
      try {
        const win = iframeRef.current?.contentWindow
        const proxyWindow = win as (Window & { __BUGSMASH_TARGET_URL__?: string }) | null
        const targetUrl = proxyWindow?.__BUGSMASH_TARGET_URL__
        if (targetUrl) return canonicalFeedbackUrl(targetUrl, view.url || currentSite || '')

        const href = win?.location.href
        if (href?.includes('/api/proxy')) {
          const parsed = new URL(href)
          const target = parsed.searchParams.get('url')
          if (target) return canonicalFeedbackUrl(target, view.url || currentSite || '')
        }
        if (href) return canonicalFeedbackUrl(href, view.url || currentSite || '')
      } catch {
        // Direct cross-origin frames fall back to the canvas URL.
      }
      return canonicalFeedbackUrl(view.url || currentSite || '')
    })()

    const created = addPin({
      kind: activeTool,
      url: actualPageUrl,
      viewportId: view.id,
      viewportType: view.type,
      viewportWidth,
      viewportHeight,
      x: xPct,
      y: yPct,
      documentX: inspection.documentX,
      documentY: inspection.documentY,
      scrollX: inspection.scrollX,
      scrollY: inspection.scrollY,
      cssSelector: inspection.cssSelector,
      playwrightLocator: inspection.playwrightLocator,
      elementText: inspection.elementText,
      elementTag: inspection.elementTag,
      elementAttributes: inspection.elementAttributes,
      elementHtml: inspection.elementHtml,
      ancestorChain: inspection.ancestorChain,
      replacementText: undefined,
      editInstruction: '',
      severity: 'medium',
      comment: ''
    })
    if (!created.id) return
    setAutoOpenPinId(created.id)
  }

  const labelFor = (inspection: SelectorResult) => {
    const tag = inspection.elementTag ? `<${inspection.elementTag}>` : 'Element'
    const id = inspection.elementAttributes?.id ? `#${inspection.elementAttributes.id}` : ''
    const testId = inspection.elementAttributes?.['data-testid']
      ? `[data-testid="${inspection.elementAttributes['data-testid']}"]`
      : ''
    return `${tag}${id}${testId}`
  }

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!canEdit || !feedbackMode || activeTool !== 'inspect' || !iframeRef.current) {
      if (hoverTarget) setHoverTarget(null)
      return
    }

    const now = Date.now()
    if (now - lastHoverReadRef.current < 80) return
    lastHoverReadRef.current = now

    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) return
    const xPct = ((e.clientX - rect.left) / rect.width) * 100
    const yPct = ((e.clientY - rect.top) / rect.height) * 100
    const inspection = inspectElementAtPoint(iframeRef.current, xPct, yPct)

    if (!inspection.sameOrigin || !inspection.elementRect) {
      setHoverTarget(null)
      return
    }

    setHoverTarget({
      x: (inspection.elementRect.x / viewportWidth) * 100,
      y: (inspection.elementRect.y / viewportHeight) * 100,
      width: (inspection.elementRect.width / viewportWidth) * 100,
      height: (inspection.elementRect.height / viewportHeight) * 100,
      label: labelFor(inspection)
    })
  }

  const getPinPosition = (pin: typeof pinsForView[number]) => {
    const anchor = pinAnchors[pin.id]
    if (anchor) return { x: anchor.x, y: anchor.y }

    if (
      typeof pin.documentX === 'number' &&
      typeof pin.documentY === 'number'
    ) {
      return {
        x: ((pin.documentX - iframeScroll.x) / viewportWidth) * 100,
        y: ((pin.documentY - iframeScroll.y) / viewportHeight) * 100
      }
    }

    return { x: pin.x, y: pin.y }
  }

  const handleWheel = (e: WheelEvent<HTMLDivElement>) => {
    if (!canEdit || !feedbackMode || !iframeRef.current) return

    try {
      const win = iframeRef.current.contentWindow
      if (!win) return

      e.preventDefault()
      win.scrollBy({
        left: e.deltaX,
        top: e.deltaY,
        behavior: 'auto'
      })

      setIframeScroll({
        x: win.scrollX,
        y: win.scrollY
      })
    } catch {
      // Direct cross-origin iframes cannot be programmatically scrolled here.
      // Those pins fall back to viewport coordinates.
    }
  }

  const isRemovalPin = (pin: typeof pinsForView[number]) => {
    const action = findInspectAction(pin)
    const instruction = pin.editInstruction?.toLowerCase() ?? ''
    return (
      action?.id === 'remove-image' ||
      action?.id === 'remove-element' ||
      instruction.includes('remove this') ||
      instruction.includes('remove the') ||
      instruction.includes('delete this') ||
      instruction.includes('hide this')
    )
  }

  const annotationMetaFor = (pin: typeof pinsForView[number]) => {
    const action = pin.kind === 'inspect' ? findInspectAction(pin) : undefined
    const label = action?.label ?? (pin.kind === 'inspect' ? 'Inspect' : 'Comment')
    const removal = isRemovalPin(pin)
    const greenAction =
      action?.id === 'replace-image' ||
      action?.id === 'replace-text' ||
      action?.id === 'rewrite-copy' ||
      action?.id === 'update-alt'
    const linkAction = action?.id === 'update-link'
    const amberAction = action?.id === 'style-layout' || action?.id === 'layout-issue'

    return {
      label,
      removal,
      outlineClass: removal
        ? 'border-red-500 bg-red-500/5 shadow-[0_0_0_1px_rgba(239,68,68,0.22)]'
        : greenAction
          ? 'border-emerald-500 bg-emerald-500/5 shadow-[0_0_0_1px_rgba(16,185,129,0.18)]'
          : linkAction
            ? 'border-blue-500 bg-blue-500/5 shadow-[0_0_0_1px_rgba(59,130,246,0.18)]'
            : amberAction
              ? 'border-amber-500 bg-amber-500/5 shadow-[0_0_0_1px_rgba(245,158,11,0.18)]'
              : 'border-zinc-500 bg-zinc-500/5 shadow-[0_0_0_1px_rgba(113,113,122,0.18)]',
      badgeClass: removal
        ? 'border-red-600 bg-red-600 text-white'
        : greenAction
          ? 'border-emerald-600 bg-emerald-600 text-white'
          : linkAction
            ? 'border-blue-600 bg-blue-600 text-white'
            : amberAction
              ? 'border-amber-600 bg-amber-600 text-white'
              : 'border-zinc-700 bg-zinc-700 text-white'
    }
  }

  return (
    <div
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setHoverTarget(null)}
      onWheel={handleWheel}
      className={`absolute inset-0 z-20 ${
        canEdit && feedbackMode ? 'cursor-crosshair pointer-events-auto' : 'pointer-events-none'
      }`}
      data-feedback-overlay
    >
      {canEdit && feedbackMode && (
        <div className='absolute inset-0 ring-2 ring-inset ring-accent/40 pointer-events-none animate-pulse' />
      )}
      {canEdit && feedbackMode && activeTool === 'inspect' && hoverTarget && (
        <div
          className='absolute z-20 pointer-events-none rounded-sm border border-foreground bg-foreground/5 shadow-[0_0_0_9999px_rgba(0,0,0,0.03)]'
          style={{
            left: `${hoverTarget.x}%`,
            top: `${hoverTarget.y}%`,
            width: `${Math.max(hoverTarget.width, 0.4)}%`,
            height: `${Math.max(hoverTarget.height, 0.4)}%`
          }}
        >
          <div className='absolute left-0 top-0 -translate-y-full rounded-t-sm bg-foreground px-1.5 py-0.5 text-[10px] font-mono text-background max-w-[220px] truncate'>
            {hoverTarget.label}
          </div>
        </div>
      )}
      {pinsForView.map(pin => {
        const anchor = pinAnchors[pin.id]
        if (!anchor || (!showAnnotations && selectedPinId !== pin.id)) return null
        const meta = annotationMetaFor(pin)
        const selected = selectedPinId === pin.id
        return (
          <div
            key={`anchor-${pin.id}`}
            className={cn(
              'pointer-events-none absolute z-20 overflow-visible rounded-sm border bg-background/0',
              meta.outlineClass,
              selected && 'border-2'
            )}
            style={{
              left: `${anchor.left}%`,
              top: `${anchor.top}%`,
              width: `${Math.max(anchor.width, 0.4)}%`,
              height: `${Math.max(anchor.height, 0.4)}%`
            }}
          >
            <div className='absolute inset-0 overflow-hidden rounded-[inherit]'>
              {meta.removal && (
                <svg
                  className='absolute inset-0 h-full w-full'
                  viewBox='0 0 100 100'
                  preserveAspectRatio='none'
                  aria-hidden='true'
                >
                  <line x1='0' y1='0' x2='100' y2='100' stroke='rgb(239 68 68)' strokeWidth='1.5' vectorEffect='non-scaling-stroke' />
                  <line x1='100' y1='0' x2='0' y2='100' stroke='rgb(239 68 68)' strokeWidth='1.5' vectorEffect='non-scaling-stroke' />
                </svg>
              )}
            </div>
            {pin.kind === 'inspect' && (
              <button
                type='button'
                onClick={event => {
                  event.stopPropagation()
                  setSelectedPinId(pin.id)
                }}
                className={cn(
                  'pointer-events-auto absolute left-0 top-0 z-10 inline-flex max-w-[200px] -translate-y-[calc(100%+4px)] items-center gap-1 truncate rounded-md border pl-1 pr-2 py-0.5 text-[10px] font-semibold leading-none shadow-sm transition-transform hover:scale-[1.02]',
                  meta.badgeClass
                )}
                title={`Pin ${pin.number}: ${meta.label}`}
              >
                <span className='inline-flex h-4 min-w-4 items-center justify-center rounded-sm bg-black/25 px-1 text-[9px] font-bold tabular-nums'>
                  {pin.number}
                </span>
                <span className='truncate'>{meta.label}</span>
              </button>
            )}
          </div>
        )
      })}
      {pinsForView.filter(p => p.kind !== 'inspect').map(pin => (
        <PinMarker
          key={pin.id}
          pin={pin}
          position={getPinPosition(pin)}
          autoOpen={pin.id === autoOpenPinId}
        />
      ))}
    </div>
  )
}
