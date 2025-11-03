"use client"

import { useEffect, useState } from "react"
import { authFetch } from "@/lib/auth-client"

export interface BusinessProfile {
  company_name?: string
  industry?: string
  business_type?: string
  company_size?: string
  business_description?: string
  business_address?: string
  business_coordinates?: {
    latitude: number
    longitude: number
  }
  business_registration?: string
  business_hours?: string
  website?: string
  business_logo?: string
  years_in_business?: number
  services_offered?: string[]
  skills?: string[]
  phone?: string
}

export function useUserProfile() {
  const [profile, setProfile] = useState<BusinessProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    const run = async () => {
      try {
        setLoading(true)
        const res = await authFetch("/api/profile/business")
        if (!res.ok) throw new Error("Failed to fetch profile")
        const json = await res.json()
        if (mounted) setProfile(json?.data?.profile || json?.profile || null)
      } catch (e: any) {
        if (mounted) setError(e.message || "Failed to fetch profile")
      } finally {
        if (mounted) setLoading(false)
      }
    }
    run()
    return () => { mounted = false }
  }, [])

  const saveProfile = async (payload: BusinessProfile) => {
    const res = await authFetch("/api/profile/business", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(json?.message || "Failed to save profile")
    setProfile(json?.data?.profile || json?.profile || payload)
    return json
  }

  return { profile, loading, error, saveProfile }
}


