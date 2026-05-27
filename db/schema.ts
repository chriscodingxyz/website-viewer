import {
  pgTable,
  text,
  timestamp,
  boolean,
  jsonb,
  integer,
  doublePrecision,
  uniqueIndex,
  index
} from 'drizzle-orm/pg-core'

/* ------------------------------------------------------------------
 * better-auth tables. Names + columns mirror better-auth defaults so
 * the Drizzle adapter wires automatically.
 * ------------------------------------------------------------------ */

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
})

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  activeOrganizationId: text('active_organization_id'),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' })
})

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
})

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
})

/* ------------------------------------------------------------------
 * better-auth organization plugin. UI copy calls these Projects.
 * ------------------------------------------------------------------ */

export const organization = pgTable(
  'organization',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    slug: text('slug').notNull().unique(),
    logo: text('logo'),
    metadata: text('metadata'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow()
  },
  table => ({
    slugIdx: uniqueIndex('organization_slug_idx').on(table.slug)
  })
)

export const member = pgTable(
  'member',
  {
    id: text('id').primaryKey(),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    role: text('role').notNull().default('client'),
    createdAt: timestamp('created_at').notNull().defaultNow()
  },
  table => ({
    organizationIdx: index('member_organization_idx').on(table.organizationId),
    userIdx: index('member_user_idx').on(table.userId),
    orgUserIdx: uniqueIndex('member_org_user_idx').on(
      table.organizationId,
      table.userId
    )
  })
)

export const invitation = pgTable(
  'invitation',
  {
    id: text('id').primaryKey(),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),
    email: text('email').notNull(),
    role: text('role').notNull(),
    status: text('status').notNull().default('pending'),
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    inviterId: text('inviter_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' })
  },
  table => ({
    organizationIdx: index('invitation_organization_idx').on(
      table.organizationId
    ),
    emailIdx: index('invitation_email_idx').on(table.email)
  })
)

/* ------------------------------------------------------------------
 * Feedback domain
 * ------------------------------------------------------------------ */

export const feedbackSession = pgTable(
  'feedback_session',
  {
    id: text('id').primaryKey(),
    slug: text('slug').notNull().unique(),
    userId: text('user_id').references(() => user.id, { onDelete: 'set null' }),
    organizationId: text('organization_id').references(() => organization.id, {
      onDelete: 'cascade'
    }),
    url: text('url').notNull(),
    title: text('title'),
    userAgent: text('user_agent'),
    capturedViewports: jsonb('captured_viewports'),
    isPublic: boolean('is_public').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow()
  },
  table => ({
    slugIdx: uniqueIndex('feedback_session_slug_idx').on(table.slug),
    userIdx: index('feedback_session_user_idx').on(table.userId),
    organizationIdx: index('feedback_session_organization_idx').on(
      table.organizationId
    )
  })
)

export const feedbackPin = pgTable(
  'feedback_pin',
  {
    id: text('id').primaryKey(),
    sessionId: text('session_id')
      .notNull()
      .references(() => feedbackSession.id, { onDelete: 'cascade' }),
    number: integer('number').notNull(),
    kind: text('kind').notNull().default('comment'),
    url: text('url').notNull(),
    viewportId: integer('viewport_id').notNull(),
    viewportType: text('viewport_type').notNull(),
    viewportWidth: integer('viewport_width').notNull(),
    viewportHeight: integer('viewport_height').notNull(),
    x: doublePrecision('x').notNull(),
    y: doublePrecision('y').notNull(),
    documentX: doublePrecision('document_x'),
    documentY: doublePrecision('document_y'),
    scrollX: doublePrecision('scroll_x'),
    scrollY: doublePrecision('scroll_y'),
    cssSelector: text('css_selector'),
    playwrightLocator: text('playwright_locator'),
    elementText: text('element_text'),
    elementTag: text('element_tag'),
    elementAttributes: jsonb('element_attributes'),
    elementHtml: text('element_html'),
    ancestorChain: jsonb('ancestor_chain'),
    replacementText: text('replacement_text'),
    editInstruction: text('edit_instruction'),
    severity: text('severity').notNull(),
    comment: text('comment').notNull().default(''),
    screenshotKey: text('screenshot_key'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow()
  },
  table => ({
    sessionIdx: index('feedback_pin_session_idx').on(table.sessionId)
  })
)

export type DbUser = typeof user.$inferSelect
export type DbOrganization = typeof organization.$inferSelect
export type DbMember = typeof member.$inferSelect
export type DbInvitation = typeof invitation.$inferSelect
export type DbFeedbackSession = typeof feedbackSession.$inferSelect
export type DbFeedbackPin = typeof feedbackPin.$inferSelect
