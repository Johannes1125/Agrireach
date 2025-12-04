import { NextRequest } from "next/server";
import { jsonOk, jsonError, getAuthToken } from "@/server/utils/api";
import { verifyToken } from "@/server/utils/auth";
import { connectToDatabase } from "@/server/lib/mongodb";
import { Driver } from "@/server/models/Driver";
import { User } from "@/server/models/User";
import { z } from "zod";

// Validation schema for updating driver
const UpdateDriverSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().min(1).optional(),
  email: z.string().email().optional(),
  photo_url: z.string().optional(),
  hub_id: z.string().optional(),
  driver_type: z.enum(["pickup", "line_haul", "delivery", "all_round"]).optional(),
  vehicle: z.object({
    type: z.enum(["motorcycle", "car", "van", "mini_truck", "truck"]),
    plate_number: z.string().min(1),
    brand: z.string().optional(),
    model: z.string().optional(),
    color: z.string().optional(),
    max_weight: z.number().min(1),
    max_volume: z.number().optional(),
    description: z.string().optional(),
  }).optional(),
  status: z.enum(["available", "on_delivery", "returning", "off_duty", "suspended"]).optional(),
  license_number: z.string().optional(),
  license_expiry: z.string().optional(),
  is_verified: z.boolean().optional(),
  is_active: z.boolean().optional(),
});

/**
 * GET /api/admin/drivers/[id]
 * Get a single driver
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

    const driver = await Driver.findById(id)
      .populate("hub_id", "name code address.city address.province")
      .populate("current_delivery_id")
      .lean();

    if (!driver) {
      return jsonError("Driver not found", 404);
    }

    return jsonOk({ driver });
  } catch (error: any) {
    console.error("Error fetching driver:", error);
    return jsonError(error.message || "Failed to fetch driver", 500);
  }
}

/**
 * PUT /api/admin/drivers/[id]
 * Update a driver
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
    const result = UpdateDriverSchema.safeParse(body);

    if (!result.success) {
      const firstIssue = result.error.issues[0];
      return jsonError(firstIssue?.message || "Validation failed", 400);
    }

    const updateData = {
      ...result.data,
      license_expiry: result.data.license_expiry ? new Date(result.data.license_expiry) : undefined,
    };

    // Check if phone already exists on another driver
    if (result.data.phone) {
      const existingPhone = await Driver.findOne({ 
        phone: result.data.phone,
        _id: { $ne: id }
      });
      if (existingPhone) {
        return jsonError("A driver with this phone number already exists", 400);
      }
    }

    // Check if plate already exists on another driver
    if (result.data.vehicle?.plate_number) {
      const existingPlate = await Driver.findOne({ 
        "vehicle.plate_number": result.data.vehicle.plate_number,
        _id: { $ne: id }
      });
      if (existingPlate) {
        return jsonError("A vehicle with this plate number already exists", 400);
      }
    }

    const driver = await Driver.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    ).populate("hub_id", "name code");

    if (!driver) {
      return jsonError("Driver not found", 404);
    }

    return jsonOk({ 
      driver,
      message: "Driver updated successfully" 
    });
  } catch (error: any) {
    console.error("Error updating driver:", error);
    return jsonError(error.message || "Failed to update driver", 500);
  }
}

/**
 * PATCH /api/admin/drivers/[id]
 * Update driver status only (quick action)
 */
export async function PATCH(
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
    const { status, is_active } = body;

    const updateData: any = {};
    if (status) {
      if (!["available", "on_delivery", "returning", "off_duty", "suspended"].includes(status)) {
        return jsonError("Invalid status", 400);
      }
      updateData.status = status;
    }
    if (typeof is_active === "boolean") {
      updateData.is_active = is_active;
    }

    const driver = await Driver.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    ).populate("hub_id", "name code");

    if (!driver) {
      return jsonError("Driver not found", 404);
    }

    return jsonOk({ 
      driver,
      message: "Driver status updated" 
    });
  } catch (error: any) {
    console.error("Error updating driver status:", error);
    return jsonError(error.message || "Failed to update driver", 500);
  }
}

/**
 * DELETE /api/admin/drivers/[id]
 * Delete a driver (soft delete)
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

    const driver = await Driver.findById(id);
    if (!driver) {
      return jsonError("Driver not found", 404);
    }

    // Check if driver has active delivery
    if (driver.status === "on_delivery" && driver.current_delivery_id) {
      return jsonError("Cannot delete driver with an active delivery", 400);
    }

    // Soft delete
    await Driver.findByIdAndUpdate(id, { $set: { is_active: false, status: "off_duty" } });

    return jsonOk({ 
      message: "Driver deactivated successfully" 
    });
  } catch (error: any) {
    console.error("Error deleting driver:", error);
    return jsonError(error.message || "Failed to delete driver", 500);
  }
}

