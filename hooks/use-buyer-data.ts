"use client"

import { useState, useEffect } from "react"
import { authFetch } from "@/lib/auth-client"

export interface BuyerProduct {
  _id: string
  title: string
  category: string
  price: number
  unit: string
  quantity_available: number
  status: "active" | "sold" | "pending_approval"
  views: number
  images?: any
  created_at: string
  organic: boolean
}

export function useBuyerData() {
  const [products, setProducts] = useState<BuyerProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    try {
      setLoading(true)
      console.log("Fetching buyer products...")
      const res = await authFetch("/api/dashboard/buyer/products")

      console.log("Response status:", res.status)
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        console.error("Error response:", errorData)
        throw new Error(errorData.message || "Failed to fetch buyer products")
      }

      const response = await res.json()
      console.log("Full response:", response)
      const products = response.data?.products || response.products || []
      console.log("Buyer products received:", products.length)
      console.log("Products data:", products)
      setProducts(products)
    } catch (err: any) {
      setError(err.message)
      console.error("Buyer data fetch error:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  return { products, loading, error, refetch: fetchData }
}

