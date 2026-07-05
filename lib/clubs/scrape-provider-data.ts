import { extractImageFromHtml, fetchPageHtml } from "@/lib/clubs/extract-page-image";

export type ScrapedProviderData = {
  description?: string;
  contactEmail?: string;
  phone?: string;
  logoUrl?: string;
  website?: string;
};

const UK_PHONE_PATTERN =
  /(?:\+44\s?\d{2,4}|\(?0\d{2,5}\)?)\s?\d{3,4}\s?\d{3,4}|\b0\d{4}\s?\d{6}\b|\b07\d{3}\s?\d{6}\b/g;

const EMAIL_PATTERN = /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g;

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizePhone(raw: string): string | undefined {
  const cleaned = raw.replace(/\s+/g, " ").trim();
  const digits = cleaned.replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 13) return undefined;
  if (/^0+$/.test(digits) || digits.startsWith("0000")) return undefined;
  if (/(\d)\1{5,}/.test(digits)) return undefined;
  return cleaned;
}

function pickBestEmail(emails: string[], pageUrl: string): string | undefined {
  const domain = new URL(pageUrl).hostname.replace(/^www\./, "");
  const filtered = emails.filter(
    (e) =>
      !e.endsWith(".png") &&
      !e.endsWith(".jpg") &&
      !e.includes("example.com") &&
      !e.includes("sentry.io") &&
      !e.includes("wixpress.com") &&
      !e.includes("wordpress.com"),
  );
  if (filtered.length === 0) return undefined;

  const domainMatch = filtered.find((e) => e.split("@")[1]?.includes(domain.split(".")[0] ?? ""));
  return domainMatch ?? filtered[0];
}

function extractMetaDescription(html: string): string | undefined {
  const metaMatch =
    html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i) ??
    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i) ??
    html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i) ??
    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:description["']/i);
  const desc = metaMatch?.[1]?.trim();
  if (!desc || desc.length < 20) return undefined;
  return desc.slice(0, 500);
}

function extractAboutText(html: string): string | undefined {
  const aboutMatch = html.match(
    /(?:about us|who we are|welcome to)[^<]{0,40}<\/[^>]+>[\s\S]{0,200}?<p[^>]*>([\s\S]{40,400}?)<\/p>/i,
  );
  if (aboutMatch) {
    const text = stripHtml(aboutMatch[1]);
    if (text.length >= 40) return text.slice(0, 500);
  }
  return undefined;
}

function extractLogoUrl(html: string, pageUrl: string): string | undefined {
  const logoPatterns = [
    /<img[^>]+(?:class|id|alt)=["'][^"']*logo[^"']*["'][^>]+src=["']([^"']+)["']/i,
    /<img[^>]+src=["']([^"']+)["'][^>]+(?:class|id|alt)=["'][^"']*logo[^"']*["']/i,
    /<link[^>]+rel=["'](?:shortcut )?icon["'][^>]+href=["']([^"']+)["']/i,
    /<link[^>]+href=["']([^"']+)["'][^>]+rel=["'](?:shortcut )?icon["']/i,
  ];

  for (const pattern of logoPatterns) {
    const match = html.match(pattern);
    if (!match?.[1]) continue;
    try {
      const resolved = new URL(match[1], pageUrl).href;
      if (resolved.startsWith("https://")) return resolved;
    } catch {
      continue;
    }
  }

  return extractImageFromHtml(html, pageUrl) ?? undefined;
}

function extractContactBlock(html: string): { email?: string; phone?: string } {
  const contactSection = html.match(
    /(?:contact us|get in touch|contact)[\s\S]{0,1200}?(?:<\/section>|<\/div>|$)/i,
  );
  const searchText = contactSection ? stripHtml(contactSection[0]) : stripHtml(html);

  const emails = [...searchText.matchAll(EMAIL_PATTERN)].map((m) => m[0]);
  const phones = [...searchText.matchAll(UK_PHONE_PATTERN)].map((m) => normalizePhone(m[0]));

  return {
    email: emails[0],
    phone: phones[0],
  };
}

export function scrapeProviderDataFromHtml(
  html: string,
  pageUrl: string,
): ScrapedProviderData {
  const description = extractMetaDescription(html) ?? extractAboutText(html);
  const contact = extractContactBlock(html);
  const allEmails = [...html.matchAll(EMAIL_PATTERN)].map((m) => m[0]);
  const allPhones = [...html.matchAll(UK_PHONE_PATTERN)].map((m) => normalizePhone(m[0]));

  return {
    description,
    contactEmail: pickBestEmail(allEmails.length ? allEmails : contact.email ? [contact.email] : [], pageUrl),
    phone: contact.phone ?? allPhones.find(Boolean),
    logoUrl: extractLogoUrl(html, pageUrl),
  };
}

export async function scrapeProviderPage(url: string): Promise<ScrapedProviderData | null> {
  const html = await fetchPageHtml(url);
  if (!html) return null;
  return scrapeProviderDataFromHtml(html, url);
}

export function getProviderScrapeUrl(provider: {
  website?: string | null;
  sourceUrl?: string | null;
}): string | null {
  const candidates = [provider.website, provider.sourceUrl].filter(Boolean) as string[];
  for (const url of candidates) {
    if (url.startsWith("https://") && !url.includes("example.com")) return url;
  }
  return null;
}
