import { NextRequest } from "next/server";
import { requireMethod, jsonError, jsonOk, getAuthToken } from "@/server/utils/api";
import { verifyToken } from "@/server/utils/auth";
import { connectToDatabase } from "@/server/lib/mongodb";
import { Order } from "@/server/models/Product";
import { getOrderDetails, getDriverDetails, LalamoveError } from "@/lib/lalamove";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

  try {
    await connectToDatabase();

    // Find the order
    const order = await Order.findById(id)
      .populate('buyer_id', 'full_name')
      .populate('seller_id', 'full_name');

    if (!order) {
      return jsonError("Order not found", 404);
    }

    // Check if user is buyer or seller
    if (String(order.buyer_id._id) !== decoded.sub && 
        String(order.seller_id._id) !== decoded.sub) {
      return jsonError("Forbidden", 403);
    }

    // If order doesn't have Lalamove order ID, return order without tracking
    if (!order.lalamove_order_id) {
      return jsonOk({
        order: {
          id: order._id,
          status: order.status,
          lalamove_enabled: false,
        },
      });
    }

    // Get Lalamove order details
    let lalamoveOrderDetails = null;
    let driverDetails = null;

    try {
      lalamoveOrderDetails = await getOrderDetails(order.lalamove_order_id);
      
      // Get driver details if driver is assigned
      if (order.lalamove_driver_id || lalamoveOrderDetails.data.driverId) {
        try {
          driverDetails = await getDriverDetails(order.lalamove_order_id);
        } catch (driverError) {
          console.error("Error getting driver details:", driverError);
          // Driver details are optional, continue without them
        }
      }
    } catch (lalamoveError: any) {
      console.error("Error getting Lalamove order details:", lalamoveError);
      // Return order with basic info even if Lalamove API fails
      return jsonOk({
        order: {
          id: order._id,
          status: order.status,
          lalamove_order_id: order.lalamove_order_id,
          lalamove_status: order.lalamove_status,
          tracking_url: order.lalamove_tracking_url,
          error: "Failed to fetch latest tracking information",
        },
      });
    }

    // Update order status based on Lalamove status
    const lalamoveStatus = lalamoveOrderDetails.data.status;
    let orderStatus = order.status;

    // Map Lalamove status to order status
    if (lalamoveStatus === "ASSIGNING_DRIVER" || lalamoveStatus === "ON_GOING") {
      orderStatus = "shipped";
    } else if (lalamoveStatus === "PICKED_UP") {
      orderStatus = "shipped";
    } else if (lalamoveStatus === "COMPLETED") {
      orderStatus = "delivered";
    } else if (lalamoveStatus === "CANCELLED") {
      orderStatus = "cancelled";
    }

    // Update order if status changed
    if (orderStatus !== order.status) {
      order.status = orderStatus;
      order.lalamove_status = lalamoveStatus;
      await order.save();
    }

    return jsonOk({
      order: {
        id: order._id,
        status: orderStatus,
        lalamove_order_id: order.lalamove_order_id,
        lalamove_status: lalamoveStatus,
        tracking_url: order.lalamove_tracking_url || lalamoveOrderDetails.data.shareLink,
        lalamove_details: lalamoveOrderDetails.data,
        driver: driverDetails?.data || null,
      },
    });
  } catch (error: any) {
    console.error("Get Lalamove order error:", error);
    return jsonError(error.message || "Failed to get order details", 500);
  }
}

