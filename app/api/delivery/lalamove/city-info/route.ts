import { NextRequest } from "next/server";
import { requireMethod, jsonError, jsonOk, getAuthToken } from "@/server/utils/api";
import { verifyToken } from "@/server/utils/auth";
import { getCityInfo, LalamoveError } from "@/lib/lalamove";

export async function GET(req: NextRequest) {
  const mm = requireMethod(req, ["GET"]);
  if (mm) return mm;

  const token = getAuthToken(req, "access");
  if (!token) return jsonError("Unauthorized", 401);

  try {
    verifyToken<any>(token, "access");
  } catch {
    return jsonError("Unauthorized", 401);
  }

  try {
    const url = new URL(req.url);
    const city = url.searchParams.get("city") || "PH_PH"; // Default to Philippines

    const cityInfo = await getCityInfo(city);

    return jsonOk({
      city: cityInfo.data,
    });
  } catch (error: any) {
    console.error("Get city info error:", error);
    if (error instanceof LalamoveError) {
      return jsonError(error.message, 400);
    }
    return jsonError(error.message || "Failed to get city info", 500);
  }
}

