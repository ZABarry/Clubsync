import { extractImageFromHtml, fetchPageHtml } from "@/lib/clubs/extract-page-image";
import { extractUkPostcode } from "@/lib/clubs/geo-utils";

export type ScrapedClubData = {
  bookingUrl?: string;
  priceNote?: string;
  dailyRate?: number;
  weeklyPrice?: number;
  startDate?: string;
  endDate?: string;
  dailyStartTime?: string;
  dailyEndTime?: string;
  description?: string;
  imageUrl?: string;
  address?: string;
  postcode?: string;
  activities?: string[];
  ageMin?: number;
  ageMax?: number;
};

const MONTHS: Record<string, number> = {
  jan: 0,
  january: 0,
  feb: 1,
  february: 1,
  mar: 2,
  march: 2,
  apr: 3,
  april: 3,
  may: 4,
  jun: 5,
  june: 5,
  jul: 6,
  july: 6,
  aug: 7,
  august: 7,
  sep: 8,
  september: 8,
  oct: 9,
  october: 9,
  nov: 10,
  november: 10,
  dec: 11,
  december: 11,
};

function parseUkDate(day: number, month: number, year: number): string {
  const d = new Date(Date.UTC(year, month, day));
  return d.toISOString().slice(0, 10);
}

function parseDateRange(text: string, defaultYear = 2026): { start?: string; end?: string } {
  const rangeMatch = text.match(
    /(\d{1,2})(?:st|nd|rd|th)?\s*[-–—]\s*(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]+)(?:\s+(\d{4}))?/i,
  );
  if (rangeMatch) {
    const [, d1, d2, monthName, yearStr] = rangeMatch;
    const month = MONTHS[monthName.toLowerCase()];
    if (month == null) return {};
    const year = yearStr ? Number.parseInt(yearStr, 10) : defaultYear;
    return {
      start: parseUkDate(Number.parseInt(d1, 10), month, year),
      end: parseUkDate(Number.parseInt(d2, 10), month, year),
    };
  }

  const crossMonth = text.match(
    /(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]+)\s*[-–—]\s*(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]+)(?:\s+(\d{4}))?/i,
  );
  if (crossMonth) {
    const [, d1, m1, d2, m2, yearStr] = crossMonth;
    const month1 = MONTHS[m1.toLowerCase()];
    const month2 = MONTHS[m2.toLowerCase()];
    if (month1 == null || month2 == null) return {};
    const year = yearStr ? Number.parseInt(yearStr, 10) : defaultYear;
    return {
      start: parseUkDate(Number.parseInt(d1, 10), month1, year),
      end: parseUkDate(Number.parseInt(d2, 10), month2, year),
    };
  }

  return {};
}

function extractPrices(html: string): {
  priceNote?: string;
  dailyRate?: number;
  weeklyPrice?: number;
} {
  const perDayMatch =
    html.match(/£\s*(\d+(?:\.\d+)?)\s*(?:per day|\/ day|a day)/i) ??
    html.match(/(\d+(?:\.\d+)?)\s*(?:per day|\/ day)/i);
  const perWeekMatch =
    html.match(/£\s*(\d+(?:\.\d+)?)\s*(?:per week|\/ week|full week)/i) ??
    html.match(/Full Week[^£]{0,40}£\s*(\d+(?:\.\d+)?)/i);

  const dailyRate = perDayMatch ? Number.parseFloat(perDayMatch[1]) : undefined;
  const weeklyPrice = perWeekMatch ? Number.parseFloat(perWeekMatch[1]) : undefined;

  let priceNote: string | undefined;
  if (dailyRate != null) {
    priceNote = weeklyPrice
      ? `£${dailyRate} per day; £${weeklyPrice} per week`
      : `£${dailyRate} per day`;
  } else if (weeklyPrice != null) {
    priceNote = `£${weeklyPrice} per week`;
  } else {
    const fromMatch = html.match(/(?:from|price)[^£]{0,20}£\s*(\d+(?:\.\d+)?)/i);
    if (fromMatch) priceNote = `From £${fromMatch[1]}`;
  }

  return { priceNote, dailyRate, weeklyPrice };
}

function extractTimes(html: string): { dailyStartTime?: string; dailyEndTime?: string } {
  const timeMatch = html.match(
    /(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\s*[-–—to]+\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i,
  );
  if (!timeMatch) return {};

  const normalize = (raw: string): string | undefined => {
    const t = raw.trim().toLowerCase();
    const m = t.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/);
    if (!m) return undefined;
    let hour = Number.parseInt(m[1], 10);
    const mins = m[2] ?? "00";
    const meridiem = m[3];
    if (meridiem === "pm" && hour < 12) hour += 12;
    if (meridiem === "am" && hour === 12) hour = 0;
    return `${String(hour).padStart(2, "0")}:${mins}`;
  };

  return {
    dailyStartTime: normalize(timeMatch[1]),
    dailyEndTime: normalize(timeMatch[2]),
  };
}

function extractAgeRange(html: string): { ageMin?: number; ageMax?: number } {
  const rangeMatch =
    html.match(/(?:ages?|aged)\s*(\d+)\s*[-–—to]+\s*(\d+)/i) ??
    html.match(/(\d+)\s*[-–—to]+\s*(\d+)\s*(?:year|yrs?)/i);
  if (!rangeMatch) return {};
  return {
    ageMin: Number.parseInt(rangeMatch[1], 10),
    ageMax: Number.parseInt(rangeMatch[2], 10),
  };
}

function extractSummerSeasonDates(html: string): { start?: string; end?: string } {
  const summerBlock = html.match(
    /(?:summer|july|august)[\s\S]{0,800}?(\d{1,2}(?:st|nd|rd|th)?\s*[-–—][\s\S]{0,40}?(?:july|august)[\s\S]{0,80})/i,
  );
  if (summerBlock) {
    const parsed = parseDateRange(summerBlock[1]);
    if (parsed.start) return parsed;
  }

  const julAug = html.match(
    /(\d{1,2})(?:st|nd|rd|th)?\s*(?:july|jul)\s*[-–—]\s*(\d{1,2})(?:st|nd|rd|th)?\s*(?:august|aug)(?:\s+(\d{4}))?/i,
  );
  if (julAug) {
    const year = julAug[3] ? Number.parseInt(julAug[3], 10) : 2026;
    return {
      start: parseUkDate(Number.parseInt(julAug[1], 10), 6, year),
      end: parseUkDate(Number.parseInt(julAug[2], 10), 7, year),
    };
  }

  const dayMonthRanges = [...html.matchAll(/(\d{1,2})\s*[-–—]\s*(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{4})/gi)];
  if (dayMonthRanges.length >= 2) {
    const first = dayMonthRanges[0];
    const last = dayMonthRanges[dayMonthRanges.length - 1];
    const m1 = MONTHS[first[3].toLowerCase()];
    const m2 = MONTHS[last[3].toLowerCase()];
    const year = Number.parseInt(first[4], 10);
    return {
      start: parseUkDate(Number.parseInt(first[1], 10), m1, year),
      end: parseUkDate(Number.parseInt(last[2], 10), m2, year),
    };
  }

  if (dayMonthRanges.length === 1) {
    const only = dayMonthRanges[0];
    const month = MONTHS[only[3].toLowerCase()];
    const year = Number.parseInt(only[4], 10);
    return {
      start: parseUkDate(Number.parseInt(only[1], 10), month, year),
      end: parseUkDate(Number.parseInt(only[2], 10), month, year),
    };
  }

  const allRanges = [...html.matchAll(/(\d{1,2})\s*[-–—]\s*(\d{1,2})\s+(Jul|Aug|July|August)\s+(\d{4})/gi)];
  if (allRanges.length > 0) {
    const first = allRanges[0];
    const last = allRanges[allRanges.length - 1];
    const m1 = MONTHS[first[3].toLowerCase()];
    const m2 = MONTHS[last[3].toLowerCase()];
    const year = Number.parseInt(first[4], 10);
    return {
      start: parseUkDate(Number.parseInt(first[1], 10), m1, year),
      end: parseUkDate(Number.parseInt(last[2], 10), m2, year),
    };
  }

  return {};
}

function extractAddress(html: string): string | undefined {
  const campDetails = html.match(/Camp Details[\s\S]{0,400}?([A-Z][\s\S]{10,120}?(?:Surrey|Middlesex|London)[\s\S]{0,40}?(?:[A-Z]{1,2}\d[\dA-Z]?\s*\d[A-Z]{2}))/i);
  if (campDetails) return campDetails[1].replace(/\s+/g, " ").trim();

  const locationLine = html.match(/Location:\s*([^<\n]+)/i);
  if (locationLine) return locationLine[1].trim();

  return undefined;
}

function inferActivities(html: string, fallback: string[]): string[] {
  const found = new Set<string>(fallback);
  const keywords: Record<string, string> = {
    swimming: "swimming",
    football: "football",
    dance: "dance",
    drama: "drama",
    art: "arts and crafts",
    craft: "arts and crafts",
    science: "science",
    stem: "STEM",
    animation: "animation",
    film: "filmmaking",
    tennis: "tennis",
    gymnastics: "gymnastics",
    coding: "coding",
    lego: "lego",
    robotics: "robotics",
    chess: "chess",
    golf: "golf",
    horse: "horse riding",
    pony: "horse riding",
    theatre: "theatre",
    music: "music",
    "multi-activity": "multi-activity",
    "multi activity": "multi-activity",
    sport: "sports",
    forest: "forest school",
    survival: "survival skills",
  };

  const lower = html.toLowerCase();
  for (const [key, activity] of Object.entries(keywords)) {
    if (lower.includes(key)) found.add(activity);
  }

  return [...found];
}

export function scrapeClubDataFromHtml(
  html: string,
  pageUrl: string,
  fallbackActivities: string[] = [],
): ScrapedClubData {
  const prices = extractPrices(html);
  const times = extractTimes(html);
  const ages = extractAgeRange(html);
  const seasonDates = extractSummerSeasonDates(html);
  const address = extractAddress(html);
  const postcode = address ? extractUkPostcode(address) ?? undefined : undefined;
  const imageUrl = extractImageFromHtml(html, pageUrl) ?? undefined;

  const descriptionMatch = html.match(
    /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i,
  );

  return {
    bookingUrl: pageUrl,
    ...prices,
    ...times,
    ...ages,
    ...seasonDates,
    address,
    postcode,
    imageUrl,
    description: descriptionMatch?.[1],
    activities: inferActivities(html, fallbackActivities),
  };
}

export async function scrapeClubPage(
  url: string,
  fallbackActivities: string[] = [],
): Promise<ScrapedClubData | null> {
  const html = await fetchPageHtml(url);
  if (!html) return null;
  return scrapeClubDataFromHtml(html, url, fallbackActivities);
}
