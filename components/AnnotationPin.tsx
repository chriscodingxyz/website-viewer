'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { X, MessageSquare } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover'

export interface Annotation {
  id: string
  x: number
  y: number
  text: string
  timestamp: number
}

interface AnnotationPinProps {
  annotation: Annotation
  onUpdate: (id: string, text: string) => void
  onDelete: (id: string) => void
  isEditing?: boolean
  number: number
  color: string
}

export function AnnotationPin({ annotation, onUpdate, onDelete, isEditing = false, number, color }: AnnotationPinProps) {
  const [isOpen, setIsOpen] = useState(isEditing)
  const [text, setText] = useState(annotation.text)

  const handleSave = () => {
    onUpdate(annotation.id, text)
    setIsOpen(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave()
    }
    if (e.key === 'Escape') {
      setText(annotation.text)
      setIsOpen(false)
    }
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          size="sm"
          className="absolute w-5 h-5 p-0 rounded-full text-xs font-bold shadow-md hover:scale-110 hover:shadow-lg transition-all duration-200 z-50 border border-white select-none cursor-pointer"
          style={{
            left: `${annotation.x}px`,
            top: `${annotation.y}px`,
            transform: 'translate(-50%, -50%)',
            backgroundColor: color,
            color: 'white',
            fontSize: '10px'
          }}
          title={annotation.text || 'Click to edit annotation'}
        >
          {number}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full text-xs font-bold flex items-center justify-center text-white"
                style={{ backgroundColor: color, fontSize: '10px' }}
              >
                {number}
              </div>
              <h4 className="font-medium text-sm">Annotation #{number}</h4>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
              onClick={() => onDelete(annotation.id)}
              title="Delete annotation"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
          <Input
            placeholder="Add your note..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            className="text-sm"
            autoFocus
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave} className="flex-1">
              Save
            </Button>
          </div>
          <div className="text-xs text-muted-foreground">
            Created: {new Date(annotation.timestamp).toLocaleString()}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}