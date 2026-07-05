const USER_AGENT = "ClubZer/1.0 camp-image-fetch";
const FETCH_TIMEOUT_MS = 10_000;

const META_IMAGE_PATTERNS = [
  /<meta[^>]+property=["']og:image(?::url)?["'][^>]+content=["']([^"']+)["']/i,
  /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image(?::url)?["']/i,
  /<meta[^>]+name=["']twitter:image(?::src)?["'][^>]+content=["']([^"']+)["']/i,
  /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image(?::src)?["']/i,
  /<link[^>]+rel=["']image_src["'][^>]+href=["']([^"']+)["']/i,
  /<link[^>]+href=["']([^"']+)["'][^>]+rel=["']image_src["']/i,
];

const JSON_LD_IMAGE_TYPES = new Set([
  "Event",
  "LocalBusiness",
  "Organization",
  "SportsActivityLocation",
  "Camp",
]);

function isHttpsUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !value.includes("*");
  } catch {
    return false;
  }
}

export function resolveImageUrl(candidate: string, pageUrl: string): string | null {
  const trimmed = candidate.trim();
  if (!trimmed || trimmed.startsWith("data:")) return null;

  try {
    const resolved = new URL(trimmed, pageUrl).href;
    return isHttpsUrl(resolved) ? resolved : null;
  } catch {
    return null;
  }
}

function extractJsonLdImage(html: string, pageUrl: string): string | null {
  const scriptPattern =
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;

  for (const match of html.matchAll(scriptPattern)) {
    const raw = match[1]?.trim();
    if (!raw) continue;

    try {
      const parsed = JSON.parse(raw) as unknown;
      const image = findJsonLdImage(parsed);
      if (!image) continue;

      const resolved = resolveImageUrl(image, pageUrl);
      if (resolved) return resolved;
    } catch {
      continue;
    }
  }

  return null;
}

function findJsonLdImage(node: unknown): string | null {
  if (!node) return null;

  if (Array.isArray(node)) {
    for (const item of node) {
      const image = findJsonLdImage(item);
      if (image) return image;
    }
    return null;
  }

  if (typeof node !== "object") return null;

  const record = node as Record<string, unknown>;
  const typeValue = record["@type"];
  const types = Array.isArray(typeValue)
    ? typeValue.map(String)
    : typeValue
      ? [String(typeValue)]
      : [];

  const matchesType =
    types.length === 0 ||
    types.some((type) => JSON_LD_IMAGE_TYPES.has(type));

  if (matchesType && record.image) {
    const image = normalizeJsonLdImageValue(record.image);
    if (image) return image;
  }

  if (record["@graph"]) {
    return findJsonLdImage(record["@graph"]);
  }

  for (const value of Object.values(record)) {
    const image = findJsonLdImage(value);
    if (image) return image;
  }

  return null;
}

function normalizeJsonLdImageValue(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    for (const item of value) {
      const image = normalizeJsonLdImageValue(item);
      if (image) return image;
    }
    return null;
  }
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    if (typeof record.url === "string") return record.url;
    if (typeof record.contentUrl === "string") return record.contentUrl;
  }
  return null;
}

export function extractImageFromHtml(html: string, pageUrl: string): string | null {
  for (const pattern of META_IMAGE_PATTERNS) {
    const match = html.match(pattern);
    if (!match?.[1]) continue;

    const resolved = resolveImageUrl(match[1], pageUrl);
    if (resolved) return resolved;
  }

  const jsonLd = extractJsonLdImage(html, pageUrl);
  if (jsonLd) return jsonLd;

  return extractContentImageFromHtml(html, pageUrl);
}

const SKIP_IMAGE_PATTERN =
  /(?:logo|favicon|icon|sprite|badge|avatar|mstile|webclip|\/flags\/|cropped-.*32x32|32x32|64x64|192x192|\.svg(?:\?|$))/i;

export function extractContentImageFromHtml(html: string, pageUrl: string): string | null {
  const candidates: string[] = [];

  for (const match of html.matchAll(
    /(?:src|content|data-src|data-lazy-src)=["']([^"']+\.(?:jpg|jpeg|png|webp|avif)(?:[^"']*)?)["']/gi,
  )) {
    const raw = match[1]?.replace(/&amp;/g, "&");
    if (!raw || SKIP_IMAGE_PATTERN.test(raw)) continue;
    const resolved = resolveImageUrl(raw, pageUrl);
    if (resolved) candidates.push(resolved);
  }

  // Prefer camp/hero/banner/photo keywords, then largest-looking CDN paths
  const ranked = candidates.sort((a, b) => scoreImageCandidate(b) - scoreImageCandidate(a));
  return ranked[0] ?? null;
}

function scoreImageCandidate(url: string): number {
  const u = url.toLowerCase();
  let score = 0;
  if (u.includes("camp")) score += 4;
  if (u.includes("banner") || u.includes("hero") || u.includes("header")) score += 3;
  if (u.includes("photo") || u.includes("gallery") || u.includes("img_")) score += 2;
  if (u.includes("location-") || u.includes("school")) score += 2;
  if (u.includes("width=2000") || u.includes("1500w") || u.includes("1920")) score += 2;
  if (u.includes("png") && u.includes("brochure")) score -= 2;
  if (u.includes("ofsted") || u.includes("rospa") || u.includes("recommend")) score -= 5;
  return score;
}

export async function extractImageFromPage(url: string): Promise<string | null> {
  const html = await fetchPageHtml(url);
  if (!html) return null;

  const imageUrl = extractImageFromHtml(html, url);
  if (!imageUrl) return null;

  if (await validateImageUrl(imageUrl)) return imageUrl;
  return imageUrl;
}

export async function fetchPageHtml(url: string): Promise<string | null> {
  if (!isHttpsUrl(url)) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
      signal: controller.signal,
    });

    if (!response.ok) return null;

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html") && !contentType.includes("application/xhtml")) {
      return null;
    }

    return await response.text();
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function validateImageUrl(url: string): Promise<boolean> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: "HEAD",
      headers: { "User-Agent": USER_AGENT },
      redirect: "follow",
      signal: controller.signal,
    });

    if (!response.ok) return false;

    const contentType = response.headers.get("content-type") ?? "";
    return contentType.startsWith("image/") || contentType === "";
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}
