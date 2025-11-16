"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Loader2, MapPin, Truck, Package, CheckCircle, ExternalLink, Phone, Calendar, User } from "lucide-react"
import { authFetch } from "@/lib/auth-client"
import { formatDate, formatRelativeTime } from "@/lib/utils"

interface OrderTrackingModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  orderId: string
}

interface TrackingInfo {
  delivery_id?: string
  tracking_number?: string
  status: string
  driver?: {
    name?: string
    phone?: string
    email?: string
    vehicle_type?: string
    vehicle_plate_number?: string
    vehicle_description?: string
  }
  pickup_address?: {
    line1: string
    city: string
    coordinates?: { latitude: number; longitude: number }
  }
  delivery_address?: {
    line1: string
    line2?: string
    city: string
    state: string
    postal_code: string
    country: string
    coordinates?: { latitude: number; longitude: number }
  }
  estimated_delivery_time?: string
  actual_delivery_time?: string
  delivery_notes?: string
  seller_notes?: string
  proof_of_delivery?: {
    image_url?: string
    signature?: string
    delivered_at?: string
    received_by?: string
    notes?: string
  }
  assigned_at?: string
  picked_up_at?: string
  in_transit_at?: string
  created_at?: string
  updated_at?: string
}

interface OrderDetails {
  _id: string
  product_id: {
    title: string
    images?: string[]
    unit?: string
  }
  quantity: number
  total_price: number
  status: string
  payment_status: string
  delivery_address: string
  delivery_address_structured?: {
    line1: string
    line2?: string
    city: string
    state: string
    postal_code: string
    country: string
  }
  pickup_address?: {
    line1: string
    city?: string
  }
  delivery_id?: string
  created_at: string
  tracking?: TrackingInfo
}

export function OrderTrackingModal({ open, onOpenChange, orderId }: OrderTrackingModalProps) {
  const [order, setOrder] = useState<OrderDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open && orderId) {
      fetchOrderDetails()
    }
  }, [open, orderId])

  const fetchOrderDetails = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const res = await authFetch(`/api/marketplace/orders/${orderId}`)
      
      if (!res.ok) {
        throw new Error("Failed to fetch order details")
      }
      
      const data = await res.json()
      setOrder(data.order)
    } catch (err: any) {
      setError(err.message || "Failed to load order details")
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "delivered":
        return "bg-green-500"
      case "in_transit":
        return "bg-blue-500"
      case "picked_up":
        return "bg-blue-500"
      case "assigned":
        return "bg-yellow-500"
      case "pending":
        return "bg-gray-500"
      case "cancelled":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      "pending": "Pending",
      "assigned": "Driver Assigned",
      "picked_up": "Picked Up",
      "in_transit": "In Transit",
      "delivered": "Delivered",
      "cancelled": "Cancelled",
    }
    return statusMap[status.toLowerCase()] || status
  }

  const formatAddress = (address: any) => {
    if (typeof address === 'string') return address
    if (address?.line1) {
      const parts = [
        address.line1,
        address.line2,
        address.city,
        address.state,
        address.postal_code,
        address.country
      ].filter(Boolean)
      return parts.join(", ")
    }
    return "Address not available"
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Track Your Order</DialogTitle>
          <DialogDescription>
            Monitor your order status and delivery progress
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-destructive">{error}</p>
            <Button onClick={fetchOrderDetails} className="mt-4">
              Retry
            </Button>
          </div>
        ) : order ? (
          <div className="space-y-6">
            {/* Order Summary */}
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                {order.product_id?.images?.[0] && (
                  <img
                    src={order.product_id.images[0]}
                    alt={order.product_id.title}
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                )}
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{order.product_id?.title || "Product"}</h3>
                  <p className="text-sm text-muted-foreground">
                    Quantity: {order.quantity} {order.product_id?.unit || "units"} • ₱{order.total_price.toLocaleString()}
                  </p>
                  <div className="flex gap-2 mt-2">
                    <Badge variant={order.payment_status === "paid" ? "default" : "secondary"}>
                      {order.payment_status}
                    </Badge>
                    <Badge variant={
                      order.status === "delivered" ? "default" :
                      order.status === "shipped" ? "secondary" :
                      "outline"
                    }>
                      {getStatusLabel(order.status)}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Delivery Tracking */}
            {order.delivery_id || order.tracking ? (
              <div className="space-y-4">
                <h4 className="font-semibold flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Delivery Tracking
                </h4>

                {/* Delivery Status */}
                {order.tracking && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(order.tracking.status)}`} />
                        <div>
                          <span className="font-medium">
                            {getStatusLabel(order.tracking.status)}
                          </span>
                          {order.tracking.tracking_number && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Tracking: {order.tracking.tracking_number}
                            </p>
                          )}
                          {order.tracking.created_at && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Created: {formatDate(order.tracking.created_at)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Estimated Delivery Time */}
                    {order.tracking.estimated_delivery_time && (
                      <div className="p-4 border rounded-lg">
                        <h5 className="font-medium mb-2 flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Estimated Delivery
                        </h5>
                        <p className="text-sm">
                          {formatDate(order.tracking.estimated_delivery_time)}
                        </p>
                      </div>
                    )}

                    {/* Delivery Notes */}
                    {order.tracking.delivery_notes && (
                      <div className="p-4 border rounded-lg">
                        <h5 className="font-medium mb-2">Delivery Notes</h5>
                        <p className="text-sm text-muted-foreground">{order.tracking.delivery_notes}</p>
                      </div>
                    )}

                    {/* Seller Notes */}
                    {order.tracking.seller_notes && (
                      <div className="p-4 border rounded-lg">
                        <h5 className="font-medium mb-2">Seller Notes</h5>
                        <p className="text-sm text-muted-foreground">{order.tracking.seller_notes}</p>
                      </div>
                    )}

                    {/* Driver Info */}
                    {order.tracking.driver && order.tracking.driver.name && (
                      <div className="p-4 border rounded-lg space-y-2">
                        <h5 className="font-medium flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Driver Information
                        </h5>
                        <p className="text-sm font-medium">Name: {order.tracking.driver.name}</p>
                        {order.tracking.driver.phone && (
                          <p className="text-sm flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            <a href={`tel:${order.tracking.driver.phone}`} className="text-primary hover:underline">
                              {order.tracking.driver.phone}
                            </a>
                          </p>
                        )}
                        {order.tracking.driver.email && (
                          <p className="text-sm">
                            Email: <a href={`mailto:${order.tracking.driver.email}`} className="text-primary hover:underline">
                              {order.tracking.driver.email}
                            </a>
                          </p>
                        )}
                        {order.tracking.driver.vehicle_type && (
                          <p className="text-sm">
                            Vehicle Type: <Badge variant="outline" className="ml-2 capitalize">
                              {order.tracking.driver.vehicle_type.replace('_', ' ')}
                            </Badge>
                          </p>
                        )}
                        {order.tracking.driver.vehicle_plate_number && (
                          <p className="text-sm">Plate Number: {order.tracking.driver.vehicle_plate_number}</p>
                        )}
                        {order.tracking.driver.vehicle_description && (
                          <p className="text-sm text-muted-foreground">{order.tracking.driver.vehicle_description}</p>
                        )}
                      </div>
                    )}

                    {/* Delivery Route - Pickup and Delivery Addresses */}
                    {(order.tracking.pickup_address || order.tracking.delivery_address) && (
                      <div className="space-y-2">
                        <h5 className="font-medium">Delivery Route</h5>
                        
                        {/* Pickup Address */}
                        {order.tracking.pickup_address && (
                          <div className="flex items-start gap-3 p-3 border rounded-lg">
                            <div className={`w-2 h-2 rounded-full mt-2 ${
                              order.tracking.status === "picked_up" || order.tracking.status === "in_transit" || order.tracking.status === "delivered" ? "bg-green-500" :
                              order.tracking.status === "assigned" ? "bg-yellow-500" :
                              "bg-gray-300"
                            }`} />
                            <div className="flex-1">
                              <p className="text-sm font-medium">Pickup Location</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {order.tracking.pickup_address.line1}, {order.tracking.pickup_address.city}
                              </p>
                              {order.tracking.pickup_address.coordinates && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  📍 {order.tracking.pickup_address.coordinates.latitude.toFixed(6)}, {order.tracking.pickup_address.coordinates.longitude.toFixed(6)}
                                </p>
                              )}
                              {order.tracking.picked_up_at && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Picked up: {formatDate(order.tracking.picked_up_at)}
                                </p>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Delivery Address */}
                        {order.tracking.delivery_address && (
                          <div className="flex items-start gap-3 p-3 border rounded-lg">
                            <div className={`w-2 h-2 rounded-full mt-2 ${
                              order.tracking.status === "delivered" ? "bg-green-500" :
                              order.tracking.status === "in_transit" ? "bg-blue-500" :
                              "bg-gray-300"
                            }`} />
                            <div className="flex-1">
                              <p className="text-sm font-medium">Delivery Location</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {order.tracking.delivery_address.line1}
                                {order.tracking.delivery_address.line2 && `, ${order.tracking.delivery_address.line2}`}
                                {`, ${order.tracking.delivery_address.city}, ${order.tracking.delivery_address.state} ${order.tracking.delivery_address.postal_code}`}
                              </p>
                              {order.tracking.delivery_address.coordinates && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  📍 {order.tracking.delivery_address.coordinates.latitude.toFixed(6)}, {order.tracking.delivery_address.coordinates.longitude.toFixed(6)}
                                </p>
                              )}
                              {order.tracking.actual_delivery_time && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Delivered: {formatDate(order.tracking.actual_delivery_time)}
                                </p>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Status Timeline */}
                        <div className="p-3 border rounded-lg space-y-2">
                          <h5 className="font-medium text-sm">Status Timeline</h5>
                          <div className="space-y-1 text-xs">
                            {order.tracking.created_at && (
                              <p className="text-muted-foreground">
                                • Created: {formatDate(order.tracking.created_at)}
                              </p>
                            )}
                            {order.tracking.assigned_at && (
                              <p className="text-muted-foreground">
                                • Driver Assigned: {formatDate(order.tracking.assigned_at)}
                              </p>
                            )}
                            {order.tracking.picked_up_at && (
                              <p className="text-muted-foreground">
                                • Picked Up: {formatDate(order.tracking.picked_up_at)}
                              </p>
                            )}
                            {order.tracking.in_transit_at && (
                              <p className="text-muted-foreground">
                                • In Transit: {formatDate(order.tracking.in_transit_at)}
                              </p>
                            )}
                            {order.tracking.actual_delivery_time && (
                              <p className="text-green-600 font-medium">
                                • Delivered: {formatDate(order.tracking.actual_delivery_time)}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Proof of Delivery */}
                        {order.tracking.proof_of_delivery && (
                          <div className="p-4 border rounded-lg">
                            <h5 className="font-medium mb-2">Proof of Delivery</h5>
                            {order.tracking.proof_of_delivery.image_url && (
                              <img 
                                src={order.tracking.proof_of_delivery.image_url} 
                                alt="Proof of Delivery" 
                                className="w-full max-w-xs rounded-lg border mb-2"
                              />
                            )}
                            {order.tracking.proof_of_delivery.received_by && (
                              <p className="text-sm">Received by: {order.tracking.proof_of_delivery.received_by}</p>
                            )}
                            {order.tracking.proof_of_delivery.delivered_at && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Delivered: {formatDate(order.tracking.proof_of_delivery.delivered_at)}
                              </p>
                            )}
                            {order.tracking.proof_of_delivery.notes && (
                              <p className="text-sm text-muted-foreground mt-2">{order.tracking.proof_of_delivery.notes}</p>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 border rounded-lg text-center">
                <MapPin className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Delivery tracking will be available once the order is confirmed
                </p>
              </div>
            )}

            <Separator />

            {/* Delivery Address */}
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Delivery Address
              </h4>
              <p className="text-sm text-muted-foreground">
                {formatAddress(order.delivery_address_structured || order.delivery_address)}
              </p>
            </div>

            {/* Pickup Address */}
            {order.pickup_address && (
              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Pickup Address
                </h4>
                <p className="text-sm text-muted-foreground">
                  {formatAddress(order.pickup_address)}
                </p>
              </div>
            )}

            {/* Order Date */}
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Order placed: {formatDate(order.created_at)} ({formatRelativeTime(order.created_at)})
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

