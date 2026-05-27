import type { Config } from 'drizzle-kit'

export default {
  schema: './db/schema.ts',
  out: './db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'postgres://webviewer:webviewer_dev_password@localhost:5432/webviewer'
  },
  verbose: true,
  strict: true
} satisfies Config
