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
        setUsers(data.users || data.items || [])
        setTotal(data.total || data.count || 0)
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

export async function adminUserAction(userId: string, action: "verify" | "unverify" | "suspend" | "unsuspend" | "ban" | "role", role?: string) {
  const res = await authFetch(`/api/admin/users/${userId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, role }),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json?.message || 'Failed to update user')
  return json
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
        setReports(data.reports || data.items || [])
        setTotal(data.total || data.count || 0)
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

export async function adminReportAction(id: string, action: 'resolve' | 'dismiss', resolution?: string) {
  const res = await authFetch('/api/admin/reports', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, action, resolution })
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json?.message || 'Failed to update report')
  return json
}

export function useAdminCommunity() {
  const [threads, setThreads] = useState<any[]>([])
  const [stats, setStats] = useState<{ total: number; active: number; pending: number; flagged: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true)
        const [threadsRes, statsRes] = await Promise.all([
          authFetch('/api/community/threads?limit=50'),
          authFetch('/api/community/stats')
        ])
        if (!threadsRes.ok) throw new Error('Failed to fetch threads')
        const threadsJson = await threadsRes.json()
        const statsJson = statsRes.ok ? await statsRes.json() : {}
        setThreads(threadsJson.data?.items || threadsJson.items || [])
        setStats(statsJson.data || statsJson || null)
      } catch (e: any) {
        setError(e.message || 'Failed to fetch community data')
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [])

  return { threads, stats, loading, error }
}

export function useAdminMarketplace() {
  const [products, setProducts] = useState<any[]>([])
  const [stats, setStats] = useState<{ total: number; active: number; pending: number; flagged: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true)
        const [prodRes] = await Promise.all([
          authFetch('/api/marketplace/products?limit=50')
        ])
        if (!prodRes.ok) throw new Error('Failed to fetch products')
        const prodJson = await prodRes.json()
        const list = prodJson?.data?.products || prodJson?.products || []
        setProducts(list)
        const totals = {
          total: list.length,
          active: list.filter((p: any) => p.status === 'active').length,
          pending: list.filter((p: any) => p.status === 'pending_approval' || p.status === 'pending').length,
          flagged: 0,
        }
        setStats(totals)
      } catch (e: any) {
        setError(e.message || 'Failed to fetch marketplace data')
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [])

  return { products, stats, loading, error }
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

export interface AdminOverview {
  totalUsers: number
  activeUsers: number
  newUsersToday: number
  totalListings: number
  pendingReviews: number
  reportedContent: number
  platformHealth: number
}

export function useAdminOverview() {
  const [stats, setStats] = useState<AdminOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    const run = async () => {
      try {
        setLoading(true)
        const res = await authFetch('/api/admin/overview')
        if (!res.ok) throw new Error('Failed to fetch admin overview')
        const json = await res.json()
        const d = json?.data || json
        if (mounted) setStats(d)
      } catch (e: any) {
        if (mounted) setError(e.message || 'Failed to fetch admin overview')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    run()
    return () => { mounted = false }
  }, [])

  return { stats, loading, error }
}