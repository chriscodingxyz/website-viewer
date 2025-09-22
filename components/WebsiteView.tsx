import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
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
  Loader2,
  AlertCircle,
  CheckCircle,
  Settings,
  Expand,
  Eye,
  Play
} from 'lucide-react'
import { View, ViewType, useWebsiteViewer } from '@/contexts/WebsiteViewerContext'
import { useFavorites } from '@/contexts/FavoritesContext'
import { toast } from 'sonner'
import { iframeDetectionService } from '@/services/IframeDetectionService'
import { 
  IframeLoading, 
  IframeBlocked, 
  IframeError 
} from '@/components/fallbacks/IframeFallbacks'
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
  mobileLarge: { width: 640, height: 1000 },
  mobile: { width: 375, height: 667 }
}

// Display dimensions for container (scaled down for layout)
const displayViewDimensions = {
  desktop: { width: 400, height: 300 }, // 2.56x scale down
  tablet: { width: 384, height: 512 }, // 2x scale down
  mobileLarge: { width: 320, height: 500 }, // 2x scale down
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

type LoadingState = 'loading' | 'loaded' | 'error'

// Container element for iframe detection
interface IframeContainer {
  element: HTMLDivElement
  cleanup: () => void
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
  const [realIframeStatus, setRealIframeStatus] = useState<'loading' | 'loaded' | 'error'>('loading')
  const { favorites, addToFavorites, removeFromFavorites } = useFavorites()
  const { updateViewIframeStatus } = useWebsiteViewer()

  const isFavorite = favorites.includes(view.url)

  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth
        const displayWidth = displayDimensions[view.type].width

        // For zoom levels 100% and below, fit to container
        // For zoom levels above 100%, expand to show full content
        let baseScale
        if (globalZoom <= 1) {
          baseScale = Math.min(1, containerWidth / displayWidth)
        } else {
          // At zoom levels above 100%, always show full content
          baseScale = 1
        }

        const finalScale = baseScale * globalZoom
        setScale(finalScale)

        // Determine if view should be in compact mode based on final width
        const currentScaledWidth = displayWidth * finalScale
        setIsCompactView(currentScaledWidth < 320) // Optimized threshold for mobile
      }
    }

    updateScale()
    window.addEventListener('resize', updateScale)
    return () => window.removeEventListener('resize', updateScale)
  }, [view.type, displayDimensions, globalZoom])

  // Sync local realIframeStatus with global view.iframeStatus
  useEffect(() => {
    setRealIframeStatus(view.iframeStatus === 'loading' ? 'loading' : 
                       view.iframeStatus === 'loaded' ? 'loaded' : 'error')
  }, [view.iframeStatus])

  // Refresh iframe on refresh key
  useEffect(() => {
    if (refreshKey && refreshKey > 0) {
      if (iframeRef.current) {
        setRealIframeStatus('loading') // Reset status on refresh
        iframeRef.current.src = iframeRef.current.src
      }
    }
  }, [refreshKey])

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
  }

  const refreshView = () => {
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
      default:
        return null
    }
  }

  const getDeviceIcon = (deviceType: ViewType) => {
    switch (deviceType) {
      case 'desktop':
        return <Monitor className='h-4 w-4' />
      case 'tablet':
        return <Tablet className='h-4 w-4' />
      case 'mobileLarge':
        return <Smartphone className='h-4 w-4' />
      case 'mobile':
        return <Smartphone className='h-4 w-4' />
    }
  }

  const getDeviceName = (deviceType: ViewType) => {
    switch (deviceType) {
      case 'desktop':
        return 'Desktop'
      case 'tablet':
        return 'Tablet'
      case 'mobileLarge':
        return 'Mobile Large'
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
      case 'mobileLarge':
        return 'device-mobile-large'
      case 'mobile':
        return 'device-mobile'
    }
  }

  const getDeviceColorStyle = (deviceType: ViewType) => {
    switch (deviceType) {
      case 'desktop':
        return { color: 'rgb(59 130 246)', backgroundColor: 'rgb(59 130 246 / 0.05)' } // blue
      case 'tablet':
        return { color: 'rgb(34 197 94)', backgroundColor: 'rgb(34 197 94 / 0.05)' } // green
      case 'mobileLarge':
        return { color: 'rgb(249 115 22)', backgroundColor: 'rgb(249 115 22 / 0.05)' } // orange
      case 'mobile':
        return { color: 'rgb(168 85 247)', backgroundColor: 'rgb(168 85 247 / 0.05)' } // purple
    }
  }

  const deviceTypes: ViewType[] = ['desktop', 'tablet', 'mobileLarge', 'mobile']

  // Container size - shows full content at all zoom levels
  const scaledWidth = displayDimensions[view.type].width * scale
  const scaledHeight = displayDimensions[view.type].height * scale

  // Calculate the scale factor to fit actual dimensions into display dimensions
  const availableWidth = displayDimensions[view.type].width
  const contentScale = availableWidth / actualDimensions[view.type].width
  const finalContentScale = contentScale * scale

  const optionsHeight = isCompactView ? 40 : 35 // Minimal height - just action buttons
  const borderWidth = 1

  return (
    <div
      ref={containerRef}
      className={`relative rounded-t-xl overflow-hidden w-full sm:w-auto hover-lift animate-fade-in device-border ${
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
        className='flex items-center justify-between p-0'
        style={{ 
          height: `${optionsHeight}px`,
          background: `rgb(var(--device-color) / 0.08)`
        }}
      >
        <div className='flex items-center gap-2'>
          {/* Index number display removed */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className='flex items-center gap-2 px-3 rounded-tl-xl text-sm font-medium transition-all duration-200 hover:bg-white/10 border-0 shadow-none'
                style={{
                  color: `rgb(var(--device-color))`,
                  height: `${optionsHeight}px`
                }}
                title={`Change device type (current: ${getDeviceName(
                  view.type
                )})`}
              >
                {getDeviceIcon(view.type)}
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

        <div className='flex items-center gap-1'>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className='text-muted-foreground hover:text-foreground p-0.5'
                title='More options'
              >
                <Settings className='h-4 w-4' />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={refreshView}>
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
                        onDuplicate({ ...view, type: 'mobileLarge' })
                      }}
                    >
                      <Smartphone className='mr-2 h-3 w-3' /> Mobile Large
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
            className='text-muted-foreground hover:text-foreground p-0.5'
            title='Enlarge view'
          >
            <Expand className='h-4 w-4' />
          </button>
          <button
            onClick={onRemove}
            className='bg-red-500/8 hover:bg-red-500/15 text-red-600 hover:text-red-700 rounded-tr-xl w-8 flex items-center justify-center transition-all duration-200 hover:brightness-95 border-0 shadow-none'
            style={{ height: `${optionsHeight}px` }}
            title='Remove view'
          >
            <X className='h-4 w-4' />
          </button>
        </div>
      </div>
      <div
        ref={iframeContainerRef}
        className='relative overflow-hidden bg-white shadow-inner'
        style={{
          width: `${scaledWidth}px`,
          height: `${scaledHeight}px`,
          margin: '0'
        }}
      >
        <iframe
          ref={iframeRef}
          src={view.shouldLoad ? view.url : undefined}
          style={{
            width: `${actualDimensions[view.type].width}px`,
            height: `${actualDimensions[view.type].height}px`,
            transform: `scale(${finalContentScale})`,
            transformOrigin: 'top left',
            border: 'none'
          }}
          title={`View ${view.id}`}
          onLoad={() => {
            setRealIframeStatus('loaded')
            updateViewIframeStatus(view.id, 'loaded')
          }}
          onError={() => {
            setRealIframeStatus('error')
            updateViewIframeStatus(view.id, 'error')
          }}
        />
        
        {/* Loading/Error Overlay */}
        {realIframeStatus === 'loading' && (
          <div className="absolute inset-0 bg-gray-50 flex items-center justify-center">
            <div className="text-center max-w-xs">
              <div className="mx-auto mb-4">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              </div>
              <p className="text-sm text-gray-700 mb-2 font-medium">Loading Website</p>
              <p className="text-xs text-gray-500">Please wait...</p>
            </div>
          </div>
        )}
        
        {realIframeStatus === 'error' && (
          <div className="absolute inset-0 bg-red-50 flex items-center justify-center">
            <div className="text-center max-w-xs">
              <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
              <p className="text-sm text-red-600 mb-1">Content Blocked</p>
              <p className="text-xs text-red-500 mb-3">
                Website refuses iframe embedding or connection failed
              </p>
              <div className="space-y-2">
                <button 
                  onClick={refreshView}
                  className="block mx-auto text-xs text-red-700 hover:text-red-900 underline"
                >
                  Try again
                </button>
                <button 
                  onClick={() => window.open(view.url, '_blank')}
                  className="block mx-auto text-xs text-blue-700 hover:text-blue-900 underline"
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
        <DialogContent className="max-w-[90vw] max-h-[90vh] p-0 bg-transparent border-0 shadow-none flex items-center justify-center">
          <div 
            className="relative rounded-xl overflow-hidden bg-white shadow-2xl border"
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
            <div className="relative bg-white overflow-hidden">
              <iframe
                src={view.shouldLoad ? view.url : undefined}
                style={{
                  width: `${actualDimensions[view.type].width * enlargeDialogScale}px`,
                  height: `${actualDimensions[view.type].height * enlargeDialogScale}px`,
                  border: 'none'
                }}
                title={`Enlarged view ${view.id}`}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
