"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Loader2, Truck, MapPin, User, Phone, Mail, Calendar, Package, CheckCircle, XCircle, Clock } from "lucide-react"
import { authFetch } from "@/lib/auth-client"
import { formatDate } from "@/lib/utils"
import { toast } from "sonner"
import { DEFAULT_DRIVERS, type DefaultDriver } from "@/lib/constants/default-drivers"
import { addMinutes, format } from "date-fns"

interface DeliveryManagementModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  orderId: string
}

type DeliveryStatus =
  | "pending"
  | "pickup_assigned"
  | "pickup_in_progress"
  | "picked_up"
  | "at_origin_hub"
  | "sorted"
  | "line_haul_in_transit"
  | "at_destination_hub"
  | "delivery_assigned"
  | "out_for_delivery"
  | "delivered"
  | "cancelled"
  | "returned"

const STATUS_TRANSITIONS: Record<DeliveryStatus, DeliveryStatus[]> = {
  pending: ["pickup_assigned", "cancelled"],
  pickup_assigned: ["pickup_in_progress", "cancelled"],
  pickup_in_progress: ["picked_up", "cancelled"],
  picked_up: ["at_origin_hub", "cancelled"],
  at_origin_hub: ["sorted", "cancelled"],
  sorted: ["line_haul_in_transit", "out_for_delivery", "cancelled"],
  line_haul_in_transit: ["at_destination_hub", "cancelled"],
  at_destination_hub: ["delivery_assigned", "cancelled"],
  delivery_assigned: ["out_for_delivery", "cancelled"],
  out_for_delivery: ["delivered", "returned", "cancelled"],
  delivered: [],
  cancelled: [],
  returned: [],
}

const STATUS_LABELS: Record<DeliveryStatus, string> = {
  pending: "Pending",
  pickup_assigned: "Pickup Assigned",
  pickup_in_progress: "Pickup In Progress",
  picked_up: "Picked Up",
  at_origin_hub: "At Origin Hub",
  sorted: "Sorted",
  line_haul_in_transit: "Line Haul In Transit",
  at_destination_hub: "At Destination Hub",
  delivery_assigned: "Delivery Assigned",
  out_for_delivery: "Out For Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
  returned: "Returned",
}

interface DeliveryDetails {
  _id: string
  order_id: {
    _id: string
    status: string
    total_price: number
    product_id?: {
      title: string
      images?: string[]
    }
  }
  buyer_id: {
    _id: string
    full_name: string
    phone?: string
  }
  seller_id: {
    _id: string
    full_name: string
  }
  tracking_number: string
  status: DeliveryStatus
  driver_name?: string
  driver_phone?: string
  driver_email?: string
  vehicle_type?: "motorcycle" | "car" | "mini_truck" | "truck"
  vehicle_plate_number?: string
  vehicle_description?: string
  pickup_address: {
    line1: string
    city: string
    coordinates?: { latitude: number; longitude: number }
  }
  delivery_address: {
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
  assigned_at?: string
  picked_up_at?: string
  in_transit_at?: string
  created_at: string
}

export function DeliveryManagementModal({ open, onOpenChange, orderId }: DeliveryManagementModalProps) {
  const [delivery, setDelivery] = useState<DeliveryDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [assigningDriver, setAssigningDriver] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [showAssignForm, setShowAssignForm] = useState(false)

  // Form state for driver assignment
  const [driverForm, setDriverForm] = useState({
    selected_driver_id: "", // ID of selected default driver
    driver_name: "",
    driver_phone: "",
    driver_email: "",
    vehicle_type: "" as "" | "motorcycle" | "car" | "mini_truck" | "truck",
    vehicle_plate_number: "",
    vehicle_description: "",
    estimated_delivery_time: "",
    seller_notes: "",
  })
  
  // Handle default driver selection
  const handleSelectDefaultDriver = (driverId: string) => {
    const driver = DEFAULT_DRIVERS.find(d => d.id === driverId)
    if (driver) {
      setDriverForm({
        selected_driver_id: driver.id,
        driver_name: driver.name,
        driver_phone: driver.phone,
        driver_email: driver.email || "",
        vehicle_type: driver.vehicle_type,
        vehicle_plate_number: driver.vehicle_plate_number || "",
        vehicle_description: driver.vehicle_description || "",
        estimated_delivery_time: driverForm.estimated_delivery_time, // Preserve existing time
        seller_notes: driverForm.seller_notes, // Preserve existing notes
      })
    }
  }

  useEffect(() => {
    if (open && orderId) {
      fetchDeliveryDetails()
    }
  }, [open, orderId])

  const fetchDeliveryDetails = async () => {
    try {
      setLoading(true)
      setError(null)

      // FIRST: Try to find delivery directly by order_id (more reliable)
      try {
        const deliveryByOrderRes = await authFetch(`/api/delivery/by-order/${orderId}`)
        if (deliveryByOrderRes.ok) {
          const response = await deliveryByOrderRes.json()
          
          // jsonOk wraps response in { success: true, data: { delivery: ... } }
          const delivery = response?.data?.delivery
          
          // DEBUG LOGGING:
          console.log("[Delivery Modal] Full API response:", JSON.stringify(response, null, 2));
          console.log("[Delivery Modal] Delivery data:", JSON.stringify(delivery, null, 2));
          console.log("[Delivery Modal] Order ID from delivery:", delivery?.order_id);
          console.log("[Delivery Modal] Product ID from order:", delivery?.order_id?.product_id);
          console.log("[Delivery Modal] Product title:", delivery?.order_id?.product_id?.title);
          console.log("[Delivery Modal] Product data type:", typeof delivery?.order_id?.product_id);
          console.log("[Delivery Modal] Is product_id populated?", delivery?.order_id?.product_id && typeof delivery?.order_id?.product_id === 'object');
          
          // Fix: Check if delivery exists before accessing properties
          if (!delivery) {
            console.error("[Delivery Modal] Invalid delivery data structure:", response);
            throw new Error("Invalid delivery data received");
          }
          
          setDelivery(delivery)
          
          // Pre-fill form if driver already assigned
          if (delivery?.driver_name) {
            // Try to match with default drivers
            const matchedDriver = DEFAULT_DRIVERS.find(
              d => d.name === delivery.driver_name &&
                   d.phone === delivery.driver_phone
            )
            
            setDriverForm({
              selected_driver_id: matchedDriver?.id || "",
              driver_name: delivery.driver_name || "",
              driver_phone: delivery.driver_phone || "",
              driver_email: delivery.driver_email || "",
              vehicle_type: delivery.vehicle_type || "",
              vehicle_plate_number: delivery.vehicle_plate_number || "",
              vehicle_description: delivery.vehicle_description || "",
              estimated_delivery_time: delivery.estimated_delivery_time
                ? new Date(delivery.estimated_delivery_time).toISOString().slice(0, 16)
                : "",
              seller_notes: delivery.seller_notes || "",
            })
            setShowAssignForm(false)
          } else {
            setShowAssignForm(true)
          }
          
          setLoading(false)
          return // Success - exit early
        } else {
          // Check error response for debugging
          const errorData = await deliveryByOrderRes.json().catch(() => ({}));
          console.log(`[Delivery Modal] Endpoint returned ${deliveryByOrderRes.status}:`, errorData.message || errorData);
          // Continue to fallback if 404 (delivery not found)
          if (deliveryByOrderRes.status !== 404) {
            // For non-404 errors, show error and return
            setError(errorData.message || "Failed to fetch delivery details");
            setLoading(false);
            return;
          }
        }
      } catch (err: any) {
        // If endpoint fails completely, continue with fallback approach
        console.error("[Delivery Modal] Direct delivery lookup error:", err);
        console.log("[Delivery Modal] Continuing with fallback approach");
      }

      // FALLBACK: Get order to find delivery_id (original approach)
      const orderRes = await authFetch(`/api/marketplace/orders/${orderId}`)
      if (!orderRes.ok) {
        throw new Error("Failed to fetch order details")
      }

      const orderData = await orderRes.json()
      const deliveryId = orderData.order?.delivery_id

      if (!deliveryId) {
        // No delivery record yet - try to create it automatically
        console.log(`[Delivery Modal] No delivery_id found, attempting to create delivery for order ${orderId}`);
        
        try {
          // Try to trigger delivery creation by confirming the order (if not already confirmed)
          const createRes = await authFetch(`/api/marketplace/orders/${orderId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "confirmed" }),
          });
          
          if (createRes.ok) {
            // Wait a moment for delivery to be created, then retry
            await new Promise(resolve => setTimeout(resolve, 1500));
            return fetchDeliveryDetails(); // Retry fetching
          } else {
            const errorData = await createRes.json().catch(() => ({}));
            setError(errorData.message || "No delivery record found. Please confirm the order first to create a delivery record.");
            setLoading(false);
            return;
          }
        } catch (err: any) {
          console.error("[Delivery Modal] Failed to create delivery:", err);
          setError("No delivery record found. Please confirm the order first to create a delivery record.");
          setLoading(false);
          return;
        }
      }

      // Fetch delivery details by delivery_id
      const deliveryRes = await authFetch(`/api/delivery/${deliveryId}`)
      if (!deliveryRes.ok) {
        throw new Error("Failed to fetch delivery details")
      }

      const response = await deliveryRes.json()
      // jsonOk wraps response in { success: true, data: { delivery: ... } }
      const delivery = response?.data?.delivery
      
      if (!delivery) {
        throw new Error("Invalid delivery data received")
      }
      
      setDelivery(delivery)

      // Pre-fill form if driver already assigned
      if (delivery?.driver_name) {
        // Try to match with default drivers
        const matchedDriver = DEFAULT_DRIVERS.find(
          d => d.name === delivery.driver_name &&
               d.phone === delivery.driver_phone
        )
        
        setDriverForm({
          selected_driver_id: matchedDriver?.id || "",
          driver_name: delivery.driver_name || "",
          driver_phone: delivery.driver_phone || "",
          driver_email: delivery.driver_email || "",
          vehicle_type: delivery.vehicle_type || "",
          vehicle_plate_number: delivery.vehicle_plate_number || "",
          vehicle_description: delivery.vehicle_description || "",
          estimated_delivery_time: delivery.estimated_delivery_time
            ? new Date(delivery.estimated_delivery_time).toISOString().slice(0, 16)
            : "",
          seller_notes: delivery.seller_notes || "",
        })
        setShowAssignForm(false)
      } else {
        setShowAssignForm(true)
      }
    } catch (err: any) {
      setError(err.message || "Failed to load delivery details")
    } finally {
      setLoading(false)
    }
  }

  const handleAssignDriver = async () => {
    if (!delivery) return
    // Prevent past ETD selection
    if (driverForm.estimated_delivery_time) {
      const selected = new Date(driverForm.estimated_delivery_time)
      if (Number.isFinite(selected.getTime()) && selected.getTime() < Date.now()) {
        toast.error("Estimated delivery time cannot be in the past")
        return
      }
    }

    // Validate that a driver is selected
    if (!driverForm.selected_driver_id || !driverForm.driver_name || !driverForm.driver_phone || !driverForm.vehicle_type) {
      toast.error("Please select a driver from the list")
      return
    }

    try {
      setAssigningDriver(true)
      // Exclude selected_driver_id from API request (it's only for UI)
      const { selected_driver_id, ...driverData } = driverForm
      const res = await authFetch(`/api/delivery/${delivery._id}/assign-driver`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(driverData),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.message || "Failed to assign driver")
      }

      toast.success("Driver assigned successfully!")
      setShowAssignForm(false)
      await fetchDeliveryDetails() // Refresh delivery details
    } catch (err: any) {
      toast.error(err.message || "Failed to assign driver")
    } finally {
      setAssigningDriver(false)
    }
  }

  const handleUpdateStatus = async (newStatus: DeliveryStatus) => {
    if (!delivery) return

    try {
      setUpdatingStatus(true)
      const res = await authFetch(`/api/delivery/${delivery._id}/update-status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.message || "Failed to update status")
      }

      toast.success(`Delivery status updated to ${newStatus.replace("_", " ")}`)
      await fetchDeliveryDetails() // Refresh delivery details
    } catch (err: any) {
      toast.error(err.message || "Failed to update status")
    } finally {
      setUpdatingStatus(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-green-500"
      case "pickup_assigned":
      case "pickup_in_progress":
      case "picked_up":
      case "line_haul_in_transit":
      case "out_for_delivery":
        return "bg-blue-500"
      case "delivery_assigned":
        return "bg-yellow-500"
      case "pending":
        return "bg-gray-500"
      case "cancelled":
      case "returned":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusLabel = (status: string) => {
    return STATUS_LABELS[status as DeliveryStatus] || status
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Delivery</DialogTitle>
          <DialogDescription>
            Assign drivers and update delivery status for this order
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={fetchDeliveryDetails}>Retry</Button>
          </div>
        ) : !delivery ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              No delivery record found. Please confirm the order first.
            </p>
            <Button onClick={() => onOpenChange(false)}>Close</Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Order Summary */}
            <div className="space-y-4">
              <h4 className="font-semibold">Order Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Product</p>
                  <p className="font-medium">
                    {delivery.order_id?.product_id?.title || "Unknown Product"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Buyer</p>
                  <p className="font-medium">{delivery.buyer_id?.full_name || "Unknown"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Price</p>
                  <p className="font-medium">₱{delivery.order_id?.total_price?.toLocaleString() || "0"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tracking Number</p>
                  <p className="font-medium font-mono">{delivery.tracking_number}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Current Status */}
            <div className="space-y-4">
              <h4 className="font-semibold">Delivery Status</h4>
              <div className="flex items-center gap-3 p-4 border rounded-lg">
                <div className={`w-3 h-3 rounded-full ${getStatusColor(delivery.status)}`} />
                <div className="flex-1">
                  <p className="font-medium">{getStatusLabel(delivery.status)}</p>
                  <p className="text-sm text-muted-foreground">
                    Created: {formatDate(delivery.created_at)}
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Driver Assignment */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">Driver Information</h4>
                {!delivery.driver_name && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAssignForm(!showAssignForm)}
                  >
                    {showAssignForm ? "Cancel" : "Assign Driver"}
                  </Button>
                )}
              </div>

              {delivery.driver_name ? (
                <div className="p-4 border rounded-lg space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Driver Name</p>
                      <p className="font-medium">{delivery.driver_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-medium">{delivery.driver_phone || "N/A"}</p>
                    </div>
                    {delivery.driver_email && (
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p className="font-medium">{delivery.driver_email}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-muted-foreground">Vehicle Type</p>
                      <Badge variant="outline" className="capitalize">
                        {delivery.vehicle_type?.replace("_", " ") || "N/A"}
                      </Badge>
                    </div>
                    {delivery.vehicle_plate_number && (
                      <div>
                        <p className="text-sm text-muted-foreground">Plate Number</p>
                        <p className="font-medium">{delivery.vehicle_plate_number}</p>
                      </div>
                    )}
                    {delivery.vehicle_description && (
                      <div className="md:col-span-2">
                        <p className="text-sm text-muted-foreground">Vehicle Description</p>
                        <p className="font-medium">{delivery.vehicle_description}</p>
                      </div>
                    )}
                  </div>
                  {delivery.assigned_at && (
                    <p className="text-xs text-muted-foreground">
                      Assigned: {formatDate(delivery.assigned_at)}
                    </p>
                  )}
                </div>
              ) : showAssignForm ? (
                <div className="p-4 border rounded-lg space-y-4">
                  {/* Driver Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="select_driver">
                      Select Driver <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={driverForm.selected_driver_id}
                      onValueChange={handleSelectDefaultDriver}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a driver from the list" />
                      </SelectTrigger>
                      <SelectContent>
                        {DEFAULT_DRIVERS.map((driver) => (
                          <SelectItem key={driver.id} value={driver.id}>
                            <div className="flex flex-col">
                              <span className="font-medium">{driver.name}</span>
                              <span className="text-xs text-muted-foreground">
                                {driver.phone} • {driver.vehicle_type.replace("_", " ")} • {driver.vehicle_plate_number}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Select one of the available drivers from the system
                    </p>
                  </div>

                  {/* Display selected driver details (read-only) */}
                  {driverForm.selected_driver_id && (
                    <div className="p-4 bg-muted rounded-lg space-y-2">
                      <h5 className="font-medium text-sm">Selected Driver Details</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Name:</span>{" "}
                          <span className="font-medium">{driverForm.driver_name}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Phone:</span>{" "}
                          <span className="font-medium">{driverForm.driver_phone}</span>
                        </div>
                        {driverForm.driver_email && (
                          <div>
                            <span className="text-muted-foreground">Email:</span>{" "}
                            <span className="font-medium">{driverForm.driver_email}</span>
                          </div>
                        )}
                        <div>
                          <span className="text-muted-foreground">Vehicle:</span>{" "}
                          <span className="font-medium capitalize">
                            {driverForm.vehicle_type?.replace("_", " ")}
                          </span>
                        </div>
                        {driverForm.vehicle_plate_number && (
                          <div>
                            <span className="text-muted-foreground">Plate:</span>{" "}
                            <span className="font-medium">{driverForm.vehicle_plate_number}</span>
                          </div>
                        )}
                        {driverForm.vehicle_description && (
                          <div className="md:col-span-2">
                            <span className="text-muted-foreground">Description:</span>{" "}
                            <span className="font-medium">{driverForm.vehicle_description}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Editable fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="estimated_delivery_time">Estimated Delivery Time</Label>
                      <Input
                        id="estimated_delivery_time"
                        type="datetime-local"
                        // Use local timezone so past dates/times can't be selected
                        min={format(addMinutes(new Date(), 1), "yyyy-MM-dd'T'HH:mm")}
                        value={driverForm.estimated_delivery_time}
                        onChange={(e) =>
                          setDriverForm({
                            ...driverForm,
                            estimated_delivery_time: e.target.value,
                            selected_driver_id: driverForm.selected_driver_id
                          })
                        }
                      />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <Label htmlFor="seller_notes">Seller Notes (for driver)</Label>
                      <Textarea
                        id="seller_notes"
                        value={driverForm.seller_notes}
                        onChange={(e) =>
                          setDriverForm({ ...driverForm, seller_notes: e.target.value })
                        }
                        placeholder="Special instructions for the driver (e.g., 'Call buyer 15 mins before arrival', 'Handle with care')..."
                        rows={3}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={handleAssignDriver}
                      disabled={assigningDriver || !driverForm.selected_driver_id}
                      className="flex-1"
                    >
                      {assigningDriver ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Assigning...
                        </>
                      ) : (
                        <>
                          <User className="mr-2 h-4 w-4" />
                          Assign Driver
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowAssignForm(false)}
                      disabled={assigningDriver}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-4 border rounded-lg text-center">
                  <p className="text-muted-foreground mb-4">No driver assigned yet</p>
                  <Button onClick={() => setShowAssignForm(true)}>
                    <User className="mr-2 h-4 w-4" />
                    Assign Driver
                  </Button>
                </div>
              )}
            </div>

            <Separator />

            {/* Delivery Addresses */}
            <div className="space-y-4">
              <h4 className="font-semibold">Delivery Route</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium">Pickup Address</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {delivery.pickup_address.line1}, {delivery.pickup_address.city}
                  </p>
                  {delivery.pickup_address.coordinates && (
                    <p className="text-xs text-muted-foreground mt-1">
                      📍 {delivery.pickup_address.coordinates.latitude.toFixed(6)},{" "}
                      {delivery.pickup_address.coordinates.longitude.toFixed(6)}
                    </p>
                  )}
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium">Delivery Address</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {delivery.delivery_address.line1}
                    {delivery.delivery_address.line2 && `, ${delivery.delivery_address.line2}`}
                    {`, ${delivery.delivery_address.city}, ${delivery.delivery_address.state} ${delivery.delivery_address.postal_code}`}
                  </p>
                  {delivery.delivery_address.coordinates && (
                    <p className="text-xs text-muted-foreground mt-1">
                      📍 {delivery.delivery_address.coordinates.latitude.toFixed(6)},{" "}
                      {delivery.delivery_address.coordinates.longitude.toFixed(6)}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            {/* Status Update Actions */}
            {delivery.driver_name && (
              <div className="space-y-4">
                <h4 className="font-semibold">Update Delivery Status</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {(STATUS_TRANSITIONS[delivery.status] || []).map((nextStatus) => (
                    <Button
                      key={nextStatus}
                      variant={nextStatus === "cancelled" ? "destructive" : nextStatus === "delivered" ? "default" : "outline"}
                      onClick={() => handleUpdateStatus(nextStatus)}
                      disabled={updatingStatus}
                      className="flex items-center gap-2"
                    >
                      {nextStatus === "picked_up" ? <Package className="h-4 w-4" /> : null}
                      {["pickup_in_progress", "line_haul_in_transit", "out_for_delivery"].includes(nextStatus) ? (
                        <Truck className="h-4 w-4" />
                      ) : null}
                      {nextStatus === "delivered" ? <CheckCircle className="h-4 w-4" /> : null}
                      {nextStatus === "cancelled" ? <XCircle className="h-4 w-4" /> : null}
                      {["at_origin_hub", "sorted", "at_destination_hub", "delivery_assigned", "returned"].includes(nextStatus) ? (
                        <Clock className="h-4 w-4" />
                      ) : null}
                      {STATUS_LABELS[nextStatus]}
                    </Button>
                  ))}
                </div>
                {updatingStatus && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Updating status...
                  </div>
                )}
              </div>
            )}

            {/* Status Timeline */}
            <div className="space-y-4">
              <h4 className="font-semibold">Status Timeline</h4>
              <div className="space-y-2 text-sm">
                {delivery.created_at && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      Created: {formatDate(delivery.created_at)}
                    </span>
                  </div>
                )}
                {delivery.assigned_at && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      Driver Assigned: {formatDate(delivery.assigned_at)}
                    </span>
                  </div>
                )}
                {delivery.picked_up_at && (
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      Picked Up: {formatDate(delivery.picked_up_at)}
                    </span>
                  </div>
                )}
                {delivery.in_transit_at && (
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      In Transit: {formatDate(delivery.in_transit_at)}
                    </span>
                  </div>
                )}
                {delivery.actual_delivery_time && (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-green-600 font-medium">
                      Delivered: {formatDate(delivery.actual_delivery_time)}
                    </span>
                  </div>
                )}
                {delivery.estimated_delivery_time && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      Estimated: {formatDate(delivery.estimated_delivery_time)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            {(delivery.delivery_notes || delivery.seller_notes) && (
              <>
                <Separator />
                <div className="space-y-4">
                  <h4 className="font-semibold">Notes</h4>
                  {delivery.seller_notes && (
                    <div className="p-4 border rounded-lg">
                      <p className="text-sm font-medium mb-1">Seller Notes</p>
                      <p className="text-sm text-muted-foreground">{delivery.seller_notes}</p>
                    </div>
                  )}
                  {delivery.delivery_notes && (
                    <div className="p-4 border rounded-lg">
                      <p className="text-sm font-medium mb-1">Delivery Notes</p>
                      <p className="text-sm text-muted-foreground">{delivery.delivery_notes}</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
