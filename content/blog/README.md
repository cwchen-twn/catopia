# Blog content

Add a post by creating a folder named with a URL-safe slug, with one markdown file per locale:

```text
content/blog/<slug>/en.md
content/blog/<slug>/es.md
content/blog/<slug>/pt.md
```

Each file needs frontmatter:

```markdown
---
title: "Post title"
description: "One-line summary used on the index page and as SEO metadata"
date: "2026-01-01"
published: true
---

Markdown body here.
```

A locale file is optional per post — if a translation isn't ready yet, omit
that file and the post simply won't appear for that locale until it exists.

`published` is optional and defaults to `true`. Set it to `false` while
drafting a post — it will only compile and show up under `bun dev`, so you
can preview it locally at `/blog/<slug>`; it's excluded entirely from
`bun preview` and `bun run deploy` (both run a production build) until you
flip it back to `true` (or remove the field).

No code changes are needed to publish a post: `next.config.ts` discovers
everything under `content/blog/` and bakes it into the build at compile time
(see `discoverBlogPosts()`), the same pattern used for routes and OG images.
Just add the file(s) and redeploy.
