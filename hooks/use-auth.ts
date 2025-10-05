"use client"

import { useEffect, useState } from "react"
import { authFetch } from "@/lib/auth-client"

export interface AuthUser {
  id: string
  name: string
  email: string
  role: string
  avatar?: string
  location?: string
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
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
        const u = json?.user
        if (isMounted && u) {
          setUser({
            id: u._id || u.id,
            name: u.full_name || u.name || "",
            email: u.email || "",
            role: u.role || "user",
            avatar: u.avatar_url || u.avatar || "",
            location: u.location || "",
          })
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
  }, [])

  return { user, loading }
}


