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
    <div className="bg-card rounded-xl p-4 border border-border shadow-sm hover-lift flex flex-col justify-between h-full group cursor-pointer" onClick={onView}>
      <div className="flex items-start gap-3 mb-3">
        {/* Icon / Logo */}
        <div className="w-10 h-10 rounded-full bg-muted/50 border border-border/50 flex items-center justify-center flex-shrink-0 overflow-hidden group-hover:bg-muted transition-colors duration-200">
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
          <Globe02Icon className="w-6 h-6 text-muted-foreground absolute opacity-0" style={{ opacity: 0 }} />
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

      <div className="mt-auto pt-3 border-t border-border/50">
        <div className="flex gap-2">
          <Button
            onClick={(e) => { e.stopPropagation(); onView(); }}
            className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
            size="sm"
          >
            Analyze
          </Button>
          {onRemove && (
            <Button
              onClick={(e) => {
                e.stopPropagation()
                onRemove()
              }}
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            >
              <Delete02Icon className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
