'use client'

import Link from 'next/link'
import { ReactNode, useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger
} from '@/components/ui/sidebar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Bug,
  CaretUpDown,
  Folder,
  GlobeHemisphereWest,
  PlusCircle,
  SignOut,
  SquaresFour,
  UserCircle
} from '@phosphor-icons/react'
import { signInWithGoogle, signOut } from '@/lib/auth-client'
import { toast } from 'sonner'
import SiteFavicon from '@/components/SiteFavicon'

type NavProject = {
  id: string
  name: string
  websiteUrl: string
  pinCount: number
}

interface Props {
  children: ReactNode
  user: { name: string | null; email: string | null; image: string | null } | null
  canCreate: boolean
  projects: NavProject[]
}

export default function BugsmashShell({ children, user, canCreate, projects }: Props) {
  const pathname = usePathname()
  const [googleConfigured, setGoogleConfigured] = useState(false)

  useEffect(() => {
    fetch('/api/projects/config')
      .then(res => (res.ok ? res.json() : null))
      .then(data => setGoogleConfigured(Boolean(data?.googleConfigured)))
      .catch(() => {})
  }, [])

  const signIn = async () => {
    if (!googleConfigured) {
      toast.error('Google OAuth is not configured yet.')
      return
    }
    await signInWithGoogle(window.location.href)
  }

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === '/dashboard' : pathname?.startsWith(href)

  const isProjectActive = (id: string) => pathname === `/p/${id}`

  return (
    <SidebarProvider>
      <Sidebar collapsible='icon'>
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size='lg' asChild>
                <Link href='/'>
                  <span className='flex aspect-square size-8 items-center justify-center rounded-lg bg-foreground text-background'>
                    <Bug weight='fill' className='size-4' />
                  </span>
                  <div className='grid flex-1 text-left text-sm leading-tight'>
                    <span className='truncate font-semibold'>Bugsmash</span>
                    <span className='truncate text-xs text-muted-foreground'>
                      Visual review
                    </span>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive('/dashboard')} tooltip='Dashboard'>
                    <Link href='/dashboard'>
                      <SquaresFour />
                      <span>Dashboard</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                {canCreate && (
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === '/projects/new'}
                      tooltip='New project'
                    >
                      <Link href='/projects/new'>
                        <PlusCircle />
                        <span>New project</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip='Free viewer'>
                    <Link href='/viewer'>
                      <GlobeHemisphereWest />
                      <span>Free viewer</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {projects.length > 0 && (
            <SidebarGroup>
              <SidebarGroupLabel>Projects</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {projects.map(project => (
                    <SidebarMenuItem key={project.id}>
                      <SidebarMenuButton
                        asChild
                        isActive={isProjectActive(project.id)}
                        tooltip={project.name}
                      >
                        <Link href={`/p/${project.id}`}>
                          <SiteFavicon siteUrl={project.websiteUrl} className='size-4 rounded-sm border-0' />
                          <span>{project.name}</span>
                        </Link>
                      </SidebarMenuButton>
                      {project.pinCount > 0 && (
                        <SidebarMenuBadge>{project.pinCount}</SidebarMenuBadge>
                      )}
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}
        </SidebarContent>

        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuButton size='lg' className='data-[state=open]:bg-accent/10'>
                      <Avatar className='size-8 rounded-lg'>
                        {user.image && <AvatarImage src={user.image} alt={user.name ?? ''} />}
                        <AvatarFallback className='rounded-lg bg-muted text-xs'>
                          {(user.name || user.email || '?').slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className='grid flex-1 text-left text-sm leading-tight'>
                        <span className='truncate font-medium'>
                          {user.name ?? user.email}
                        </span>
                        <span className='truncate text-xs text-muted-foreground'>
                          {user.email}
                        </span>
                      </div>
                      <CaretUpDown className='ml-auto size-4' />
                    </SidebarMenuButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align='end'
                    side='right'
                    className='min-w-56'
                  >
                    <DropdownMenuLabel>
                      <div className='grid'>
                        <span className='truncate text-sm font-medium'>
                          {user.name ?? 'Signed in'}
                        </span>
                        <span className='truncate text-xs font-normal text-muted-foreground'>
                          {user.email}
                        </span>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href='/dashboard'>
                        <SquaresFour className='mr-2 size-4' />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => signOut()}>
                      <SignOut className='mr-2 size-4' />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <SidebarMenuButton size='lg' onClick={signIn} disabled={!googleConfigured}>
                  <Avatar className='size-8 rounded-lg'>
                    <AvatarFallback className='rounded-lg bg-muted text-xs'>
                      <UserCircle className='size-4' />
                    </AvatarFallback>
                  </Avatar>
                  <div className='grid flex-1 text-left text-sm leading-tight'>
                    <span className='truncate font-medium'>
                      {googleConfigured ? 'Sign in' : 'Google not set'}
                    </span>
                    <span className='truncate text-xs text-muted-foreground'>
                      Continue with Google
                    </span>
                  </div>
                </SidebarMenuButton>
              )}
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <SidebarInset>
        <header className='sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b border-border/60 bg-background/95 px-4 backdrop-blur'>
          <SidebarTrigger className='-ml-1' />
          <Separator orientation='vertical' className='mr-2 h-4' />
          <Breadcrumbs pathname={pathname ?? ''} projects={projects} />
          {/* Project pages portal their actions (badges, SEO, Settings, Share,
              Export) into this slot so the workspace needs no second header. */}
          <div id='ws-header-slot' className='ml-auto flex min-w-0 items-center gap-2' />
        </header>
        <div className='flex-1'>{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}

function Breadcrumbs({ pathname, projects }: { pathname: string; projects: NavProject[] }) {
  if (pathname === '/dashboard') {
    return <span className='text-sm font-medium'>Dashboard</span>
  }
  if (pathname === '/projects/new') {
    return (
      <span className='inline-flex items-center gap-1.5 text-sm'>
        <Link href='/dashboard' className='text-muted-foreground hover:text-foreground'>
          Dashboard
        </Link>
        <span className='text-muted-foreground'>/</span>
        <span className='font-medium'>New project</span>
      </span>
    )
  }
  if (pathname.startsWith('/p/')) {
    const id = pathname.split('/')[2]
    const project = projects.find(p => p.id === id)
    return (
      <span className='inline-flex items-center gap-1.5 text-sm'>
        <Link href='/dashboard' className='text-muted-foreground hover:text-foreground'>
          Projects
        </Link>
        <span className='text-muted-foreground'>/</span>
        <span className='font-medium'>{project?.name ?? 'Project'}</span>
      </span>
    )
  }
  return null
}
