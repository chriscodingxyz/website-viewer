'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

export type FontFamily = 
  | 'ibm-plex-mono'
  | 'inter' 
  | 'roboto'
  | 'montserrat'
  | 'poppins'
  | 'lato'
  | 'playfair-display'

export const fontOptions: { value: FontFamily; label: string; description: string }[] = [
  { value: 'ibm-plex-mono', label: 'IBM Plex Mono', description: 'Current monospace font' },
  { value: 'inter', label: 'Inter', description: 'Modern & clean' },
  { value: 'roboto', label: 'Roboto', description: 'Google\'s flagship' },
  { value: 'montserrat', label: 'Montserrat', description: 'Buenos Aires inspired' },
  { value: 'poppins', label: 'Poppins', description: 'Geometric & sleek' },
  { value: 'lato', label: 'Lato', description: 'Warm & inviting' },
  { value: 'playfair-display', label: 'Playfair Display', description: 'Elegant serif' }
]

interface FontContextType {
  font: FontFamily
  setFont: (font: FontFamily) => void
}

const FontContext = createContext<FontContextType | undefined>(undefined)

export function FontProvider({ children }: { children: React.ReactNode }) {
  const [font, setFont] = useState<FontFamily>('inter')

  useEffect(() => {
    const stored = localStorage.getItem('font-preference')
    if (stored && fontOptions.some(f => f.value === stored)) {
      setFont(stored as FontFamily)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('font-preference', font)
    
    // Apply font class to document body
    const body = document.body
    
    // Remove all font classes
    fontOptions.forEach(f => {
      body.classList.remove(`font-${f.value}`)
    })
    
    // Add selected font class
    body.classList.add(`font-${font}`)
  }, [font])

  return (
    <FontContext.Provider value={{ font, setFont }}>
      {children}
    </FontContext.Provider>
  )
}

export function useFont() {
  const context = useContext(FontContext)
  if (context === undefined) {
    throw new Error('useFont must be used within a FontProvider')
  }
  return context
}