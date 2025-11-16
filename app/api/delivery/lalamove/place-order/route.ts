import { NextRequest } from "next/server";
import { requireMethod, jsonError, jsonOk, getAuthToken } from "@/server/utils/api";
import { verifyToken } from "@/server/utils/auth";
import { connectToDatabase } from "@/server/lib/mongodb";
import { Order } from "@/server/models/Product";
import { User } from "@/server/models/User";
import { Notification } from "@/server/models/Notification";
import { placeOrder, LalamovePlaceOrderRequest, LalamoveError } from "@/lib/lalamove";

export async function POST(req: NextRequest) {
  const mm = requireMethod(req, ["POST"]);
  if (mm) return mm;

  const token = getAuthToken(req, "access");
  if (!token) return jsonError("Unauthorized", 401);

  let decoded: any;
  try {
    decoded = verifyToken<any>(token, "access");
  } catch {
    return jsonError("Unauthorized", 401);
  }

  try {
    const userId = decoded.sub;

    const body = await req.json();
    const { orderId, quotationId, senderName, senderPhone, recipientName, recipientPhone } = body;

    if (!orderId || !quotationId) {
      return jsonError("Order ID and Quotation ID are required", 400);
    }

    await connectToDatabase();

    // Find the order
    const order = await Order.findById(orderId)
      .populate('seller_id', 'full_name phone')
      .populate('buyer_id', 'full_name phone');

    if (!order) {
      return jsonError("Order not found", 404);
    }

    // Verify seller owns this order
    if (String(order.seller_id._id) !== userId) {
      return jsonError("You can only place delivery for your own orders", 403);
    }

    // Check if order already has a Lalamove order
    if (order.lalamove_order_id) {
      return jsonError("Order already has a Lalamove delivery", 400);
    }

    const seller = order.seller_id as any;
    const buyer = order.buyer_id as any;

    // Prepare Lalamove place order request
    const placeOrderRequest: LalamovePlaceOrderRequest = {
      quotationId,
      sender: {
        stopId: "1", // First stop is pickup
        name: senderName || seller.full_name || "Seller",
        phone: senderPhone || seller.phone || "",
      },
      recipients: [
        {
          stopId: "2", // Second stop is delivery
          name: recipientName || buyer.full_name || "Buyer",
          phone: recipientPhone || buyer.phone || "",
        },
      ],
      metadata: {
        order_id: String(order._id),
        buyer_id: String(order.buyer_id),
        seller_id: String(order.seller_id),
      },
    };

    const lalamoveOrder = await placeOrder(placeOrderRequest);

    // Update order with Lalamove information
    order.lalamove_order_id = lalamoveOrder.data.orderId;
    order.lalamove_quotation_id = quotationId;
    order.lalamove_status = lalamoveOrder.data.status;
    order.lalamove_tracking_url = lalamoveOrder.data.shareLink;
    order.lalamove_driver_id = lalamoveOrder.data.driverId;
    
    // Update order status to "shipped" if driver is assigned
    if (lalamoveOrder.data.driverId) {
      order.status = "shipped";
    } else {
      order.status = "confirmed";
    }
    
    await order.save();

    // Send notification to buyer
    await Notification.create({
      user_id: order.buyer_id,
      type: 'order_update',
      title: 'Delivery Arranged',
      message: `Your order has been arranged for delivery via Lalamove. Track your order: ${lalamoveOrder.data.shareLink || 'N/A'}`,
      priority: 'high',
      action_url: `/marketplace/orders/${order._id}`,
    });

    return jsonOk({
      success: true,
      order: {
        id: order._id,
        lalamove_order_id: lalamoveOrder.data.orderId,
        lalamove_status: lalamoveOrder.data.status,
        tracking_url: lalamoveOrder.data.shareLink,
        driver_id: lalamoveOrder.data.driverId,
      },
    });
  } catch (error: any) {
    console.error("Lalamove place order error:", error);
    if (error instanceof LalamoveError) {
      return jsonError(error.message, 400);
    }
    return jsonError(error.message || "Failed to place order", 500);
  }
}

