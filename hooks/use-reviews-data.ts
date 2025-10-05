"use client"

import { useState, useEffect } from "react"
import { authFetch } from "@/lib/auth-client"

export interface Review {
  _id: string
  reviewer_id: {
    full_name: string
    avatar_url?: string
  }
  reviewee_id: {
    full_name: string
    avatar_url?: string
  }
  rating: number
  title?: string
  comment?: string
  category?: string
  verified_purchase: boolean
  helpful_count: number
  created_at: string
  status: string
}

export interface ReviewsFilters {
  reviewee_id?: string
  reviewer_id?: string
  category?: string
  rating?: number
  status?: string
  page?: number
  limit?: number
}

export function useReviewsData(filters: ReviewsFilters = {}) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(0)

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true)
        
        // Build query params
        const params = new URLSearchParams()
        if (filters.reviewee_id) params.append('reviewee_id', filters.reviewee_id)
        if (filters.reviewer_id) params.append('reviewer_id', filters.reviewer_id)
        if (filters.category) params.append('category', filters.category)
        if (filters.rating) params.append('rating', filters.rating.toString())
        if (filters.status) params.append('status', filters.status)
        params.append('page', (filters.page || 1).toString())
        params.append('limit', (filters.limit || 20).toString())

        const res = await authFetch(`/api/reviews?${params.toString()}`)
        
        if (!res.ok) {
          throw new Error("Failed to fetch reviews")
        }

        const data = await res.json()
        setReviews(data.reviews)
        setTotal(data.total)
        setPages(data.pages)
      } catch (err: any) {
        setError(err.message)
        console.error("Reviews fetch error:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchReviews()
  }, [
    filters.reviewee_id,
    filters.reviewer_id,
    filters.category,
    filters.rating,
    filters.status,
    filters.page,
    filters.limit
  ])

  return { 
    reviews, 
    loading, 
    error, 
    total, 
    pages,
    refetch: () => setLoading(true) 
  }
}
