# Phase 2 deploy guide

Server-backed feedback sessions: PSQL via Drizzle, file uploads via MinIO/S3, auth via better-auth.

The app **runs fine without any of this** — when env vars are missing, sync no-ops and the existing localStorage flow stays as the source of truth. Flip `NEXT_PUBLIC_FEEDBACK_SYNC=on` only when DB + auth are wired.

---

## 1. Local dev

```bash
# Start Postgres + MinIO (with a feedback-uploads bucket auto-created)
npm run infra:up

# Copy env template and fill in BETTER_AUTH_SECRET (openssl rand -base64 32)
cp .env.example .env.local

# Generate + apply Drizzle migrations
npm run db:generate
npm run db:migrate

# Optional GUI for the DB
npm run db:studio

npm run dev
```

MinIO console: http://localhost:9001 (user/pass: `webviewer` / `webviewer_dev_password`).
Postgres: `postgres://webviewer:webviewer_dev_password@localhost:5432/webviewer`.

---

## 2. Coolify deploy

### 2a. Postgres
1. In Coolify → New Resource → **Postgres**. Pick a version (16+).
2. Copy the connection string Coolify gives you. Set as `DATABASE_URL` on the Next.js service.

### 2b. MinIO (S3-compatible storage)
1. New Resource → **Service** → search **MinIO**.
2. Set `MINIO_ROOT_USER` / `MINIO_ROOT_PASSWORD`.
3. Expose port `9000` (S3 API) and optionally `9001` (console).
4. After deploy, open the console, create a bucket called `feedback-uploads`, set its anonymous access policy to **download** (so screenshots in share links are publicly readable).

### 2c. Env vars on the Next.js service
```
NEXT_PUBLIC_FEEDBACK_SYNC=on
DATABASE_URL=postgres://...                  # from 2a
BETTER_AUTH_SECRET=<openssl rand -base64 32>
BETTER_AUTH_URL=https://your-domain.com
NEXT_PUBLIC_BETTER_AUTH_URL=https://your-domain.com

S3_ENDPOINT=https://minio.your-domain.com    # or internal Coolify URL
S3_REGION=us-east-1
S3_ACCESS_KEY=<minio user>
S3_SECRET_KEY=<minio password>
S3_BUCKET=feedback-uploads
S3_PUBLIC_URL=https://minio.your-domain.com/feedback-uploads
S3_FORCE_PATH_STYLE=true

# Optional OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
```

### 2d. Run migrations once on the server
Coolify lets you run a one-shot command on the service:
```
npm run db:migrate
```
Or generate locally + commit, then `db:migrate` runs in a release phase.

---

## 3. What runs server-side now

| Route | Purpose | Auth |
|-------|---------|------|
| `/api/auth/[...all]` | better-auth handler (sign in / sign up / sessions) | n/a |
| `GET  /api/feedback/sessions` | List the signed-in user's sessions | required |
| `POST /api/feedback/sessions` | Create empty session, assigns slug | required |
| `GET  /api/feedback/sessions/[id]` | Get session + pins | required (owner) |
| `PUT  /api/feedback/sessions/[id]` | Upsert full session + pins (idempotent sync) | required (owner) |
| `DELETE /api/feedback/sessions/[id]` | Hard delete | required (owner) |
| `GET  /api/feedback/share/[slug]` | Public read by slug (isPublic = true) | none |
| `POST /api/upload` | Presigned PUT URL for S3 (screenshots/video) | required |
| `/s/[slug]` | Public share view (server-rendered) | none |

---

## 4. How the client uses it

When `NEXT_PUBLIC_FEEDBACK_SYNC=on` **and** a user is signed in, `FeedbackContext` debounces a `PUT /api/feedback/sessions/[id]` 1.5s after any pin edit. localStorage stays the local cache — losing network or going offline doesn't break the flow.

The "Create share link" button in the Export dialog appears only when sync is on; it forces a write then returns `${origin}/s/<slug>`.

---

## 5. Adding OAuth providers

`better-auth` picks up provider creds from env at boot. Add the two env vars and restart — providers light up automatically. The login UI is not built yet (Phase 3); for now, hit the API directly or build a `/login` page that calls `authClient.signIn.social({ provider: 'github' })`.

---

## 6. Future (Phase 3 candidates)

- `/login` and `/dashboard` pages (better-auth client wired)
- Console / network capture per pin
- Linear / GitHub integration (one-click "open issue from pin")
- Realtime collab via Pusher or self-hosted Soketi
- Comments + statuses on share view (open / resolved)
