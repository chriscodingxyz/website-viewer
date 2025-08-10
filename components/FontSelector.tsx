'use client'

import { useFont, fontOptions, type FontFamily } from '@/contexts/FontContext'
import { Type } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'

export function FontSelector() {
  const { font, setFont } = useFont()

  const currentFont = fontOptions.find(f => f.value === font)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="h-12 w-12 p-0 border-2 border-border/50 hover:border-border shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 bg-card/90 hover:bg-card rounded-2xl"
          title="Change font family"
        >
          <Type className="h-4 w-4" />
          <span className="sr-only">Switch font</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {fontOptions.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => setFont(option.value)}
            className="cursor-pointer"
          >
            <div className="flex flex-col items-start gap-1">
              <div className={`font-${option.value} font-medium`}>
                {option.label}
                {font === option.value && ' ✓'}
              </div>
              <div className="text-xs text-muted-foreground">
                {option.description}
              </div>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}