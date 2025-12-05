"use client"

import { useState, useEffect } from "react"
import { authFetch } from "@/lib/auth-client"

export interface Product {
  _id: string
  title: string
  price: number
  unit: string
  seller_id: {
    full_name: string
    location?: string
  }
  category: string
  images: string[]
  description: string
  quantity_available: number
  status: string
  organic: boolean
  created_at: string
}

export interface MarketplaceFilters {
  search?: string
  category?: string
  location?: string
  organic?: boolean
  minPrice?: number
  maxPrice?: number
  sortBy?: string
  page?: number
  limit?: number
  excludeOwn?: boolean      // Hide user's own products
  nearMe?: boolean          // Only show nearby products
  buyerLocation?: string    // User's location for nearMe filter
}

export function useMarketplaceData(filters: MarketplaceFilters = {}) {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(0)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        // Build query params
        const params = new URLSearchParams()
        if (filters.search) params.append('search', filters.search)
        if (filters.category && filters.category !== 'all') params.append('category', filters.category)
        if (filters.location) params.append('location', filters.location)
        if (filters.organic !== undefined) params.append('organic', filters.organic.toString())
        if (filters.minPrice) params.append('minPrice', filters.minPrice.toString())
        if (filters.maxPrice) params.append('maxPrice', filters.maxPrice.toString())
        if (filters.sortBy) params.append('sortBy', filters.sortBy)
        params.append('page', (filters.page || 1).toString())
        params.append('limit', (filters.limit || 20).toString())
        
        // Add new filters for hiding own products and near me
        if (filters.excludeOwn) params.append('excludeOwn', 'true')
        if (filters.nearMe) params.append('nearMe', 'true')
        if (filters.buyerLocation) params.append('buyerLocation', filters.buyerLocation)

        const [productsRes, categoriesRes] = await Promise.all([
          authFetch(`/api/marketplace/products?${params.toString()}`),
          fetch('/api/marketplace/categories')
        ])

        if (!productsRes.ok) {
          throw new Error("Failed to fetch products")
        }

        const productsData = await productsRes.json()
        const categoriesData = categoriesRes.ok ? await categoriesRes.json() : { categories: [] }

        // API returns { success, data: { products, total, page, pages } }
        const p = productsData?.data || productsData
        setProducts(p.products || [])
        setTotal(p.total || 0)
        setPages(p.pages || 0)
        setCategories((categoriesData.data?.categories || categoriesData.categories) || [])
      } catch (err: any) {
        setError(err.message)
        console.error("Marketplace data fetch error:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [
    filters.search,
    filters.category,
    filters.location,
    filters.organic,
    filters.minPrice,
    filters.maxPrice,
    filters.sortBy,
    filters.page,
    filters.limit,
    filters.excludeOwn,
    filters.nearMe,
    filters.buyerLocation
  ])

  return { 
    products, 
    categories, 
    loading, 
    error, 
    total, 
    pages,
    refetch: () => setLoading(true) 
  }
}
