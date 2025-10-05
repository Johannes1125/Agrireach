"use client"

import { useState, useEffect } from "react"

export interface CommunityStats {
  totalMembers: number
  totalThreads: number
  totalPosts: number
  onlineNow: number
}

export interface TrendingTopic {
  _id: string
  title: string
  replies_count: number
  category: string
  created_at: string
}

export interface RecentActivity {
  type: string
  user: {
    full_name: string
    avatar_url?: string
  }
  action: string
  topic: string
  time: string
  thread_id?: string
}

export function useCommunityData() {
  const [stats, setStats] = useState<CommunityStats | null>(null)
  const [trendingTopics, setTrendingTopics] = useState<TrendingTopic[]>([])
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        const [statsRes, trendingRes, activityRes] = await Promise.all([
          fetch("/api/community/stats"),
          fetch("/api/community/trending?limit=4"),
          fetch("/api/community/recent-activity?limit=5")
        ])

        if (statsRes.ok) {
          const statsData = await statsRes.json()
          setStats(statsData.data.stats)
        }

        if (trendingRes.ok) {
          const trendingData = await trendingRes.json()
          setTrendingTopics(trendingData.data.topics)
        }

        if (activityRes.ok) {
          const activityData = await activityRes.json()
          setRecentActivity(activityData.data.activities)
        }
      } catch (err: any) {
        setError(err.message)
        console.error("Community data fetch error:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  return { 
    stats, 
    trendingTopics, 
    recentActivity, 
    loading, 
    error,
    refetch: () => setLoading(true) 
  }
}
