"use client"

import { useEffect, useState, useRef } from "react"
import { usePathname } from "next/navigation"
import { authFetch } from "@/lib/auth-client"

export interface AuthUser {
  id: string
  name: string
  email: string
  role: string
  roles?: string[]
  avatar?: string
  location?: string
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const pathname = usePathname()
  const hasFetched = useRef(false)

  useEffect(() => {
    // Skip auth check on homepage and auth pages to avoid unnecessary API calls
    const isAuthPage = pathname?.startsWith('/auth') || pathname?.startsWith('/admin/login')
    const isLandingPage = pathname === '/'
    
    if (isAuthPage || isLandingPage) {
      setLoading(false)
      return
    }

    // If we've already fetched user data, don't refetch on navigation
    if (hasFetched.current) {
      return
    }

    let isMounted = true

    const fetchUser = async () => {
      try {
        setLoading(true)
        const res = await authFetch("/api/auth/me")
        if (!res.ok) {
          if (isMounted) setUser(null)
          return
        }
        const json = await res.json()
        const u = json?.data?.user || json?.user
        if (isMounted && u) {
          setUser({
            id: u._id || u.id,
            name: u.full_name || u.name || "",
            email: u.email || "",
            role: u.role || "user",
            roles: u.roles || [u.role || "user"],
            avatar: u.avatar_url || u.avatar || "",
            location: u.location || "",
          })
          hasFetched.current = true
        }
      } catch (_err) {
        if (isMounted) setUser(null)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchUser()
    return () => {
      isMounted = false
    }
  }, [pathname])

  return { user, loading }
}


