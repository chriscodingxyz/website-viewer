'use client'

import React from 'react'
import ThemeToggle from '@/components/ThemeToggle'

export function LayoutHeader() {
  return (
    <header className='bg-background border-b px-4 py-3 flex-shrink-0'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-3'>
          <h1 className='text-lg font-medium'>
            Website Viewer
          </h1>
        </div>
        <ThemeToggle />
      </div>
    </header>
  )
}