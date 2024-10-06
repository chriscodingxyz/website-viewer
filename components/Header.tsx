'use client'

import ThemeToggle from '@/components/ThemeToggle'
import {
  Monofett,
  Silkscreen,
  Poppins,
  Raleway,
  Rajdhani,
  Indie_Flower,
  Montserrat_Alternates,
  Space_Mono,
  Poiret_One
} from 'next/font/google'
import { Button } from './ui/button'
import { Menu } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem
} from '@/components/ui/dropdown-menu'
import Link from 'next/link'
import { useState } from 'react'

const monofett = Monofett({
  subsets: ['latin'],
  weight: ['400']
})

const silkscreen = Silkscreen({
  subsets: ['latin'],
  weight: ['400']
})

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400']
})

const raleway = Raleway({
  subsets: ['latin'],
  weight: ['700']
})

const rajdhani = Rajdhani({
  subsets: ['latin'],
  weight: ['400']
})

const indieFlower = Indie_Flower({
  subsets: ['latin'],
  weight: ['400']
})

const montserratAlternates = Montserrat_Alternates({
  subsets: ['latin'],
  weight: ['400']
})

const spaceMono = Space_Mono({
  subsets: ['latin'],
  weight: ['400']
})

const poiretOne = Poiret_One({
  subsets: ['latin'],
  weight: ['400']
})

export function Header () {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <header className='border-b px-4 top-0 sticky z-50 bg-background'>
      <div className='container mx-auto flex justify-between items-center'>
        <a href='/'>
          <h1
            className={`text-md tracking-tight drop-shadow-lg space-x-1
${raleway.className}`}
          >
            cherrydub 🍒
          </h1>
        </a>
        <div className='flex items-center space-x-2'>
          <ThemeToggle />
          {/* <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
              <Button size={'icon'} variant={'ghost'}>
                <Menu />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuItem asChild>
                <Link href='/favorites' onClick={() => setIsOpen(false)}>
                  Show Favorites
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href='/history' onClick={() => setIsOpen(false)}>
                  Show History
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu> */}
        </div>
      </div>
    </header>
  )
}
