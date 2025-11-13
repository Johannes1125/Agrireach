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
    .populate('buyer_id', 'full_name email location')
    .populate('seller_id', 'full_name email location')
    .populate('product_id', 'title price unit images')
    .lean();

  if (!order) return jsonError("Order not found", 404);

  // Check if user is buyer or seller
  if (String(order.buyer_id._id) !== decoded.sub && 
      String(order.seller_id._id) !== decoded.sub) {
    return jsonError("Forbidden", 403);
  }

  return jsonOk({ order });
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
