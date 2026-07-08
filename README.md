# Catopia

Landing page for **Catopia de Chen Antúnez** — a software and AI solutions firm based in Paraguay. Built with Next.js 16 and deployed to Cloudflare Workers via the OpenNext adapter.

## Stack

- **Next.js 16** (App Router, Turbopack) — `force-static` pages
- **Cloudflare Workers** via [OpenNext](https://opennext.js.org/cloudflare)
- **Tailwind CSS v4**
- **next-intl** — i18n with `en` (en-US), `es` (es-PY), and `pt` (pt-BR) locales
- **Zod** — runtime schema validation for all API routes
- **Resend** — transactional email for the contact form
- **Bun** as the package manager and runtime

## Development

```bash
bun install          # install dependencies
bun dev              # Next.js dev server at localhost:3000 (Node.js runtime)
bun preview          # build + preview on the actual Cloudflare Workers runtime
```

## Code quality

```bash
bun run lint         # prettier --check + eslint
bun run format       # prettier --write (auto-fix formatting)
```

## Deploy

```bash
bun run deploy       # build with OpenNext and deploy to Cloudflare
```

## Project structure

```
src/
  app/
    not-found.tsx    # Root 404 page (self-contained with <html>/<body>)
    page.tsx         # Root redirect: / → /en
    sitemap.ts       # Auto-generated /sitemap.xml (routes via APP_ROUTES env)
    [locale]/        # App Router pages (home, services, about, contact)
      layout.tsx     # Locale layout — guards invalid locales with notFound()
  components/        # Nav, Footer, ThemeToggle, LocaleSwitch, FontSizeControl,
                     # ThemeScript, FontSizeScript, ThemeRestorer
  i18n/              # next-intl routing, request config, navigation helpers
messages/
  en.json            # English (en-US) translations
  es.json            # Spanish (es-PY) translations
  pt.json            # Brazilian Portuguese (pt-BR) translations
public/
  robots.txt         # Static robots file (must be static — see i18n note below)
next.config.ts       # Scans src/app/[locale] at build time; injects APP_ROUTES env
wrangler.jsonc       # Cloudflare Worker config
open-next.config.ts  # OpenNext/Cloudflare adapter config
```

## i18n

- Supported locales: `en` (en-US), `es` (es-PY), `pt` (pt-BR)
- URL-based locale prefix: `/en/...`, `/es/...`, `/pt/...`
- No middleware — Next.js 16's `proxy.ts` is forced to the Node.js runtime, which OpenNext Cloudflare does not support. Locale detection is handled entirely via `setRequestLocale(locale)` in each page.
- Root `/` redirects to `/en` via `src/app/page.tsx`
- Client components use `useTranslations()`, server components use `getTranslations()`
- Always use `usePathname` and `useRouter` from `@/i18n/navigation` (not `next/navigation`) in client components
- **`robots.txt` must be a static file** in `public/`. Without it, `/robots.txt` matches the `[locale]` dynamic segment (treating `"robots.txt"` as a locale) and serves the app instead.

## Theme and UI preferences

- Dark/light toggle via `ThemeScript` in `<head>` (reads `localStorage`, falls back to `prefers-color-scheme`) and `ThemeToggle` component using `useSyncExternalStore`
- Font size control (S / M / L → 16px / 18px / 20px root) via `FontSizeScript` + `FontSizeControl`; scales all `rem`-based Tailwind utilities automatically
- Both preferences persist in `localStorage` and are restored before hydration (no flash) and on every route navigation via `ThemeRestorer`

## Contact form

The `/contact` page posts to `src/app/api/contact/route.ts`. The handler validates the body with Zod, then sends an email via Resend with the client's address as `Reply-To`.

Secrets are read from `getCloudflareContext().env` — never from the client bundle.

**Local development** — add to `.dev.vars` (loaded by both `bun dev` and `bun preview`):

```
RESEND_API_KEY=re_...
RESEND_FROM=Catopia <noreply@catopia.chenantunez.com>
RESEND_TO=catopia@chenantunez.com
RESEND_SUBJECT_PREFIX=[CLIENT INQUIRY]
```

**Scripts:**

```bash
bun run test-email     # send a test email using .dev.vars values
bun run set-cf-secrets # push all RESEND_* entries from .dev.vars to the Cloudflare Worker
```

`set-cf-secrets` reads `.dev.vars` and pipes each `RESEND_*` value to `wrangler secret put`, so secrets never appear in the process list. If `.dev.vars` isn't present (e.g. in CI), it falls back to reading `RESEND_*` from already-exported environment variables instead.

**CI/CD** — `.github/workflows/deploy.yml` runs on every `v*` tag push. It builds and deploys via `bun run deploy`, then runs `bun run set-cf-secrets` with `RESEND_API_KEY`, `RESEND_FROM`, `RESEND_SUBJECT_PREFIX`, `RESEND_TO`, `CLOUDFLARE_API_TOKEN`, and `CLOUDFLARE_ACCOUNT_ID` all sourced from GitHub Actions repository secrets and passed via `env:`.

Push those repository secrets with:

```bash
bun run set-gh-secrets  # gh secret set for RESEND_* (from .dev.vars) + CLOUDFLARE_API_TOKEN/CLOUDFLARE_ACCOUNT_ID (prompted)
```

**SOP — updating a secret:**

1. Update the value in `.dev.vars`.
2. Run `bun run set-gh-secrets` — GitHub Actions secrets are the source of truth.
3. Deploy via a version tag (`git tag vX.Y.Z && git push --tags`) — CI builds, deploys, and runs `set-cf-secrets` against the synced GitHub secrets automatically. Don't run `set-cf-secrets` yourself in this path.

Only run `bun run set-cf-secrets` + `bun run deploy` manually when you need to push a Cloudflare change without a tagged CI deploy (CI down, local testing, etc). If you do, remember to also run `set-gh-secrets` with the same value — otherwise the next tagged deploy will silently overwrite Cloudflare back to the stale GitHub value.

Requires the [`gh` CLI](https://cli.github.com/) authenticated (`gh auth login`). `RESEND_*` values come from `.dev.vars`; `CLOUDFLARE_API_TOKEN`/`CLOUDFLARE_ACCOUNT_ID` aren't stored locally, so the script prompts for them (or reads them from your shell env if already exported).

## SEO

- `/robots.txt` — served from `public/robots.txt`; allows all crawlers, disallows `/_next/`, references the sitemap
- `/sitemap.xml` — generated by `src/app/sitemap.ts`; covers all locale × route combinations; routes are auto-discovered at build time via `next.config.ts` (no manual list needed)
