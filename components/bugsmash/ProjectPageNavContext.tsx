'use client'

import {
  createContext,
  Dispatch,
  ReactNode,
  SetStateAction,
  useContext,
  useState
} from 'react'

export type ProjectPageNavItem = {
  url: string
  path: string
  openCount: number
  doneCount: number
  totalCount: number
  isHome: boolean
}

export type ProjectPageNavState = {
  projectId: string
  currentUrl: string
  pages: ProjectPageNavItem[]
  navigateToPage: (url: string) => void
}

const ProjectPageNavContext = createContext<{
  nav: ProjectPageNavState | null
  setNav: Dispatch<SetStateAction<ProjectPageNavState | null>>
} | null>(null)

export function ProjectPageNavProvider({ children }: { children: ReactNode }) {
  const [nav, setNav] = useState<ProjectPageNavState | null>(null)

  return (
    <ProjectPageNavContext.Provider value={{ nav, setNav }}>
      {children}
    </ProjectPageNavContext.Provider>
  )
}

export function useProjectPageNav() {
  const value = useContext(ProjectPageNavContext)
  if (!value) {
    throw new Error('useProjectPageNav must be used inside ProjectPageNavProvider')
  }
  return value
}
