import React from 'react'
import { Button } from '@/components/ui/button'
import { 
  Shield, 
  AlertCircle, 
  ExternalLink, 
  Copy, 
  RefreshCw, 
  Clock,
  Eye,
  Play,
  Loader2
} from 'lucide-react'
import { toast } from 'sonner'
import { IframeDetectionResult, iframeDetectionService } from '@/services/IframeDetectionService'

interface IframeFallbackProps {
  url: string
  result?: IframeDetectionResult
  onRetry?: () => void
  onPreview?: () => void
  className?: string
}

// IframeReady component removed - we now auto-load immediately

export function IframeLoading({ url, className = '' }: IframeFallbackProps) {
  return (
    <div className={`flex flex-col items-center justify-center h-full bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20 p-6 rounded-lg ${className}`}>
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white mb-4 mx-auto">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
        
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Loading Preview
        </h3>
        
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
          Checking if website allows embedding and loading content...
        </p>
        
        <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20 px-3 py-2 rounded-full">
          <Clock className="h-3 w-3" />
          This may take a few seconds
        </div>
      </div>
    </div>
  )
}

export function IframeBlocked({ url, result, onRetry, className = '' }: IframeFallbackProps) {
  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(url)
      toast.success('URL copied to clipboard')
    } catch (err) {
      toast.error('Failed to copy URL')
    }
  }

  const openInNewTab = () => {
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const message = result 
    ? iframeDetectionService.getBlockedMessage(result)
    : 'This website prevents embedding for security reasons.'

  const confidence = result?.confidence || 'medium'
  
  return (
    <div className={`flex flex-col items-center justify-center h-full bg-gradient-to-br from-orange-50/50 to-red-50/50 dark:from-orange-950/20 dark:to-red-950/20 p-6 rounded-lg ${className}`}>
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center text-white mb-4 mx-auto">
          <Shield className="h-8 w-8" />
        </div>
        
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Preview Blocked
        </h3>
        
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
          {message}
        </p>

        {result && (
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-4">
            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs
              ${confidence === 'high' 
                ? 'bg-red-100 dark:bg-red-950/20 text-red-700 dark:text-red-300'
                : 'bg-orange-100 dark:bg-orange-950/20 text-orange-700 dark:text-orange-300'
              }`}>
              {confidence === 'high' ? 'Confirmed blocked' : 'Likely blocked'}
            </div>
          </div>
        )}
        
        <div className="flex flex-col gap-2">
          <Button 
            onClick={openInNewTab} 
            size="sm" 
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Open in New Tab
          </Button>
          
          <div className="flex gap-2 justify-center">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={copyUrl}
              className="text-xs"
            >
              <Copy className="h-3 w-3 mr-1" />
              Copy URL
            </Button>
            {onRetry && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onRetry}
                className="text-xs"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Retry
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export function IframeError({ url, result, onRetry, className = '' }: IframeFallbackProps) {
  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(url)
      toast.success('URL copied to clipboard')
    } catch (err) {
      toast.error('Failed to copy URL')
    }
  }

  const openInNewTab = () => {
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className={`flex flex-col items-center justify-center h-full bg-gradient-to-br from-red-50/50 to-pink-50/50 dark:from-red-950/20 dark:to-pink-950/20 p-6 rounded-lg ${className}`}>
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-pink-600 rounded-2xl flex items-center justify-center text-white mb-4 mx-auto">
          <AlertCircle className="h-8 w-8" />
        </div>
        
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Failed to Load
        </h3>
        
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
          There was a network error or the website is temporarily unavailable.
        </p>

        {result?.reason && (
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-4 bg-gray-100 dark:bg-gray-800/50 px-3 py-2 rounded-lg">
            {result.reason}
          </div>
        )}
        
        <div className="flex flex-col gap-2">
          <Button 
            onClick={onRetry} 
            size="sm" 
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
          
          <div className="flex gap-2 justify-center">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={openInNewTab}
              className="text-xs"
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Open Direct
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={copyUrl}
              className="text-xs"
            >
              <Copy className="h-3 w-3 mr-1" />
              Copy URL
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function IframeTimeout({ url, result, onRetry, className = '' }: IframeFallbackProps) {
  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(url)
      toast.success('URL copied to clipboard')
    } catch (err) {
      toast.error('Failed to copy URL')
    }
  }

  const openInNewTab = () => {
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className={`flex flex-col items-center justify-center h-full bg-gradient-to-br from-amber-50/50 to-orange-50/50 dark:from-amber-950/20 dark:to-orange-950/20 p-6 rounded-lg ${className}`}>
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center text-white mb-4 mx-auto">
          <Clock className="h-8 w-8" />
        </div>
        
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Loading Timeout
        </h3>
        
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
          The website took too long to respond. It may be slow or blocking previews.
        </p>
        
        <div className="flex flex-col gap-2">
          <Button 
            onClick={onRetry} 
            size="sm" 
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
          
          <div className="flex gap-2 justify-center">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={openInNewTab}
              className="text-xs"
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Open Direct
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={copyUrl}
              className="text-xs"
            >
              <Copy className="h-3 w-3 mr-1" />
              Copy URL
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}