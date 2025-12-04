import { NextRequest } from "next/server";
import { jsonOk, jsonError, getAuthToken } from "@/server/utils/api";
import { verifyToken } from "@/server/utils/auth";
import { connectToDatabase } from "@/server/lib/mongodb";
import { Driver } from "@/server/models/Driver";
import { User } from "@/server/models/User";
import { z } from "zod";

// Validation schema for creating driver
const CreateDriverSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(1, "Phone is required"),
  email: z.string().email().optional(),
  photo_url: z.string().optional(),
  hub_id: z.string().min(1, "Hub assignment is required"),
  driver_type: z.enum(["pickup", "line_haul", "delivery", "all_round"]).default("all_round"),
  vehicle: z.object({
    type: z.enum(["motorcycle", "car", "van", "mini_truck", "truck"]),
    plate_number: z.string().min(1, "Plate number is required"),
    brand: z.string().optional(),
    model: z.string().optional(),
    color: z.string().optional(),
    max_weight: z.number().min(1, "Max weight is required"),
    max_volume: z.number().optional(),
    description: z.string().optional(),
  }),
  license_number: z.string().optional(),
  license_expiry: z.string().optional(),
  is_verified: z.boolean().default(false),
  is_active: z.boolean().default(true),
});

/**
 * GET /api/admin/drivers
 * List all drivers (admin only)
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
    const hub_id = searchParams.get("hub_id");
    const driver_type = searchParams.get("driver_type");
    const status = searchParams.get("status");
    const vehicle_type = searchParams.get("vehicle_type");
    const active = searchParams.get("active");

    const query: any = {};
    if (hub_id) query.hub_id = hub_id;
    if (driver_type) query.driver_type = driver_type;
    if (status) query.status = status;
    if (vehicle_type) query["vehicle.type"] = vehicle_type;
    if (active !== null) query.is_active = active === "true";

    const drivers = await Driver.find(query)
      .populate("hub_id", "name code address.city")
      .populate("current_delivery_id", "tracking_number status")
      .sort({ hub_id: 1, name: 1 })
      .lean();

    // Calculate summary stats
    const stats = {
      total: drivers.length,
      available: drivers.filter(d => d.status === "available").length,
      on_delivery: drivers.filter(d => d.status === "on_delivery").length,
      off_duty: drivers.filter(d => d.status === "off_duty").length,
      suspended: drivers.filter(d => d.status === "suspended").length,
    };

    return jsonOk({ drivers, stats });
  } catch (error: any) {
    console.error("Error fetching drivers:", error);
    return jsonError(error.message || "Failed to fetch drivers", 500);
  }
}

/**
 * POST /api/admin/drivers
 * Create a new driver (admin only)
 */
export async function POST(req: NextRequest) {
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

    const body = await req.json();
    const result = CreateDriverSchema.safeParse(body);

    if (!result.success) {
      const firstIssue = result.error.issues[0];
      return jsonError(firstIssue?.message || "Validation failed", 400);
    }

    // Check if phone number already exists
    const existingPhone = await Driver.findOne({ phone: result.data.phone });
    if (existingPhone) {
      return jsonError("A driver with this phone number already exists", 400);
    }

    // Check if plate number already exists
    const existingPlate = await Driver.findOne({ "vehicle.plate_number": result.data.vehicle.plate_number });
    if (existingPlate) {
      return jsonError("A vehicle with this plate number already exists", 400);
    }

    const driverData = {
      ...result.data,
      license_expiry: result.data.license_expiry ? new Date(result.data.license_expiry) : undefined,
      status: "available" as const,
      rating: 5,
      total_ratings: 0,
      completed_deliveries: 0,
      cancelled_deliveries: 0,
    };

    const driver = await Driver.create(driverData);

    // Populate hub info
    await driver.populate("hub_id", "name code");

    return jsonOk({ 
      driver,
      message: "Driver created successfully" 
    });
  } catch (error: any) {
    console.error("Error creating driver:", error);
    return jsonError(error.message || "Failed to create driver", 500);
  }
}

