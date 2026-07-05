export type ParsedClubPrice = {
  price: number | null;
  dailyRate: number | null;
  priceNote: string | null;
};

export function isDailyPriceNote(note: string | null | undefined): boolean {
  if (!note) return false;
  const lower = note.toLowerCase();
  return (
    lower.includes("per day") ||
    lower.includes("/ day") ||
    lower.includes("per session") ||
    lower.includes("/session") ||
    lower.includes("daily rate")
  );
}

export function isWeeklyPriceNote(note: string | null | undefined): boolean {
  if (!note) return false;
  const lower = note.toLowerCase();
  return (
    lower.includes("per week") ||
    lower.includes("/ week") ||
    lower.includes("weekly") ||
    lower.includes("week block") ||
    lower.includes("full week")
  );
}

export function parseClubPrice(priceFrom?: string | null): ParsedClubPrice {
  const note = priceFrom?.trim();
  if (!note) {
    return { price: null, dailyRate: null, priceNote: null };
  }

  const match = note.match(/(\d+(?:\.\d+)?)/);
  const amount = match ? Number.parseFloat(match[1]) : null;
  const isDaily = isDailyPriceNote(note);
  const isWeekly = isWeeklyPriceNote(note);

  if (amount != null && isDaily && !isWeekly) {
    return {
      price: amount,
      dailyRate: amount,
      priceNote: note,
    };
  }

  if (amount != null && isWeekly) {
    return {
      price: amount,
      dailyRate: null,
      priceNote: note,
    };
  }

  return {
    price: amount,
    dailyRate: null,
    priceNote: note,
  };
}
