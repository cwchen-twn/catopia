# Catopia

Marketing site for **Catopia** — a software development company based in Paraguay helping businesses build reliable digital solutions, from professional websites to custom software and AI-powered automation. Built with Next.js 16 and deployed to Cloudflare Workers via the OpenNext adapter.

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

Deploys automatically on every `v*` tag push via `.github/workflows/deploy.yml` (applies D1 migrations, builds, deploys, syncs secrets).

`.github/workflows/update-deps.yml` runs weekly and opens a PR for minor dependency updates (`bun run ncu-minor`) — only when there's actually something to update. If you add another `ncu-*` script meant to run non-interactively, remember `ncu` needs `-u`/`--upgrade` to write changes; without it, it just prints available updates and nothing gets committed.

## Project structure

```
src/
  app/
    not-found.tsx    # Root 404 page (self-contained with <html>/<body>)
    page.tsx         # Root redirect: / → /en
    sitemap.ts       # Auto-generated /sitemap.xml (routes via APP_ROUTES env)
    [locale]/        # App Router pages (home, services, case-studies, blog, about, contact)
      services/[slug]/ # Dedicated per-service page (own SEO metadata)
      blog/[slug]/   # Blog post page (force-static, notFound() on unknown slug)
      layout.tsx     # Locale layout — guards invalid locales with notFound()
  components/        # Nav, Footer, ThemeToggle, LocaleSwitch, FontSizeControl,
                     # ThemeScript, FontSizeScript, ThemeRestorer, Dialog
  lib/
    services.ts      # SERVICE_SLUGS — single source of truth for slug↔key,
                     # used by homepage, services index, [slug] page, sitemap
    blog.ts          # getBlogPosts/getBlogPost — reads process.env.BLOG_POSTS,
                     # baked at build time by discoverBlogPosts() in next.config.ts
  i18n/              # next-intl routing, request config, navigation helpers
content/
  blog/<slug>/<locale>.md # Blog post source (see content/blog/README.md)
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

The `/contact` page posts to `src/app/api/contact/route.ts`. In order: rate-limit check, Zod validation, Turnstile verification (production only — see "Bot & abuse protection" below), best-effort D1 write, then an email via Resend with the client's address as `Reply-To`.

Secrets are read from `getCloudflareContext().env` — never from the client bundle.

**Local development** — add to `.dev.vars` (loaded by both `bun dev` and `bun preview`):

```
RESEND_API_KEY=re_...
RESEND_FROM=Catopia <noreply@catopia.chenantunez.com>
RESEND_TO=catopia@chenantunez.com
RESEND_SUBJECT_PREFIX=[CLIENT INQUIRY]
TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA
NEXT_PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA
```

(`bun dev` never loads Turnstile at all — see "Bot & abuse protection" below — so these values only matter for `bun preview`, which runs a real production build. The values above are Cloudflare's published always-pass test keypair — safe for that case. Create a real widget at Cloudflare dashboard → Turnstile before deploying.)

**Scripts:**

```bash
bun run test-email     # send a test email using .dev.vars values
bun run set-cf-secrets # push runtime secrets (Resend + Turnstile secret key) from .dev.vars to the Cloudflare Worker
```

`set-cf-secrets` reads `.dev.vars` and pipes each tracked runtime secret to `wrangler secret put`, so secrets never appear in the process list. If `.dev.vars` isn't present (e.g. in CI), it falls back to reading them from already-exported environment variables instead. `NEXT_PUBLIC_TURNSTILE_SITE_KEY` is intentionally excluded — it's a public value inlined into the client bundle at build time (via `next.config.ts`, see "Bot & abuse protection" below), not a Worker runtime secret.

**CI/CD** — `.github/workflows/deploy.yml` runs on every `v*` tag push: applies pending D1 migrations (`bun run d1-migrate`), builds and deploys (`bun run deploy`, with `NEXT_PUBLIC_TURNSTILE_SITE_KEY` passed as a build-time `env:`), then runs `bun run set-cf-secrets` with `RESEND_*`, `TURNSTILE_SECRET_KEY`, `CLOUDFLARE_API_TOKEN`, and `CLOUDFLARE_ACCOUNT_ID` all sourced from GitHub Actions repository secrets and passed via `env:`.

Push those repository secrets with:

```bash
bun run set-gh-secrets  # gh secret set for tracked .dev.vars keys + CLOUDFLARE_API_TOKEN/CLOUDFLARE_ACCOUNT_ID (prompted)
```

**SOP — updating a secret:**

1. Update the value in `.dev.vars`.
2. Run `bun run set-gh-secrets` — GitHub Actions secrets are the source of truth.
3. Deploy via a version tag (`git tag vX.Y.Z && git push --tags`) — CI builds, deploys, and runs `set-cf-secrets` against the synced GitHub secrets automatically. Don't run `set-cf-secrets` yourself in this path.

Only run `bun run set-cf-secrets` + `bun run deploy` manually when you need to push a Cloudflare change without a tagged CI deploy (CI down, local testing, etc). If you do, remember to also run `set-gh-secrets` with the same value — otherwise the next tagged deploy will silently overwrite Cloudflare back to the stale GitHub value.

Requires the [`gh` CLI](https://cli.github.com/) authenticated (`gh auth login`). `RESEND_*` values come from `.dev.vars`; `CLOUDFLARE_API_TOKEN`/`CLOUDFLARE_ACCOUNT_ID` aren't stored locally, so the script prompts for them (or reads them from your shell env if already exported).

## Bot & abuse protection

Three independent layers on the contact form, checked in this order in `src/app/api/contact/route.ts`:

1. **Rate limiting** — a Workers Rate Limiting binding (`ratelimits` in `wrangler.jsonc`), keyed by IP, 5 requests/60s. Purely declarative, no external resource to provision.
2. **Cloudflare Turnstile** — a CAPTCHA widget verified server-side via `siteverify`. Complementary to rate limiting, not redundant: Turnstile checks "is this a real browser," rate limiting caps volume from anything that passes it (a human clicking repeatedly, a paid solving service, etc). **Production only** — gated behind `process.env.NODE_ENV === "production"` on both client (`contact-form.tsx`) and server (`route.ts`/`check-email/route.ts`); `next build` (used by `bun preview` and `bun run deploy`) always inlines `"production"`, `bun dev` always inlines `"development"`, so the widget simply doesn't load under `bun dev` and `turnstileToken` is omitted from requests (the Zod schema treats it as optional).
3. **Duplicate-email confirmation** (UX, not security) — `src/app/api/contact/check-email/route.ts` checks the `clients` table for a currently-`active` deal on that email; if found, the form shows a confirm/cancel prompt listing up to 5 recent inquiries so the visitor recognizes what's already in progress. This endpoint now returns real content (not just a boolean), so it also requires `turnstileToken` and shares the same rate limiter as the main route.

`NEXT_PUBLIC_TURNSTILE_SITE_KEY` is a public value that has to be inlined into the client bundle at _build_ time — Next's automatic `NEXT_PUBLIC_*` handling doesn't pick it up from `.dev.vars` here (that file only feeds the Cloudflare runtime context via `initOpenNextCloudflareForDev()`, not Node's `process.env`), so `next.config.ts` reads `.dev.vars` directly and bakes it into `nextConfig.env`, same as `APP_ROUTES`/`APP_VERSION`.

## Client deal status (`clients` table)

Separate from `contact_submissions` (an immutable message log), `clients` tracks the relationship with each email: `lead` (default, just reached out) → `active` (you're manually working a deal — the only status that triggers the duplicate-confirmation prompt) → `closed_won` / `closed_lost` / `closed_abandoned` (deal concluded — behaves like `lead` for the confirm check, just recorded for later reporting). Enforced with a DB-level `CHECK` constraint, not just app-side validation.

No admin UI — manage it via:

```bash
bun run d1-clients                                 # list all clients + status
bun run d1-set-status client@example.com active    # validated update (rejects anything outside the 5 statuses)
```

## Contact submissions (D1)

Every contact form submission also persists to a Cloudflare D1 database (`catopia-crm` — named for future CRM data generally, not contact-specific), bound as `env.DB`. This is a best-effort, non-blocking write: a D1 failure is logged but never blocks the Resend email.

```bash
wrangler d1 migrations apply catopia-crm --local   # apply to local dev DB
bun run d1-migrate                                  # apply to production (also runs automatically in CI before deploy)
```

Migration files live in `migrations/`; create new ones with `wrangler d1 migrations create catopia-crm <name>`.

**Querying production data:**

```bash
bun run d1-contacts                                             # list all submissions, newest first
bun run d1-query -- "SELECT count(*) FROM contact_submissions"  # ad-hoc SQL (note the `--`)
```

**Rolling back a migration** — there's no "down migration" built in; once a migration file has run anywhere, treat it as immutable and roll forward instead of editing/deleting it.

- **Full restore** (e.g. bad data): D1's Time Travel feature restores the whole database to any point in the last 30 days:
  ```bash
  wrangler d1 time-travel info catopia-crm                # grab a bookmark before anything risky
  wrangler d1 time-travel restore catopia-crm --before-timestamp=<ISO8601>
  ```
- **Bad schema change**: write a new corrective migration (`wrangler d1 migrations create catopia-crm <name>`) that reverses it, then apply normally with `bun run d1-migrate`.

## Services pages

`/services` is a lightweight index linking to a dedicated page per service (`/services/<slug>`) rather than one combined page — each gets its own SEO title/description. `src/lib/services.ts` (`SERVICE_SLUGS`) is the single source of truth for the slug↔key mapping; the homepage preview, services index, `[slug]` page, and sitemap all derive from it. Healthcare gets an extra expanded content section (patient management, clinical workflows, HL7 FHIR interoperability) since it's the strongest differentiator.

**"Get a Quote" from a service page** links to `/contact?service=<slug>`, pre-filling the subject/message with that service's translated title/quote-template. Since `/contact` is `force-static`, this has to be read client-side (`useSearchParams()` in `contact-form.tsx`, wrapped in `<Suspense>` in the page) — a server-side `searchParams` prop wouldn't see the real query string on a statically-generated page.

## SEO

- `/robots.txt` — served from `public/robots.txt`; allows all crawlers, disallows `/_next/`, references the sitemap
- `/sitemap.xml` — generated by `src/app/sitemap.ts`; covers all locale × route combinations plus `/services/<slug>` for each entry in `SERVICE_SLUGS`; routes are auto-discovered at build time via `next.config.ts` (no manual list needed)
- Open Graph images — one per locale (`public/images/og-share-{en,es,pt}.png`), each with a translated tagline, referenced by `generateMetadata` in `src/app/[locale]/layout.tsx`. Regenerate with `bun run og-image` (`scripts/generate-og-image.ts`) whenever the tagline or logo changes, and commit the PNGs — they're checked into git, not built in CI.

## Blog

Markdown-file-based, statically rendered at build time — ships with zero posts, no code changes needed to add one.

- Add a post: `bun run new-post <slug>` scaffolds `content/blog/<slug>/{en,es,pt}.md` with default frontmatter (title-cased from the slug, today's date, `published: false`) and placeholder template content per locale. Edit the content, set `published: true` when ready (see `content/blog/README.md` for the exact frontmatter format). A locale file is optional per post.
- `next.config.ts`'s `discoverBlogPosts()` scans `content/blog/` at build time (parses frontmatter with `gray-matter`, renders markdown with `marked`) and bakes the result into `process.env.BLOG_POSTS`, read by `src/lib/blog.ts` (`getBlogPosts`/`getBlogPost`). Posts with `published: false` are excluded from this in a production build (`bun preview`/`bun run deploy`) — they only render under `bun dev`, for local preview.
- `/blog` (index, shows an empty state with zero posts) and `/blog/<slug>` (post page, 404s on an unknown slug/locale) live under `src/app/[locale]/blog/`. Both are `force-static`.
- `/blog` in the nav, and `/blog`/`/blog/<slug>` in the sitemap, both come along for free — `/blog` via the existing `APP_ROUTES` route auto-discovery, `/blog/<slug>` explicitly from `getBlogPosts()` in `sitemap.ts`.
