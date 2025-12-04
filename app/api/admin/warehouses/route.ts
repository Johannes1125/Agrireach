import { NextRequest } from "next/server";
import { jsonOk, jsonError, getAuthToken } from "@/server/utils/api";
import { verifyToken } from "@/server/utils/auth";
import { connectToDatabase } from "@/server/lib/mongodb";
import { Warehouse } from "@/server/models/Warehouse";
import { User } from "@/server/models/User";
import { z } from "zod";

// Validation schema for creating/updating warehouse
const WarehouseSchema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().min(1, "Code is required").toUpperCase(),
  type: z.enum(["regional_hub", "sorting_center", "collection_point"]).default("regional_hub"),
  address: z.object({
    line1: z.string().min(1, "Address line 1 is required"),
    line2: z.string().optional(),
    city: z.string().min(1, "City is required"),
    province: z.string().min(1, "Province is required"),
    postal_code: z.string().optional(),
    country: z.string().default("Philippines"),
    coordinates: z.object({
      latitude: z.number(),
      longitude: z.number(),
    }).optional(),
  }),
  coverage_areas: z.array(z.string()).default([]),
  operating_hours: z.object({
    open: z.string().default("08:00"),
    close: z.string().default("18:00"),
    days: z.array(z.string()).default(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]),
  }).optional(),
  daily_capacity: z.number().min(1).default(500),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  is_active: z.boolean().default(true),
});

/**
 * GET /api/admin/warehouses
 * List all warehouses (admin only)
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
    const type = searchParams.get("type");
    const active = searchParams.get("active");

    const query: any = {};
    if (type) query.type = type;
    if (active !== null) query.is_active = active === "true";

    const warehouses = await Warehouse.find(query)
      .populate("manager_id", "full_name email")
      .populate("connected_hubs", "name code")
      .sort({ name: 1 })
      .lean();

    return jsonOk({ warehouses });
  } catch (error: any) {
    console.error("Error fetching warehouses:", error);
    return jsonError(error.message || "Failed to fetch warehouses", 500);
  }
}

/**
 * POST /api/admin/warehouses
 * Create a new warehouse (admin only)
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
    const result = WarehouseSchema.safeParse(body);

    if (!result.success) {
      const firstIssue = result.error.issues[0];
      return jsonError(firstIssue?.message || "Validation failed", 400);
    }

    // Check if code already exists
    const existing = await Warehouse.findOne({ code: result.data.code });
    if (existing) {
      return jsonError(`Warehouse with code ${result.data.code} already exists`, 400);
    }

    const warehouse = await Warehouse.create(result.data);

    return jsonOk({ 
      warehouse,
      message: "Warehouse created successfully" 
    });
  } catch (error: any) {
    console.error("Error creating warehouse:", error);
    return jsonError(error.message || "Failed to create warehouse", 500);
  }
}

