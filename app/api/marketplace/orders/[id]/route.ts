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

  // If order has Lalamove tracking, include tracking info
  let trackingInfo = null;
  if (order.lalamove_order_id) {
    try {
      const { getOrderDetails, getDriverDetails } = await import("@/lib/lalamove");
      const lalamoveOrder = await getOrderDetails(order.lalamove_order_id);
      
      let driverDetails = null;
      if (order.lalamove_driver_id || lalamoveOrder.data.driverId) {
        try {
          driverDetails = await getDriverDetails(order.lalamove_order_id);
        } catch (err) {
          // Driver details optional
          console.log("Driver details not available yet:", err);
        }
      }
      
      // Extract comprehensive tracking information from Lalamove response
      // According to Lalamove API docs: https://developers.lalamove.com/#order-flow
      const lalamoveData = lalamoveOrder.data || {};
      
      trackingInfo = {
        order_id: lalamoveData.orderId || order.lalamove_order_id,
        quotation_id: lalamoveData.quotationId || order.lalamove_quotation_id || null,
        status: lalamoveData.status || order.lalamove_status || "PENDING",
        tracking_url: order.lalamove_tracking_url || lalamoveData.shareLink || null,
        driver: driverDetails?.data ? {
          name: driverDetails.data.name || driverDetails.data.driverName || null,
          phone: driverDetails.data.phone || driverDetails.data.phoneNumber || null,
          vehicle: driverDetails.data.vehicle || driverDetails.data.vehicleType || null,
          plateNumber: driverDetails.data.plateNumber || driverDetails.data.plate || null,
        } : null,
        stops: (lalamoveData.stops || []).map((stop: any) => ({
          stopId: stop.stopId || null,
          coordinates: stop.coordinates || null,
          address: stop.address || null,
          name: stop.name || null,
          phone: stop.phone || null,
          status: stop.status || null,
          POD: stop.POD || null, // Proof of Delivery info if enabled
        })),
        distance: lalamoveData.distance || null, // { value: string, unit: string }
        priceBreakdown: lalamoveData.priceBreakdown || null, // Price breakdown details
        priorityFee: lalamoveData.priorityFee || null,
        serviceType: lalamoveData.serviceType || null,
        specialRequests: lalamoveData.specialRequests || [],
        metadata: lalamoveData.metadata || null,
        remarks: lalamoveData.remarks || [], // Array of strings
        placedAt: lalamoveData.placedAt || lalamoveData.createdAt || order.created_at,
        pickupTime: lalamoveData.pickupTime || lalamoveData.scheduledAt || null,
      };
    } catch (err) {
      console.error("Error fetching Lalamove tracking:", err);
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

  // IMPORTANT: If seller is confirming the order and Lalamove hasn't been set up yet, trigger it
  if (result.data.status === "confirmed" && isSeller && !order.lalamove_order_id) {
    console.log(`[Order Confirmation] Triggering Lalamove setup for order ${order._id}`);
    
    // Import and trigger Lalamove auto-setup (non-blocking)
    try {
      const { autoSetupLalamoveDelivery } = await import("@/server/utils/lalamove-auto-setup");
      
      // Run async but don't wait - we want to return success immediately
      autoSetupLalamoveDelivery(String(order._id))
        .then((result) => {
          if (result.success) {
            console.log(`[Order Confirmation] ✅ Lalamove setup successful for order ${order._id}: ${result.lalamove_order_id}`);
          } else {
            console.error(`[Order Confirmation] ❌ Lalamove setup failed for order ${order._id}: ${result.error}`);
          }
        })
        .catch((error) => {
          // Log error but don't fail the order confirmation
          console.error(`[Order Confirmation] ❌ Failed to setup Lalamove for order ${order._id}:`, error);
        });
    } catch (importError) {
      console.error(`[Order Confirmation] ❌ Failed to import Lalamove auto-setup:`, importError);
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
