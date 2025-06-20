import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Monitor, Tablet, Smartphone, X, Star, PlusCircle, RefreshCw, ExternalLink, Copy, Loader2, AlertCircle, CheckCircle } from 'lucide-react'
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
  globalZoom: number
  onRemove: () => void
  onTypeChange: (type: ViewType) => void
  onDuplicate: (view: View) => void
  index: number
}

type LoadingState = 'loading' | 'loaded' | 'error'

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
  const [scale, setScale] = useState(1)
  const [isCompactView, setIsCompactView] = useState(false) // For responsive layout
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
        setIsCompactView(currentScaledWidth < 350) // Increased threshold for mobile
      }
    }

    updateScale()
    window.addEventListener('resize', updateScale)
    return () => window.removeEventListener('resize', updateScale)
  }, [view.type, displayDimensions, globalZoom])

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

  const getDeviceIcon = (deviceType: ViewType) => {
    switch (deviceType) {
      case 'desktop':
        return <Monitor className="h-4 w-4 text-blue-600" />
      case 'tablet':
        return <Tablet className="h-4 w-4 text-green-600" />
      case 'mobileLarge':
        return <Smartphone className="h-4 w-4 text-orange-600" />
      case 'mobile':
        return <Smartphone className="h-4 w-4 text-red-600" />
    }
  }

  const getDeviceColor = (deviceType: ViewType) => {
    switch (deviceType) {
      case 'desktop':
        return 'bg-blue-100 hover:bg-blue-200 border-blue-300'
      case 'tablet':
        return 'bg-green-100 hover:bg-green-200 border-green-300'
      case 'mobileLarge':
        return 'bg-orange-100 hover:bg-orange-200 border-orange-300'
      case 'mobile':
        return 'bg-red-100 hover:bg-red-200 border-red-300'
    }
  }


  const cycleDeviceType = () => {
    const devices: ViewType[] = ['desktop', 'tablet', 'mobileLarge', 'mobile']
    const currentIndex = devices.indexOf(view.type)
    const nextIndex = (currentIndex + 1) % devices.length
    onTypeChange(devices[nextIndex])
  }

  // Container size - shows full content at all zoom levels
  const scaledWidth = displayDimensions[view.type].width * scale  
  const scaledHeight = displayDimensions[view.type].height * scale
  
  // Calculate the scale factor to fit actual dimensions into display dimensions
  const contentScale = displayDimensions[view.type].width / actualDimensions[view.type].width
  const finalContentScale = contentScale * scale
  
  const optionsHeight = isCompactView ? 40 : 35 // Minimal height - just action buttons
  const borderWidth = 1

  return (
    <div
      ref={containerRef}
      className='relative border rounded-lg overflow-hidden w-full sm:w-auto'
      style={{
        width: `${scaledWidth + 2 * borderWidth}px`,
        height: `${scaledHeight + optionsHeight + 2 * borderWidth}px`,
        maxWidth: globalZoom > 1 ? 'none' : '600px' // Remove max-width constraint when zoomed
      }}
    >
      <div className='absolute top-2 left-2 bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold z-10'>
        {index + 1}
      </div>
      <button
        onClick={cycleDeviceType}
        className={`absolute bottom-2 left-2 w-8 h-8 rounded border-2 transition-colors z-20 shadow-sm flex items-center justify-center ${getDeviceColor(view.type)}`}
        title={`${view.type} - Click to cycle device type`}
      >
        {getDeviceIcon(view.type)}
      </button>
      <button
        onClick={onRemove}
        className='absolute bottom-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded w-6 h-6 flex items-center justify-center z-20 shadow-sm transition-colors'
        title='Remove view'
      >
        <X className='h-3 w-3' />
      </button>
      <div className={`flex items-center justify-between ${isCompactView ? 'p-1' : 'p-2'}`} style={{ height: `${optionsHeight}px` }}>
        <div className='flex items-center gap-1 pl-8'>
            {getStatusIcon()}
            <button
              onClick={refreshView}
              className='text-gray-500 hover:text-gray-700 p-0.5'
              title='Refresh view'
            >
              <RefreshCw className='h-4 w-4' />
            </button>
            <button
              onClick={openInNewTab}
              className='text-gray-500 hover:text-gray-700 p-0.5'
              title='Open in new tab'
            >
              <ExternalLink className='h-4 w-4' />
            </button>
            <button
              onClick={copyUrl}
              className='text-gray-500 hover:text-gray-700 p-0.5'
              title='Copy URL'
            >
              <Copy className='h-4 w-4' />
            </button>
            <button
              onClick={handleFavoriteToggle}
              className='text-gray-500 hover:text-gray-700 p-0.5'
              title='Add to favorites'
            >
              {isFavorite ? (
                <Star fill='yellow' className='h-4 w-4 text-yellow-500' />
              ) : (
                <Star className='h-4 w-4' />
              )}
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className='text-gray-500 hover:text-gray-700 p-0.5'
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
                  <Smartphone className='mr-2 h-3 w-3' /> Large Mobile
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    onDuplicate({ ...view, type: 'mobile' })
                  }}
                >
                  <Smartphone className='mr-2 h-3 w-3' /> Mobile
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
