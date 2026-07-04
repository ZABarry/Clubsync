import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { getSupabaseConfigOrNull } from "@/lib/auth/env";

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isAuthRoute =
    pathname.startsWith("/login") || pathname.startsWith("/signup");
  const isProtected =
    pathname === "/" ||
    pathname.startsWith("/discover") ||
    pathname.startsWith("/calendar") ||
    pathname.startsWith("/friends") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/planner") ||
    pathname.startsWith("/camps") ||
    pathname.startsWith("/shared-camps") ||
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
      // Stale or invalid session cookies — clear them so we don't retry every request.
      await supabase.auth.signOut();
    } else {
      user = data.user;
    }
  } catch {
    // Supabase unreachable (network/proxy) — continue as logged out rather than 500.
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
