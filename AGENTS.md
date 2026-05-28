# AGENTS.md

This file guides Codex when working in this repository.

## Commands

### Development
- `npm run dev` - Start the Next.js dev server on http://localhost:3000
- `npm run build` - Build the production app
- `npm run start` - Start the production server
- `npm run lint` - Run ESLint

### Database
- `npm run infra:up` / `npm run infra:down` - Start or stop Docker services
- `npm run db:generate` - Generate Drizzle migrations from schema changes
- `npm run db:migrate` - Apply Drizzle migrations
- `npm run db:push` - Push schema changes directly
- `npm run db:studio` - Open Drizzle Studio

There is no dedicated test suite configured yet. Use lint/build plus manual browser verification for changed workflows.

## Product Overview

The primary product is **Bugsmash**, a visual website review workspace. Teams create projects for websites, load the site through a proxy-backed iframe canvas, drop pinned feedback on exact elements, discuss tasks in threads, and share implementation briefs.

The older Website Viewer and SEO analysis routes still exist (`/viewer`, `/seo`, `/social`, `/technical`, `/viewports`, `/report`, `/compare`) and should not be broken, but new review workflow work usually belongs to the Bugsmash project area.

## Main App Structure

### Bugsmash Routes
- `app/(bugsmash)/dashboard/page.tsx` - Signed-in project dashboard with project metrics and owner management actions
- `app/(bugsmash)/projects/new/page.tsx` - Guided project creation flow
- `app/(bugsmash)/p/[projectId]/page.tsx` - Project workspace loader
- `app/invite/[id]/page.tsx` - Invitation acceptance page

### Bugsmash Components
- `components/bugsmash/BugsmashShell.tsx` - Sidebar shell for dashboard, project, and create routes
- `components/bugsmash/ProjectWorkspace.tsx` - Main workspace layout and current page state
- `components/bugsmash/ProjectCanvas.tsx` - Proxy iframe renderer, viewport controls, preview mode, page navigation, and commented-page preloading
- `components/bugsmash/ProjectCommentPanel.tsx` - Task list, open/closed workflow, page grouping, replies, export/copy actions, and pin details
- `components/bugsmash/ProjectOwnerActions.tsx` - Owner-only member/invite/access management on the dashboard
- `components/bugsmash/NewProjectForm.tsx` - Project creation form with URL identity preview and access setting
- `components/SiteFavicon.tsx` - Reusable favicon component with metadata, apple-touch, `/favicon.ico`, Google S2, and local fallback handling

### Feedback Components
- `contexts/FeedbackContext.tsx` - Primary client state for sessions, pins, selected pin, syncing, export modal state, and edit permissions
- `components/feedback/FeedbackOverlay.tsx` - Canvas overlay for adding pins and rendering element outlines
- `components/feedback/PinMarker.tsx` - Popover editor for coordinate/comment pins
- `components/feedback/ExportDialog.tsx` - Export UI
- `lib/feedback/export.ts` - Markdown/JSON implementation brief generation
- `lib/feedback/inspectActions.ts` - Inspect/edit intent definitions and action inference
- `lib/feedback/url.ts` - Canonical URL/path helpers for feedback pages

## Data Model

The app uses Drizzle with PostgreSQL (`db/schema.ts`) and Better Auth organization tables.

### Auth and Projects
- Better Auth tables: `user`, `session`, `account`, `verification`
- Organization plugin tables: `organization`, `member`, `invitation`
- Bugsmash project table: `project`
- Organization UI copy calls organizations "Projects"; the `project` row stores the reviewed website and points to its organization.
- Roles are defined in `lib/project-access.ts`: `owner`, `dev`, `client`.
- Project creation is restricted by `PROJECT_CREATOR_EMAILS` in `lib/auth.ts`.

### Feedback
- `feedback_session` stores one review session per project.
- `feedback_pin` stores task pins. Pins have `kind` (`comment` or `inspect`) and `status` (`open` or `closed`, default `open`).
- `feedback_pin_reply` stores discussion replies.
- `types/feedback.ts` is the Zod/type source for serialized feedback sessions.

## API Routes

- `app/api/projects/route.ts` - List/create projects
- `app/api/projects/[projectId]/route.ts` - Load/update project details and access
- `app/api/projects/[projectId]/feedback/route.ts` - Persist feedback sessions and pins
- `app/api/projects/[projectId]/pins/[pinId]/replies/route.ts` - Create replies
- `app/api/projects/[projectId]/pins/[pinId]/replies/[replyId]/route.ts` - Delete replies
- `app/api/proxy/route.ts` - Fetches and rewrites target pages/assets so iframe navigation, element inspection, and preview mode work
- `app/api/metadata/route.ts` - Extracts metadata, icons, SEO, social, technical details
- `app/api/auth/[...all]/route.ts` - Better Auth endpoint

## Proxy Renderer Notes

`app/api/proxy/route.ts` rewrites HTML, CSS, JS, links, forms, and common asset URLs through `/api/proxy?url=...`. It injects a small script that:
- keeps same-site navigation inside the iframe,
- posts page URL changes to the parent canvas,
- disables common frame-busting behavior,
- supports preview mode for inspect/edit pins.

Be careful with proxy changes. Verify normal links, SPA navigation, images, CSS, and preview mode after editing it.

## UI and Styling

- Framework: Next.js 14 App Router, React 18, TypeScript
- Styling: Tailwind CSS and shadcn/ui/Radix components
- Icons: Phosphor Icons are common in Bugsmash; Lucide is also available
- Notifications: Sonner
- Keep Bugsmash interfaces dense, scannable, and work-focused. Avoid marketing-page layouts for app screens.
- Existing design favors compact controls, restrained borders, small-radius cards, and clear status/action color semantics.

## Implementation Guidelines

- Prefer existing helpers and patterns before adding abstractions.
- Treat pins as tasks; do not introduce a separate issue tracker unless explicitly requested.
- Preserve public read-only behavior: non-members can view public projects but cannot edit, close, or reply.
- Owner-only management should be guarded server-side or by existing Better Auth permission checks, not just hidden in UI.
- When adding pin fields, update `db/schema.ts`, `types/feedback.ts`, `lib/projects.ts`, sync routes, exports, and client normalization together.
- When adding project fields, update create/update schemas and dashboard/project loaders together.
- After workflow changes, run `npm run lint` and `npm run build`.
