import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decodeJwt, getRolesFromPayload } from "@/lib/jwt-edge";

// Define route access rules
const PUBLIC_ROUTES = ["/", "/auth/login", "/auth/register", "/accessibility"];
const AUTH_ROUTES = ["/auth/login", "/auth/register"];
const PROTECTED_ROUTES = [
  "/dashboard",
  "/profile",
  "/settings",
  "/notifications",
  "/reviews/write",
  "/opportunities",
];
const RECRUITER_ROUTES = ["/opportunities/post", "/opportunities/edit"];
const WORKER_ROUTES = ["/opportunities/apply"];
const COMMUNITY_ROUTES = ["/community","/community/new-thread", "/community/thread", "/community/thread/edit", "/community/thread/delete"];
const NEWS_ROUTES = ["/news/create", "/news/edit", "/news/delete"];
const MARKETPLACE_ROUTES = ["/marketplace","/marketplace/sell", "/marketplace/edit", "/marketplace/payment", "/marketplace/payment/success", "/marketplace/payment/failed"];
const PROFILE_ROUTES = ["/profile/edit", "/profile/delete"];
const SETTINGS_ROUTES = ["/settings/edit", "/settings/delete"];
const NOTIFICATIONS_ROUTES = ["/notifications/edit", "/notifications/delete"];
const REVIEWS_ROUTES = ["/reviews/write", "/reviews/edit", "/reviews/delete"];
const ADMIN_ROUTES = ["/admin/users", "/admin/content", "/admin/reports", "/admin/settings"];

function matchesRoute(path: string, routes: string[]): boolean {
  return routes.some((route) => {
    if (route.endsWith("/*")) {
      return path.startsWith(route.slice(0, -2));
    }
    return path === route || path.startsWith(`${route}/`);
  });
}

function getUserFromToken(token: string): { sub: string; roles: string[] } | null {
  try {
    const payload = decodeJwt(token);
    if (!payload) return null;
    
    const roles = getRolesFromPayload(payload);
    return {
      sub: payload.sub,
      roles: roles,
    };
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = request.cookies.get("agrireach_at")?.value;
  const user = token ? getUserFromToken(token) : null;

  if (PUBLIC_ROUTES.includes(pathname)) {
    return NextResponse.next();
  }

  if (matchesRoute(pathname, AUTH_ROUTES)) {
    if (user) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  if (matchesRoute(pathname, PROTECTED_ROUTES)) {
    if (!user) {
      const loginUrl = new URL("/auth/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  if (matchesRoute(pathname, ADMIN_ROUTES)) {
    if (!user) {
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }
    if (!user.roles.includes("admin")) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  // Protect recruiter routes
  if (matchesRoute(pathname, RECRUITER_ROUTES)) {
    if (!user) {
      const loginUrl = new URL("/auth/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (!user.roles.includes("recruiter")) {
      return NextResponse.redirect(new URL("/opportunities", request.url));
    }
    return NextResponse.next();
  }

  // Protect worker routes
  if (matchesRoute(pathname, WORKER_ROUTES)) {
    if (!user) {
      const loginUrl = new URL("/auth/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (!user.roles.includes("worker")) {
      return NextResponse.redirect(new URL("/opportunities", request.url));
    }
    return NextResponse.next();
  }

  // Protect marketplace routes (allow buyer, worker, recruiter)
  if (matchesRoute(pathname, MARKETPLACE_ROUTES)) {
    if (!user) {
      const loginUrl = new URL("/auth/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (!user.roles.some(role => ["buyer", "worker", "recruiter"].includes(role))) {
      return NextResponse.redirect(new URL("/marketplace", request.url));
    }
    return NextResponse.next();
  }

  // For community action routes, just require authentication
  if (matchesRoute(pathname, COMMUNITY_ROUTES)) {
    if (!user) {
      const loginUrl = new URL("/auth/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // News management routes - restrict to admins
  if (matchesRoute(pathname, NEWS_ROUTES)) {
    if (!user) {
      const loginUrl = new URL("/auth/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (!user.roles.includes("admin")) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  // Auth-required utility routes (basic login requirement)
  if (
    matchesRoute(pathname, PROFILE_ROUTES) ||
    matchesRoute(pathname, SETTINGS_ROUTES) ||
    matchesRoute(pathname, NOTIFICATIONS_ROUTES) ||
    matchesRoute(pathname, REVIEWS_ROUTES)
  ) {
    if (!user) {
      const loginUrl = new URL("/auth/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // Allow all other routes (marketplace, community, opportunities list pages, etc.)
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|public).*)",
  ],
};

