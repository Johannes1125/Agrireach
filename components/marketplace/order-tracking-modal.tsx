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
  order_id: string
  quotation_id?: string
  status: string
  tracking_url?: string
  driver?: {
    name?: string
    phone?: string
    vehicle?: string
    plateNumber?: string
  }
  stops?: Array<{
    stopId?: string
    coordinates?: { lat: string; lng: string }
    address?: string
    name?: string
    phone?: string
    status?: string
    POD?: {
      status: string
      image?: string
      deliveredAt?: string
    }
  }>
  distance?: {
    value: string
    unit: string
  }
  priceBreakdown?: {
    base?: string
    extraMileage?: string
    surcharge?: string
    adminFee?: string
    totalExcludePriorityFee?: string
    total?: string
    currency?: string
    priorityFee?: string
  }
  priorityFee?: string
  serviceType?: string
  specialRequests?: string[]
  metadata?: Record<string, any>
  remarks?: string[]
  placedAt?: string
  pickupTime?: string
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
  lalamove_order_id?: string
  lalamove_tracking_url?: string
  lalamove_status?: string
  lalamove_details?: any
  driver?: any
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
      case "completed":
        return "bg-green-500"
      case "shipped":
      case "on_going":
      case "picked_up":
        return "bg-blue-500"
      case "confirmed":
      case "assigning_driver":
        return "bg-yellow-500"
      case "pending":
        return "bg-gray-500"
      case "cancelled":
      case "canceled":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      "pending": "Pending",
      "confirmed": "Confirmed",
      "shipped": "Shipped",
      "delivered": "Delivered",
      "cancelled": "Cancelled",
      "assigning_driver": "Assigning Driver",
      "on_going": "On the Way",
      "picked_up": "Picked Up",
      "completed": "Delivered",
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
            {order.lalamove_order_id || order.tracking ? (
              <div className="space-y-4">
                <h4 className="font-semibold flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Delivery Tracking
                </h4>

                {/* Lalamove Status */}
                {order.tracking && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(order.tracking.status)}`} />
                        <div>
                          <span className="font-medium">
                            {getStatusLabel(order.tracking.status)}
                          </span>
                          {order.tracking.placedAt && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Placed: {formatDate(order.tracking.placedAt)}
                            </p>
                          )}
                        </div>
                      </div>
                      {order.tracking.tracking_url && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(order.tracking!.tracking_url, "_blank")}
                        >
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Track on Lalamove
                        </Button>
                      )}
                    </div>

                    {/* Service Type & Special Requests */}
                    {(order.tracking.serviceType || order.tracking.specialRequests?.length) && (
                      <div className="p-4 border rounded-lg space-y-2">
                        <h5 className="font-medium">Service Details</h5>
                        {order.tracking.serviceType && (
                          <p className="text-sm">Service Type: <Badge variant="outline">{order.tracking.serviceType}</Badge></p>
                        )}
                        {order.tracking.specialRequests && order.tracking.specialRequests.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            <span className="text-sm text-muted-foreground">Special Requests:</span>
                            {order.tracking.specialRequests.map((req, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">{req}</Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Price Breakdown */}
                    {order.tracking.priceBreakdown && (
                      <div className="p-4 border rounded-lg space-y-2">
                        <h5 className="font-medium">Price Breakdown</h5>
                        <div className="space-y-1 text-sm">
                          {order.tracking.priceBreakdown.base && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Base:</span>
                              <span>{order.tracking.priceBreakdown.currency} {order.tracking.priceBreakdown.base}</span>
                            </div>
                          )}
                          {order.tracking.priceBreakdown.extraMileage && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Extra Mileage:</span>
                              <span>{order.tracking.priceBreakdown.currency} {order.tracking.priceBreakdown.extraMileage}</span>
                            </div>
                          )}
                          {order.tracking.priceBreakdown.surcharge && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Surcharge:</span>
                              <span>{order.tracking.priceBreakdown.currency} {order.tracking.priceBreakdown.surcharge}</span>
                            </div>
                          )}
                          {order.tracking.priceBreakdown.adminFee && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Admin Fee:</span>
                              <span>{order.tracking.priceBreakdown.currency} {order.tracking.priceBreakdown.adminFee}</span>
                            </div>
                          )}
                          {order.tracking.priceBreakdown.priorityFee && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Priority Fee:</span>
                              <span>{order.tracking.priceBreakdown.currency} {order.tracking.priceBreakdown.priorityFee}</span>
                            </div>
                          )}
                          {order.tracking.priceBreakdown.total && (
                            <div className="flex justify-between font-semibold pt-2 border-t">
                              <span>Total:</span>
                              <span>{order.tracking.priceBreakdown.currency} {order.tracking.priceBreakdown.total}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Distance */}
                    {order.tracking.distance && (
                      <div className="p-4 border rounded-lg">
                        <h5 className="font-medium mb-2">Delivery Distance</h5>
                        <p className="text-sm">
                          {parseFloat(order.tracking.distance.value).toLocaleString()} {order.tracking.distance.unit}
                          {order.tracking.distance.unit === "m" && ` (${(parseFloat(order.tracking.distance.value) / 1000).toFixed(2)} km)`}
                        </p>
                      </div>
                    )}

                    {/* Remarks */}
                    {order.tracking.remarks && order.tracking.remarks.length > 0 && (
                      <div className="p-4 border rounded-lg">
                        <h5 className="font-medium mb-2">Remarks</h5>
                        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                          {order.tracking.remarks.map((remark, idx) => (
                            <li key={idx}>{remark}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Driver Info */}
                    {order.tracking.driver && (
                      <div className="p-4 border rounded-lg space-y-2">
                        <h5 className="font-medium flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Driver Information
                        </h5>
                        {order.tracking.driver.name && (
                          <p className="text-sm">Driver: {order.tracking.driver.name}</p>
                        )}
                        {order.tracking.driver.phone && (
                          <p className="text-sm flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            {order.tracking.driver.phone}
                          </p>
                        )}
                        {order.tracking.driver.vehicle && (
                          <p className="text-sm">Vehicle: {order.tracking.driver.vehicle}</p>
                        )}
                        {order.tracking.driver.plateNumber && (
                          <p className="text-sm">Plate Number: {order.tracking.driver.plateNumber}</p>
                        )}
                      </div>
                    )}

                    {/* Delivery Stops */}
                    {order.tracking.stops && order.tracking.stops.length > 0 && (
                      <div className="space-y-2">
                        <h5 className="font-medium">Delivery Route</h5>
                        {order.tracking.stops.map((stop, index) => (
                          <div key={stop.stopId || index} className="flex items-start gap-3 p-3 border rounded-lg">
                            <div className={`w-2 h-2 rounded-full mt-2 ${
                              stop.POD?.status === "DELIVERED" || stop.status === "COMPLETED" || stop.status === "DELIVERED" ? "bg-green-500" :
                              stop.status === "IN_PROGRESS" || stop.status === "PICKED_UP" ? "bg-blue-500" :
                              "bg-gray-300"
                            }`} />
                            <div className="flex-1">
                              <p className="text-sm font-medium">
                                {index === 0 ? "Pickup Location" : `Delivery Location ${index > 1 ? index : ""}`}
                              </p>
                              {stop.name && (
                                <p className="text-sm font-medium text-muted-foreground">{stop.name}</p>
                              )}
                              {stop.address && (
                                <p className="text-xs text-muted-foreground">{stop.address}</p>
                              )}
                              {stop.phone && (
                                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                  <Phone className="h-3 w-3" />
                                  {stop.phone}
                                </p>
                              )}
                              {stop.coordinates && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  📍 {stop.coordinates.lat}, {stop.coordinates.lng}
                                </p>
                              )}
                              <div className="flex gap-2 mt-2">
                                {stop.status && (
                                  <Badge variant="outline" className="text-xs">
                                    {stop.status}
                                  </Badge>
                                )}
                                {stop.POD?.status && (
                                  <Badge variant={stop.POD.status === "DELIVERED" ? "default" : "secondary"} className="text-xs">
                                    POD: {stop.POD.status}
                                  </Badge>
                                )}
                              </div>
                              {stop.POD?.image && (
                                <div className="mt-2">
                                  <img 
                                    src={stop.POD.image} 
                                    alt="Proof of Delivery" 
                                    className="w-full max-w-xs rounded-lg border"
                                  />
                                  {stop.POD.deliveredAt && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      Delivered: {formatDate(stop.POD.deliveredAt)}
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Fallback to basic tracking URL */}
                {!order.tracking && order.lalamove_tracking_url && (
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground mb-3">
                      Track your delivery on Lalamove
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => window.open(order.lalamove_tracking_url, "_blank")}
                      className="w-full"
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Open Tracking Link
                    </Button>
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

