"use client"

import { useState, useEffect } from "react"
import { authFetch } from "@/lib/auth-client"

export interface OrderItem {
  _id: string
  buyer_id: {
    _id: string
    full_name: string
    email: string
    location: string
  }
  seller_id: {
    _id: string
    full_name: string
    email: string
    location: string
  }
  product_id: {
    _id: string
    title: string
    price: number
    unit: string
    images?: any
  }
  quantity: number
  total_price: number
  delivery_address: string
  status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled"
  payment_status: "pending" | "paid" | "refunded" | "failed"
  payment_method?: string
  created_at: string
  updated_at: string
}

export interface OrdersResponse {
  orders: OrderItem[]
  total: number
  page: number
  pages: number
}

export function useOrdersData(role: "buyer" | "seller" = "buyer", limit: number = 10) {
  const [orders, setOrders] = useState<OrderItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchOrders = async () => {
    try {
      setLoading(true)
      console.log(`Fetching ${role} orders...`)
      
      const res = await authFetch(`/api/marketplace/orders?role=${role}&limit=${limit}`)
      
      console.log("Orders response status:", res.status)
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        console.error("Error response:", errorData)
        throw new Error(errorData.message || `Failed to fetch ${role} orders`)
      }

      const response = await res.json()
      console.log("Orders response:", response)
      const ordersData = response.data?.orders || response.orders || []
      console.log(`${role} orders received:`, ordersData.length)
      console.log("Orders data:", ordersData)
      setOrders(ordersData)
    } catch (err: any) {
      setError(err.message)
      console.error(`${role} orders fetch error:`, err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [role, limit])

  return { orders, loading, error, refetch: fetchOrders }
}
