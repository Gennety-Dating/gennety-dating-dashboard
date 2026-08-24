# Implementation Prompt — Admin Dashboard "Conversation Viewer"

> Paste this whole file as the opening message of a new session. It is
> self-contained: it carries the data-model facts, exact file paths, the chosen
> product decisions, and the gotchas already discovered, so the session can go
> straight to implementation.

## Goal

Add a feature to the Gennety Dating **admin analytics dashboard** that lets an
operator open any user and read their **full conversation with the bot in
near-original form** — every user and bot message, in order, **with images
rendered inline** (profile photos the user uploaded, mobile chat attachments).
Telegram-native chrome (reactions, keyboards) is out of scope; the goal is a
readable, faithful transcript.

This is a **cross-repo** change:

1. **Backend** — `/Users/pro/Desktop/Gennety Dating` (the bot/admin API).
   New admin endpoints: a normalized conversation endpoint + an authenticated
   image proxy.
2. **Frontend** — `/Users/pro/Projects/gennety-admin-dashboard` (this repo,
   React 19 + Vite + Tailwind v4 + react-router v7). The conversation UI.

## Chosen product decisions (already made — do not re-ask)

- **Surface:** full-screen. The current 420px-tall box inside the right-side
  drawer is too cramped for a long chat. Add a **dedicated full-screen
  conversation view** — either a new route `/users/:id` or a full-screen modal
  launched from the user row / drawer — rendering a Telegram-like transcript at
  full height with its own scroll.
- **Technical messages:** hidden by default, behind a toggle. The default view
  shows only **user + bot** turns (a clean transcript). A **"Show technical"**
  toggle reveals `system` prompts, `tool` calls, and tool results for debugging.
- **Images:** rendered inline. Must work for both Telegram `file_id`s (proxied
  server-side) and Supabase paths (mobile chat attachments + mobile profile photos).

## Current state (this is an ENHANCEMENT, not greenfield)

The dashboard already has a crude version — reuse/upgrade it, don't duplicate:

- `src/pages/UsersPage.tsx` — users list + pagination, opens a drawer.
- `src/components/users/UserProfileDrawer.tsx` — right-side drawer; fetches
  `getUserDetail(id)` and already renders profile + `ChatHistoryBlock`.
- `src/components/users/ChatHistoryBlock.tsx` — renders `messageHistory` raw:
  it dumps `system` prompts and `JSON.stringify`s any non-string content (tool
  calls), shows no images, and has no real timestamps. **This is the thing to
  replace/upgrade.**
- `src/lib/api.ts` — `apiFetch<T>()` helper (Bearer auth from
  `sessionStorage["admin_api_key"]`), plus `getUserDetail()` returning
  `UserDetail { ...UserListItem, messageHistory: ChatMessage[] | null }`.
- `src/lib/auth.ts` — `getApiKey()/setApiKey()/clearApiKey()`.
- `src/App.tsx` — routes: `/login`, `/` (dashboard), `/users`, `/reports`,
  all wrapped in `<ProtectedRoute>`.
- Backend `apps/bot/src/admin/server.ts` already exposes
  `GET /admin/users/:id` returning `USER_SELECT` + `messageHistory`.

## Backend data-model facts (source of truth — verified in code)

There are **TWO** conversation stores. The feature must merge both.

### Store 1 — `User.messageHistory` (`Json[]`) — Telegram onboarding/menu agents

- Shape per entry (OpenAI chat message):
  `{ role: "system" | "user" | "assistant" | "tool", content: string | null,
     tool_calls?: [...], tool_call_id?: string }`.
- **No per-message timestamps.** Order = array order only.
- **No inline images.** Photo uploads during onboarding are recorded only as
  collector *events* (`photos_updated`), not as renderable images here. The
  actual photos live in `Profile.photos[]`.
- `content` can be `null` (pure tool-call assistant turns).
- Written by `services/onboarding-agent.ts`, `services/menu-agent.ts`
  (filters out `system` before persisting in menu-agent; onboarding keeps more).
- This is what the dashboard currently shows.

### Store 2 — `Message` table — the mobile app chat (multimodal)

- Prisma model `Message` (`@@map("messages")`):
  `{ id, userId, role: MessageRole(user|assistant|system), content: String,
     imageUrl: String?, createdAt: DateTime }`, `@@index([userId, createdAt])`.
- `imageUrl` = **opaque Supabase Storage path** in the chat bucket
  (`{userId}/{ts}.jpg`), NOT a public URL. Has real `createdAt` timestamps.
- **Not currently exposed in any admin endpoint.**

### Images — how to turn refs into rendered bytes

Browser cannot render a Telegram `file_id`, and Supabase paths are private.
Both must be **proxied server-side**. Helpers already exist in
`apps/bot/src/services/storage.ts`:

- `downloadProfileImage(refOrFileId, api)` — auto-branches: ref containing `/`
  → `downloadProfilePhoto(path)` (Supabase photo bucket); otherwise →
  `downloadTelegramFile(api, fileId)` (Telegram `getFile` + HTTPS GET with bot
  token). **Use this for `Profile.photos[]`.**
- `downloadChatImage(path)` — Supabase chat bucket (for `Message.imageUrl`).
- `downloadTelegramFile(api, fileId)` — direct Telegram file download.

`Profile.photos[]` entries are **Telegram `file_id`s** (bot uploads, no `/`) or
**Supabase paths** (mobile uploads, contain `/`). `downloadProfileImage`
already handles that distinction.

### Admin server facts

- `apps/bot/src/admin/server.ts` — Express app, exported as `app` (tests import
  it directly without `.listen()`).
- Auth: `requireApiKey` middleware on the whole app — `Authorization: Bearer
  <ADMIN_API_KEY>`, timing-safe compare. 401 without it.
- Bot `Api` is held in a module-scoped `let botApi` set by `setAdminBotApi(api)`
  (called from `startAdminServer`). Routes that need Telegram (e.g.
  `rerun-verification`) read it and **503 when null** (tests don't register it).
  The image proxy needs this for Telegram `file_id`s → mirror the 503 pattern.
- CORS: gated by `ADMIN_DASHBOARD_ORIGIN` (must be set to the dashboard origin
  in prod; methods `GET POST PATCH OPTIONS`).
- `express.json({ limit: "32kb" })` (request bodies — irrelevant to image
  responses).
- **Rate limit: 60 req/min/IP across the whole admin surface.** A gallery of
  many images would blow this. Mitigate: give `/admin/media` its own higher
  limiter (or skip the global limiter for it), and/or lazy-load images in the
  UI. Don't ignore this.
- BigInt `telegramId` must be `.toString()`-ed before `res.json()` (existing
  pattern).
- Production runs the admin API and the prod bot in the **same process**, so
  `botApi` is the prod bot and its `file_id`s resolve. (Local dev admin uses the
  dev bot; file_ids only resolve for the bot that produced them.)

## Backend tasks

### B1 — `GET /admin/users/:id/conversation`

New endpoint (recommend adding **inline in `server.ts`**, next to
`GET /admin/users/:id`, because it can reuse the module-scoped `botApi` and the
existing auth/middleware). Returns a normalized, chronological transcript
merging both stores.

Response shape (suggested):

```ts
{
  userId: string,
  telegramId: string,            // stringified BigInt
  displayName: string | null,    // firstName + surname
  // Each item is one normalized turn:
  messages: Array<{
    id: string,                  // stable key (index-based for messageHistory)
    source: "telegram" | "mobile",
    role: "user" | "assistant" | "system" | "tool",
    text: string | null,         // content; null for pure tool-call turns
    createdAt: string | null,    // ISO; null for messageHistory (no timestamps)
    technical: boolean,          // true for system/tool/null-content turns
    toolCalls?: Array<{ name: string; arguments: string }>, // when present
    image?: {                    // present only for mobile turns with imageUrl
      type: "chat",
      ref: string,               // Supabase chat path → /admin/media?type=chat&ref=
    },
  }>,
  // Photos aren't reliably interleaved into the transcript, so expose them
  // separately as a gallery:
  photos: Array<{
    type: "photo",
    ref: string,                 // Profile.photos[] entry (file_id OR supabase path)
  }>,
}
```

Implementation notes:
- Read `User.messageHistory`, `Profile.photos`, and `prisma.message.findMany({
  where: { userId }, orderBy: { createdAt: "asc" } })`.
- Map `messageHistory` entries → normalized (mark `technical: true` when
  `role` is `system`/`tool` or `content` is null; surface `tool_calls` names).
- Map `Message` rows → normalized with `createdAt` and `image` when `imageUrl`.
- **Ordering:** Telegram `messageHistory` has no timestamps; the mobile chat has them.
  A user is realistically one-or-the-other (mobile-only users have a negative
  `telegramId` and no meaningful `messageHistory`). Simplest correct approach:
  emit the `messageHistory` block (array order) then the mobile block
  (createdAt order); do **not** fabricate timestamps to interleave. Document
  this in a comment.
- 404 if user not found. Stringify BigInt.

### B2 — `GET /admin/media` (authenticated image proxy)

Streams image bytes so the browser can render private/Telegram images. Query:
- `?type=telegram&ref=<file_id>` → `downloadTelegramFile(botApi, ref)`
  (503 if `botApi` null).
- `?type=photo&ref=<Profile.photos entry>` → `downloadProfileImage(ref, botApi)`
  (handles file_id OR supabase path).
- `?type=chat&ref=<Message.imageUrl supabase path>` → `downloadChatImage(ref)`.

Rules:
- Validate `type` against the allow-list; validate `ref` shape. For Supabase
  paths enforce a safe shape (e.g. `^[A-Za-z0-9._\-/]+$`, reject `..`) to block
  traversal. For Telegram file_ids, treat as opaque token.
- On success: `res.setHeader("Content-Type", <sniffed or image/jpeg>)`, add
  `Cache-Control: private, max-age=300`, send the Buffer. On null/failure: 404
  (image expired / not found) — never 500-loop.
- Give it a **dedicated, higher rate limiter** (or mount before the global 60/min
  limiter) so a gallery doesn't trip the limit.
- Auth: keep it under `requireApiKey` (Bearer). The frontend fetches it with the
  Bearer header and converts to a blob URL (see F2) — **do not** accept the key
  via query string.

### B3 — Tests

Extend `apps/bot/src/admin/server.test.ts`:
- conversation endpoint: 404 unknown user; normalizes a `messageHistory` blob;
  marks system/tool as `technical`; includes mobile `Message` rows + `image`
  ref; stringifies BigInt.
- media endpoint: 401 without Bearer; 503 for `type=telegram` when `botApi`
  unset; 400 on bad `type`/`ref`; happy path streams bytes (mock the storage
  download helpers).

## Frontend tasks (this repo)

### F1 — API client (`src/lib/api.ts`)

- Add types `ConversationMessage`, `ConversationPhoto`, `UserConversation`
  mirroring B1.
- Add `getUserConversation(id: string)` using the existing `apiFetch`.
- Add a `mediaUrl(type, ref)` helper that builds
  `${BASE_URL}/admin/media?type=...&ref=${encodeURIComponent(ref)}` (used by the
  authed image fetch, NOT as a raw `<img src>`).

### F2 — `<AuthedImage>` component (`src/components/AuthedImage.tsx`)

Because `<img src>` can't send the `Authorization` header and we refuse to put
the key in the URL:
- On mount, `fetch(url, { headers: { Authorization: Bearer <key> } })` →
  `res.blob()` → `URL.createObjectURL(blob)` → render `<img>`.
- Loading skeleton + error/broken-image fallback (Telegram file_ids can expire).
- `URL.revokeObjectURL` on unmount / ref change to avoid leaks.
- Do **not** route through `apiFetch` (that one forces `Content-Type: json` and
  calls `res.json()`).

### F3 — Conversation transcript component (`src/components/users/ConversationView.tsx`)

Replace/upgrade `ChatHistoryBlock`. Telegram-like full-height transcript:
- User bubbles right-aligned, bot left-aligned, system/tool muted/centered.
- Render `text` with `white-space: pre-wrap`; render `image` via `<AuthedImage>`.
- Real timestamps where `createdAt` present; otherwise omit (don't fake).
- **"Show technical" toggle** (default OFF): when off, filter out
  `technical === true` items; when on, show them (system prompt text, tool-call
  names/arguments) in a clearly de-emphasized style.
- A **profile photos gallery** section (`photos[]` via `<AuthedImage>` thumbnails,
  click to enlarge) — these aren't interleaved in the transcript.
- Empty state when no messages.
- Optional niceties: source badge (Telegram vs app) when both present;
  scroll-to-bottom; copy-transcript.

### F4 — Surface (full-screen)

Per the decision, make it full-screen, not the cramped drawer box:
- Recommended: new route `/users/:id` in `App.tsx` (wrapped in
  `<ProtectedRoute>`) rendering a `UserConversationPage` (header with
  back-to-users + user identity, then `<ConversationView>` full height).
  Navigate from a row action / a "Open conversation" button in
  `UsersTable`/`UserProfileDrawer`.
- Acceptable alternative: a full-screen modal overlay launched from the drawer.
- Keep the existing drawer for the quick profile peek; add the full conversation
  as the deeper view.

### F5 — Frontend checks

- `npm run build` (tsc -b + vite) and `npm run lint` clean.
- Verify against a real user with photos (Telegram file_id images proxy
  correctly) and, if available, a mobile-app user (chat `imageUrl`).

## Security / privacy guardrails

- Everything stays behind `requireApiKey` (Bearer). Never accept `ADMIN_API_KEY`
  via query string; the image proxy is fetched with the header → blob URL.
- Path-traversal guard on Supabase `ref` in `/admin/media`.
- Don't persist/cache Telegram bytes server-side beyond the response.
- This surfaces private DMs and faces to operators — it's an internal admin tool;
  don't add any public/unauthenticated path. No new logging of message contents.

## Deploy notes (backend repo `deploy.md` is canonical)

- No schema changes (uses existing `User.messageHistory`, `Message`,
  `Profile.photos`) → **no `db:push` needed**.
- Backend ships via the full-server rsync + `pnpm build` + `pm2 restart
  gennety-bot --update-env`. The admin API is part of the `gennety-bot` process
  (port `3100`, `api-admin.gennety.com`).
- Ensure `ADMIN_DASHBOARD_ORIGIN` includes the dashboard origin (already
  required for the dashboard to work cross-origin).
- Dashboard deploys via its own pipeline (Vercel per `vercel.json`); prod
  `VITE_API_URL=https://api-admin.gennety.com`. Local dev defaults to
  `http://localhost:3100`.
- Run backend tests + typecheck (`pnpm --filter @gennety/bot exec vitest run
  src/admin/server.test.ts`, `pnpm --filter @gennety/bot typecheck`) and the
  dashboard build/lint before shipping.

## Suggested build order

1. B2 image proxy + B3 media tests (smallest, unblocks images).
2. B1 conversation endpoint + tests.
3. F1 api client + F2 `<AuthedImage>`.
4. F3 `ConversationView` + F4 full-screen surface.
5. Manual QA with a real user (photos + chat), build/lint/test, then ship per
   `deploy.md`.

## Open items to confirm with the user during implementation (only if they block)

- Whether to also surface match-related DMs (pitch/scheduling) — those are NOT
  in `messageHistory`; they'd need separate sourcing and are **out of scope**
  for v1 unless asked.
- Pagination for very long histories (v1 can render all; revisit if a user has
  thousands of turns).
