import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
import { readdirSync, existsSync, readFileSync } from "fs";
import { join } from "path";
import { execSync } from "child_process";
import matter from "gray-matter";
import { marked } from "marked";
import { routing } from "./src/i18n/routing";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

function discoverRoutes(): string[] {
  const localeDir = join(process.cwd(), "src/app/[locale]");
  const routes: string[] = [""];
  try {
    for (const entry of readdirSync(localeDir, { withFileTypes: true })) {
      if (
        entry.isDirectory() &&
        existsSync(join(localeDir, entry.name, "page.tsx"))
      ) {
        routes.push(`/${entry.name}`);
      }
    }
  } catch {}
  return routes;
}

interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  html: string;
}

function discoverBlogPosts(): Record<string, BlogPost[]> {
  const blogDir = join(process.cwd(), "content/blog");
  const posts: Record<string, BlogPost[]> = Object.fromEntries(
    routing.locales.map((locale) => [locale, []]),
  );
  try {
    for (const entry of readdirSync(blogDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const slug = entry.name;
      for (const locale of routing.locales) {
        const filePath = join(blogDir, slug, `${locale}.md`);
        if (!existsSync(filePath)) continue;
        const { data, content } = matter(readFileSync(filePath, "utf8"));
        // Unpublished (draft) posts compile only under `next dev` so authors
        // can preview them locally — `next build` (bun preview, bun run
        // deploy) always inlines NODE_ENV as "production" and excludes them.
        const published = data.published !== false;
        if (!published && process.env.NODE_ENV === "production") continue;
        posts[locale].push({
          slug,
          title: data.title,
          description: data.description,
          date: data.date,
          html: marked.parse(content, { async: false }) as string,
        });
      }
    }
  } catch {}
  for (const locale of routing.locales) {
    posts[locale].sort((a, b) => (a.date < b.date ? 1 : -1));
  }
  return posts;
}

function resolveVersion(): string {
  // GitHub Actions sets GITHUB_REF_NAME to the tag name on tag pushes
  if (process.env.GITHUB_REF_NAME) return process.env.GITHUB_REF_NAME;
  try {
    return execSync("git rev-parse --short HEAD", { encoding: "utf8" }).trim();
  } catch {
    return "dev";
  }
}

// NEXT_PUBLIC_* vars are normally inlined automatically from process.env at
// build time, but initOpenNextCloudflareForDev() only loads .dev.vars into
// the Cloudflare runtime context (getCloudflareContext().env), not Node's
// process.env — so plain `process.env.NEXT_PUBLIC_X` never resolves here.
// Read .dev.vars directly instead (CI has no .dev.vars, so it falls back to
// the real process.env set by the GitHub Actions step).
function readPublicVar(key: string): string {
  if (process.env[key]) return process.env[key];
  try {
    const content = readFileSync(join(process.cwd(), ".dev.vars"), "utf8");
    for (const line of content.split("\n")) {
      const [k, ...rest] = line.split("=");
      if (k.trim() === key) return rest.join("=").trim();
    }
  } catch {}
  return "";
}

const nextConfig: NextConfig = {
  env: {
    APP_ROUTES: JSON.stringify(discoverRoutes()),
    APP_VERSION: resolveVersion(),
    BLOG_POSTS: JSON.stringify(discoverBlogPosts()),
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: readPublicVar(
      "NEXT_PUBLIC_TURNSTILE_SITE_KEY",
    ),
  },
};

// Enable calling `getCloudflareContext()` in `next dev`.
// See https://opennext.js.org/cloudflare/bindings#local-access-to-bindings.
initOpenNextCloudflareForDev();

export default withNextIntl(nextConfig);
