'use client'

import React, { useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Monitor, Tablet, Smartphone, Camera, X } from 'lucide-react'
import html2canvas from 'html2canvas'
import { View, ViewType } from './WebsiteViewer'

const viewDimensions = {
  desktop: { width: '1024px', height: '768px' },
  tablet: { width: '768px', height: '1024px' },
  mobile: { width: '375px', height: '667px' },
}

interface WebsiteViewProps {
  view: View
  onRemove: () => void
  onTypeChange: (type: ViewType) => void
}

export default function WebsiteView({ view, onRemove, onTypeChange }: WebsiteViewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const captureScreenshot = async () => {
    if (iframeRef.current) {
      try {
        const canvas = await html2canvas(iframeRef.current)
        const image = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream")
        const link = document.createElement('a')
        link.download = `screenshot-${view.type}-${Date.now()}.png`
        link.href = image
        link.click()
      } catch (error) {
        console.error('Failed to capture screenshot:', error)
        alert('Failed to capture screenshot. This might be due to cross-origin restrictions.')
      }
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {view.url}
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={onRemove}>
          <X className="h-4 w-4" />
          <span className="sr-only">Remove view</span>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center mb-4">
          <Select value={view.type} onValueChange={onTypeChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select view type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="desktop"><Monitor className="inline mr-2 h-4 w-4" /> Desktop</SelectItem>
              <SelectItem value="tablet"><Tablet className="inline mr-2 h-4 w-4" /> Tablet</SelectItem>
              <SelectItem value="mobile"><Smartphone className="inline mr-2 h-4 w-4" /> Mobile</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={captureScreenshot} size="sm">
            <Camera className="mr-2 h-4 w-4" /> Capture
          </Button>
        </div>
        <div className="overflow-hidden rounded-md border" style={{ width: viewDimensions[view.type].width, height: viewDimensions[view.type].height }}>
          <iframe
            ref={iframeRef}
            src={view.url}
            style={{ width: '100%', height: '100%', border: 'none' }}
            title={`View ${view.id}`}
          />
        </div>
      </CardContent>
    </Card>
  )
}