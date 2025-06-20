import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Monitor, Tablet, Smartphone, X, Star, PlusCircle, RefreshCw, ExternalLink, Copy, Loader2, AlertCircle, CheckCircle, ZoomIn, ZoomOut } from 'lucide-react'
import { View, ViewType } from './WebsiteViewer'
import { useFavorites } from '@/contexts/FavoritesContext'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'

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
  onRemove: () => void
  onTypeChange: (type: ViewType) => void
  onDuplicate: (view: View) => void
  index: number
}

type LoadingState = 'loading' | 'loaded' | 'error'

export default function WebsiteView ({
  view,
  refreshKey,
  onRemove,
  onTypeChange,
  onDuplicate,
  index
}: WebsiteViewProps) {
  const [actualDimensions] = useState(actualViewDimensions)
  const [displayDimensions] = useState(displayViewDimensions)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [scale, setScale] = useState(1)
  const [userZoom, setUserZoom] = useState(1) // User-controlled zoom level
  const containerRef = useRef<HTMLDivElement>(null)
  const [loadingState, setLoadingState] = useState<LoadingState>('loading')
  const [loadStartTime, setLoadStartTime] = useState<number>(Date.now())
  const { favorites, addToFavorites, removeFromFavorites } = useFavorites()

  const isFavorite = favorites.includes(view.url)

  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth
        const displayWidth = displayDimensions[view.type].width
        const baseScale = Math.min(1, containerWidth / displayWidth)
        const finalScale = baseScale * userZoom
        setScale(finalScale)
      }
    }

    updateScale()
    window.addEventListener('resize', updateScale)
    return () => window.removeEventListener('resize', updateScale)
  }, [view.type, displayDimensions, userZoom])

  useEffect(() => {
    setLoadingState('loading')
    setLoadStartTime(Date.now())
  }, [view.url])

  useEffect(() => {
    if (refreshKey && refreshKey > 0) {
      setLoadingState('loading')
      setLoadStartTime(Date.now())
      if (iframeRef.current) {
        iframeRef.current.src = iframeRef.current.src
      }
    }
  }, [refreshKey])

  const handleFavoriteToggle = () => {
    if (isFavorite) {
      removeFromFavorites(view.url)
    } else {
      addToFavorites(view.url)
    }
  }

  const handleIframeLoad = () => {
    setLoadingState('loaded')
  }

  const handleIframeError = () => {
    setLoadingState('error')
  }

  const refreshView = () => {
    setLoadingState('loading')
    setLoadStartTime(Date.now())
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src
    }
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
    switch (loadingState) {
      case 'loading':
        return <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
      case 'loaded':
        return <CheckCircle className="h-3 w-3 text-green-500" />
      case 'error':
        return <AlertCircle className="h-3 w-3 text-red-500" />
    }
  }

  const zoomIn = () => {
    setUserZoom(prev => Math.min(prev * 1.25, 3)) // Max 3x zoom
  }

  const zoomOut = () => {
    setUserZoom(prev => Math.max(prev / 1.25, 0.25)) // Min 0.25x zoom
  }

  const resetZoom = () => {
    setUserZoom(1)
  }

  // Container uses display dimensions scaled by user zoom
  const scaledWidth = displayDimensions[view.type].width * scale
  const scaledHeight = displayDimensions[view.type].height * scale
  
  // Calculate the scale factor to fit actual dimensions into display dimensions
  const contentScale = displayDimensions[view.type].width / actualDimensions[view.type].width
  const finalContentScale = contentScale * scale
  
  const optionsHeight = 90
  const borderWidth = 1

  return (
    <div
      ref={containerRef}
      className='relative border rounded-lg overflow-hidden w-full sm:w-auto max-w-[600px]'
      style={{
        width: `${scaledWidth + 2 * borderWidth}px`,
        height: `${scaledHeight + optionsHeight + 2 * borderWidth}px`
      }}
    >
      <div className='absolute top-2 left-2 bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold z-10'>
        {index + 1}
      </div>
      <div className='p-2 space-y-2' style={{ height: `${optionsHeight}px` }}>
        <div className='flex items-center justify-between'>
          <div className='flex items-center flex-1 mr-2'>
            <div className='flex items-center gap-2 pl-8'>
              {getStatusIcon()}
              <p className='responsive-text-sm font-medium truncate flex-1'>
                {view.url}
              </p>
            </div>
            <div className='flex items-center gap-1'>
              <button
                onClick={refreshView}
                className='text-gray-500 hover:text-gray-700 p-1'
                title='Refresh view'
              >
                <RefreshCw className='h-4 w-4' />
              </button>
              <button
                onClick={openInNewTab}
                className='text-gray-500 hover:text-gray-700 p-1'
                title='Open in new tab'
              >
                <ExternalLink className='h-4 w-4' />
              </button>
              <button
                onClick={copyUrl}
                className='text-gray-500 hover:text-gray-700 p-1'
                title='Copy URL'
              >
                <Copy className='h-4 w-4' />
              </button>
              <button
                onClick={handleFavoriteToggle}
                className='text-gray-500 hover:text-gray-700 p-1'
                title='Add to favorites'
              >
                {isFavorite ? (
                  <Star fill='yellow' className='h-4 w-4 text-yellow-500 ' />
                ) : (
                  <Star className='h-4 w-4' />
                )}
              </button>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className='text-gray-500 hover:text-gray-700 p-1'
                  title='Duplicate view'
                >
                  <PlusCircle className='h-4 w-4' />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem
                  onClick={() => {
                    onDuplicate({ ...view, type: 'desktop' })
                  }}
                >
                  <Monitor className='mr-2 h-4 w-4' /> Desktop
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    onDuplicate({ ...view, type: 'tablet' })
                  }}
                >
                  <Tablet className='mr-2 h-4 w-4' /> Tablet
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    onDuplicate({ ...view, type: 'mobileLarge' })
                  }}
                >
                  <Smartphone className='mr-2 h-4 w-4' /> Large Mobile
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    onDuplicate({ ...view, type: 'mobile' })
                  }}
                >
                  <Smartphone className='mr-2 h-4 w-4' /> Mobile
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <Button variant='ghost' size='sm' onClick={onRemove}>
            <X className='h-4 w-4' />
            <span className='sr-only'>Remove view</span>
          </Button>
        </div>
        <div className='flex justify-between items-center'>
          <Select value={view.type} onValueChange={onTypeChange}>
            <SelectTrigger className='w-[180px]'>
              <SelectValue placeholder='View type' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='desktop'>
                <Monitor className='inline mr-1 h-4 w-4' /> Desktop{' '}
                <span className='text-[10px] text-muted-foreground'>
                  1024×768
                </span>
              </SelectItem>
              <SelectItem value='tablet'>
                <Tablet className='inline mr-1 h-4 w-4' /> Tablet{' '}
                <span className='text-[10px] text-muted-foreground'>
                  768×1024
                </span>
              </SelectItem>
              <SelectItem value='mobileLarge'>
                <Smartphone className='inline mr-1 h-4 w-4' /> Large Mobile{' '}
                <span className='text-[10px] text-muted-foreground'>
                  640×1000
                </span>
              </SelectItem>
              <SelectItem value='mobile'>
                <Smartphone className='inline mr-1 h-4 w-4' /> Mobile{' '}
                <span className='text-[10px] text-muted-foreground'>
                  375×667
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
          <div className='flex items-center gap-1'>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={zoomOut}
              disabled={userZoom <= 0.25}
              title="Zoom out"
            >
              <ZoomOut className="h-3 w-3" />
            </Button>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={resetZoom}
              className="text-xs px-2"
              title="Reset zoom"
            >
              {Math.round(userZoom * 100)}%
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={zoomIn}
              disabled={userZoom >= 3}
              title="Zoom in"
            >
              <ZoomIn className="h-3 w-3" />
            </Button>
          </div>
          {/* <Button onClick={captureScreenshot} size="sm" disabled={isCapturing}>
            {isCapturing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Camera className="mr-2 h-4 w-4" />
            )}
            Capture
          </Button> */}
        </div>
        <div className='text-xs text-center'>
          {actualDimensions[view.type].width} × {actualDimensions[view.type].height} ({Math.round(userZoom * 100)}%)
        </div>
      </div>
      <div
        className='relative overflow-hidden bg-background mx-auto border-t'
        style={{
          width: `${scaledWidth}px`,
          height: `${scaledHeight}px`
        }}
      >
        <iframe
          ref={iframeRef}
          src={view.url}
          onLoad={handleIframeLoad}
          onError={handleIframeError}
          style={{
            width: `${actualDimensions[view.type].width}px`,
            height: `${actualDimensions[view.type].height}px`,
            transform: `scale(${finalContentScale})`,
            transformOrigin: 'top left'
          }}
          title={`View ${view.id}`}
        />
        {loadingState === 'loading' && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80">
            <div className="flex items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="text-sm">Loading...</span>
            </div>
          </div>
        )}
        {loadingState === 'error' && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/90">
            <div className="text-center">
              <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
              <p className="text-sm text-red-600">Failed to load</p>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={refreshView}
                className="mt-2"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Retry
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
