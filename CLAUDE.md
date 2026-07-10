# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**catopia** — a Next.js 16 app built to run on Cloudflare Workers via the OpenNext adapter.

## Maintenance Rules

**Keep docs up to date.** After every meaningful change — new file, new pattern, removed file, discovered constraint — update both `CLAUDE.md` and `README.md` before finishing. Future agents read these files first; stale docs cause repeated mistakes.

**Prefer auto-discovery over manual declarations.** This project uses Next.js file-path routing: the filesystem is the route registry. Do not maintain separate hardcoded lists of routes, locales, or paths that duplicate what the framework already tracks.

- Locales → import `routing.locales` from `src/i18n/routing.ts`
- App routes (e.g. for the sitemap) → auto-discovered at build time via `discoverRoutes()` in `next.config.ts`, injected into `process.env.APP_ROUTES`; read that env var rather than writing a route list by hand
- If a new page is added, no manual update is needed — `discoverRoutes()` picks it up automatically on the next build

## Package Manager

This project uses **Bun**. Always use `bun` instead of `npm`/`yarn`/`pnpm`.

## Commands

```bash
bun dev              # Next.js dev server at localhost:3000 (Node.js runtime, not Cloudflare)
bun preview          # Build and preview using the actual Cloudflare Workers runtime locally
bun build            # Next.js production build only
bun run deploy       # Build with OpenNext and deploy to Cloudflare
bun run lint         # prettier --check . && eslint . (both must pass)
bun run format       # prettier --write . (auto-fix formatting)
bun run cf-typegen   # Regenerate cloudflare-env.d.ts after adding Wrangler bindings
```

## Architecture

### Two Runtimes

- `bun dev` runs on Node.js — use for fast iteration.
- `bun preview` runs on the Cloudflare Workers runtime — required to test Cloudflare-specific features (bindings, caching, image optimization).

### Cloudflare Integration

- **`open-next.config.ts`** — configures the OpenNext/Cloudflare adapter. R2 incremental cache is available here (currently commented out).
- **`wrangler.jsonc`** — Cloudflare Worker config. Worker name: `catopia`. Bindings defined here: `ASSETS` (static files), `IMAGES` (image optimization), `WORKER_SELF_REFERENCE` (self-reference for caching).
- **`cloudflare-env.d.ts`** — auto-generated TypeScript types for Cloudflare bindings; regenerate with `bun run cf-typegen` after changing `wrangler.jsonc`.
- **`.dev.vars`** — local-only environment variables passed to the Wrangler dev runtime (equivalent of `.env` for Cloudflare).
- Cloudflare bindings are accessible at runtime via `getCloudflareContext()` from `@opennextjs/cloudflare`. This also works in `bun dev` because `next.config.ts` calls `initOpenNextCloudflareForDev()`.

### Validation

Use **Zod** (`zod`) for all runtime schema validation — API route request bodies, external data, anything that crosses a trust boundary. Never use hand-rolled `if (!field)` checks in place of a schema.

```ts
import { z } from "zod";

const schema = z.object({ ... });
const parsed = schema.safeParse(await request.json());
if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
const { field } = parsed.data; // fully typed
```

### Icons

Use **Lucide React** (`lucide-react`) for all icons. Import named components directly: `import { IconName } from "lucide-react"`. Do not add SVG files or other icon libraries.

### Next.js App Router

All pages live under `src/app/[locale]/` using the App Router. Tailwind CSS v4 is configured via PostCSS (`postcss.config.mjs`).

### i18n

Supported locales: `en` (en-US), `es` (es-PY), and `pt` (pt-BR), configured in `src/i18n/routing.ts`.

**No middleware.** Next.js 16's `proxy.ts` (the new middleware file) is forced to run on the Node.js runtime, which OpenNext Cloudflare does not support. Since all pages use `force-static` + `setRequestLocale`, locale detection works without middleware. The root `/` redirects to `/en` via `src/app/page.tsx`. Do **not** add `proxy.ts` or `middleware.ts` — it will break `bun preview`/`bun run deploy`.

- **`src/app/page.tsx`** — root redirect: `redirect('/en')`.
- **`src/i18n/routing.ts`** — locale list and default locale.
- **`src/i18n/request.ts`** — server-side next-intl config; loads the correct `messages/*.json` file.
- **`messages/en.json`** / **`messages/es.json`** / **`messages/pt.json`** — translation files. Add new keys to all three when adding UI text.
- In Server Components use `getTranslations("namespace")` from `next-intl/server`. In Client Components use `useTranslations("namespace")`.
- Per-locale SEO metadata (title, description, keywords, OG locale, hreflang) lives in `src/app/[locale]/layout.tsx` via `generateMetadata`.
- Use `usePathname` and `useRouter` from `@/i18n/navigation` (not `next/navigation`) for locale-aware routing in Client Components.

### UI Preferences (Theme & Font Size)

Both preferences are persisted in `localStorage` and restored before hydration via `beforeInteractive` scripts to avoid any flash of wrong state.

- **`src/components/theme-script.tsx`** — `<Script strategy="beforeInteractive">` reads `localStorage('theme')`, falls back to `prefers-color-scheme`, and toggles the `dark` class on `<html>`. Also seeds `localStorage` on first visit.
- **`src/components/font-size-script.tsx`** — same pattern; reads `localStorage('font-size')` (`sm`/`md`/`lg`) and sets `document.documentElement.style.fontSize` to `16px`/`18px`/`20px`. All Tailwind `rem` units scale automatically.
- **`src/components/theme-restorer.tsx`** — Client component using `useLayoutEffect` + `usePathname`. Re-applies both theme class and font size from `localStorage` before each paint on route change (React reconciliation clears externally-set attributes during soft navigation).
- **`src/components/theme-toggle.tsx`** — `useSyncExternalStore` watching a `MutationObserver` on `document.documentElement` class; writes to `localStorage` on click.
- **`src/components/font-size-control.tsx`** — same pattern, watching `style` attribute; three `A` buttons (fixed `px` display sizes so the control stays visually consistent regardless of current root size).
- **`src/components/locale-switch.tsx`** — `appearance-none` `<select>` with `bg-background`/`text-foreground` and a `ChevronDown` icon overlay; uses `useRouter`/`usePathname` from `@/i18n/navigation` for locale-aware switching.

### Rendering Strategy

This project uses OpenNext on Cloudflare Workers — do **not** add `output: 'export'` to `next.config.ts` (it would break the Workers setup). Instead, every page file must explicitly opt into static rendering:

```ts
export const dynamic = "force-static";
```

Add this to every `page.tsx` (and `route.ts` where applicable). The locale is in the URL path so pages can still be fully static even with i18n.

**Critical:** `force-static` pages cannot call `headers()` at render time. Because next-intl normally reads the locale from a request header, you must call `setRequestLocale(locale)` at the top of every `page.tsx`, `layout.tsx`, and `generateMetadata` function before any `getTranslations()` or `getMessages()` call:

```ts
import { getTranslations, setRequestLocale } from "next-intl/server";

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale); // must come before getTranslations
  const t = await getTranslations("namespace");
  // ...
}
```

Omitting `setRequestLocale` silently falls back to the default locale (`en`) on every page.

### Not-Found (404) Page

Invalid routes are handled at two levels:

1. **Invalid locale** (e.g. `/sitemap`, `/foo`) — caught by an explicit guard at the top of `src/app/[locale]/layout.tsx`:
   ```ts
   if (!(routing.locales as readonly string[]).includes(locale)) notFound();
   ```
2. **Valid locale, unknown sub-path** (e.g. `/en/idk`) — Next.js returns 404 automatically because no matching page file exists.

Both cases render **`src/app/not-found.tsx`** — a root-level 404 page that includes its own `<html>/<body>` (the root layout just passes children through, so it does not provide them). It embeds an inline theme script and imports `globals.css` directly so CSS custom properties work.

**Do not use `export const dynamicParams = false`** in `[locale]/layout.tsx`. It interferes with OpenNext's request routing and causes valid locale paths (e.g. `/en`) to return 404 in `bun preview` and the deployed Worker. Use the explicit `notFound()` guard instead.

### Services Pages

`/services` is a lightweight index (icon + title + one-line description + "Learn more") linking to a dedicated page per service — `src/app/[locale]/services/[slug]/page.tsx` — rather than one combined page, for distinct per-service SEO metadata.

- **`src/lib/services.ts`** — the single source of truth: `SERVICE_SLUGS` maps each `slug` (URL segment) to its `key` (the `messages/*.json` `services.<key>` namespace). Deliberately has no icon/React imports so `sitemap.ts` can import it without pulling in UI code. Every UI file (homepage preview, services index, `[slug]` page) pairs this with its own local icon lookup keyed by `key`.
- Adding, removing, or reordering a service is a one-line change to `SERVICE_SLUGS` (plus the corresponding `messages/*.json` content) — the homepage, services index, `[slug]` page, and sitemap all derive from it, nothing else to update.
- **Healthcare gets extra depth** (`services.healthcare.expanded.*` in `messages/*.json`) — patient management, clinical workflows, and HL7 FHIR interoperability, plus a link to `/case-studies`. This is the one service page with a second content block; conditional on `key === "healthcare"` in the `[slug]` page.
- **"Get a Quote" flow**: each service page links to `/contact?service=<slug>`. Since `/contact` is `force-static`, reading that query param **must** happen client-side — `contact-form.tsx` (already `"use client"`) uses `useSearchParams()` from `next/navigation`, not a server-side `searchParams` prop (which wouldn't see the real query string on a statically-generated page). `src/app/[locale]/contact/page.tsx` wraps `<ContactForm />` in `<Suspense>`, which Next.js requires for any component calling `useSearchParams()` during static rendering. The matched service's `title`/`quoteTemplate` translations pre-fill the subject/message fields — still fully editable, not locked.

### SEO

- **`public/robots.txt`** — static file served before Next.js routing. Allows all crawlers, disallows `/_next/` (build artifacts), and references the sitemap. Using a static file is critical: without it, `/robots.txt` is matched by the `[locale]` dynamic segment with locale `"robots.txt"`, rendering the app instead of a valid robots file.
- **`src/app/sitemap.ts`** — generates `/sitemap.xml` at build time (`force-static`). Routes are auto-discovered via `process.env.APP_ROUTES` (see below) plus `/services/<slug>` for each entry in `SERVICE_SLUGS` (dynamic `[slug]` routes aren't covered by the `APP_ROUTES` directory scan, so they're added explicitly from the same source of truth the pages use). Locales come from `routing.locales`.

### Contact Form & Email

The `/contact` page submits to `src/app/api/contact/route.ts` via `fetch`. The route handler, in order:

1. Rate-limits by IP (`env.CONTACT_RATE_LIMITER`, see "Bot & Abuse Protection" below) — checked first, before touching anything else.
2. Reads `RESEND_API_KEY`, `RESEND_FROM`, `RESEND_TO`, and `RESEND_SUBJECT_PREFIX` from `getCloudflareContext().env` (never from `process.env` or the client bundle).
3. Validates the request body with Zod (including `turnstileToken`).
4. Verifies `turnstileToken` server-side against Cloudflare's `siteverify` endpoint.
5. Best-effort writes to `contact_submissions`, best-effort upserts a `clients` row (see "Client Deal Status" below), then sends via Resend, with the client's email as `replyTo`.

Local secrets go in `.dev.vars` (loaded by both `bun dev` and `bun preview` via `initOpenNextCloudflareForDev`). Production secrets are pushed with `bun run set-cf-secrets` (`scripts/set-cf-secrets.sh`), which pipes each tracked key to `wrangler secret put` — reading them from `.dev.vars` locally, or from already-exported env vars when `.dev.vars` isn't present (e.g. in CI).

**CI (`.github/workflows/deploy.yml`)** — triggers on `v*` tag pushes. It runs, in order: `bun run d1-migrate` (applies pending D1 migrations to the remote database), `bun run deploy` (with `NEXT_PUBLIC_TURNSTILE_SITE_KEY` in its `env:` — needed at build time, see below), then `bun run set-cf-secrets` with `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, all four `RESEND_*` values, and `TURNSTILE_SECRET_KEY` injected via `env:` from GitHub Actions repository secrets (Settings → Secrets and variables → Actions). Migrations run before the deploy step so new code depending on new schema never ships ahead of the schema itself. When adding a new secret-backed env var to `.dev.vars.example`, add a matching repo secret and an `env:` entry in that workflow step.

`CLOUDFLARE_API_TOKEN` needs a **D1 Edit** permission (account-level) in addition to Workers Scripts/KV Storage Write, or the `d1-migrate` CI step will fail with a permissions error.

`bun run set-gh-secrets` (`scripts/set-gh-secrets.sh`) pushes those repository secrets via `gh secret set`: tracked keys come from `.dev.vars`, while `CLOUDFLARE_API_TOKEN`/`CLOUDFLARE_ACCOUNT_ID` (not present in `.dev.vars`) are read from the shell env if exported, otherwise prompted for interactively. Requires `gh auth login` first.

### Bot & Abuse Protection (Contact Form)

Three independent layers, checked in this order in `src/app/api/contact/route.ts`:

1. **Rate limiting** — a Workers Rate Limiting binding (`ratelimits` in `wrangler.jsonc`, `env.CONTACT_RATE_LIMITER`), keyed by `cf-connecting-ip`, 5 requests per 60 seconds. Purely declarative — `namespace_id` is an arbitrary developer-chosen string, no external resource to provision (unlike D1). Returns 429 if exceeded. **Constraint:** `simple.period` must be exactly `10` or `60` seconds, no custom windows.
2. **Cloudflare Turnstile** — a CAPTCHA widget in `src/components/contact-form.tsx` (loaded via `next/script`, rendered into a container ref, token captured via its `callback`), verified server-side against `https://challenges.cloudflare.com/turnstile/v0/siteverify`. Returns 403 on failure. These solve different problems — Turnstile checks "is this a real browser," rate limiting caps volume from anything that passes (including a human clicking repeatedly, or a paid solving service).
3. **Duplicate-email confirmation** (UX only, not a security control) — `src/app/api/contact/check-email/route.ts` checks the **`clients`** table (not `contact_submissions` directly) for a row with `status = 'active'` for that email; if found, the client shows a confirm/cancel prompt — listing up to 5 recent inquiry subjects/dates so the visitor recognizes what's already in progress — before actually sending. Since this now returns real inquiry content (not just a boolean), `check-email` requires `turnstileToken` and shares `CONTACT_RATE_LIMITER` too, same as the main route.

### Client Deal Status (`clients` table)

A separate table from `contact_submissions` (the immutable message log) — `clients` tracks the _relationship_, keyed by `email` (`UNIQUE`, surrogate `id` primary key so a future multi-email-per-client scenario doesn't require redesigning anything that references a client). `status` is one of, enforced by a DB-level `CHECK` constraint:

- `lead` — default for any new submitter (auto-upserted on every `/api/contact` submission); no deal, doesn't trigger the confirm prompt.
- `active` — manually flagged as currently undergoing a deal. **The only status that triggers the confirm prompt.**
- `closed_won` / `closed_lost` / `closed_abandoned` — deal concluded (successfully, unsuccessfully, or the record wasn't a genuine outcome — test/spam/gone-cold). All three behave like `lead` for the confirm check; they exist for later reporting, not because the confirm logic cares.

No admin UI — manage status via:

```bash
bun run d1-clients                                  # list all clients + status
bun run d1-set-status client@example.com active      # validated status update (also enforced by the CHECK constraint if bypassed)
```

**`NEXT_PUBLIC_TURNSTILE_SITE_KEY` needs special handling** — unlike `TURNSTILE_SECRET_KEY` (a normal runtime secret read via `getCloudflareContext().env`), this is a **public** value that must be inlined into the client bundle at _build_ time. Next.js's automatic `NEXT_PUBLIC_*` inlining doesn't work here because `initOpenNextCloudflareForDev()` only loads `.dev.vars` into the Cloudflare runtime context, never into Node's `process.env` — so `next.config.ts` reads `.dev.vars` directly (falling back to `process.env` in CI, where the value comes from the GitHub Actions step's `env:`) and bakes it into `nextConfig.env`, the same pattern already used for `APP_ROUTES`/`APP_VERSION` (see "Build-Time Filesystem Access" below).

Local dev/testing uses Cloudflare's published always-pass test keypair (site key `1x00000000000000000000AA`, secret `1x0000000000000000000000000000000AA`) as the `.dev.vars` defaults — swap in the real widget's values (Cloudflare dashboard → Turnstile → create a widget for the production domain) via `.dev.vars` + `bun run set-gh-secrets` before/at a deploy; no code change needed.

**SOP for changing a secret value:** treat GitHub Actions secrets as the source of truth, not Cloudflare directly.

1. Update `.dev.vars`.
2. Run `bun run set-gh-secrets`.
3. Deploy via a version tag (`git tag vX.Y.Z && git push --tags`) — CI's `set-cf-secrets` step syncs Cloudflare from the GitHub secrets automatically. Do not run `set-cf-secrets` manually in this path.

Manual `bun run set-cf-secrets` + `bun run deploy` is only for pushing a Cloudflare-only change outside a tagged CI deploy (CI down, local testing). If you do this, also run `set-gh-secrets` with the same value — otherwise the next tagged deploy overwrites Cloudflare back to the stale GitHub-stored value.

### Cloudflare D1 (`catopia-crm`)

Contact form submissions persist to a D1 database named `catopia-crm` (named for future CRM-related data generally, not contact-specific — additional tables can be added later via new migrations against the same database). Bound as `env.DB` in `wrangler.jsonc`.

- `migrations/` — SQL migration files, managed via `wrangler d1 migrations create catopia-crm <name>`.
- Apply locally: `wrangler d1 migrations apply catopia-crm --local` (writes to `.wrangler/state/v3/d1`, used by both `bun dev` and `bun preview`).
- Apply to production: `bun run d1-migrate` (wraps `wrangler d1 migrations apply catopia-crm --remote`) — runs automatically in CI before every tagged deploy; only needed manually for an out-of-band Cloudflare-only change.
- `src/app/api/contact/route.ts` writes to `env.DB` as a **best-effort, non-blocking** step — a D1 failure is logged but never prevents the Resend email from sending.
- After adding/changing bindings in `wrangler.jsonc`, run `bun run cf-typegen` to refresh `cloudflare-env.d.ts`.

**Querying production data:**

```bash
bun run d1-contacts                              # list all contact_submissions, newest first
bun run d1-query -- "SELECT count(*) FROM contact_submissions"   # ad-hoc SQL (note the `--`)
```

**Rolling back a migration** — Wrangler has no "down migration" concept; treat every applied migration file as immutable history (once it's run anywhere, don't edit or delete it — it's tracked by filename in D1's own bookkeeping table). Two options, depending on what went wrong:

1. **Bad data / need a full restore** — D1 Time Travel restores the whole database to any point in the last 30 days, no explicit backup needed:
   ```bash
   wrangler d1 time-travel info catopia-crm                 # get current bookmark before doing anything risky
   wrangler d1 time-travel restore catopia-crm --before-timestamp=<ISO8601>
   # or: wrangler d1 time-travel restore catopia-crm --bookmark=<bookmark-from-info>
   ```
2. **Bad schema (e.g. wrong column type)** — write a new corrective migration (`wrangler d1 migrations create catopia-crm <name>`) that reverses the change (`DROP TABLE`, `ALTER TABLE ... DROP COLUMN`, etc.) and apply it normally (`bun run d1-migrate` or let the next tagged deploy do it). Don't touch the original migration file.

### Build-Time Filesystem Access (`next.config.ts`)

`process.cwd()` is **not** reliable inside `sitemap.ts` or other pre-rendered pages during `next build` — the compilation context does not guarantee the working directory is the project root. `fs.readdirSync` calls there fail silently.

**The pattern:** do filesystem work in `next.config.ts` instead. The config file always runs before compilation with `process.cwd()` at the project root. Bake results into `nextConfig.env` — Next.js statically replaces `process.env.X` at compile time, so the value is available everywhere including the Workers bundle:

```ts
// next.config.ts
const nextConfig: NextConfig = {
  env: {
    APP_ROUTES: JSON.stringify(discoverRoutes()), // scans src/app/[locale] with fs
  },
};
```

```ts
// src/app/sitemap.ts
const routes = JSON.parse(process.env.APP_ROUTES ?? '[""]') as string[];
```

### CI Workflows (`.github/workflows/`)

- **`deploy.yml`** — triggers on `v*` tag pushes. Applies pending D1 migrations, builds + deploys via OpenNext, then syncs Cloudflare Worker secrets. See "Cloudflare D1" and "Contact Form & Email" above.
- **`update-deps.yml`** — runs weekly (`ncu-minor`), opens a PR only if there's an actual diff. **Gotcha:** `ncu` without `-u`/`--upgrade` only prints available updates — it does not write to `package.json`. Any `ncu-*` script meant to run non-interactively in CI must include `-u`, or the step will silently no-op (this broke `ncu-minor` for weeks with no visible error, since `bun install` finding "no changes" is not a failure).

Apply this pattern for any build-time data that requires filesystem access.
