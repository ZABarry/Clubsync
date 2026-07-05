/** Allow only same-origin relative paths (blocks open redirects). */
export function sanitizeRedirectPath(
  path: string | null | undefined,
  fallback = "/",
): string {
  if (!path || typeof path !== "string") return fallback;

  const trimmed = path.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return fallback;
  }
  if (trimmed.includes("@") || trimmed.includes("\\")) {
    return fallback;
  }

  try {
    const resolved = new URL(trimmed, "http://localhost");
    if (resolved.origin !== "http://localhost") return fallback;
    if (!resolved.pathname.startsWith("/")) return fallback;
    return `${resolved.pathname}${resolved.search}${resolved.hash}`;
  } catch {
    return fallback;
  }
}
