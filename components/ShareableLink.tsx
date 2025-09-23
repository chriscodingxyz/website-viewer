'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Share2,
  Copy,
  Check,
  ExternalLink,
  Globe,
  BarChart3,
  Share,
  Settings
} from 'lucide-react'
import { toast } from 'sonner'

interface ShareableLinkProps {
  currentUrl: string
  section: 'viewports' | 'seo' | 'social' | 'technical'
  domainName: string
}

const sectionConfig = {
  viewports: {
    label: 'Viewports',
    icon: Globe,
    description: 'Multi-device website preview'
  },
  seo: {
    label: 'SEO Analysis',
    icon: BarChart3,
    description: 'SEO score and optimization insights'
  },
  social: {
    label: 'Social Media',
    icon: Share,
    description: 'Social media sharing previews'
  },
  technical: {
    label: 'Technical',
    icon: Settings,
    description: 'Technical metadata and headers'
  }
}

export default function ShareableLink({ currentUrl, section, domainName }: ShareableLinkProps) {
  const [copied, setCopied] = useState(false)
  const [open, setOpen] = useState(false)

  const config = sectionConfig[section]
  const IconComponent = config.icon

  // Generate the shareable URL
  const shareableUrl = `${window.location.origin}/${section}?site=${encodeURIComponent(domainName)}`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareableUrl)
      setCopied(true)
      toast.success(`${config.label} link copied to clipboard!`)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      toast.error('Failed to copy link')
    }
  }

  const handleOpenInNewTab = () => {
    window.open(shareableUrl, '_blank', 'noopener,noreferrer')
    toast.success(`Opened ${config.label} in new tab`)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <Share2 className="h-4 w-4" />
          Share
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-4" align="end">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <IconComponent className="h-5 w-5 text-primary" />
            <div>
              <h4 className="font-semibold">{config.label}</h4>
              <p className="text-sm text-muted-foreground">{config.description}</p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Shareable Link</label>
            <div className="flex gap-2">
              <Input
                value={shareableUrl}
                readOnly
                className="text-xs font-mono"
              />
              <Button
                size="sm"
                onClick={handleCopy}
                className="shrink-0"
              >
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenInNewTab}
              className="flex-1"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open in New Tab
            </Button>
            <Button
              size="sm"
              onClick={handleCopy}
              className="flex-1"
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy Link
            </Button>
          </div>

          <div className="pt-2 border-t">
            <div className="flex items-center gap-2 mb-2">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Analyzing</span>
            </div>
            <Badge variant="outline" className="text-xs">
              {domainName}
            </Badge>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}