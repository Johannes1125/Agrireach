import { NextRequest, NextResponse } from "next/server";

const ACCESS_COOKIE = process.env.ACCESS_TOKEN_COOKIE || "agrireach_at";
const REFRESH_COOKIE = process.env.REFRESH_TOKEN_COOKIE || "agrireach_rt";
const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN || "localhost";
const COOKIE_SECURE = String(process.env.COOKIE_SECURE || "false").toLowerCase() === "true";

export function jsonOk<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ success: true, data }, { status: 200, ...(init || {}) });
}

export function jsonError(message: string, status = 400, details?: unknown) {
  return NextResponse.json({ success: false, message, details }, { status });
}

export function requireMethod(req: NextRequest, methods: ("GET"|"POST"|"PUT"|"PATCH"|"DELETE")[]) {
  if (!methods.includes(req.method as any)) {
    return jsonError("Method Not Allowed", 405);
  }
}

export function getBearerToken(req: NextRequest): string | null {
  const hdr = req.headers.get("authorization");
  if (!hdr) return null;
  const [scheme, token] = hdr.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) return null;
  return token;
}

export function getAuthToken(req: NextRequest, preferred: "access" | "refresh" = "access"): string | null {
  // Prefer cookie, fallback to Bearer header for compatibility
  const fromCookie = getCookieToken(req, preferred);
  if (fromCookie) return fromCookie;
  return getBearerToken(req);
}

export function withCors(res: NextResponse) {
  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  return res;
}

// TODO: plug in a real rate limiter (e.g., upstash/redis)
// For now, allowing all requests - implement proper rate limiting in production
export async function rateLimitOk(_key: string): Promise<boolean> {
  return true;
}

export function setAuthCookies(res: NextResponse, tokens: { accessToken?: string; refreshToken?: string }) {
  if (tokens.accessToken) {
    res.cookies.set(ACCESS_COOKIE, tokens.accessToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: COOKIE_SECURE,
      path: "/",
      domain: COOKIE_DOMAIN,
      maxAge: 60 * parseInt(process.env.JWT_ACCESS_TTL_MIN || "15", 10),
    });
  }
  if (tokens.refreshToken) {
    res.cookies.set(REFRESH_COOKIE, tokens.refreshToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: COOKIE_SECURE,
      path: "/",
      domain: COOKIE_DOMAIN,
      maxAge: 60 * 60 * 24 * parseInt(process.env.JWT_REFRESH_TTL_DAYS || "7", 10),
    });
  }
  return res;
}

export function clearAuthCookies(res: NextResponse) {
  res.cookies.set(ACCESS_COOKIE, "", { httpOnly: true, expires: new Date(0), path: "/", domain: COOKIE_DOMAIN });
  res.cookies.set(REFRESH_COOKIE, "", { httpOnly: true, expires: new Date(0), path: "/", domain: COOKIE_DOMAIN });
  return res;
}

export function getCookieToken(req: NextRequest, kind: "access" | "refresh"): string | null {
  const key = kind === "access" ? ACCESS_COOKIE : REFRESH_COOKIE;
  const cookie = req.cookies.get(key)?.value;
  return cookie || null;
}
