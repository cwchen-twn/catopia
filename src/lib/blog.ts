export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  html: string;
}

function loadAll(): Record<string, BlogPost[]> {
  return JSON.parse(process.env.BLOG_POSTS ?? "{}");
}

export function getBlogPosts(locale: string): BlogPost[] {
  return loadAll()[locale] ?? [];
}

export function getBlogPost(
  locale: string,
  slug: string,
): BlogPost | undefined {
  return getBlogPosts(locale).find((post) => post.slug === slug);
}
