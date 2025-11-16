import { NextRequest } from "next/server";
import { requireMethod, jsonError, jsonOk, getAuthToken } from "@/server/utils/api";
import { verifyToken } from "@/server/utils/auth";
import { validateBody } from "@/server/middleware/validate";
import { connectToDatabase } from "@/server/lib/mongodb";
import { Order } from "@/server/models/Product";
import { Notification } from "@/server/models/Notification";
import { z } from "zod";

const UpdateOrderSchema = z.object({
  status: z.enum(["pending", "confirmed", "shipped", "delivered", "cancelled"]).optional(),
  payment_status: z.enum(["pending", "paid", "refunded"]).optional(),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const mm = requireMethod(req, ["GET"]);
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
  
  const order = await Order.findById(id)
    .populate('buyer_id', 'full_name email location location_coordinates phone')
    .populate('seller_id', 'full_name email location location_coordinates phone')
    .populate('product_id', 'title price unit images')
    .lean();

  if (!order) return jsonError("Order not found", 404);

  // Check if user is buyer or seller
  if (String(order.buyer_id._id) !== decoded.sub && 
      String(order.seller_id._id) !== decoded.sub) {
    return jsonError("Forbidden", 403);
  }

  // If order has delivery tracking, include tracking info
  let trackingInfo = null;
  if (order.delivery_id) {
    try {
      const { Delivery } = await import("@/server/models/Delivery");
      const delivery = await Delivery.findById(order.delivery_id)
        .populate('buyer_id', 'full_name phone')
        .populate('seller_id', 'full_name phone')
        .lean();

      if (delivery) {
        trackingInfo = {
          delivery_id: String(delivery._id),
          tracking_number: delivery.tracking_number,
          status: delivery.status,
          driver: delivery.driver_name ? {
            name: delivery.driver_name,
            phone: delivery.driver_phone || null,
            email: delivery.driver_email || null,
            vehicle_type: delivery.vehicle_type || null,
            vehicle_plate_number: delivery.vehicle_plate_number || null,
            vehicle_description: delivery.vehicle_description || null,
          } : null,
          pickup_address: delivery.pickup_address,
          delivery_address: delivery.delivery_address,
          estimated_delivery_time: delivery.estimated_delivery_time || null,
          actual_delivery_time: delivery.actual_delivery_time || null,
          delivery_notes: delivery.delivery_notes || null,
          seller_notes: delivery.seller_notes || null,
          proof_of_delivery: delivery.proof_of_delivery || null,
          assigned_at: delivery.assigned_at || null,
          picked_up_at: delivery.picked_up_at || null,
          in_transit_at: delivery.in_transit_at || null,
          created_at: delivery.created_at,
          updated_at: delivery.updated_at,
        };
      }
    } catch (err) {
      console.error("Error fetching delivery tracking:", err);
      // Continue without tracking info if API fails
    }
  }

  return jsonOk({ 
    order: {
      ...order,
      tracking: trackingInfo,
    }
  });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const mm = requireMethod(req, ["PUT"]);
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
  
  const order = await Order.findById(id)
    .populate('buyer_id', 'full_name')
    .populate('seller_id', 'full_name')
    .populate('product_id', 'title');

  if (!order) return jsonError("Order not found", 404);

  // Only seller can update order status, buyer can cancel
  const isSeller = String(order.seller_id._id) === decoded.sub;
  const isBuyer = String(order.buyer_id._id) === decoded.sub;

  if (!isSeller && !isBuyer) {
    return jsonError("Forbidden", 403);
  }

  const validate = validateBody(UpdateOrderSchema);
  const result = await validate(req);
  if (!result.ok) return result.res;

  // Validate permissions for specific updates
  if (result.data.status) {
    if (result.data.status === "cancelled" && !isBuyer && order.status === "pending") {
      return jsonError("Only buyers can cancel pending orders", 403);
    }
    if (result.data.status !== "cancelled" && !isSeller) {
      return jsonError("Only sellers can update order status", 403);
    }
  }

  if (result.data.payment_status && !isSeller) {
    return jsonError("Only sellers can update payment status", 403);
  }

  const updatedOrder = await Order.findByIdAndUpdate(
    id,
    { $set: result.data },
    { new: true }
  ).populate('buyer_id', 'full_name')
   .populate('seller_id', 'full_name')
   .populate('product_id', 'title');

  // IMPORTANT: If seller is confirming the order, create delivery record if it doesn't exist
  if (result.data.status === "confirmed" && isSeller && !order.delivery_id) {
    console.log(`[Order Confirmation] Creating delivery for order ${order._id}`);
    
    // Import and trigger custom delivery setup (non-blocking)
    try {
      const { createDeliveryForOrder } = await import("@/server/utils/delivery-setup");
      
      // Run async but don't wait - we want to return success immediately
      createDeliveryForOrder(String(order._id))
        .then((result) => {
          if (result.success) {
            console.log(`[Order Confirmation] ✅ Delivery created for order ${order._id}: ${result.tracking_number}`);
          } else {
            console.error(`[Order Confirmation] ❌ Delivery creation failed for order ${order._id}: ${result.error}`);
          }
        })
        .catch((error) => {
          // Log error but don't fail the order confirmation
          console.error(`[Order Confirmation] ❌ Failed to create delivery for order ${order._id}:`, error);
        });
    } catch (importError) {
      console.error(`[Order Confirmation] ❌ Failed to import delivery setup:`, importError);
    }
  }

  // Send notification about status change
  const notificationTarget = isSeller ? order.buyer_id._id : order.seller_id._id;
  const statusMessage = result.data.status ? 
    `Order status updated to ${result.data.status}` :
    `Payment status updated to ${result.data.payment_status}`;
  const product = order.product_id as any;

  await Notification.create({
    user_id: notificationTarget,
    type: 'order_update',
    title: 'Order Status Updated',
    message: `${statusMessage} for "${product?.title || 'product'}"`,
    priority: 'medium',
    action_url: `/marketplace/orders/${order._id}`
  });

  return jsonOk({ order: updatedOrder });
}
