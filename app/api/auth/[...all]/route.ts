import { auth } from '@/lib/auth'
import { toNextJsHandler } from 'better-auth/next-js'

const fallback = () =>
  new Response(
    JSON.stringify({ error: 'Auth not configured. Set DATABASE_URL + BETTER_AUTH_SECRET.' }),
    { status: 503, headers: { 'Content-Type': 'application/json' } }
  )

const handlers = auth
  ? toNextJsHandler(auth.handler)
  : { GET: fallback, POST: fallback }

export const { GET, POST } = handlers
