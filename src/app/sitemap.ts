import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { SERVICE_SLUGS } from "@/lib/services";
import { getBlogPosts } from "@/lib/blog";

export const dynamic = "force-static";

const base =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://catopia.chenantunez.com";

const routes = JSON.parse(process.env.APP_ROUTES ?? '[""]') as string[];
const serviceRoutes = SERVICE_SLUGS.map(({ slug }) => `/services/${slug}`);

export default function sitemap(): MetadataRoute.Sitemap {
  return routing.locales.flatMap((locale) => [
    ...routes.map((route) => ({
      url: `${base}/${locale}${route}`,
      changeFrequency: "monthly" as const,
      priority: route === "" ? 1 : 0.8,
    })),
    ...serviceRoutes.map((route) => ({
      url: `${base}/${locale}${route}`,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    ...getBlogPosts(locale).map((post) => ({
      url: `${base}/${locale}/blog/${post.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ]);
}
