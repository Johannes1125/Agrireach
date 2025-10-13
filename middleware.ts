import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decodeJwt, getRolesFromPayload } from "@/lib/jwt-edge";

const PUBLIC_ROUTES = ["/", "/auth/login", "/auth/register", "/accessibility", "/admin/login"];
const AUTH_ROUTES = ["/auth/login", "/auth/register", "/admin/login"];

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
    
    // Use roles from JWT payload if available, otherwise fallback to role
    const roles = payload.roles || (payload.role ? [payload.role] : []);
    
    return {
      sub: payload.sub,
      roles: roles,
    };
  } catch (error) {
    console.error("Error decoding token:", error);
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = request.cookies.get("agrireach_at")?.value;
  const user = token ? getUserFromToken(token) : null;

  // Allow public routes
  if (PUBLIC_ROUTES.includes(pathname)) {
    return NextResponse.next();
  }

  // Handle auth routes (login, register, admin login)
  if (matchesRoute(pathname, AUTH_ROUTES)) {
    if (user) {
      // Redirect authenticated users away from auth pages
      if (user.roles.includes("admin")) {
        return NextResponse.redirect(new URL("/admin", request.url));
      }
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  // For all other routes, just require authentication
  if (!user) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // User is authenticated, allow access
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
