'use client'

import React from 'react'
// import ThemeToggle from '@/components/ThemeToggle'
import { GithubLogo, LinkedinLogo, XLogo } from '@phosphor-icons/react'
import { useWebsiteViewer } from '@/contexts/WebsiteViewerContext'

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear()
  const { currentSite } = useWebsiteViewer()

  // Hide footer when a site is loaded (analysis tools take over)
  if (currentSite) {
    return null
  }

  return (
    <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex items-center justify-between px-2 sm:px-4 py-2">
        {/* Left Side: Branding & Copyright */}
        <div className="flex items-center gap-1 sm:gap-3">
          <p className="text-xs text-muted-foreground">
            © {currentYear}{' '}
            <a
              href="https://chriswiz.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary hover:underline"
            >
              cherrydub 🍒
            </a>
          </p>
        </div>

        {/* Center: Social Icons */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <a
            href="https://github.com/chriscodingxyz"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
            className="rounded-full p-1 sm:p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <GithubLogo size={14} className="sm:w-4 sm:h-4" />
          </a>
          <a
            href="https://linkedin.com/in/wisniewskichris"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn"
            className="rounded-full p-1 sm:p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <LinkedinLogo size={14} className="sm:w-4 sm:h-4" />
          </a>
          <a
            href="https://twitter.com/chriscodingxyz"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="X (formerly Twitter)"
            className="rounded-full p-1 sm:p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <XLogo size={14} className="sm:w-4 sm:h-4" />
          </a>
        </div>

        {/* Right Side: Theme Toggle */}
        {/* <div className="flex items-center">
          <ThemeToggle />
        </div> */}
      </div>
    </footer>
  )
}

export default Footer