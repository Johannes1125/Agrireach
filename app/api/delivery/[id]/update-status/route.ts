import { NextRequest } from "next/server";
import { requireMethod, jsonError, jsonOk, getAuthToken } from "@/server/utils/api";
import { verifyToken } from "@/server/utils/auth";
import { connectToDatabase } from "@/server/lib/mongodb";
import { Delivery } from "@/server/models/Delivery";
import { Order } from "@/server/models/Product";
import { Notification } from "@/server/models/Notification";
import { z } from "zod";

const UpdateStatusSchema = z.object({
  status: z.enum(["pending", "assigned", "picked_up", "in_transit", "delivered", "cancelled"]),
  notes: z.string().optional(),
});

/**
 * PATCH /api/delivery/[id]/update-status
 * Update delivery status (seller only)
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

  // Only seller can update delivery status
  if (String(delivery.seller_id._id) !== decoded.sub) {
    return jsonError("Only the seller can update delivery status", 403);
  }

  const body = await req.json();
  const validation = UpdateStatusSchema.safeParse(body);
  if (!validation.success) {
    return jsonError("Invalid status", 400);
  }

  const { status, notes } = validation.data;
  const oldStatus = delivery.status;

  // Prepare update data
  const updateData: any = {
    status,
  };

  // Set timestamps based on status
  if (status === "picked_up" && oldStatus !== "picked_up") {
    updateData.picked_up_at = new Date();
  }
  if (status === "in_transit" && oldStatus !== "in_transit") {
    updateData.in_transit_at = new Date();
  }
  if (status === "delivered" && oldStatus !== "delivered") {
    updateData.actual_delivery_time = new Date();
    updateData.proof_of_delivery = {
      ...delivery.proof_of_delivery,
      delivered_at: new Date(),
    };
  }

  if (notes) {
    updateData.delivery_notes = notes;
  }

  const updatedDelivery = await Delivery.findByIdAndUpdate(
    id,
    { $set: updateData },
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
    if (status === "picked_up" || status === "in_transit") {
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
    assigned: "A driver has been assigned to your delivery",
    picked_up: "Your order has been picked up",
    in_transit: "Your order is on the way",
    delivered: "Your order has been delivered",
    cancelled: "Your delivery has been cancelled",
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
  });
}

