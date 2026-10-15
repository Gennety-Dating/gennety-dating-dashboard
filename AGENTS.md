# AGENTS.md - Gennety Dating Admin Dashboard

Internal admin panel for Gennety Dating. Read-only analytics plus a few admin
actions (ad spend, report review). The reader is a Russian-speaking founder:
new UI copy is Russian.

## Stack

Vite 8 · React 19 · TypeScript 6 · Tailwind 4 (`@tailwindcss/vite`) ·
Recharts 3 · react-router 7. Dark theme only (`src/index.css`: canvas + panel
greys; colour is reserved for status — severity, friction, danger).

## Deploy — read this first

**A push to `main` deploys to Vercel automatically.** Work on a branch; push to
`main` only when the change is meant to go live. The backend API is deployed by
hand and can lag the dashboard, so new UI must tolerate a missing endpoint
(404 → inline note, never a blank page).

## Commands

```bash
npm run dev        # vite dev server
npm run build      # tsc -b && vite build
npm run lint       # eslint .
npm run preview    # serve dist/
VITE_PULSE_FIXTURES=1 npm run dev   # preview Pulse tabs without a backend
```

No test suite.

## Auth and API

- `VITE_API_URL` (default `http://localhost:3100`) — the bot's admin API.
- Login stores the key in `sessionStorage["admin_api_key"]`; every request sends
  `Authorization: Bearer <key>`. A 401 clears it and routes to `/login`.
  `ADMIN_API_KEY` works everywhere; the read-only `ADMIN_READ_KEY` works on
  `GET /admin/pulse/*` and `GET /admin/analytics/*` only.
- All clients and response types live in `src/lib/api.ts`, hand-mirrored from
  the backend. Pulse types are in `src/lib/pulse-types.ts`, a verbatim copy of
  `apps/bot/src/admin/utils/pulse-types.ts` in the Gennety Dating repo.
- Cached endpoints accept `?fresh=1`; the header Refresh button bumps a token
  that makes every section re-request with it.

## Analytics page (`/`) — tabs → endpoints

The active view lives in the URL: `?tab=`, `?g=` (growth sub-section),
`?screen=`, `?user=`. Each tab loads only its own data; every request settles
on its own (`src/lib/useLoad.ts`) and fails inline in its section.

1. «Сводка» (default) — `GET /admin/pulse/brief`, `GET /admin/pulse/insights?status=open`
   (first/last-seen dates only).
2. «Экраны» — `GET /admin/pulse/screens`; detail `GET /admin/pulse/screens/:screen`
   (tap map; optional background `public/screens/<screen>.png`).
3. «Люди» — `GET /admin/pulse/journeys?stuck=1&limit=50` (or without `stuck`);
   timeline `GET /admin/pulse/journeys/:userId`. Links to `/users/:id` and the
   user drawer.
4. «Рост и деньги» — sub-sections, each loading on open:
   - Воронки и активность — `/admin/pulse/funnels`, `/admin/analytics/active`,
     `/admin/analytics/onboarding-funnel`.
   - Ключевые — `/admin/dashboard`.
   - Удержание и доверие — `/admin/analytics/retention`, `/dates`, `/verification`,
     `/admin/reports/stats`.
   - Деньги — `/admin/analytics/monetization`.
   - Виральность — `/admin/analytics/virality/*` (self-loading).
   - Аудитория — `/admin/analytics/demographics`, `/audience`, `/audience/heatmap`.
   - Гендер — `/admin/analytics/gender`.
   - Города — `/admin/analytics/cities`, `/admin/analytics/waitlist`.
   - Алгоритм и пары — `/admin/analytics/algorithm`, `/matches`, `/weekly-matches`.

Small-sample rule (Pulse): when `smallSample` is true (n < 30) show absolute
numbers («6 из 11») and the «история, не статистика» badge, never percentages.

## Fixtures flag

`VITE_PULSE_FIXTURES=1` (dev only) answers `/admin/pulse/*`,
`/admin/analytics/active` and `/admin/analytics/onboarding-funnel` from
`src/lib/pulse-fixtures.ts` and sets a placeholder session key, so the Pulse
tabs render without a backend. Other sections show their inline error. The flag
is a build-time constant; never set it in Vercel.

## Conventions

- Strict TS, no `any`. Components export components only (react-refresh lint);
  shared constants go in `src/lib/`.
- A `null` from the API is "unknown", rendered as «—» or hidden — never as 0.
- No long explanatory paragraphs in the UI; methodology goes in `InfoHint`.
