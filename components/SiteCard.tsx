import React from 'react'
import { Button } from '@/components/ui/button'
import { Globe02Icon, Delete02Icon, ArrowRight01Icon, LinkSquare02Icon } from 'hugeicons-react'
import Image from 'next/image'

interface SiteCardProps {
  url: string
  title?: string
  date?: string
  onView: () => void
  onRemove?: () => void
  isFavorite?: boolean
}

export default function SiteCard({
  url,
  title,
  date,
  onView,
  onRemove,
  isFavorite
}: SiteCardProps) {
  // Helper to get efficient favicon
  const getFavicon = (siteUrl: string) => {
    try {
      const domain = new URL(siteUrl).hostname
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`
    } catch {
      return ''
    }
  }

  const cleanUrl = url.replace(/^https?:\/\//, '').replace(/\/$/, '')

  return (
    <div className="bg-white rounded-lg p-3 border border-border/60 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between h-full group">
      <div className="flex items-start gap-3 mb-3">
        {/* Icon / Logo */}
        <div className="w-10 h-10 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
          <Image
            src={getFavicon(url)}
            alt={cleanUrl}
            width={32}
            height={32}
            className="w-7 h-7 object-contain"
            onError={(e) => {
              // Fallback if image fails
              (e.target as HTMLImageElement).src = '/globe-icon.png' // or just hide
              ;(e.target as HTMLImageElement).style.display = 'none'
            }}
          />
          <Globe02Icon className="w-6 h-6 text-gray-400 absolute opacity-0" style={{ opacity: 0 }} />
          {/* We could show Globe if image fails, but simple favicon is usually reliable-ish */}
        </div>

        <div>
          <h3 className="font-bold text-sm text-foreground leading-tight mb-0.5 line-clamp-1" title={title || cleanUrl}>
            {title || cleanUrl.split('.')[0]}
          </h3>
          <p className="text-xs text-muted-foreground line-clamp-1">
            {cleanUrl}
          </p>
        </div>
      </div>

      <div className="mt-auto">
        <div className="flex gap-1.5">
          <Button
            onClick={onView}
            variant="outline"
            className="flex-1 bg-white hover:bg-gray-50 text-foreground hover:text-foreground border-gray-200 hover:border-gray-300"
            size="xs"
          >
            View
          </Button>
          <Button
            onClick={onView}
            className="flex-1 bg-gray-50 hover:bg-gray-100 text-foreground hover:text-foreground border border-gray-200 hover:border-gray-300"
            variant="ghost"
            size="xs"
          >
            Analyze
          </Button>
          {onRemove && (
            <Button
              onClick={(e) => {
                e.stopPropagation()
                onRemove()
              }}
              variant="outline"
              size="xs"
              className="px-2 border-gray-200 text-foreground hover:text-red-600 hover:border-red-200 hover:bg-red-50"
            >
              <Delete02Icon className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
