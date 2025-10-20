"use client"

import { useState, useEffect } from "react"
import { authFetch } from "@/lib/auth-client"

export interface FeaturedProduct {
  _id: string
  title: string
  price: number
  unit: string
  images?: any[]
  seller_id: {
    _id: string
    full_name: string
    location: string
  }
  status: string
  created_at: string
  rating?: number
  reviews_count?: number
}

export interface FeaturedProductsResponse {
  products: FeaturedProduct[]
  total: number
}

export function useFeaturedProductsData(limit: number = 12) {
  const [products, setProducts] = useState<FeaturedProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchFeaturedProducts = async () => {
    try {
      setLoading(true)
      console.log("=== FEATURED PRODUCTS HOOK ===")
      console.log("Fetching featured products...")
      
      // Fetch active products from marketplace
      const res = await authFetch(`/api/marketplace/products?status=active&limit=${limit}&sortBy=created_at`)
      
      console.log("Featured products response status:", res.status)
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        console.error("Error response:", errorData)
        throw new Error(errorData.message || "Failed to fetch featured products")
      }

      const response = await res.json()
      console.log("Featured products response:", response)
      const productsData = response.data?.products || response.products || []
      console.log("Featured products received:", productsData.length)
      console.log("Raw products data:", productsData)
      
      // Filter out current user's products to show only other sellers' products
      const filteredProducts = productsData.filter((product: any) => {
        // This will be filtered on the client side since we don't have user context in the hook
        return product.status === "active"
      })
      
      console.log("Filtered products:", filteredProducts.length)
      console.log("Sample filtered product:", filteredProducts[0])
      setProducts(filteredProducts)
    } catch (err: any) {
      setError(err.message)
      console.error("Featured products fetch error:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFeaturedProducts()
  }, [limit])

  return { products, loading, error, refetch: fetchFeaturedProducts }
}
