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

  return extractJsonLdImage(html, pageUrl);
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

export async function extractImageFromPage(url: string): Promise<string | null> {
  const html = await fetchPageHtml(url);
  if (!html) return null;

  const imageUrl = extractImageFromHtml(html, url);
  if (!imageUrl) return null;

  if (await validateImageUrl(imageUrl)) return imageUrl;
  return imageUrl;
}
