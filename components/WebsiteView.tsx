import React, { useState, useRef, useEffect } from 'react'
import {
  Monitor,
  Tablet,
  Smartphone,
  X,
  Star,
  PlusCircle,
  RefreshCw,
  ExternalLink,
  Copy,
  AlertCircle,
  Settings,
  Expand,
  Shield,
  ShieldOff
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { View, ViewType, useWebsiteViewer } from '@/contexts/WebsiteViewerContext'
import { useFavorites } from '@/contexts/FavoritesContext'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose
} from '@/components/ui/dialog'

// const defaultViewDimensions = {
//   desktop: { width: 1024, height: 768 },
//   tablet: { width: 768, height: 1024 },
//   mobile: { width: 375, height: 667 }
// }

// Actual device dimensions for iframe content
const actualViewDimensions = {
  desktop: { width: 1024, height: 768 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 375, height: 667 }
}

// Display dimensions for container (scaled down for layout)
const displayViewDimensions = {
  desktop: { width: 400, height: 300 }, // 2.56x scale down
  tablet: { width: 384, height: 512 }, // 2x scale down
  mobile: { width: 187, height: 333 } // 2x scale down
}

type WebsiteViewProps = {
  view: View
  refreshKey?: number
  globalZoom: number
  onRemove: () => void
  onTypeChange: (type: ViewType) => void
  onDuplicate: (view: View) => void
  index: number
}


export default function WebsiteView ({
  view,
  refreshKey,
  globalZoom,
  onRemove,
  onTypeChange,
  onDuplicate,
  index
}: WebsiteViewProps) {
  const [actualDimensions] = useState(actualViewDimensions)
  const [displayDimensions] = useState(displayViewDimensions)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const iframeContainerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [isCompactView, setIsCompactView] = useState(false) // For responsive layout
  const containerRef = useRef<HTMLDivElement>(null)
  const [isEnlargeDialogOpen, setIsEnlargeDialogOpen] = useState(false)
  const [enlargeDialogScale, setEnlargeDialogScale] = useState(1)
  const [realIframeStatus, setRealIframeStatus] = useState<'loading' | 'loaded' | 'error' | 'blocked'>('loading')
  const { favorites, addToFavorites, removeFromFavorites } = useFavorites()
  const { updateViewIframeStatus, toggleViewProxy, refreshView: refreshViewport } = useWebsiteViewer()

  const isFavorite = favorites.includes(view.url)

  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        // Measure parent slot width so the card scales to fit its container
        // rather than circularly measuring its own explicit style width
        const parent = containerRef.current.parentElement
        const availableWidth = parent ? parent.clientWidth : containerRef.current.offsetWidth
        const displayWidth = displayDimensions[view.type].width

        let baseScale
        if (globalZoom <= 1) {
          baseScale = Math.min(1, availableWidth / displayWidth)
        } else {
          baseScale = 1
        }

        const finalScale = baseScale * globalZoom
        setScale(finalScale)

        const currentScaledWidth = displayWidth * finalScale
        setIsCompactView(currentScaledWidth < 320)
      }
    }

    updateScale()
    window.addEventListener('resize', updateScale)
    return () => window.removeEventListener('resize', updateScale)
  }, [view.type, displayDimensions, globalZoom])

  // Simple key-based iframe reloading - use view-level refresh/proxy state to force remounts.
  const iframeKey = `${view.id}-${view.useProxy ? 'proxy' : 'direct'}-${view.refreshKey || 0}-${refreshKey || 0}`

  // Sync local realIframeStatus with global view.iframeStatus
  useEffect(() => {
    setRealIframeStatus(view.iframeStatus === 'loading' ? 'loading' :
                       view.iframeStatus === 'loaded' ? 'loaded' : 
                       view.iframeStatus === 'blocked' ? 'blocked' : 'error')
  }, [view.iframeStatus])

  // Reset status when refreshKey changes
  useEffect(() => {
    if (refreshKey && refreshKey > 0) {
      setRealIframeStatus('loading')
    }
  }, [refreshKey])

  useEffect(() => {
    if (!view.useProxy || view.shouldLoad === false || realIframeStatus !== 'loading') {
      return
    }

    const timeoutId = window.setTimeout(() => {
      setRealIframeStatus(currentStatus => {
        if (currentStatus !== 'loading') {
          return currentStatus
        }

        updateViewIframeStatus(view.id, 'loaded')
        return 'loaded'
      })
    }, 3500)

    return () => window.clearTimeout(timeoutId)
  }, [iframeKey, realIframeStatus, updateViewIframeStatus, view.id, view.shouldLoad, view.useProxy])

  // Calculate responsive scale for enlarge dialog
  useEffect(() => {
    if (isEnlargeDialogOpen) {
      const calculateScale = () => {
        const headerHeight = 50
        const actualWidth = actualDimensions[view.type].width
        const actualHeight = actualDimensions[view.type].height + headerHeight
        
        // Use 90% of viewport dimensions for maximum dialog size
        const maxWidth = window.innerWidth * 0.9
        const maxHeight = window.innerHeight * 0.9
        
        // Calculate scale factors for both dimensions
        const widthScale = maxWidth / actualWidth
        const heightScale = maxHeight / actualHeight
        
        // Use the smaller scale to ensure both dimensions fit
        const scale = Math.min(widthScale, heightScale, 1) // Don't scale up, only down
        
        setEnlargeDialogScale(scale)
      }
      
      calculateScale()
      window.addEventListener('resize', calculateScale)
      return () => window.removeEventListener('resize', calculateScale)
    }
  }, [isEnlargeDialogOpen, view.type, actualDimensions])

  const handleFavoriteToggle = () => {
    if (isFavorite) {
      removeFromFavorites(view.url)
    } else {
      addToFavorites(view.url)
    }
  }

// (lines 195–230 have been removed; the unused startIframeDetection function is deleted)

  const handleRetry = () => {
    updateViewIframeStatus(view.id, 'loading')
    setRealIframeStatus('loading')
    refreshViewport(view.id)
  }

  const retryCurrentView = () => {
    handleRetry()
  }

  const openInNewTab = () => {
    window.open(view.url, '_blank')
  }

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(view.url)
      toast.success('URL copied to clipboard')
    } catch (err) {
      console.error('Failed to copy URL:', err)
      toast.error('Failed to copy URL')
    }
  }

  const getStatusIcon = () => {
    // Only show icons for error states, no spinners
    switch (realIframeStatus) {
      case 'loading':
        return null // No spinner - let it load quietly
      case 'loaded':
        return null // No icon when loaded - don't annoy users
      case 'error':
        return <AlertCircle className='h-3 w-3 text-red-600' />
      case 'blocked':
        return <Shield className='h-3 w-3 text-amber-600' />
      default:
        return null
    }
  }

  const getDeviceIcon = (deviceType: ViewType) => {
    switch (deviceType) {
      case 'desktop':
        return <Monitor className='h-3.5 w-3.5' />
      case 'tablet':
        return <Tablet className='h-3.5 w-3.5' />
      case 'mobile':
        return <Smartphone className='h-3.5 w-3.5' />
    }
  }

  const getDeviceName = (deviceType: ViewType) => {
    switch (deviceType) {
      case 'desktop':
        return 'Desktop'
      case 'tablet':
        return 'Tablet'
      case 'mobile':
        return 'Mobile'
    }
  }

  const getDeviceClass = (deviceType: ViewType) => {
    switch (deviceType) {
      case 'desktop':
        return 'device-desktop'
      case 'tablet':
        return 'device-tablet'
      case 'mobile':
        return 'device-mobile'
    }
  }

  const getDeviceColorStyle = (deviceType: ViewType) => {
    switch (deviceType) {
      case 'desktop':
        return { color: 'hsl(var(--info))', backgroundColor: 'hsl(var(--info-muted))' }
      case 'tablet':
        return { color: 'hsl(var(--success))', backgroundColor: 'hsl(var(--success-muted))' }
      case 'mobile':
        return { color: 'hsl(var(--accent))', backgroundColor: 'hsl(var(--accent) / 0.1)' }
    }
  }

  const deviceTypes: ViewType[] = ['desktop', 'tablet', 'mobile']

  // Container size - shows full content at all zoom levels
  const scaledWidth = displayDimensions[view.type].width * scale
  const scaledHeight = displayDimensions[view.type].height * scale

  // Calculate the scale factor to fit actual dimensions into display dimensions
  const availableWidth = displayDimensions[view.type].width
  const contentScale = availableWidth / actualDimensions[view.type].width
  const finalContentScale = contentScale * scale

  // Resolve URL for iframe
  const displayUrl = view.useProxy 
    ? `/api/proxy?url=${encodeURIComponent(view.url)}` 
    : view.url
  const iframeSrc = view.shouldLoad === false ? undefined : displayUrl

  const optionsHeight = isCompactView ? 40 : 35 // Minimal height - just action buttons
  const borderWidth = 1

  return (
    <div
      ref={containerRef}
      className={`relative rounded-lg overflow-hidden w-full sm:w-auto hover-lift animate-fade-in bg-card border border-border/40 shadow-sm ${
        getDeviceClass(view.type)
      }`}
      style={{
        width: `${scaledWidth + 2 * borderWidth}px`,
        height: `${scaledHeight + optionsHeight + 2 * borderWidth}px`,
        maxWidth: globalZoom > 1 ? 'none' : 'none',
        animationDelay: `${index * 0.1}s`
      }}
    >
      <div
        className='flex items-center justify-between p-0 glass border-b border-border/30'
        style={{
          height: `${optionsHeight}px`
        }}
      >
        <div className='flex items-center gap-2'>
          {/* Index number display removed */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className='flex items-center gap-2 px-3 rounded-tl-lg text-xs font-medium transition-all duration-200 hover:bg-muted/80 border-0 shadow-none text-foreground'
                style={{
                  height: `${optionsHeight}px`
                }}
                title={`Change device type (current: ${getDeviceName(
                  view.type
                )})`}
              >
                <div className='h-3.5 w-3.5 flex items-center justify-center'>
                  {getDeviceIcon(view.type)}
                </div>
                <span className='truncate'>
                  {getDeviceName(view.type)}
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='start' className='w-48'>
              {deviceTypes.map(deviceType => (
                <DropdownMenuItem
                  key={deviceType}
                  onClick={() => onTypeChange(deviceType)}
                  className={`flex items-center gap-3 border-l-3 transition-all duration-200 ${
                    view.type === deviceType ? 'border-l-current' : 'border-l-transparent'
                  }`}
                  style={getDeviceColorStyle(deviceType)}
                >
                  {getDeviceIcon(deviceType)}
                  <span className='font-medium'>
                    {getDeviceName(deviceType)}
                  </span>
                  {view.type === deviceType && (
                    <div className='ml-auto w-2 h-2 rounded-full' style={{ backgroundColor: getDeviceColorStyle(deviceType).color }}></div>
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          {getStatusIcon()}
        </div>

        <div className='flex items-center gap-0.5 pr-1'>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={`text-muted-foreground hover:text-foreground p-1 rounded hover:bg-muted/80 transition-colors ${view.useProxy ? 'text-blue-500' : ''}`}
                title='More options'
              >
                <Settings className='h-3.5 w-3.5' />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => toggleViewProxy(view.id)}>
                {view.useProxy ? (
                  <>
                    <ShieldOff className='mr-2 h-4 w-4' />
                    <span>Disable Proxy Mode</span>
                  </>
                ) : (
                  <>
                    <Shield className='mr-2 h-4 w-4' />
                    <span>Enable Proxy Mode</span>
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={retryCurrentView}>
                <RefreshCw className='mr-2 h-4 w-4' />
                <span>Refresh</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={openInNewTab}>
                <ExternalLink className='mr-2 h-4 w-4' />
                <span>Open in new tab</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={copyUrl}>
                <Copy className='mr-2 h-4 w-4' />
                <span>Copy URL</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleFavoriteToggle}>
                <Star
                  className={`mr-2 h-4 w-4 ${isFavorite ? 'text-primary' : ''}`}
                  fill={isFavorite ? 'hsl(var(--primary))' : 'transparent'}
                />
                <span>
                  {isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                </span>
              </DropdownMenuItem>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <PlusCircle className='mr-2 h-4 w-4' />
                  <span>Duplicate</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem
                      onClick={() => {
                        onDuplicate({ ...view, type: 'desktop' })
                      }}
                    >
                      <Monitor className='mr-2 h-3 w-3' /> Desktop
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        onDuplicate({ ...view, type: 'tablet' })
                      }}
                    >
                      <Tablet className='mr-2 h-3 w-3' /> Tablet
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        onDuplicate({ ...view, type: 'mobile' })
                      }}
                    >
                      <Smartphone className='mr-2 h-3 w-3' /> Mobile
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>
            </DropdownMenuContent>
          </DropdownMenu>
          <button
            onClick={() => setIsEnlargeDialogOpen(true)}
            className='text-muted-foreground hover:text-foreground p-1 rounded hover:bg-muted/80 transition-colors'
            title='Enlarge view'
          >
            <Expand className='h-3.5 w-3.5' />
          </button>
          <button
            onClick={onRemove}
            className='text-muted-foreground hover:text-red-600 hover:bg-red-500/10 rounded-tr-lg px-2 flex items-center justify-center transition-all duration-200 border-0 shadow-none'
            style={{ height: `${optionsHeight}px` }}
            title='Remove view'
          >
            <X className='h-3.5 w-3.5' />
          </button>
        </div>
      </div>
      <div
        ref={iframeContainerRef}
        className='relative overflow-hidden bg-card'
        style={{
          width: `${scaledWidth}px`,
          height: `${scaledHeight}px`,
          margin: '0'
        }}
      >
        <iframe
          key={iframeKey}
          ref={iframeRef}
          src={iframeSrc}
          style={{
            width: `${actualDimensions[view.type].width}px`,
            height: `${actualDimensions[view.type].height}px`,
            transform: `scale(${finalContentScale})`,
            transformOrigin: 'top left',
            border: 'none'
          }}
          title={`View ${view.id}`}
          onLoad={() => {
            if (view.shouldLoad === false || view.iframeStatus === 'blocked') {
              setRealIframeStatus('blocked')
              return
            }

            setRealIframeStatus('loaded')
            updateViewIframeStatus(view.id, 'loaded')
          }}
          onError={() => {
            setRealIframeStatus('error')
            updateViewIframeStatus(view.id, 'error')
          }}
          sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
        />
        
        {/* Loading/Error Overlay */}
        {realIframeStatus === 'loading' && (
          <div className="absolute inset-0 bg-card flex items-center justify-center">
            <div className="text-center max-w-xs">
              <div className="mx-auto mb-4">
                <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto"></div>
              </div>
              <p className="text-sm text-foreground mb-2 font-medium">Loading Website</p>
              <p className="text-xs text-muted-foreground">Please wait...</p>
            </div>
          </div>
        )}
        
        {realIframeStatus === 'blocked' && (
          <div className="absolute inset-0 bg-warning-muted flex items-center justify-center">
            <div className="text-center max-w-xs px-4">
              <Shield className="h-8 w-8 text-warning mx-auto mb-2" />
              <p className="text-sm text-foreground mb-1 font-semibold">Embedding Restricted</p>
              <p className="text-xs text-muted-foreground mb-4">
                This site blocks standard embedding. Use Proxy Mode to bypass this restriction.
              </p>
              <div className="space-y-2">
                <Button
                  size="sm"
                  onClick={() => toggleViewProxy(view.id)}
                  className="bg-warning hover:bg-warning/90 text-white w-full gap-2"
                >
                  <Shield className="h-3.5 w-3.5" />
                  Enable Proxy Mode
                </Button>
                <button
                  onClick={() => window.open(view.url, '_blank')}
                  className="block mx-auto text-xs text-accent hover:text-accent/80 underline"
                >
                  Open directly
                </button>
              </div>
            </div>
          </div>
        )}
        
        {realIframeStatus === 'error' && (
          <div className="absolute inset-0 bg-destructive/5 flex items-center justify-center">
            <div className="text-center max-w-xs px-4">
              <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
              <p className="text-sm text-destructive mb-1 font-semibold">Unable to Display</p>
              <p className="text-xs text-muted-foreground mb-3">
                {view.useProxy
                  ? "The proxy couldn't load this content. The site may require authentication."
                  : "This website blocks iframe embedding. Try enabling Proxy Mode."}
              </p>
              <div className="space-y-2">
                {!view.useProxy && (
                  <Button
                    size="sm"
                    onClick={() => toggleViewProxy(view.id)}
                    variant="outline"
                    className="w-full gap-2"
                  >
                    <Shield className="h-3.5 w-3.5" />
                    Try Proxy Mode
                  </Button>
                )}
                <button
                  onClick={retryCurrentView}
                  className="block mx-auto text-xs text-muted-foreground hover:text-foreground underline"
                >
                  Try again
                </button>
                <button
                  onClick={() => window.open(view.url, '_blank')}
                  className="block mx-auto text-xs text-accent hover:text-accent/80 underline"
                >
                  Open directly
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Enlarge Dialog */}
      <Dialog open={isEnlargeDialogOpen} onOpenChange={setIsEnlargeDialogOpen}>
        <DialogContent className="max-w-[90vw] max-h-[90svh] p-0 bg-transparent border-0 shadow-none flex items-center justify-center">
          <div
            className="relative rounded-xl overflow-hidden bg-card shadow-2xl border border-border"
            style={{
              width: `${(actualDimensions[view.type].width + 2) * enlargeDialogScale}px`,
              height: `${(actualDimensions[view.type].height + 50) * enlargeDialogScale}px`
            }}
          >
            <DialogHeader className="p-0">
              <div 
                className="flex items-center justify-between px-4 py-3 rounded-t-xl"
                style={{
                  backgroundColor: getDeviceColorStyle(view.type).backgroundColor,
                  color: getDeviceColorStyle(view.type).color
                }}
              >
                <DialogTitle className="text-base font-semibold flex items-center gap-2">
                  {getDeviceIcon(view.type)}
                  {getDeviceName(view.type)} - {actualDimensions[view.type].width}×{actualDimensions[view.type].height}
                </DialogTitle>
                <DialogClose className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none">
                  <X className="h-4 w-4" />
                  <span className="sr-only">Close</span>
                </DialogClose>
              </div>
            </DialogHeader>
            <div className="relative bg-card overflow-hidden">
              <iframe
                key={`dialog-${iframeKey}`}
                src={iframeSrc}
                style={{
                  width: `${actualDimensions[view.type].width * enlargeDialogScale}px`,
                  height: `${actualDimensions[view.type].height * enlargeDialogScale}px`,
                  border: 'none'
                }}
                title={`Enlarged view ${view.id}`}
                sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
