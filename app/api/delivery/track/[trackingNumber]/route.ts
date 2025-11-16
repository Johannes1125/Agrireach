import { NextRequest } from "next/server";
import { requireMethod, jsonError, jsonOk } from "@/server/utils/api";
import { connectToDatabase } from "@/server/lib/mongodb";
import { Delivery } from "@/server/models/Delivery";

/**
 * GET /api/delivery/track/[trackingNumber]
 * Track delivery by tracking number (public endpoint, no auth required)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ trackingNumber: string }> }
) {
  const mm = requireMethod(req, ["GET"]);
  if (mm) return mm;

  const { trackingNumber } = await params;

  if (!trackingNumber) {
    return jsonError("Tracking number is required", 400);
  }

  await connectToDatabase();

  const delivery = await Delivery.findOne({ tracking_number: trackingNumber })
    .populate('order_id', 'status payment_status total_price product_id')
    .populate('buyer_id', 'full_name')
    .populate('seller_id', 'full_name')
    .populate('order_id.product_id', 'title images')
    .lean();

  if (!delivery) {
    return jsonError("Delivery not found", 404);
  }

  // Return delivery info (public tracking)
  return jsonOk({
    tracking_number: delivery.tracking_number,
    status: delivery.status,
    driver: delivery.driver_name ? {
      name: delivery.driver_name,
      phone: delivery.driver_phone || null,
      vehicle_type: delivery.vehicle_type || null,
      vehicle_plate_number: delivery.vehicle_plate_number || null,
    } : null,
    pickup_address: delivery.pickup_address,
    delivery_address: delivery.delivery_address,
    estimated_delivery_time: delivery.estimated_delivery_time || null,
    actual_delivery_time: delivery.actual_delivery_time || null,
    assigned_at: delivery.assigned_at || null,
    picked_up_at: delivery.picked_up_at || null,
    in_transit_at: delivery.in_transit_at || null,
    created_at: delivery.created_at,
    updated_at: delivery.updated_at,
    // Order info (limited)
    order: {
      status: (delivery.order_id as any)?.status,
      total_price: (delivery.order_id as any)?.total_price,
      product: (delivery.order_id as any)?.product_id,
    },
  });
}

