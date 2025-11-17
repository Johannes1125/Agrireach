import { NextRequest } from "next/server";
import { requireMethod, jsonError, jsonOk, getAuthToken } from "@/server/utils/api";
import { verifyToken } from "@/server/utils/auth";
import { connectToDatabase } from "@/server/lib/mongodb";
import { Delivery } from "@/server/models/Delivery";
import { Order } from "@/server/models/Product";

/**
 * GET /api/delivery/by-order/[orderId]
 * Get delivery details by order ID (more reliable than going through order.delivery_id)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const mm = requireMethod(req, ["GET"]);
  if (mm) return mm;

  const { orderId } = await params;
  const token = getAuthToken(req, "access");
  if (!token) return jsonError("Unauthorized", 401);

  let decoded: any;
  try {
    decoded = verifyToken<any>(token, "access");
  } catch {
    return jsonError("Unauthorized", 401);
  }

  await connectToDatabase();

  // First verify the order exists and user has access
  const order = await Order.findById(orderId)
    .populate('buyer_id', 'full_name')
    .populate('seller_id', 'full_name')
    .lean();

  if (!order) {
    return jsonError("Order not found", 404);
  }

  // Check if user is buyer or seller
  const userId = decoded.sub;
  const isBuyer = String(order.buyer_id._id) === userId;
  const isSeller = String(order.seller_id._id) === userId;

  if (!isBuyer && !isSeller) {
    return jsonError("Forbidden", 403);
  }

  // Find delivery by order_id
  const delivery = await Delivery.findOne({ order_id: orderId })
    .populate('order_id', 'status payment_status total_price product_id')
    .populate('order_id.product_id', 'title images unit')
    .populate('buyer_id', 'full_name phone email')
    .populate('seller_id', 'full_name phone email')
    .lean();

  if (!delivery) {
    return jsonError("Delivery not found for this order", 404);
  }

  // Also ensure order.delivery_id is set (fix any mismatches)
  if (!order.delivery_id || String(order.delivery_id) !== String(delivery._id)) {
    await Order.findByIdAndUpdate(orderId, {
      $set: { delivery_id: delivery._id }
    });
  }

  return jsonOk({ delivery });
}

