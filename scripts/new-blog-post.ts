import { mkdirSync, existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const slug = process.argv[2];

if (!slug) {
  console.error("Usage: bun run new-post <slug>");
  console.error(
    "  e.g. bun run new-post 5-signs-your-business-needs-custom-software",
  );
  process.exit(1);
}

if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
  console.error(
    `Invalid slug "${slug}" — use lowercase letters, numbers, and hyphens only (e.g. my-first-post).`,
  );
  process.exit(1);
}

const dir = join("content/blog", slug);
if (existsSync(dir)) {
  console.error(`content/blog/${slug} already exists.`);
  process.exit(1);
}

const title = slug
  .split("-")
  .map((word) => word[0].toUpperCase() + word.slice(1))
  .join(" ");

const date = new Date().toISOString().slice(0, 10);

const TEMPLATES = {
  en: {
    description:
      "One-line summary of this post — shows on the index page and as SEO metadata.",
    body: `## Introduction

Start writing here.

## Key takeaways

- First point
- Second point
- Third point

## Conclusion

Wrap up your thoughts here.
`,
  },
  es: {
    description:
      "Resumen de una línea de esta publicación — se muestra en el índice y como metadatos SEO.",
    body: `## Introducción

Empieza a escribir aquí.

## Puntos clave

- Primer punto
- Segundo punto
- Tercer punto

## Conclusión

Cierra tus ideas aquí.
`,
  },
  pt: {
    description:
      "Resumo de uma linha desta publicação — aparece no índice e como metadados de SEO.",
    body: `## Introdução

Comece a escrever aqui.

## Principais pontos

- Primeiro ponto
- Segundo ponto
- Terceiro ponto

## Conclusão

Finalize suas ideias aqui.
`,
  },
} as const;

mkdirSync(dir, { recursive: true });

for (const [locale, { description, body }] of Object.entries(TEMPLATES)) {
  const filePath = join(dir, `${locale}.md`);
  const frontmatter = `---
title: "${title}"
description: "${description}"
date: "${date}"
published: false
---

`;
  writeFileSync(filePath, frontmatter + body);
  console.log(`  ✓  ${filePath}`);
}

console.log(`\nNew draft post created at content/blog/${slug}/`);
console.log(
  `Preview at http://localhost:3000/en/blog/${slug} (bun dev only — published: false).`,
);
console.log(
  `Edit the title/description/body in each locale file, then set published: true when ready.`,
);
