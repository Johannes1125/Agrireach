import { NextRequest } from "next/server";
import { requireMethod, jsonError, jsonOk, getAuthToken } from "@/server/utils/api";
import { verifyToken } from "@/server/utils/auth";
import { connectToDatabase } from "@/server/lib/mongodb";
import { Delivery } from "@/server/models/Delivery";
import { Order } from "@/server/models/Product";
import { Notification } from "@/server/models/Notification";

/**
 * GET /api/delivery/[id]
 * Get delivery details by delivery ID
 */
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

  await connectToDatabase();

  const delivery = await Delivery.findById(id)
    .populate('order_id', 'status payment_status total_price product_id')
    .populate('order_id.product_id', 'title images unit')
    .populate('buyer_id', 'full_name phone email')
    .populate('seller_id', 'full_name phone email')
    .lean();

  if (!delivery) {
    return jsonError("Delivery not found", 404);
  }

  // Check if user is buyer or seller
  const userId = decoded.sub;
  const isBuyer = String(delivery.buyer_id._id) === userId;
  const isSeller = String(delivery.seller_id._id) === userId;

  if (!isBuyer && !isSeller) {
    return jsonError("Forbidden", 403);
  }

  return jsonOk({ delivery });
}

/**
 * PATCH /api/delivery/[id]
 * Update delivery details (seller only)
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
    .populate('seller_id', 'full_name');

  if (!delivery) {
    return jsonError("Delivery not found", 404);
  }

  // Only seller can update delivery
  if (String(delivery.seller_id._id) !== decoded.sub) {
    return jsonError("Only the seller can update delivery details", 403);
  }

  const body = await req.json();
  const {
    driver_name,
    driver_phone,
    driver_email,
    vehicle_type,
    vehicle_plate_number,
    vehicle_description,
    estimated_delivery_time,
    delivery_notes,
    seller_notes,
  } = body;

  // Update delivery fields
  const updateData: any = {};
  if (driver_name !== undefined) updateData.driver_name = driver_name;
  if (driver_phone !== undefined) updateData.driver_phone = driver_phone;
  if (driver_email !== undefined) updateData.driver_email = driver_email;
  if (vehicle_type !== undefined) updateData.vehicle_type = vehicle_type;
  if (vehicle_plate_number !== undefined) updateData.vehicle_plate_number = vehicle_plate_number;
  if (vehicle_description !== undefined) updateData.vehicle_description = vehicle_description;
  if (estimated_delivery_time !== undefined) updateData.estimated_delivery_time = estimated_delivery_time ? new Date(estimated_delivery_time) : null;
  if (delivery_notes !== undefined) updateData.delivery_notes = delivery_notes;
  if (seller_notes !== undefined) updateData.seller_notes = seller_notes;

  // If driver is assigned and status is pending, update to assigned
  if (driver_name && delivery.status === "pending") {
    updateData.status = "assigned";
    updateData.assigned_at = new Date();
  }

  const updatedDelivery = await Delivery.findByIdAndUpdate(
    id,
    { $set: updateData },
    { new: true }
  )
    .populate('order_id', 'status')
    .populate('buyer_id', 'full_name')
    .populate('seller_id', 'full_name')
    .lean();

  // Send notification to buyer if driver is assigned
  if (driver_name && delivery.status === "pending") {
    await Notification.create({
      user_id: delivery.buyer_id,
      type: 'order_update',
      title: 'Driver Assigned',
      message: `A driver has been assigned to your delivery. Tracking: ${delivery.tracking_number}`,
      priority: 'high',
      action_url: `/marketplace/orders/${delivery.order_id._id}`,
    });
  }

  return jsonOk({ delivery: updatedDelivery });
}

