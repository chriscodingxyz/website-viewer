'use client'

import { createAuthClient } from 'better-auth/react'
import { organizationClient } from 'better-auth/client/plugins'
import { projectAc, projectRoles } from '@/lib/project-access'

export const authClient = createAuthClient({
  baseURL:
    process.env.NEXT_PUBLIC_BETTER_AUTH_URL ||
    (typeof window !== 'undefined'
      ? window.location.origin
      : 'http://localhost:3000'),
  plugins: [
    organizationClient({
      ac: projectAc,
      roles: projectRoles
    })
  ]
})

export const {
  signIn,
  signOut,
  useSession,
  useListOrganizations,
  useActiveOrganization,
  useActiveMember,
  useActiveMemberRole
} = authClient

export function signInWithGoogle(callbackURL?: string) {
  return signIn.social({
    provider: 'google',
    callbackURL
  })
}
