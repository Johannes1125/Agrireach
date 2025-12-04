import { NextRequest } from "next/server";
import { jsonOk, jsonError, getAuthToken } from "@/server/utils/api";
import { verifyToken } from "@/server/utils/auth";
import { connectToDatabase } from "@/server/lib/mongodb";
import { Warehouse } from "@/server/models/Warehouse";
import { Driver } from "@/server/models/Driver";
import { User } from "@/server/models/User";
import { z } from "zod";

// Validation schema for updating warehouse
const UpdateWarehouseSchema = z.object({
  name: z.string().min(1).optional(),
  type: z.enum(["regional_hub", "sorting_center", "collection_point"]).optional(),
  address: z.object({
    line1: z.string().min(1),
    line2: z.string().optional(),
    city: z.string().min(1),
    province: z.string().min(1),
    postal_code: z.string().optional(),
    country: z.string().default("Philippines"),
    coordinates: z.object({
      latitude: z.number(),
      longitude: z.number(),
    }).optional(),
  }).optional(),
  coverage_areas: z.array(z.string()).optional(),
  operating_hours: z.object({
    open: z.string(),
    close: z.string(),
    days: z.array(z.string()),
  }).optional(),
  daily_capacity: z.number().min(1).optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  manager_id: z.string().optional(),
  is_active: z.boolean().optional(),
  connected_hubs: z.array(z.string()).optional(),
});

/**
 * GET /api/admin/warehouses/[id]
 * Get a single warehouse with its drivers
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = getAuthToken(req, "access");
  if (!token) return jsonError("Unauthorized", 401);

  try {
    const decoded = verifyToken<any>(token, "access");
    const { id } = await params;
    
    await connectToDatabase();
    
    // Check if user is admin
    const user = await User.findById(decoded.sub).select("roles role").lean();
    const roles = user?.roles || [user?.role];
    if (!roles.includes("admin")) {
      return jsonError("Admin access required", 403);
    }

    const warehouse = await Warehouse.findById(id)
      .populate("manager_id", "full_name email phone")
      .populate("connected_hubs", "name code address.city")
      .lean();

    if (!warehouse) {
      return jsonError("Warehouse not found", 404);
    }

    // Get drivers at this hub
    const drivers = await Driver.find({ hub_id: id, is_active: true })
      .sort({ driver_type: 1, name: 1 })
      .lean();

    // Get driver stats
    const driverStats = {
      total: drivers.length,
      available: drivers.filter(d => d.status === "available").length,
      on_delivery: drivers.filter(d => d.status === "on_delivery").length,
      off_duty: drivers.filter(d => d.status === "off_duty").length,
      by_type: {
        pickup: drivers.filter(d => d.driver_type === "pickup" || d.driver_type === "all_round").length,
        line_haul: drivers.filter(d => d.driver_type === "line_haul").length,
        delivery: drivers.filter(d => d.driver_type === "delivery" || d.driver_type === "all_round").length,
      },
      by_vehicle: {
        motorcycle: drivers.filter(d => d.vehicle.type === "motorcycle").length,
        car: drivers.filter(d => d.vehicle.type === "car").length,
        van: drivers.filter(d => d.vehicle.type === "van").length,
        mini_truck: drivers.filter(d => d.vehicle.type === "mini_truck").length,
        truck: drivers.filter(d => d.vehicle.type === "truck").length,
      },
    };

    return jsonOk({ 
      warehouse,
      drivers,
      driver_stats: driverStats,
    });
  } catch (error: any) {
    console.error("Error fetching warehouse:", error);
    return jsonError(error.message || "Failed to fetch warehouse", 500);
  }
}

/**
 * PUT /api/admin/warehouses/[id]
 * Update a warehouse
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = getAuthToken(req, "access");
  if (!token) return jsonError("Unauthorized", 401);

  try {
    const decoded = verifyToken<any>(token, "access");
    const { id } = await params;
    
    await connectToDatabase();
    
    // Check if user is admin
    const user = await User.findById(decoded.sub).select("roles role").lean();
    const roles = user?.roles || [user?.role];
    if (!roles.includes("admin")) {
      return jsonError("Admin access required", 403);
    }

    const body = await req.json();
    const result = UpdateWarehouseSchema.safeParse(body);

    if (!result.success) {
      const firstIssue = result.error.issues[0];
      return jsonError(firstIssue?.message || "Validation failed", 400);
    }

    const warehouse = await Warehouse.findByIdAndUpdate(
      id,
      { $set: result.data },
      { new: true }
    )
      .populate("manager_id", "full_name email")
      .populate("connected_hubs", "name code");

    if (!warehouse) {
      return jsonError("Warehouse not found", 404);
    }

    return jsonOk({ 
      warehouse,
      message: "Warehouse updated successfully" 
    });
  } catch (error: any) {
    console.error("Error updating warehouse:", error);
    return jsonError(error.message || "Failed to update warehouse", 500);
  }
}

/**
 * DELETE /api/admin/warehouses/[id]
 * Delete a warehouse (soft delete by setting is_active to false)
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = getAuthToken(req, "access");
  if (!token) return jsonError("Unauthorized", 401);

  try {
    const decoded = verifyToken<any>(token, "access");
    const { id } = await params;
    
    await connectToDatabase();
    
    // Check if user is admin
    const user = await User.findById(decoded.sub).select("roles role").lean();
    const roles = user?.roles || [user?.role];
    if (!roles.includes("admin")) {
      return jsonError("Admin access required", 403);
    }

    // Check if warehouse has active drivers
    const activeDrivers = await Driver.countDocuments({ hub_id: id, is_active: true });
    if (activeDrivers > 0) {
      return jsonError(`Cannot delete warehouse with ${activeDrivers} active driver(s). Reassign drivers first.`, 400);
    }

    // Soft delete
    const warehouse = await Warehouse.findByIdAndUpdate(
      id,
      { $set: { is_active: false } },
      { new: true }
    );

    if (!warehouse) {
      return jsonError("Warehouse not found", 404);
    }

    return jsonOk({ 
      message: "Warehouse deactivated successfully" 
    });
  } catch (error: any) {
    console.error("Error deleting warehouse:", error);
    return jsonError(error.message || "Failed to delete warehouse", 500);
  }
}

