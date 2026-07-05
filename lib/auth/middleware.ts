import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { getSupabaseConfigOrNull } from "@/lib/auth/env";
import { checkRateLimit, rateLimitKey } from "@/lib/security/rate-limit";

function isSupabaseNetworkError(error: unknown): boolean {
  if (error instanceof TypeError) return true;
  if (error && typeof error === "object" && "message" in error) {
    const message = String((error as { message: unknown }).message).toLowerCase();
    return (
      message.includes("fetch failed") ||
      message.includes("failed to fetch") ||
      message.includes("network")
    );
  }
  return false;
}

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (
    pathname.startsWith("/api/clubs/upload-image") &&
    request.method === "POST"
  ) {
    try {
      const ip =
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
        request.headers.get("x-real-ip") ??
        "unknown";
      checkRateLimit(rateLimitKey("upload-image-ip", ip), {
        limit: 30,
        windowMs: 60 * 60 * 1000,
      });
    } catch {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429 },
      );
    }
  }

  const isAuthRoute =
    pathname.startsWith("/login") || pathname.startsWith("/signup");
  const isProtected =
    pathname === "/" ||
    pathname.startsWith("/discover") ||
    pathname.startsWith("/calendar") ||
    pathname.startsWith("/friends") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/planner") ||
    pathname.startsWith("/clubs") ||
    pathname.startsWith("/my-clubs") ||
    pathname.startsWith("/notifications") ||
    pathname.startsWith("/shared-clubs") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/invite");
  const isPublic =
    pathname.startsWith("/setup") || pathname.startsWith("/auth/");

  const config = getSupabaseConfigOrNull();
  if (!config) {
    if (isProtected && !isPublic) {
      const url = request.nextUrl.clone();
      url.pathname = "/setup";
      return NextResponse.redirect(url);
    }
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(config.url, config.publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  let user = null;
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      if (isSupabaseNetworkError(error)) {
        const { data: sessionData } = await supabase.auth.getSession();
        user = sessionData.session?.user ?? null;
      } else {
        // Stale or invalid session — clear cookies locally only (no remote call).
        try {
          await supabase.auth.signOut({ scope: "local" });
        } catch {
          // Ignore — cookies will expire or user can sign in again.
        }
      }
    } else {
      user = data.user;
    }
  } catch (error) {
    if (isSupabaseNetworkError(error)) {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        user = sessionData.session?.user ?? null;
      } catch {
        // Supabase unreachable — continue as logged out rather than 500.
      }
    }
  }

  if (!user && isProtected && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  supabaseResponse.headers.set("x-pathname", pathname);

  return supabaseResponse;
}
