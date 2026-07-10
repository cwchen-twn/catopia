import sharp, { type OutputInfo } from "sharp";
import { readFileSync } from "node:fs";

const LOGO = "scripts/catopia.png";
const WIDTH = 1200;
const HEIGHT = 630;
const LOGO_SIZE = 200;

// Kept in sync with home.hero.title in messages/*.json, shortened to fit an
// OG image — this is a build tool, not app i18n, so it doesn't need to read
// messages/*.json directly.
const LOCALES = {
  en: {
    title: "Catopia",
    tagline: "Reliable Digital Solutions for Growing Businesses",
  },
  es: {
    title: "Catopia",
    tagline: "Soluciones Digitales Confiables para Empresas en Crecimiento",
  },
  pt: {
    title: "Catopia",
    tagline: "Soluções Digitais Confiáveis para Empresas em Crescimento",
  },
} as const;

const logoBase64 = readFileSync(LOGO).toString("base64");

function label(path: string, info: OutputInfo) {
  const kb = (info.size / 1024).toFixed(1).padStart(8);
  console.log(`  ✓  ${path.padEnd(44)} ${kb} KB`);
}

for (const [locale, { title, tagline }] of Object.entries(LOCALES)) {
  const out = `public/images/og-share-${locale}.png`;
  // Longer ES/PT taglines need a smaller size to stay clear of the edges.
  const taglineSize = tagline.length > 55 ? 24 : 28;

  const svg = `
<svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${WIDTH}" height="${HEIGHT}" fill="#ffffff" />
  <image
    x="${(WIDTH - LOGO_SIZE) / 2}"
    y="150"
    width="${LOGO_SIZE}"
    height="${LOGO_SIZE}"
    href="data:image/png;base64,${logoBase64}"
  />
  <text
    x="${WIDTH / 2}"
    y="420"
    font-family="sans-serif"
    font-size="64"
    font-weight="700"
    fill="#171717"
    text-anchor="middle"
  >${title}</text>
  <text
    x="${WIDTH / 2}"
    y="470"
    font-family="sans-serif"
    font-size="${taglineSize}"
    fill="#525252"
    text-anchor="middle"
  >${tagline}</text>
</svg>
`;

  label(
    out,
    await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(out),
  );
}
