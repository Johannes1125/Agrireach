import { NextRequest } from "next/server";
import { requireMethod, jsonError, jsonOk, getAuthToken } from "@/server/utils/api";
import { verifyToken } from "@/server/utils/auth";
import { connectToDatabase } from "@/server/lib/mongodb";
import { Order } from "@/server/models/Product";
import { Notification } from "@/server/models/Notification";
import { editOrder, LalamoveEditOrderRequest, LalamoveError } from "@/lib/lalamove";

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

  try {
    const userId = decoded.sub;

    await connectToDatabase();

    // Find the order
    const order = await Order.findById(id)
      .populate('buyer_id', 'full_name phone')
      .populate('seller_id', 'full_name phone');

    if (!order) {
      return jsonError("Order not found", 404);
    }

    // Verify seller owns this order
    if (String(order.seller_id._id) !== userId) {
      return jsonError("You can only edit delivery for your own orders", 403);
    }

    if (!order.lalamove_order_id) {
      return jsonError("Order does not have a Lalamove delivery", 400);
    }

    // Check if order can still be edited (must be before pickup)
    if (order.lalamove_status === "PICKED_UP" || order.lalamove_status === "COMPLETED") {
      return jsonError("Cannot edit order after pickup", 400);
    }

    const body = await req.json();
    const { stops, recipients, sender, metadata } = body;

    // Prepare edit request
    const editRequest: LalamoveEditOrderRequest = {
      stops,
      recipients,
      sender,
      metadata: metadata || {
        order_id: String(order._id),
        buyer_id: String(order.buyer_id),
        seller_id: String(order.seller_id),
        product_id: String(order.product_id),
      },
    };

    // Edit Lalamove order
    const lalamoveResponse = await editOrder(order.lalamove_order_id, editRequest);

    // Update order if needed
    if (lalamoveResponse.data.shareLink) {
      order.lalamove_tracking_url = lalamoveResponse.data.shareLink;
    }
    if (lalamoveResponse.data.status) {
      order.lalamove_status = lalamoveResponse.data.status;
    }
    await order.save();

    // Send notification to buyer
    await Notification.create({
      user_id: order.buyer_id._id,
      type: 'order_update',
      title: 'Delivery Updated',
      message: 'The delivery information for your order has been updated.',
      priority: 'medium',
      action_url: `/marketplace/orders/${order._id}`,
    });

    return jsonOk({
      success: true,
      message: "Order updated successfully",
      order: {
        id: order._id,
        lalamove_order_id: order.lalamove_order_id,
        lalamove_status: order.lalamove_status,
        tracking_url: order.lalamove_tracking_url,
      },
    });
  } catch (error: any) {
    console.error("Edit Lalamove order error:", error);
    if (error instanceof LalamoveError) {
      return jsonError(error.message, 400);
    }
    return jsonError(error.message || "Failed to edit order", 500);
  }
}

