'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useFeedback } from '@/contexts/FeedbackContext'
import type { View, ViewType } from '@/contexts/WebsiteViewerContext'
import type { Pin } from '@/types/feedback'
import FeedbackOverlay from '@/components/feedback/FeedbackOverlay'
import { iframeDetectionService } from '@/services/IframeDetectionService'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Toggle } from '@/components/ui/toggle'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'
import {
  ArrowClockwise,
  ArrowsOut,
  ArrowSquareOut,
  Cursor,
  DeviceMobile,
  DeviceTablet,
  Eye,
  SelectionPlus,
  Monitor,
  Shield,
  ShieldSlash,
  Target,
  Warning
} from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { canonicalFeedbackUrl, feedbackPath, sameFeedbackUrl } from '@/lib/feedback/url'
import { findInspectAction } from '@/lib/feedback/inspectActions'

export type CanvasViewport = 'desktop' | 'tablet' | 'mobile' | 'fullscreen'

const PRESETS: Record<
  Exclude<CanvasViewport, 'fullscreen'>,
  { id: number; type: ViewType; width: number; height: number }
> = {
  desktop: { id: 1, type: 'desktop', width: 1440, height: 900 },
  tablet: { id: 2, type: 'tablet', width: 768, height: 1024 },
  mobile: { id: 3, type: 'mobile', width: 375, height: 812 }
}

const VIEWPORT_OPTIONS: { id: CanvasViewport; label: string; icon: typeof Monitor }[] = [
  { id: 'desktop', label: 'Desktop', icon: Monitor },
  { id: 'tablet', label: 'Tablet', icon: DeviceTablet },
  { id: 'mobile', label: 'Mobile', icon: DeviceMobile },
  { id: 'fullscreen', label: 'Fullscreen', icon: ArrowsOut }
]

type FrameStatus = 'loading' | 'loaded' | 'blocked' | 'error'

interface Props {
  websiteUrl: string
  onPageUrlChange?: (url: string) => void
  jumpToPin?: { pin: Pin; requestId: number } | null
  onJumpHandled?: () => void
  pendingNavigation?: { url: string; requestId: number } | null
  onNavigationHandled?: () => void
}

export default function ProjectCanvas({
  websiteUrl,
  onPageUrlChange,
  jumpToPin,
  onJumpHandled,
  pendingNavigation,
  onNavigationHandled
}: Props) {
  const [viewport, setViewport] = useState<CanvasViewport>('desktop')
  // Default to proxy so links inside the iframe stay rewritten and navigation works
  // for sites that block embedding or use _top links.
  const [useProxy, setUseProxy] = useState<boolean>(true)
  const [frameStatus, setFrameStatus] = useState<FrameStatus>('loading')
  const [refreshCount, setRefreshCount] = useState(0)
  const [showAnnotations, setShowAnnotations] = useState(true)
  const [previewMode, setPreviewMode] = useState(false)
  const [targetPageUrl, setTargetPageUrl] = useState<string>(() =>
    canonicalFeedbackUrl(websiteUrl)
  )
  const [currentPageUrl, setCurrentPageUrl] = useState<string>(() =>
    canonicalFeedbackUrl(websiteUrl)
  )
  const pendingScrollRef = useRef<Pin | null>(null)
  const proxyAutoTriedRef = useRef(false)
  const detectionRanRef = useRef<string | null>(null)

  const { feedbackMode, setFeedbackMode, activeTool, setActiveTool, canEdit, pins } = useFeedback()
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const detectionContainerRef = useRef<HTMLDivElement>(null)

  const preset = viewport === 'fullscreen' ? PRESETS.desktop : PRESETS[viewport]
  const isFullscreen = viewport === 'fullscreen'

  const pinsOnThisPage = pins.filter(
    p => sameFeedbackUrl(p.url, currentPageUrl) && p.viewportId === preset.id
  )

  const previewPayload = useMemo(() => {
    return pins
      .filter(p => sameFeedbackUrl(p.url, currentPageUrl) && p.kind === 'inspect' && p.cssSelector)
      .map(p => ({
        cssSelector: p.cssSelector,
        action: findInspectAction(p)?.id,
        replacementText: p.replacementText
      }))
      .filter(p => p.action)
  }, [pins, currentPageUrl])

  const sendPreview = useCallback(() => {
    const win = iframeRef.current?.contentWindow
    if (!win) return
    win.postMessage(
      { source: 'bugsmash', type: 'apply-preview', pins: previewPayload, showDiff: true },
      '*'
    )
  }, [previewPayload])

  const clearPreview = useCallback(() => {
    const win = iframeRef.current?.contentWindow
    if (!win) return
    win.postMessage({ source: 'bugsmash', type: 'clear-preview' }, '*')
  }, [])

  useEffect(() => {
    if (!previewMode) {
      clearPreview()
      return
    }
    if (frameStatus !== 'loaded') return
    sendPreview()
  }, [previewMode, frameStatus, sendPreview, clearPreview])

  const togglePreview = () => {
    setPreviewMode(value => {
      const next = !value
      if (next) {
        if (!useProxy) {
          setUseProxy(true)
          setRefreshCount(count => count + 1)
        }
        setFeedbackMode(false)
      }
      return next
    })
  }

  useEffect(() => {
    if (feedbackMode && previewMode) setPreviewMode(false)
  }, [feedbackMode, previewMode])

  const pathHint = feedbackPath(currentPageUrl)

  const canvasAreaRef = useRef<HTMLDivElement>(null)
  const [canvasWidth, setCanvasWidth] = useState(0)

  useEffect(() => {
    if (!canvasAreaRef.current) return
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        setCanvasWidth(entry.contentRect.width)
      }
    })
    observer.observe(canvasAreaRef.current)
    return () => observer.disconnect()
  }, [])

  const horizontalPadding = 16
  const scale = isFullscreen
    ? 1
    : Math.min(1, Math.max(0.3, (canvasWidth - horizontalPadding) / preset.width || 1))

  const view: View = useMemo(
    () => ({
      id: preset.id,
      url: currentPageUrl,
      type: preset.type,
      iframeStatus: frameStatus === 'loaded' ? 'loaded' : 'loading',
      useProxy
    }),
    [preset.id, preset.type, currentPageUrl, frameStatus, useProxy]
  )

  const iframeSrc = useProxy
    ? `/api/proxy?url=${encodeURIComponent(targetPageUrl)}`
    : targetPageUrl

  const iframeKey = `${targetPageUrl}-${useProxy ? 'proxy' : 'direct'}-${refreshCount}`

  useEffect(() => {
    const handleProxyMessage = (event: MessageEvent) => {
      const data = event.data
      if (
        !data ||
        typeof data !== 'object' ||
        data.source !== 'bugsmash-proxy' ||
        data.type !== 'url-change' ||
        typeof data.url !== 'string'
      ) {
        return
      }

      const nextUrl = canonicalFeedbackUrl(data.url, websiteUrl)
      setCurrentPageUrl(nextUrl)
      setTargetPageUrl(prev =>
        sameFeedbackUrl(prev, nextUrl) ? prev : nextUrl
      )
    }

    window.addEventListener('message', handleProxyMessage)
    return () => window.removeEventListener('message', handleProxyMessage)
  }, [websiteUrl])

  useEffect(() => {
    setFrameStatus('loading')
    setCurrentPageUrl(canonicalFeedbackUrl(targetPageUrl, websiteUrl))
  }, [iframeKey, targetPageUrl, websiteUrl])

  // Reset target URL if project changes.
  useEffect(() => {
    const canonicalProjectUrl = canonicalFeedbackUrl(websiteUrl)
    setTargetPageUrl(canonicalProjectUrl)
    setCurrentPageUrl(canonicalProjectUrl)
  }, [websiteUrl])

  const scrollToPin = useCallback((pin: Pin) => {
    const iframe = iframeRef.current
    if (!iframe) return false
    try {
      const doc = iframe.contentDocument
      const win = iframe.contentWindow
      if (!doc || !win) return false

      let target: Element | null = null
      if (pin.cssSelector) {
        try {
          target = doc.querySelector(pin.cssSelector)
        } catch {
          target = null
        }
      }
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' })
        return true
      }
      if (typeof pin.documentY === 'number') {
        win.scrollTo({
          left: pin.documentX ?? 0,
          top: Math.max(0, pin.documentY - 200),
          behavior: 'smooth'
        })
        return true
      }
    } catch {
      // cross-origin
    }
    return false
  }, [])

  const scrollToPinWithRetry = useCallback((pin: Pin, attempt = 0) => {
    const didScroll = scrollToPin(pin)
    if (didScroll || attempt >= 6) return

    window.setTimeout(() => {
      scrollToPinWithRetry(pin, attempt + 1)
    }, attempt === 0 ? 120 : 250)
  }, [scrollToPin])

  // Handle jump-to-pin requests from the comment panel.
  useEffect(() => {
    if (!jumpToPin) return

    const pin = jumpToPin.pin
    const targetUrl = canonicalFeedbackUrl(pin.url, websiteUrl)
    pendingScrollRef.current = { ...pin, url: targetUrl }
    setUseProxy(true)

    if (!sameFeedbackUrl(targetUrl, currentPageUrl)) {
      setTargetPageUrl(targetUrl)
      return
    }

    window.setTimeout(() => {
      scrollToPinWithRetry({ ...pin, url: targetUrl })
      pendingScrollRef.current = null
      onJumpHandled?.()
    }, 50)
  }, [jumpToPin, currentPageUrl, onJumpHandled, scrollToPinWithRetry, websiteUrl])

  useEffect(() => {
    onPageUrlChange?.(currentPageUrl)
  }, [currentPageUrl, onPageUrlChange])

  useEffect(() => {
    if (!pendingNavigation) return
    const next = canonicalFeedbackUrl(pendingNavigation.url, websiteUrl)
    setUseProxy(true)
    if (!sameFeedbackUrl(next, currentPageUrl)) {
      setTargetPageUrl(next)
    }
    onNavigationHandled?.()
  }, [pendingNavigation, currentPageUrl, onNavigationHandled, websiteUrl])

  // Read the iframe's actual page URL on load. With proxy mode the iframe URL is
  // /api/proxy?url=<target>, so we extract the target. With direct mode we can't
  // read it cross-origin and fall back to websiteUrl.
  const readIframeUrl = () => {
    const iframe = iframeRef.current
    if (!iframe) return
    try {
      const href = iframe.contentWindow?.location.href
      if (!href) return
      if (href.includes('/api/proxy')) {
        const parsed = new URL(href)
        const target = parsed.searchParams.get('url')
        if (target) {
          setCurrentPageUrl(canonicalFeedbackUrl(target, websiteUrl))
          return
        }
      }
      setCurrentPageUrl(canonicalFeedbackUrl(href, websiteUrl))
    } catch {
      // Direct cross-origin frames cannot expose location.
    }
  }

  // Preflight detection only runs when in direct mode — auto-flip to proxy on block.
  useEffect(() => {
    if (useProxy) return
    if (!detectionContainerRef.current) return
    const detectionKey = `${websiteUrl}-${refreshCount}`
    if (detectionRanRef.current === detectionKey) return
    detectionRanRef.current = detectionKey

    let cancelled = false
    iframeDetectionService
      .detectIframeStatus(websiteUrl, detectionContainerRef.current, {
        timeout: 7000,
        enablePreflight: true,
        checkContentAccess: true
      })
      .then(result => {
        if (cancelled) return
        if (result.status === 'blocked' && !proxyAutoTriedRef.current) {
          proxyAutoTriedRef.current = true
          setUseProxy(true)
        }
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [websiteUrl, useProxy, refreshCount])

  const refresh = () => {
    proxyAutoTriedRef.current = false
    detectionRanRef.current = null
    setRefreshCount(count => count + 1)
  }

  const toggleProxy = () => {
    setUseProxy(value => !value)
    setRefreshCount(count => count + 1)
  }

  const setBrowse = () => setFeedbackMode(false)

  const wrapperWidth = isFullscreen ? '100%' : `${preset.width * scale}px`
  const wrapperHeight = isFullscreen ? '100%' : `${preset.height * scale}px`

  return (
    <TooltipProvider delayDuration={150}>
      <div className='flex h-full min-h-0 flex-col bg-background'>
        <div className='flex items-center justify-between gap-2 border-b border-border/60 bg-background px-3 py-2'>
          <ToggleGroup
            type='single'
            value={viewport}
            onValueChange={value => {
              if (value) setViewport(value as CanvasViewport)
            }}
            size='sm'
            className='gap-0'
          >
            {VIEWPORT_OPTIONS.map(option => {
              const Icon = option.icon
              return (
                <Tooltip key={option.id}>
                  <TooltipTrigger asChild>
                    <ToggleGroupItem
                      value={option.id}
                      aria-label={option.label}
                      className='h-8 w-9'
                    >
                      <Icon className='h-4 w-4' />
                    </ToggleGroupItem>
                  </TooltipTrigger>
                  <TooltipContent>{option.label}</TooltipContent>
                </Tooltip>
              )
            })}
          </ToggleGroup>

          <ToggleGroup
            type='single'
            value={feedbackMode ? 'annotate' : 'browse'}
            onValueChange={value => {
              if (value === 'browse') setBrowse()
              else if (value === 'annotate') {
                setActiveTool('inspect')
                setFeedbackMode(true)
              }
            }}
            size='sm'
            className='gap-0'
          >
            <ToggleGroupItem value='browse' aria-label='Browse mode' className='h-8 gap-1.5 px-3 text-xs'>
              <Cursor className='h-3.5 w-3.5' />
              Browse
            </ToggleGroupItem>
            <ToggleGroupItem
              value='annotate'
              aria-label='Annotate mode'
              disabled={!canEdit}
              className='h-8 gap-1.5 px-3 text-xs'
            >
              <SelectionPlus className='h-3.5 w-3.5' />
              Annotate
              {pinsOnThisPage.length > 0 && (
                <span className='ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-sm bg-muted-foreground/20 px-1 text-[10px] font-semibold tabular-nums text-muted-foreground'>
                  {pinsOnThisPage.length}
                </span>
              )}
            </ToggleGroupItem>
          </ToggleGroup>

          <div className='flex items-center gap-1.5'>
            <span
              className='max-w-[180px] truncate rounded-md border border-border bg-muted px-2 py-1 font-mono text-[11px] text-foreground md:max-w-[260px]'
              title={currentPageUrl}
            >
              {pathHint}
            </span>
            <span className='hidden text-[11px] text-muted-foreground lg:block'>
              {isFullscreen ? 'Fullscreen' : `${preset.width} × ${preset.height}`}
            </span>
            <Separator orientation='vertical' className='mx-1 h-5' />
            <Tooltip>
              <TooltipTrigger asChild>
                <Toggle
                  size='sm'
                  pressed={showAnnotations}
                  onPressedChange={setShowAnnotations}
                  aria-label='Toggle marked elements'
                  className='h-8 w-8 p-0'
                >
                  <Target weight={showAnnotations ? 'fill' : 'regular'} className='h-4 w-4' />
                </Toggle>
              </TooltipTrigger>
              <TooltipContent>
                {showAnnotations ? 'Hide marked elements' : 'Show marked elements'}
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Toggle
                  size='sm'
                  pressed={previewMode}
                  onPressedChange={togglePreview}
                  disabled={previewPayload.length === 0}
                  aria-label='Toggle preview of edits'
                  className='h-8 w-8 p-0'
                >
                  <Eye weight={previewMode ? 'fill' : 'regular'} className='h-4 w-4' />
                </Toggle>
              </TooltipTrigger>
              <TooltipContent>
                {previewPayload.length === 0
                  ? 'No inspect edits to preview'
                  : previewMode
                    ? `Hide preview (${previewPayload.length})`
                    : `Preview edits (${previewPayload.length})`}
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Toggle
                  size='sm'
                  pressed={useProxy}
                  onPressedChange={toggleProxy}
                  aria-label='Toggle proxy mode'
                  className='h-8 w-8 p-0'
                >
                  {useProxy ? (
                    <Shield weight='fill' className='h-4 w-4' />
                  ) : (
                    <ShieldSlash className='h-4 w-4' />
                  )}
                </Toggle>
              </TooltipTrigger>
              <TooltipContent>
                {useProxy ? 'Proxy on — navigation works' : 'Direct iframe'}
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant='ghost' size='icon' className='h-8 w-8' onClick={refresh}>
                  <ArrowClockwise className='h-4 w-4' />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Reload preview</TooltipContent>
            </Tooltip>
          </div>
        </div>

        <div
          ref={canvasAreaRef}
          className='flex flex-1 items-start justify-center overflow-auto p-2'
        >
          <div
            className='relative shrink-0 overflow-hidden rounded-lg border border-border/60 bg-white shadow-sm'
            style={{
              width: wrapperWidth,
              height: wrapperHeight
            }}
          >
            <iframe
              key={iframeKey}
              ref={iframeRef}
              src={iframeSrc}
              title={`Preview of ${websiteUrl}`}
              className='border-0'
              style={
                isFullscreen
                  ? { width: '100%', height: '100%' }
                  : {
                      width: `${preset.width}px`,
                      height: `${preset.height}px`,
                      transform: `scale(${scale})`,
                      transformOrigin: 'top left'
                    }
              }
              sandbox='allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts'
              onLoad={() => {
                setFrameStatus('loaded')
                readIframeUrl()
                if (pendingScrollRef.current) {
                  const pin = pendingScrollRef.current
                  // small delay to let layout settle
                  setTimeout(() => scrollToPinWithRetry(pin), 250)
                  pendingScrollRef.current = null
                  onJumpHandled?.()
                }
              }}
              onError={() => setFrameStatus('error')}
            />

            <FeedbackOverlay
              view={view}
              iframeRef={iframeRef}
              viewportWidth={preset.width}
              viewportHeight={preset.height}
              showAnnotations={showAnnotations}
            />

            {frameStatus === 'loading' && (
              <div className='pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-white/80 backdrop-blur-sm'>
                <div className='flex flex-col items-center gap-2'>
                  <div className='h-8 w-8 animate-spin rounded-full border-2 border-foreground/20 border-t-foreground' />
                  <p className='text-xs text-muted-foreground'>Loading preview…</p>
                </div>
              </div>
            )}

            {frameStatus === 'blocked' && (
              <div className='absolute inset-0 z-10 flex items-center justify-center bg-white/95 p-6'>
                <div className='max-w-sm text-center'>
                  <Shield weight='fill' className='mx-auto h-8 w-8 text-amber-500' />
                  <h3 className='mt-3 text-sm font-semibold'>This site blocks embedding</h3>
                  <p className='mt-1 text-xs text-muted-foreground'>
                    Try the proxy renderer or open the site directly.
                  </p>
                  <div className='mt-4 flex flex-wrap justify-center gap-2'>
                    {!useProxy && (
                      <Button size='sm' className='h-8 gap-1.5 text-xs' onClick={toggleProxy}>
                        <Shield className='h-3.5 w-3.5' />
                        Use proxy
                      </Button>
                    )}
                    <Button asChild size='sm' variant='outline' className='h-8 gap-1.5 text-xs'>
                      <a href={websiteUrl} target='_blank' rel='noreferrer'>
                        Open site
                        <ArrowSquareOut className='h-3.5 w-3.5' />
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {frameStatus === 'error' && (
              <div className='absolute inset-0 z-10 flex items-center justify-center bg-white/95 p-6'>
                <div className='max-w-sm text-center'>
                  <Warning weight='fill' className='mx-auto h-8 w-8 text-rose-500' />
                  <h3 className='mt-3 text-sm font-semibold'>Preview failed to load</h3>
                  <p className='mt-1 text-xs text-muted-foreground'>
                    Try refreshing or toggling the proxy.
                  </p>
                  <div className='mt-4 flex flex-wrap justify-center gap-2'>
                    <Button size='sm' className='h-8 gap-1.5 text-xs' onClick={refresh}>
                      <ArrowClockwise className='h-3.5 w-3.5' />
                      Reload
                    </Button>
                    <Button
                      size='sm'
                      variant='outline'
                      className='h-8 gap-1.5 text-xs'
                      onClick={toggleProxy}
                    >
                      {useProxy ? (
                        <ShieldSlash className='h-3.5 w-3.5' />
                      ) : (
                        <Shield className='h-3.5 w-3.5' />
                      )}
                      {useProxy ? 'Direct' : 'Proxy'}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div
            ref={detectionContainerRef}
            className='pointer-events-none fixed -left-[9999px] h-1 w-1 opacity-0'
          />
        </div>
      </div>
    </TooltipProvider>
  )
}
