import { NextResponse } from "next/server";

import { createClient } from "@/lib/auth/supabase-server";
import { checkRateLimit, rateLimitKey } from "@/lib/security/rate-limit";
import { sanitizeRedirectPath } from "@/lib/security/safe-redirect";
import type { EmailOtpType } from "@supabase/supabase-js";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";
  try {
    checkRateLimit(rateLimitKey("auth-callback", ip), {
      limit: 30,
      windowMs: 15 * 60 * 1000,
    });
  } catch {
    return NextResponse.redirect(`${origin}/login?error=rate_limit`);
  }

  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = sanitizeRedirectPath(
    searchParams.get("next"),
    "/profile?onboarding=true",
  );

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
