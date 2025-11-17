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
  // Mongoose will automatically convert string to ObjectId, but we can also try both
  let delivery = await Delivery.findOne({ order_id: orderId })
    .populate('order_id', 'status payment_status total_price product_id')
    .populate('order_id.product_id', 'title images unit')
    .populate('buyer_id', 'full_name phone email')
    .populate('seller_id', 'full_name phone email')
    .lean();

  // DEBUG LOGGING:
  console.log(`[Delivery By Order API] Found delivery for order ${orderId}:`, delivery ? "Yes" : "No");
  if (delivery) {
    const orderIdPopulated = delivery.order_id as any;
    console.log(`[Delivery By Order API] Order ID populated:`, orderIdPopulated);
    console.log(`[Delivery By Order API] Product ID in order:`, orderIdPopulated?.product_id);
    console.log(`[Delivery By Order API] Product ID type:`, typeof orderIdPopulated?.product_id);
    console.log(`[Delivery By Order API] Product populated:`, orderIdPopulated?.product_id && typeof orderIdPopulated?.product_id === 'object' ? "Yes" : "No");
    if (orderIdPopulated?.product_id && typeof orderIdPopulated?.product_id === 'object') {
      console.log(`[Delivery By Order API] Product title:`, (orderIdPopulated.product_id as any)?.title);
      console.log(`[Delivery By Order API] Full product object:`, JSON.stringify(orderIdPopulated.product_id, null, 2));
    } else {
      console.log(`[Delivery By Order API] Product ID is not populated - value:`, orderIdPopulated?.product_id);
    }
  }

  // If not found, try with explicit ObjectId conversion (in case of type mismatch)
  if (!delivery) {
    try {
      const mongoose = await import("mongoose");
      const orderIdObjectId = new mongoose.Types.ObjectId(orderId);
      delivery = await Delivery.findOne({ order_id: orderIdObjectId })
        .populate('order_id', 'status payment_status total_price product_id')
        .populate('order_id.product_id', 'title images unit')
        .populate('buyer_id', 'full_name phone email')
        .populate('seller_id', 'full_name phone email')
        .lean();
      
      // DEBUG LOGGING:
      console.log(`[Delivery By Order API] Retry with ObjectId - Found delivery:`, delivery ? "Yes" : "No");
      if (delivery) {
        const orderIdPopulated = delivery.order_id as any;
        console.log(`[Delivery By Order API] Retry - Product populated:`, orderIdPopulated?.product_id && typeof orderIdPopulated?.product_id === 'object' ? "Yes" : "No");
        if (orderIdPopulated?.product_id && typeof orderIdPopulated?.product_id === 'object') {
          console.log(`[Delivery By Order API] Retry - Product title:`, (orderIdPopulated.product_id as any)?.title);
        }
      }
    } catch (err) {
      // Invalid ObjectId format, continue with original query result (null)
      console.error(`[Delivery By Order API] ObjectId conversion error:`, err);
    }
  }

  if (!delivery) {
    console.error(`[Delivery By Order] No delivery found for order ${orderId}`);
    return jsonError("Delivery not found for this order", 404);
  }

  // Also ensure order.delivery_id is set (fix any mismatches)
  if (!order.delivery_id || String(order.delivery_id) !== String(delivery._id)) {
    await Order.findByIdAndUpdate(orderId, {
      $set: { delivery_id: delivery._id }
    });
  }

  // DEBUG LOGGING - Before returning:
  const orderIdFinal = delivery?.order_id as any;
  console.log(`[Delivery By Order API] Returning delivery with order_id:`, orderIdFinal?._id || orderIdFinal);
  console.log(`[Delivery By Order API] Final product check:`, orderIdFinal?.product_id);
  if (orderIdFinal?.product_id && typeof orderIdFinal.product_id === 'object') {
    console.log(`[Delivery By Order API] Final product title:`, (orderIdFinal.product_id as any)?.title);
  }

  return jsonOk({ delivery });
}

