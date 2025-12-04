import { NextRequest } from "next/server";
import { jsonOk, jsonError, getAuthToken } from "@/server/utils/api";
import { verifyToken } from "@/server/utils/auth";
import { connectToDatabase } from "@/server/lib/mongodb";
import { calculateShippingFee, getAllShippingRates } from "@/server/utils/shipping-calculator";
import { z } from "zod";

const CalculateShippingSchema = z.object({
  seller_location: z.string().min(1, "Seller location is required"),
  buyer_location: z.string().min(1, "Buyer location is required"),
  subtotal: z.number().min(0, "Subtotal must be positive"),
});

/**
 * POST /api/marketplace/shipping/calculate
 * Calculate shipping fee based on seller and buyer locations
 */
export async function POST(req: NextRequest) {
  const token = getAuthToken(req, "access");
  if (!token) return jsonError("Unauthorized", 401);

  try {
    verifyToken<any>(token, "access");
  } catch {
    return jsonError("Unauthorized", 401);
  }

  try {
    await connectToDatabase();

    const body = await req.json();
    const result = CalculateShippingSchema.safeParse(body);

    if (!result.success) {
      const firstIssue = result.error.issues[0];
      return jsonError(firstIssue?.message || "Invalid request", 400);
    }

    const { seller_location, buyer_location, subtotal } = result.data;

    const shippingInfo = calculateShippingFee(seller_location, buyer_location, subtotal);

    return jsonOk({
      shipping: shippingInfo,
      total: subtotal + shippingInfo.fee,
    });
  } catch (error: any) {
    console.error("Shipping calculation error:", error);
    return jsonError("Failed to calculate shipping", 500);
  }
}

/**
 * GET /api/marketplace/shipping/calculate
 * Get all available shipping rates
 */
export async function GET(req: NextRequest) {
  const token = getAuthToken(req, "access");
  if (!token) return jsonError("Unauthorized", 401);

  try {
    verifyToken<any>(token, "access");
  } catch {
    return jsonError("Unauthorized", 401);
  }

  try {
    const rates = getAllShippingRates();
    return jsonOk({ rates });
  } catch (error: any) {
    console.error("Error fetching shipping rates:", error);
    return jsonError("Failed to fetch shipping rates", 500);
  }
}

