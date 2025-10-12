"use client"

import { useAuth } from "@/hooks/use-auth"
import { userHasRole, userHasAnyRole } from "@/lib/role-utils"
import { UserRole } from "@/server/models/User"
import { useRouter, usePathname } from "next/navigation"
import { useEffect, ReactNode } from "react"
import { toast } from "sonner"
import { PageLoader } from "@/components/ui/page-loader"

interface RouteGuardProps {
  children: ReactNode
  requireAuth?: boolean
  requiredRole?: UserRole
  requiredRoles?: UserRole[]
  requireAnyRole?: boolean // If true, user needs ANY of the requiredRoles. If false, needs ALL
  redirectTo?: string
  showToast?: boolean
}

/**
 * Client-side route guard component
 * Protects routes by checking authentication and role requirements
 */
export function RouteGuard({
  children,
  requireAuth = false,
  requiredRole,
  requiredRoles,
  requireAnyRole = true,
  redirectTo = "/auth/login",
  showToast = true,
}: RouteGuardProps) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (loading) return

    // Check authentication requirement
    if (requireAuth && !user) {
      if (showToast) {
        toast.error("Please log in to access this page")
      }
      const loginUrl = `${redirectTo}?redirect=${encodeURIComponent(pathname)}`
      router.push(loginUrl)
      return
    }

    // Check single role requirement
    if (requiredRole && !userHasRole(user, requiredRole)) {
      if (showToast) {
        toast.error(`You need the ${requiredRole} role to access this page`)
      }
      router.push("/dashboard")
      return
    }

    // Check multiple role requirements
    if (requiredRoles && requiredRoles.length > 0) {
      const hasAccess = requireAnyRole
        ? userHasAnyRole(user, requiredRoles)
        : requiredRoles.every((role) => userHasRole(user, role))

      if (!hasAccess) {
        if (showToast) {
          const roleMsg = requireAnyRole
            ? `one of these roles: ${requiredRoles.join(", ")}`
            : `all of these roles: ${requiredRoles.join(", ")}`
          toast.error(`You need ${roleMsg} to access this page`)
        }
        router.push("/dashboard")
        return
      }
    }
  }, [user, loading, requireAuth, requiredRole, requiredRoles, requireAnyRole, pathname, redirectTo, router, showToast])

  // Show loading state while checking authentication
  if (loading) {
    return <PageLoader text="Verifying access..." variant="spinner" size="md" />
  }

  // Don't render children until auth check is complete
  if (requireAuth && !user) {
    return <PageLoader text="Redirecting..." variant="spinner" size="md" />
  }

  // Check role requirements before rendering
  if (requiredRole && !userHasRole(user, requiredRole)) {
    return <PageLoader text="Checking permissions..." variant="spinner" size="md" />
  }

  if (requiredRoles && requiredRoles.length > 0) {
    const hasAccess = requireAnyRole
      ? userHasAnyRole(user, requiredRoles)
      : requiredRoles.every((role) => userHasRole(user, role))

    if (!hasAccess) {
      return <PageLoader text="Checking permissions..." variant="spinner" size="md" />
    }
  }

  return <>{children}</>
}

/**
 * Higher-order component for route guarding
 */
export function withRouteGuard<P extends object>(
  Component: React.ComponentType<P>,
  guardOptions: Omit<RouteGuardProps, "children">
) {
  return function GuardedComponent(props: P) {
    return (
      <RouteGuard {...guardOptions}>
        <Component {...props} />
      </RouteGuard>
    )
  }
}

