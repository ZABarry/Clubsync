import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number | null | undefined): string {
  if (price == null) return "Price on request";
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(price);
}

export function formatDateRange(start: Date, end: Date): string {
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
  const s = new Intl.DateTimeFormat("en-GB", opts).format(start);
  const e = new Intl.DateTimeFormat("en-GB", {
    ...opts,
    year: start.getFullYear() !== end.getFullYear() ? "numeric" : undefined,
  }).format(end);
  return `${s} – ${e}`;
}

export function formatOptionalDateRange(
  start: Date | string | null | undefined,
  end: Date | string | null | undefined,
  fallback = "Dates TBC",
): string {
  if (start == null || end == null) return fallback;
  const s = start instanceof Date ? start : new Date(start);
  const e = end instanceof Date ? end : new Date(end);
  return formatDateRange(s, e);
}

export function buildGoogleMapsDirectionsUrl(input: {
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}): string | null {
  const address = input.address?.trim();
  if (address) {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
  }

  if (input.latitude != null && input.longitude != null) {
    return `https://www.google.com/maps/dir/?api=1&destination=${input.latitude},${input.longitude}`;
  }

  return null;
}

export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
