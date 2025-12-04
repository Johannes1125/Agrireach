import { NextRequest } from "next/server";
import { jsonOk, jsonError, getAuthToken } from "@/server/utils/api";
import { verifyToken } from "@/server/utils/auth";
import { connectToDatabase } from "@/server/lib/mongodb";
import { Delivery } from "@/server/models/Delivery";
import { Driver } from "@/server/models/Driver";
import { User } from "@/server/models/User";
import { autoAssignDriver, findAvailableDrivers } from "@/server/utils/logistics-router";
import { z } from "zod";

const AssignDriverSchema = z.object({
  delivery_id: z.string().min(1, "Delivery ID is required"),
  leg_number: z.number().min(1).max(3),
  driver_id: z.string().optional(), // If not provided, auto-assign
});

/**
 * POST /api/delivery/assign-driver
 * Assign a driver to a delivery leg (manual or auto)
 */
export async function POST(req: NextRequest) {
  const token = getAuthToken(req, "access");
  if (!token) return jsonError("Unauthorized", 401);

  try {
    const decoded = verifyToken<any>(token, "access");
    
    await connectToDatabase();
    
    // Check if user is admin or hub manager
    const user = await User.findById(decoded.sub).select("roles role full_name").lean();
    if (!user) {
      return jsonError("User not found", 404);
    }
    const roles = user.roles || [user.role];
    if (!roles.includes("admin")) {
      return jsonError("Admin access required", 403);
    }

    const body = await req.json();
    const result = AssignDriverSchema.safeParse(body);

    if (!result.success) {
      const firstIssue = result.error.issues[0];
      return jsonError(firstIssue?.message || "Validation failed", 400);
    }

    const { delivery_id, leg_number, driver_id } = result.data;

    // Get delivery
    const delivery = await Delivery.findById(delivery_id);
    if (!delivery) {
      return jsonError("Delivery not found", 404);
    }

    // Find the leg
    const leg = delivery.legs.find(l => l.leg_number === leg_number);
    if (!leg) {
      return jsonError(`Leg ${leg_number} not found in delivery`, 404);
    }

    // Determine the hub for this leg
    const hubId = leg.type === "pickup" 
      ? delivery.origin_hub_id 
      : leg.type === "delivery" 
        ? delivery.destination_hub_id 
        : delivery.origin_hub_id; // Line haul originates from origin hub

    if (!hubId) {
      return jsonError("Hub not assigned for this delivery", 400);
    }

    let driver: any;

    if (driver_id) {
      // Manual assignment
      driver = await Driver.findById(driver_id);
      if (!driver) {
        return jsonError("Driver not found", 404);
      }

      // Validate driver is at the right hub and available
      if (driver.hub_id.toString() !== hubId.toString()) {
        return jsonError("Driver is not assigned to the required hub", 400);
      }

      if (driver.status !== "available") {
        return jsonError(`Driver is currently ${driver.status}`, 400);
      }

      // Check vehicle capacity
      if (driver.vehicle.max_weight < delivery.package_weight) {
        return jsonError(`Driver's vehicle cannot handle ${delivery.package_weight}kg package`, 400);
      }
    } else {
      // Auto-assign
      const assignment = await autoAssignDriver(
        hubId.toString(),
        leg.type,
        delivery.package_size,
        delivery.package_weight
      );

      if (!assignment.success || !assignment.driver) {
        return jsonError(assignment.error || "No available driver found", 404);
      }

      driver = assignment.driver;
    }

    // Update the leg with driver info
    leg.driver_id = driver._id;
    leg.driver_name = driver.name;
    leg.driver_phone = driver.phone;
    leg.vehicle_type = driver.vehicle.type;
    leg.vehicle_plate = driver.vehicle.plate_number;
    leg.status = "assigned";
    leg.assigned_at = new Date();

    // Update the delivery status based on leg type
    if (leg.type === "pickup") {
      delivery.pickup_driver_id = driver._id;
      delivery.status = "pickup_assigned";
      delivery.assigned_at = new Date();
    } else if (leg.type === "line_haul") {
      delivery.line_haul_driver_id = driver._id;
    } else if (leg.type === "delivery") {
      delivery.delivery_driver_id = driver._id;
      delivery.status = "delivery_assigned";
    }

    // Add timeline entry
    delivery.timeline.push({
      status: `${leg.type}_assigned`,
      timestamp: new Date(),
      location: leg.from_location.name,
      notes: `${driver.name} (${driver.vehicle.type}) assigned for ${leg.type}`,
      updated_by: user.full_name || "Admin",
    });

    // Update driver status
    driver.status = "on_delivery";
    driver.current_delivery_id = delivery._id;
    await driver.save();

    await delivery.save();

    return jsonOk({
      success: true,
      message: `Driver ${driver.name} assigned to ${leg.type} leg`,
      driver: {
        id: driver._id,
        name: driver.name,
        phone: driver.phone,
        vehicle: driver.vehicle,
      },
      delivery_status: delivery.status,
    });
  } catch (error: any) {
    console.error("Error assigning driver:", error);
    return jsonError(error.message || "Failed to assign driver", 500);
  }
}

/**
 * GET /api/delivery/assign-driver?delivery_id=xxx&leg_number=1
 * Get available drivers for a delivery leg
 */
export async function GET(req: NextRequest) {
  const token = getAuthToken(req, "access");
  if (!token) return jsonError("Unauthorized", 401);

  try {
    const decoded = verifyToken<any>(token, "access");
    
    await connectToDatabase();
    
    // Check if user is admin
    const user = await User.findById(decoded.sub).select("roles role").lean();
    const roles = user?.roles || [user?.role];
    if (!roles.includes("admin")) {
      return jsonError("Admin access required", 403);
    }

    const { searchParams } = new URL(req.url);
    const delivery_id = searchParams.get("delivery_id");
    const leg_number = parseInt(searchParams.get("leg_number") || "1");

    if (!delivery_id) {
      return jsonError("Delivery ID is required", 400);
    }

    // Get delivery
    const delivery = await Delivery.findById(delivery_id);
    if (!delivery) {
      return jsonError("Delivery not found", 404);
    }

    // Find the leg
    const leg = delivery.legs.find(l => l.leg_number === leg_number);
    if (!leg) {
      return jsonError(`Leg ${leg_number} not found in delivery`, 404);
    }

    // Determine the hub
    const hubId = leg.type === "pickup" 
      ? delivery.origin_hub_id 
      : leg.type === "delivery" 
        ? delivery.destination_hub_id 
        : delivery.origin_hub_id;

    if (!hubId) {
      return jsonError("Hub not assigned for this delivery", 400);
    }

    // Find available drivers
    const drivers = await findAvailableDrivers(
      hubId.toString(),
      leg.type,
      delivery.package_size,
      delivery.package_weight
    );

    return jsonOk({
      leg_type: leg.type,
      package_size: delivery.package_size,
      package_weight: delivery.package_weight,
      available_drivers: drivers.map(d => ({
        id: d._id,
        name: d.name,
        phone: d.phone,
        rating: d.rating,
        completed_deliveries: d.completed_deliveries,
        vehicle: d.vehicle,
      })),
    });
  } catch (error: any) {
    console.error("Error fetching available drivers:", error);
    return jsonError(error.message || "Failed to fetch drivers", 500);
  }
}

