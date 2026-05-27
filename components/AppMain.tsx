'use client'

import { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const workspacePrefixes = ['/dashboard', '/projects', '/p/']

export default function AppMain({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const isWorkspace =
    pathname === '/' ||
    workspacePrefixes.some(prefix => pathname?.startsWith(prefix))

  return (
    <main className={cn('flex-1', !isWorkspace && 'pt-16')}>
      {children}
    </main>
  )
}
