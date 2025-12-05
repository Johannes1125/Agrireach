import { NextRequest } from "next/server";
import { requireMethod, jsonError, jsonOk, getAuthToken } from "@/server/utils/api";
import { verifyToken } from "@/server/utils/auth";
import { connectToDatabase } from "@/server/lib/mongodb";
import { Delivery } from "@/server/models/Delivery";
import { Order } from "@/server/models/Product";
import { Notification } from "@/server/models/Notification";
import { z } from "zod";

const AssignDriverSchema = z.object({
  driver_name: z.string().min(1, "Driver name is required"),
  driver_phone: z.string().min(1, "Driver phone is required"),
  driver_email: z.string().email().optional(),
  vehicle_type: z.enum(["motorcycle", "car", "mini_truck", "truck"]),
  vehicle_plate_number: z.string().optional(),
  vehicle_description: z.string().optional(),
  estimated_delivery_time: z.string().optional(), // ISO date string
  seller_notes: z.string().optional(),
});

/**
 * POST /api/delivery/[id]/assign-driver
 * Assign a driver to a delivery (seller only)
 */
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

  await connectToDatabase();

  const delivery = await Delivery.findById(id)
    .populate('order_id')
    .populate('buyer_id', 'full_name')
    .populate('seller_id', 'full_name');

  if (!delivery) {
    return jsonError("Delivery not found", 404);
  }

  // Only seller can assign driver
  if (String(delivery.seller_id._id) !== decoded.sub) {
    return jsonError("Only the seller can assign a driver", 403);
  }

  // Check if driver is already assigned
  if (delivery.status !== "pending" && delivery.driver_name) {
    return jsonError("A driver has already been assigned to this delivery", 400);
  }

  const body = await req.json();
  const validation = AssignDriverSchema.safeParse(body);
  if (!validation.success) {
    return jsonError(validation.error.issues[0]?.message || "Invalid input", 400);
  }

  const {
    driver_name,
    driver_phone,
    driver_email,
    vehicle_type,
    vehicle_plate_number,
    vehicle_description,
    estimated_delivery_time,
    seller_notes,
  } = validation.data;

  // Update delivery with driver information
  const updateData: any = {
    driver_name,
    driver_phone,
    driver_email,
    vehicle_type,
    vehicle_plate_number,
    vehicle_description,
    seller_notes,
    // Align with DeliveryStatus progression (pending -> pickup_assigned)
    status: "pickup_assigned",
    assigned_at: new Date(),
  };

  if (estimated_delivery_time) {
    updateData.estimated_delivery_time = new Date(estimated_delivery_time);
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

  // Update order status to "confirmed" if it's still pending
  const order = await Order.findById(delivery.order_id._id);
  if (order && order.status === "pending") {
    await Order.findByIdAndUpdate(delivery.order_id._id, {
      $set: { status: "confirmed" }
    });
  }

  // Send notification to buyer
  await Notification.create({
    user_id: delivery.buyer_id._id,
    type: 'order_update',
    title: 'Driver Assigned',
    message: `A driver (${driver_name}) has been assigned to your delivery. Vehicle: ${vehicle_type}. Tracking: ${delivery.tracking_number}`,
    priority: 'high',
    action_url: `/marketplace/orders/${delivery.order_id._id}`,
  });

  return jsonOk({
    success: true,
    message: "Driver assigned successfully",
    delivery: updatedDelivery,
  });
}

