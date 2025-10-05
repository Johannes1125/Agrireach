"use client"

import { useState, useEffect } from "react"
import { authFetch } from "@/lib/auth-client"

export interface DashboardStats {
  user: {
    id: string
    full_name: string
    role: string
    trust_score: number
    verified: boolean
  }
  unreadNotifications: number
  reviewsReceived: number
  worker?: {
    activeApplications: number
    acceptedJobs: number
    pendingApplications: number
  }
  recruiter?: {
    activeJobs: number
    totalApplications: number
    pendingApplications: number
  }
  buyer?: {
    activeProducts: number
    totalOrders: number
    pendingOrders: number
    totalSpent: number
  }
  seller?: {
    totalOrders: number
    totalEarnings: number
  }
}

export interface RecentActivity {
  type: string
  title: string
  description: string
  timestamp: string
  data: any
}

export function useDashboardData() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [activities, setActivities] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        const [statsRes, activitiesRes] = await Promise.all([
          authFetch("/api/dashboard/stats"),
          authFetch("/api/dashboard/recent-activity?limit=10")
        ])

        if (!statsRes.ok) {
          throw new Error("Failed to fetch dashboard stats")
        }
        
        if (!activitiesRes.ok) {
          throw new Error("Failed to fetch recent activities")
        }

        const statsData = await statsRes.json()
        const activitiesData = await activitiesRes.json()

        setStats(statsData.data.stats)
        setActivities(activitiesData.data.activities)
      } catch (err: any) {
        setError(err.message)
        console.error("Dashboard data fetch error:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  return { stats, activities, loading, error, refetch: () => setLoading(true) }
}
