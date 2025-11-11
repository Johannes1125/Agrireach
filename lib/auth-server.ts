import { cookies, headers } from "next/headers"
import { redirect } from "next/navigation"
import { verifyToken } from "@/server/utils/auth"
import { connectToDatabase } from "@/server/lib/mongodb"
import { User, UserRole } from "@/server/models/User"

/**
 * Server-side authentication and authorization utilities
 * For use in Server Components, Route Handlers, and Server Actions
 */

export interface AuthUser {
  id: string
  email: string
  full_name: string
  role: UserRole | UserRole[]
  roles?: UserRole[]
  avatar_url?: string
  location?: string
  verified: boolean
  trust_score?: number
  status: string
  created_at?: Date
  verification_status?: "none" | "pending" | "verified" | "rejected"
  verification_requested_at?: Date
  bio?: string
  phone?: string
}

/**
 * Get the current user from the access token cookie
 * Returns null if not authenticated
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get("agrireach_at")?.value
    
    if (!accessToken) {
      return null
    }

    const decoded = verifyToken<any>(accessToken, "access")
    if (!decoded?.sub) {
      return null
    }

    await connectToDatabase()
    const user = await User.findById(decoded.sub).select("-password_hash").lean()
    
    if (!user) {
      return null
    }

    // Support both single role and multiple roles
    const roles = Array.isArray(user.roles) ? user.roles : [user.role]

    return {
      id: user._id.toString(),
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      roles: roles,
      avatar_url: user.avatar_url,
      location: user.location,
      verified: user.verified,
      trust_score: user.trust_score,
      status: user.status,
      created_at: user.created_at,
      verification_status: user.verification_status,
      verification_requested_at: user.verification_requested_at,
      bio: user.bio,
      phone: user.phone,
    }
  } catch (error) {
    console.error("Auth error:", error)
    return null
  }
}

/**
 * Require authentication - redirects to login if not authenticated
 */
export async function requireAuth(redirectTo: string = "/auth/login"): Promise<AuthUser> {
  const user = await getCurrentUser()

  if (!user) {
    const headersList = await headers()
    const pathname = headersList.get("x-invoke-path") || "/"
    redirect(`${redirectTo}?redirect=${encodeURIComponent(pathname)}`)
  }

  return user
}

/**
 * Check if user has a specific role
 */
export function hasRole(user: AuthUser | null, role: UserRole): boolean {
  if (!user) return false

  const roles = user.roles || [user.role as UserRole]
  return roles.includes(role)
}

/**
 * Check if user has any of the specified roles
 */
export function hasAnyRole(user: AuthUser | null, roles: UserRole[]): boolean {
  if (!user) return false

  const userRoles = user.roles || [user.role as UserRole]
  return roles.some((role) => userRoles.includes(role))
}

/**
 * Check if user has all of the specified roles
 */
export function hasAllRoles(user: AuthUser | null, roles: UserRole[]): boolean {
  if (!user) return false

  const userRoles = user.roles || [user.role as UserRole]
  return roles.every((role) => userRoles.includes(role))
}

/**
 * Require a specific role - redirects to fallback if user doesn't have it
 */
export async function requireRole(
  role: UserRole,
  fallbackUrl: string = "/dashboard"
): Promise<AuthUser> {
  const user = await requireAuth()

  if (!hasRole(user, role)) {
    redirect(fallbackUrl)
  }

  return user
}

/**
 * Require any of the specified roles
 */
export async function requireAnyRole(
  roles: UserRole[],
  fallbackUrl: string = "/dashboard"
): Promise<AuthUser> {
  const user = await requireAuth()

  if (!hasAnyRole(user, roles)) {
    redirect(fallbackUrl)
  }

  return user
}

/**
 * Require all of the specified roles
 */
export async function requireAllRoles(
  roles: UserRole[],
  fallbackUrl: string = "/dashboard"
): Promise<AuthUser> {
  const user = await requireAuth()

  if (!hasAllRoles(user, roles)) {
    redirect(fallbackUrl)
  }

  return user
}

/**
 * Require admin role
 */
export async function requireAdmin(fallbackUrl: string = "/dashboard"): Promise<AuthUser> {
  return requireRole("admin", fallbackUrl)
}

/**
 * Require recruiter role
 */
export async function requireRecruiter(fallbackUrl: string = "/opportunities"): Promise<AuthUser> {
  return requireRole("recruiter", fallbackUrl)
}

/**
 * Require buyer role
 */
export async function requireBuyer(fallbackUrl: string = "/marketplace"): Promise<AuthUser> {
  return requireRole("buyer", fallbackUrl)
}

/**
 * Require worker role
 */
export async function requireWorker(fallbackUrl: string = "/opportunities"): Promise<AuthUser> {
  return requireRole("worker", fallbackUrl)
}

/**
 * Check if user is the owner of a resource
 */
export function isResourceOwner(user: AuthUser | null, resourceOwnerId: string): boolean {
  if (!user) return false
  return user.id === resourceOwnerId
}
