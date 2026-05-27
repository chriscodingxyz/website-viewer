import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { nextCookies } from 'better-auth/next-js'
import { organization } from 'better-auth/plugins/organization'
import { db, schema } from '@/db/client'
import { projectAc, projectRoles } from '@/lib/project-access'

const baseURL = process.env.BETTER_AUTH_URL || 'http://localhost:3000'
const secret = process.env.BETTER_AUTH_SECRET || 'dev-only-insecure-change-me'

const googleId = process.env.GOOGLE_CLIENT_ID
const googleSecret = process.env.GOOGLE_CLIENT_SECRET

export const googleAuthConfigured = Boolean(googleId && googleSecret)

export const projectCreatorEmails = (process.env.PROJECT_CREATOR_EMAILS || '')
  .split(',')
  .map(email => email.trim().toLowerCase())
  .filter(Boolean)

export function isProjectCreatorEmail(email?: string | null) {
  if (!email) return false
  return projectCreatorEmails.includes(email.toLowerCase())
}

const socialProviders = googleId && googleSecret
  ? {
      google: {
        clientId: googleId,
        clientSecret: googleSecret
      }
    }
  : undefined

/**
 * `auth` is null when DATABASE_URL is missing. Route handlers should guard
 * with `if (!auth) return new Response(...)` so the app still runs without
 * a server in localStorage-only mode.
 */
export const auth = db
  ? betterAuth({
      database: drizzleAdapter(db, {
        provider: 'pg',
        schema: {
          user: schema.user,
          session: schema.session,
          account: schema.account,
          verification: schema.verification,
          organization: schema.organization,
          member: schema.member,
          invitation: schema.invitation
        }
      }),
      baseURL,
      secret,
      ...(socialProviders ? { socialProviders } : {}),
      plugins: [
        organization({
          ac: projectAc,
          roles: projectRoles,
          creatorRole: 'owner',
          allowUserToCreateOrganization: user =>
            isProjectCreatorEmail(user.email),
          cancelPendingInvitationsOnReInvite: true,
          invitationExpiresIn: 60 * 60 * 24 * 7
        }),
        nextCookies()
      ]
    })
  : null

export type Auth = NonNullable<typeof auth>
