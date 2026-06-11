# Bugsmash / Website Viewer

Bugsmash is a visual website review workspace built with Next.js 14. Teams create projects for websites, load pages through a proxy-backed iframe canvas, pin feedback to exact elements, discuss tasks in threads, and share implementation briefs.

The repository also keeps the older Website Viewer and metadata analysis routes (`/viewer`, `/seo`, `/social`, `/technical`, `/viewports`, `/report`, `/compare`) for responsive previews and SEO/social/technical checks.

## Local Development

Install dependencies:

```bash
npm install
```

Start the Next.js dev server:

```bash
npm run dev
```

By default the app runs at `http://localhost:3000`. If port `3000` is busy, Next.js will choose the next available port.

## Useful Commands

```bash
npm run dev      # Start the development server
npm run build    # Build the production app
npm run start    # Start the production server
npm run lint     # Run ESLint
```

## Optional Local Services

Bugsmash can run without database, auth, or upload services. When those environment variables are absent, feedback sync no-ops and the local browser flow remains usable.

For server-backed feedback sessions and uploads:

```bash
npm run infra:up
npm run db:generate
npm run db:migrate
```

Copy `.env.example` to `.env.local` when configuring local auth, database, or S3-compatible storage. Enable server sync only when the required services are configured.

## Testing Status

There is no dedicated test suite configured yet. Use `npm run lint`, `npm run build`, and manual browser verification for changed workflows.
