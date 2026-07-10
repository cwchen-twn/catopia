import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { getBlogPost, getBlogPosts } from "@/lib/blog";

export const dynamic = "force-static";

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    getBlogPosts(locale).map(({ slug }) => ({ locale, slug })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = getBlogPost(locale, slug);
  if (!post) return {};
  return { title: post.title, description: post.description };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const post = getBlogPost(locale, slug);
  if (!post) notFound();

  return (
    <article className="max-w-3xl mx-auto px-4 sm:px-6 py-10 md:py-16">
      <h1 className="text-3xl font-bold tracking-tight mb-2">{post.title}</h1>
      <time dateTime={post.date} className="text-xs text-foreground/45">
        {new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(
          new Date(post.date),
        )}
      </time>
      {/* post.html is compiled from author-controlled markdown at build
          time (content/blog/**), not user input — safe to render directly. */}
      <div
        className="blog-content mt-8"
        dangerouslySetInnerHTML={{ __html: post.html }}
      />
    </article>
  );
}
