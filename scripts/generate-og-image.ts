import sharp, { type OutputInfo } from "sharp";
import { readFileSync } from "node:fs";

const LOGO = "scripts/catopia.png";
const OUT = "public/images/og-share.png";
const WIDTH = 1200;
const HEIGHT = 630;
const LOGO_SIZE = 200;

const logoBase64 = readFileSync(LOGO).toString("base64");

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
  >Catopia</text>
  <text
    x="${WIDTH / 2}"
    y="470"
    font-family="sans-serif"
    font-size="28"
    fill="#525252"
    text-anchor="middle"
  >Reliable Digital Solutions for Growing Businesses</text>
</svg>
`;

function label(path: string, info: OutputInfo) {
  const kb = (info.size / 1024).toFixed(1).padStart(8);
  console.log(`  ✓  ${path.padEnd(44)} ${kb} KB`);
}

label(
  OUT,
  await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(OUT),
);
