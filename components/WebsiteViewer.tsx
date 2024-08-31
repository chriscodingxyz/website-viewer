'use client'

import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PlusCircle } from 'lucide-react'
import WebsiteView from './WebsiteView'


export type ViewType = 'desktop' | 'tablet' | 'mobile'

export interface View {
  id: number
  url: string
  type: ViewType
}

export default function WebsiteViewer() {
  const [url, setUrl] = useState('')
  const [views, setViews] = useState<View[]>([])
  const [nextId, setNextId] = useState(1)

  const addView = () => {
    if (url) {
      setViews([...views, { id: nextId, url, type: 'desktop' }])
      setNextId(nextId + 1)
    }
  }

  const removeView = (id: number) => {
    setViews(views.filter(view => view.id !== id))
  }

  const changeViewType = (id: number, type: ViewType) => {
    setViews(views.map(view => view.id === id ? { ...view, type } : view))
  }

  return (
    <div>
      <div className="mb-6">
        <Label htmlFor="url-input" className="mb-2 block">Enter Website URL:</Label>
        <div className="flex gap-2">
          <Input
            id="url-input"
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com or http://localhost:3000"
            className="flex-grow"
          />
          <Button onClick={addView}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add View
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {views.map(view => (
          <WebsiteView
            key={view.id}
            view={view}
            onRemove={() => removeView(view.id)}
            onTypeChange={(type) => changeViewType(view.id, type)}
          />
        ))}
      </div>
    </div>
  )
}