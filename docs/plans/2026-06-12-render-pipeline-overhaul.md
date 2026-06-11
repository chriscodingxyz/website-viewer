# Render Pipeline Overhaul Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make proxied page rendering full-fidelity (interactive accordions, SPA data loading, module imports) and fast (CDN-cached navigation), then polish the workspace UI toward the BugSmash reference.

**Architecture:** Move from "rewrite everything server-side with regex" to "rewrite only element attributes server-side, intercept everything else at runtime". Three interception layers, outermost wins: (1) cheerio per-element attribute rewriting, (2) injected client script patching `fetch`/XHR/DOM setters/history, (3) a same-origin service worker that re-targets any request escaping layers 1-2 using the client page's `?url=` parameter. Performance comes from CDN `s-maxage` caching per content type and keep-alive upstream agents.

**Tech Stack:** Next.js 14 App Router, cheerio (server), vanilla JS injection (client), Service Worker API, Vercel CDN caching.

**Background:** Read `docs/render-pipeline-audit.md` first. Root causes RC1-RC9 referenced below.

---

## Task index (one .md per task in docs/plans/render-overhaul/)

| # | Task file | Fixes | Risk |
|---|-----------|-------|------|
| 1 | [task-01-server-rewrite-hygiene.md](render-overhaul/task-01-server-rewrite-hygiene.md) | RC1, RC2, RC5, RC6, RC9 | Low - removes corruption |
| 2 | [task-02-runtime-interception.md](render-overhaul/task-02-runtime-interception.md) | RC3 (partial), RC7 | Medium |
| 3 | [task-03-service-worker.md](render-overhaul/task-03-service-worker.md) | RC3 (full), RC4 (practical) | Medium - must passthrough app routes |
| 4 | [task-04-caching-performance.md](render-overhaul/task-04-caching-performance.md) | RC8 | Low |
| 5 | [task-05-ui-polish-bugsmash.md](render-overhaul/task-05-ui-polish-bugsmash.md) | UX parity with BugSmash reference | Low |

## Order and dependencies

- Task 1 must land first (everything else assumes uncorrupted HTML/JS).
- Task 2 and 3 are complementary: 2 covers pre-SW-control window and non-SW browsers; 3 covers everything else. Land 2 then 3.
- Task 4 independent after 1.
- Task 5 independent (pure UI).

## Verification strategy (no test suite in repo)

Per task: `npm run build` must pass, then live checks against `npm run dev`:

1. `curl -s 'http://localhost:3000/api/proxy?url=https%3A%2F%2Fexample.com' | grep ...` for server output assertions.
2. Browser check on a hydration-heavy site with accordions (e.g. `https://ui.shadcn.com/docs/components/accordion`): accordion must expand/collapse inside the proxied iframe.
3. Browser check console: zero hydration warnings / 404s for `_next` chunks.

## Done criteria

- Accordions/tabs/menus on Next.js and similar SPA sites work inside the proxied iframe.
- Page navigation inside iframe stays proxied and reports URL to host (existing behavior preserved).
- Second navigation to an already-visited page is served from CDN/browser cache (fast).
- Preview applier + pin overlay keep working.
- All commits pushed to `codex/bugsmash-llm-ready`.
