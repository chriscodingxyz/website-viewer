'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
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
  Settings,
  Eye,
  Link as LinkIcon,
  Twitter,
  Facebook,
  Linkedin,
  Mail
} from 'lucide-react'
import { toast } from 'sonner'

interface ShareableLinkProps {
  currentUrl: string
  section: 'viewports' | 'seo' | 'social' | 'technical'
  domainName: string
  className?: string
}

const sectionConfig = {
  viewports: {
    label: 'Viewports',
    icon: Eye,
    description: 'Multi-device website preview',
    emoji: '📱'
  },
  seo: {
    label: 'SEO Analysis',
    icon: BarChart3,
    description: 'SEO score and optimization insights',
    emoji: '🔍'
  },
  social: {
    label: 'Social Media',
    icon: Share,
    description: 'Social media sharing previews',
    emoji: '💬'
  },
  technical: {
    label: 'Technical',
    icon: Settings,
    description: 'Technical metadata and headers',
    emoji: '⚙️'
  }
}

export default function ShareableLink({ currentUrl, section, domainName, className = '' }: ShareableLinkProps) {
  const [copied, setCopied] = useState(false)
  const [open, setOpen] = useState(false)
  const [shareableUrl, setShareableUrl] = useState('')

  const config = sectionConfig[section]
  const IconComponent = config.icon

  // Generate the shareable URL on the client side
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setShareableUrl(`${window.location.origin}/${section}?site=${encodeURIComponent(currentUrl)}`)
    }
  }, [section, currentUrl])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareableUrl)
      setCopied(true)
      toast.success(`${config.label} link copied!`)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      toast.error('Failed to copy link')
    }
  }

  const handleOpenInNewTab = () => {
    window.open(shareableUrl, '_blank', 'noopener,noreferrer')
    toast.success(`Opened in new tab`)
  }

  const handleShareVia = (platform: 'twitter' | 'linkedin' | 'facebook' | 'email') => {
    const text = `Check out this ${config.label.toLowerCase()} for ${domainName}`
    let shareUrl = ''

    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareableUrl)}`
        break
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareableUrl)}`
        break
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareableUrl)}`
        break
      case 'email':
        shareUrl = `mailto:?subject=${encodeURIComponent(text)}&body=${encodeURIComponent(`${text}\n\n${shareableUrl}`)}`
        break
    }

    window.open(shareUrl, '_blank', 'noopener,noreferrer,width=600,height=600')
    toast.success(`Sharing via ${platform.charAt(0).toUpperCase() + platform.slice(1)}`)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`w-9 h-9 p-0 ${className}`.trim()}
          title="Share this analysis"
        >
          <Share2 className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[420px] p-0" align="end">
        <div className="p-4 space-y-4">
          {/* Header */}
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
              <span className="text-xl">{config.emoji}</span>
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-base">{config.label}</h4>
              <p className="text-sm text-muted-foreground">{config.description}</p>
            </div>
          </div>

          <Separator />

          {/* Shareable Link */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <LinkIcon className="h-4 w-4" />
              Shareable Link
            </label>
            <div className="flex gap-2">
              <Input
                value={shareableUrl}
                readOnly
                className="text-xs font-mono bg-muted/50"
                onClick={(e) => e.currentTarget.select()}
              />
              <Button
                size="sm"
                onClick={handleCopy}
                className="shrink-0 min-w-[80px]"
                variant={copied ? 'default' : 'secondary'}
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-1" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-1" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Quick Actions */}
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
          </div>

          <Separator />

          {/* Share via Social Media */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Share via</label>
            <div className="grid grid-cols-4 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleShareVia('twitter')}
                className="flex flex-col gap-1 h-auto py-3"
                title="Share on Twitter"
              >
                <Twitter className="h-4 w-4 text-sky-500" />
                <span className="text-xs">Twitter</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleShareVia('linkedin')}
                className="flex flex-col gap-1 h-auto py-3"
                title="Share on LinkedIn"
              >
                <Linkedin className="h-4 w-4 text-blue-600" />
                <span className="text-xs">LinkedIn</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleShareVia('facebook')}
                className="flex flex-col gap-1 h-auto py-3"
                title="Share on Facebook"
              >
                <Facebook className="h-4 w-4 text-blue-500" />
                <span className="text-xs">Facebook</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleShareVia('email')}
                className="flex flex-col gap-1 h-auto py-3"
                title="Share via Email"
              >
                <Mail className="h-4 w-4 text-gray-600" />
                <span className="text-xs">Email</span>
              </Button>
            </div>
          </div>

          <Separator />

          {/* Site Info */}
          <div className="bg-muted/30 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1.5">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Analyzing</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs font-mono">
                {domainName}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {section.toUpperCase()}
              </Badge>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}