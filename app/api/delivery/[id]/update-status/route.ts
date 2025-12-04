import { NextRequest } from "next/server";
import { requireMethod, jsonError, jsonOk, getAuthToken } from "@/server/utils/api";
import { verifyToken } from "@/server/utils/auth";
import { connectToDatabase } from "@/server/lib/mongodb";
import { Delivery, DeliveryStatus, STATUS_PROGRESSION } from "@/server/models/Delivery";
import { Order } from "@/server/models/Product";
import { Notification } from "@/server/models/Notification";
import { z } from "zod";

// Updated schema with new delivery statuses
const UpdateStatusSchema = z.object({
  status: z.enum([
    "pending",
    "pickup_assigned",
    "pickup_in_progress",
    "picked_up",
    "at_origin_hub",
    "sorted",
    "line_haul_in_transit",
    "at_destination_hub",
    "delivery_assigned",
    "out_for_delivery",
    "delivered",
    "cancelled",
    "returned"
  ]),
  notes: z.string().optional(),
  location: z.string().optional(),
});

/**
 * PATCH /api/delivery/[id]/update-status
 * Update delivery status (seller or admin only)
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const mm = requireMethod(req, ["PATCH"]);
  if (mm) return mm;

  const { id } = await params;
  const token = getAuthToken(req, "access");
  if (!token) return jsonError("Unauthorized", 401);

  let decoded: any;
  try {
    decoded = verifyToken<any>(token, "access");
  } catch {
    return jsonError("Unauthorized", 401);
  }

  await connectToDatabase();

  const delivery = await Delivery.findById(id)
    .populate('order_id')
    .populate('buyer_id', 'full_name')
    .populate('seller_id', 'full_name');

  if (!delivery) {
    return jsonError("Delivery not found", 404);
  }

  // Only seller can update delivery status (or admin - check later if needed)
  if (String(delivery.seller_id._id) !== decoded.sub) {
    return jsonError("Only the seller can update delivery status", 403);
  }

  const body = await req.json();
  const validation = UpdateStatusSchema.safeParse(body);
  if (!validation.success) {
    return jsonError("Invalid status", 400);
  }

  const { status, notes, location } = validation.data;
  const oldStatus = delivery.status as DeliveryStatus;

  // Validate status progression
  const allowedNextStatuses = STATUS_PROGRESSION[oldStatus] || [];
  if (!allowedNextStatuses.includes(status as DeliveryStatus) && status !== oldStatus) {
    return jsonError(
      `Invalid status transition from "${oldStatus}" to "${status}". Allowed: ${allowedNextStatuses.join(", ") || "none"}`,
      400
    );
  }

  // Prepare update data
  const updateData: any = {
    status,
  };

  // Set timestamps based on status
  const now = new Date();
  
  switch (status) {
    case "pickup_assigned":
      updateData.assigned_at = now;
      break;
    case "picked_up":
      updateData.picked_up_at = now;
      break;
    case "at_origin_hub":
      updateData.at_origin_hub_at = now;
      break;
    case "line_haul_in_transit":
      updateData.line_haul_started_at = now;
      updateData.in_transit_at = now;
      break;
    case "at_destination_hub":
      updateData.at_destination_hub_at = now;
      break;
    case "out_for_delivery":
      updateData.out_for_delivery_at = now;
      break;
    case "delivered":
      updateData.actual_delivery_time = now;
      updateData.proof_of_delivery = {
        ...delivery.proof_of_delivery,
        delivered_at: now,
      };
      break;
  }

  if (notes) {
    updateData.delivery_notes = notes;
  }

  // Add timeline entry
  const timelineEntry = {
    status,
    timestamp: now,
    location: location || undefined,
    notes: notes || undefined,
    updated_by: "Seller",
  };

  const updatedDelivery = await Delivery.findByIdAndUpdate(
    id,
    { 
      $set: updateData,
      $push: { timeline: timelineEntry }
    },
    { new: true }
  )
    .populate('order_id')
    .populate('buyer_id', 'full_name')
    .populate('seller_id', 'full_name')
    .lean();

  // Update order status based on delivery status
  const order = await Order.findById(delivery.order_id._id);
  if (order) {
    let orderStatus = order.status;
    
    // Map delivery status to order status
    if (["picked_up", "at_origin_hub", "sorted", "line_haul_in_transit", "at_destination_hub", "out_for_delivery"].includes(status)) {
      orderStatus = "shipped";
    } else if (status === "delivered") {
      orderStatus = "delivered";
    } else if (status === "cancelled") {
      orderStatus = "cancelled";
    }
    
    if (orderStatus !== order.status) {
      await Order.findByIdAndUpdate(delivery.order_id._id, {
        $set: { status: orderStatus }
      });
    }
  }

  // Send notification to buyer
  const statusMessages: Record<string, string> = {
    pickup_assigned: "A pickup rider has been assigned to collect your order",
    pickup_in_progress: "Rider is heading to pick up your order",
    picked_up: "Your order has been picked up from the seller",
    at_origin_hub: "Your order has arrived at the sorting hub",
    sorted: "Your order has been sorted and is ready for dispatch",
    line_haul_in_transit: "Your order is being transported to your area",
    at_destination_hub: "Your order has arrived at the local delivery hub",
    delivery_assigned: "A delivery rider has been assigned",
    out_for_delivery: "Your order is out for delivery!",
    delivered: "Your order has been delivered",
    cancelled: "Your delivery has been cancelled",
    returned: "Your order is being returned to the seller",
  };

  const message = statusMessages[status] || `Delivery status updated to ${status}`;
  await Notification.create({
    user_id: delivery.buyer_id._id,
    type: 'order_update',
    title: 'Delivery Status Updated',
    message: `${message}. Tracking: ${delivery.tracking_number}`,
    priority: status === "delivered" ? 'high' : 'medium',
    action_url: `/marketplace/orders/${delivery.order_id._id}`,
  });

  return jsonOk({ 
    delivery: updatedDelivery,
    order_status: order?.status,
    message: `Status updated to "${status}"`,
  });
}
