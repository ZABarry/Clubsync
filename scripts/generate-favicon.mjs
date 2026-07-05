import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const COLORS = {
  primary: "#FF6B54",
  primaryMid: "#FF9346",
  primaryLight: "#FFB347",
  accent: "#FDE047",
};

function buildMarkSvg({ favicon = false, size = 48 } = {}) {
  const stroke = favicon ? 4 : 3.5;
  const circleR = favicon ? 4.75 : 4.5;
  const circleStroke = favicon ? 1.75 : 1.5;
  const gradientId = favicon ? "clubzer-favicon-bg" : "clubzer-bg";

  return `<svg width="${size}" height="${size}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="ClubZer">
  <rect width="48" height="48" rx="14" fill="url(#${gradientId})"/>
  <path d="M15 16H33L21 24H31" stroke="white" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M21 32H33" stroke="white" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="15" cy="32" r="${circleR}" fill="${COLORS.accent}" stroke="white" stroke-width="${circleStroke}"/>
  <defs>
    <linearGradient id="${gradientId}" x1="6" y1="4" x2="44" y2="46" gradientUnits="userSpaceOnUse">
      <stop stop-color="${COLORS.primary}"/>
      <stop offset="0.55" stop-color="${COLORS.primaryMid}"/>
      <stop offset="1" stop-color="${COLORS.primaryLight}"/>
    </linearGradient>
  </defs>
</svg>
`;
}

function buildIco(pngBuffers) {
  const count = pngBuffers.length;
  const headerSize = 6 + count * 16;
  let offset = headerSize;
  const header = Buffer.alloc(headerSize);

  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(count, 4);

  for (let i = 0; i < count; i += 1) {
    const png = pngBuffers[i];
    const entryOffset = 6 + i * 16;
    const size = png.length;
    const dimension = i === 0 ? 16 : i === 1 ? 32 : 48;

    header.writeUInt8(dimension === 256 ? 0 : dimension, entryOffset);
    header.writeUInt8(dimension === 256 ? 0 : dimension, entryOffset + 1);
    header.writeUInt8(0, entryOffset + 2);
    header.writeUInt8(0, entryOffset + 3);
    header.writeUInt16LE(1, entryOffset + 4);
    header.writeUInt16LE(32, entryOffset + 6);
    header.writeUInt32LE(size, entryOffset + 8);
    header.writeUInt32LE(offset, entryOffset + 12);
    offset += size;
  }

  return Buffer.concat([header, ...pngBuffers]);
}

async function writeSvg(filePath, svg) {
  await fs.writeFile(filePath, svg);
}

async function renderPng(svg, size) {
  return sharp(Buffer.from(svg)).resize(size, size).png().toBuffer();
}

const appIconSvg = buildMarkSvg({ favicon: true, size: 32 });
const logoSvg = buildMarkSvg({ size: 48 });

await writeSvg(path.join(root, "app", "icon.svg"), appIconSvg);
await writeSvg(path.join(root, "public", "logo.svg"), logoSvg);
await writeSvg(path.join(root, "public", "icons", "icon.svg"), logoSvg);

const png192 = await renderPng(logoSvg, 192);
const png512 = await renderPng(logoSvg, 512);

await fs.writeFile(path.join(root, "public", "icons", "icon-192.png"), png192);
await fs.writeFile(path.join(root, "public", "icons", "icon-512.png"), png512);

const png16 = await renderPng(appIconSvg, 16);
const png32 = await renderPng(appIconSvg, 32);
const png48 = await renderPng(appIconSvg, 48);

await fs.writeFile(
  path.join(root, "app", "favicon.ico"),
  buildIco([png16, png32, png48]),
);
await fs.writeFile(path.join(root, "app", "apple-icon.png"), png192);

console.log("Synced brand favicons from CLUBZER_COLORS palette");
