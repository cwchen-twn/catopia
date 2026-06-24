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

### SEO

- **`public/robots.txt`** — static file served before Next.js routing. Allows all crawlers, disallows `/_next/` (build artifacts), and references the sitemap. Using a static file is critical: without it, `/robots.txt` is matched by the `[locale]` dynamic segment with locale `"robots.txt"`, rendering the app instead of a valid robots file.
- **`src/app/sitemap.ts`** — generates `/sitemap.xml` at build time (`force-static`). Routes are auto-discovered via `process.env.APP_ROUTES` (see below). Locales come from `routing.locales`.

### Contact Form & Email

The `/contact` page submits to `src/app/api/contact/route.ts` via `fetch`. The route handler:

- Reads `RESEND_API_KEY`, `RESEND_FROM`, `RESEND_TO`, and `RESEND_SUBJECT_PREFIX` from `getCloudflareContext().env` (never from `process.env` or the client bundle)
- Validates the request body with Zod before touching any field
- Sets the client's email as `replyTo` so the team can reply directly

Local secrets go in `.dev.vars` (loaded by both `bun dev` and `bun preview` via `initOpenNextCloudflareForDev`). Production secrets are pushed with `bun run set-secrets`, which reads `.dev.vars` and pipes each `RESEND_*` entry to `wrangler secret put`.

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

Apply this pattern for any build-time data that requires filesystem access.
