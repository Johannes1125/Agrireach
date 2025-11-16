import { NextRequest } from "next/server";
import { requireMethod, jsonError, jsonOk, getAuthToken } from "@/server/utils/api";
import { verifyToken } from "@/server/utils/auth";
import { connectToDatabase } from "@/server/lib/mongodb";
import { Order } from "@/server/models/Product";
import { Notification } from "@/server/models/Notification";
import { cancelOrder, LalamoveError } from "@/lib/lalamove";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const mm = requireMethod(req, ["POST"]);
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
      .populate('buyer_id', 'full_name')
      .populate('seller_id', 'full_name');

    if (!order) {
      return jsonError("Order not found", 404);
    }

    // Verify seller owns this order
    if (String(order.seller_id._id) !== userId) {
      return jsonError("You can only cancel delivery for your own orders", 403);
    }

    if (!order.lalamove_order_id) {
      return jsonError("Order does not have a Lalamove delivery", 400);
    }

    // Cancel Lalamove order
    try {
      await cancelOrder(order.lalamove_order_id);
    } catch (lalamoveError: any) {
      console.error("Lalamove cancel error:", lalamoveError);
      // Continue to update order even if Lalamove cancel fails
    }

    // Update order
    order.lalamove_status = "CANCELLED";
    order.status = "confirmed"; // Reset to confirmed since delivery is cancelled
    await order.save();

    // Send notification to buyer
    await Notification.create({
      user_id: order.buyer_id,
      type: 'order_update',
      title: 'Delivery Cancelled',
      message: `The delivery for your order has been cancelled. Please contact the seller for more information.`,
      priority: 'medium',
      action_url: `/marketplace/orders/${order._id}`,
    });

    return jsonOk({
      success: true,
      message: "Delivery cancelled successfully",
      order: {
        id: order._id,
        status: order.status,
        lalamove_status: order.lalamove_status,
      },
    });
  } catch (error: any) {
    console.error("Cancel Lalamove delivery error:", error);
    if (error instanceof LalamoveError) {
      return jsonError(error.message, 400);
    }
    return jsonError(error.message || "Failed to cancel delivery", 500);
  }
}

