export type SupabaseConfig = {
  url: string;
  publishableKey: string;
};

/** Returns Supabase client config when env vars are present (e.g. missing on Vercel). */
export function getSupabaseConfigOrNull(): SupabaseConfig | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !publishableKey) return null;
  return { url, publishableKey };
}

export function getSupabaseUrl() {
  const config = getSupabaseConfigOrNull();
  if (!config) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  }
  return config.url;
}

/** Supports Supabase's newer publishable key and legacy anon key names. */
export function getSupabasePublishableKey() {
  const config = getSupabaseConfigOrNull();
  if (!config) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY)",
    );
  }
  return config.publishableKey;
}
