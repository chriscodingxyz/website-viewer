import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const connectionString = process.env.DATABASE_URL

/**
 * Singleton postgres client. Returns null when DATABASE_URL is missing so
 * the app falls back to client-only mode (localStorage). API routes that
 * require the DB should `if (!db) return 503`.
 */
let _client: ReturnType<typeof postgres> | null = null
let _db: ReturnType<typeof drizzle<typeof schema>> | null = null

function getClient() {
  if (!connectionString) return null
  if (!_client) {
    _client = postgres(connectionString, {
      max: 10,
      idle_timeout: 30,
      connect_timeout: 10
    })
  }
  return _client
}

export function getDb() {
  if (_db) return _db
  const client = getClient()
  if (!client) return null
  _db = drizzle(client, { schema })
  return _db
}

export const db = getDb()
export { schema }
