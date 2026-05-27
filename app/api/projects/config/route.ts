import { NextResponse } from 'next/server'
import { googleAuthConfigured, isProjectCreatorEmail } from '@/lib/auth'
import { requireSession } from '@/lib/auth-helpers'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await requireSession()

  return NextResponse.json({
    googleConfigured: googleAuthConfigured,
    canCreateProjects: isProjectCreatorEmail(session?.user.email),
    syncEnabled: process.env.NEXT_PUBLIC_FEEDBACK_SYNC === 'on'
  })
}
