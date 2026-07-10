import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getBlogPosts } from "@/lib/blog";

export const dynamic = "force-static";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("blog");
  return { title: t("title"), description: t("subtitle") };
}

export default async function Blog({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("blog");
  const posts = getBlogPosts(locale);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 md:py-16">
      <div className="flex flex-col gap-2 mb-8 md:mb-12">
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-foreground/60">{t("subtitle")}</p>
      </div>

      {posts.length === 0 ? (
        <p className="text-sm text-foreground/60">{t("emptyState")}</p>
      ) : (
        <div className="flex flex-col gap-6">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="flex flex-col gap-2 p-6 rounded-xl border border-foreground/10 hover:border-foreground/20 transition-colors"
            >
              <h2 className="font-semibold text-lg">{post.title}</h2>
              <p className="text-sm text-foreground/60 leading-relaxed">
                {post.description}
              </p>
              <time dateTime={post.date} className="text-xs text-foreground/45">
                {new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(
                  new Date(post.date),
                )}
              </time>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
