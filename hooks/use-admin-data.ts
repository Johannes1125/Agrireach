"use client"

import { useState, useEffect } from "react"
import { authFetch } from "@/lib/auth-client"

export interface AdminUser {
  _id: string
  full_name: string
  email: string
  role: string
  status: string
  trust_score: number
  created_at: string
  last_login?: string
  avatar_url?: string
  verified: boolean
}

export interface AdminReport {
  _id: string
  reporter_id: {
    full_name: string
    email: string
  }
  reported_user_id: {
    full_name: string
    email: string
  }
  type: string
  reason: string
  description?: string
  status: string
  priority: string
  created_at: string
  resolved_at?: string
  admin_notes?: string
}

export interface AdminStats {
  totalUsers: number
  activeUsers: number
  totalJobs: number
  totalProducts: number
  totalReports: number
  pendingReports: number
}

export function useAdminUsers(filters: { status?: string; role?: string; search?: string } = {}) {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true)
        const params = new URLSearchParams()
        if (filters.status && filters.status !== "all") params.append("status", filters.status)
        if (filters.role && filters.role !== "all") params.append("role", filters.role)
        if (filters.search) params.append("search", filters.search)
        params.append("limit", "50")

        const res = await authFetch(`/api/admin/users?${params.toString()}`)
        if (!res.ok) {
          throw new Error("Failed to fetch users")
        }

        const data = await res.json()
        setUsers(data.users || [])
        setTotal(data.total || 0)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [filters.status, filters.role, filters.search])

  return { users, loading, error, total, refetch: () => setLoading(true) }
}

export function useAdminReports(filters: { status?: string; priority?: string } = {}) {
  const [reports, setReports] = useState<AdminReport[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true)
        const params = new URLSearchParams()
        if (filters.status && filters.status !== "all") params.append("status", filters.status)
        if (filters.priority && filters.priority !== "all") params.append("priority", filters.priority)
        params.append("limit", "50")

        const res = await authFetch(`/api/admin/reports?${params.toString()}`)
        if (!res.ok) {
          throw new Error("Failed to fetch reports")
        }

        const data = await res.json()
        setReports(data.reports || [])
        setTotal(data.total || 0)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchReports()
  }, [filters.status, filters.priority])

  return { reports, loading, error, total, refetch: () => setLoading(true) }
}

export function useAdminStats() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        const res = await authFetch("/api/admin/stats")
        if (!res.ok) {
          throw new Error("Failed to fetch admin stats")
        }

        const data = await res.json()
        setStats(data.stats)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  return { stats, loading, error, refetch: () => setLoading(true) }
}
