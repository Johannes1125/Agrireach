import { NextRequest } from "next/server";
import { requireMethod, jsonError, jsonOk, getAuthToken } from "@/server/utils/api";
import { verifyToken } from "@/server/utils/auth";
import { setWebhookUrl, LalamoveError } from "@/lib/lalamove";

export async function POST(req: NextRequest) {
  const mm = requireMethod(req, ["POST"]);
  if (mm) return mm;

  const token = getAuthToken(req, "access");
  if (!token) return jsonError("Unauthorized", 401);

  let decoded: any;
  try {
    decoded = verifyToken<any>(token, "access");
    // Only allow admin users to set webhook URL
    if (decoded.role !== "admin") {
      return jsonError("Only admins can set webhook URL", 403);
    }
  } catch {
    return jsonError("Unauthorized", 401);
  }

  try {
    const body = await req.json();
    const { webhookUrl } = body;

    if (!webhookUrl) {
      return jsonError("webhookUrl is required", 400);
    }

    // Validate URL format
    try {
      new URL(webhookUrl);
    } catch {
      return jsonError("Invalid webhook URL format", 400);
    }

    const result = await setWebhookUrl(webhookUrl);

    return jsonOk({
      success: true,
      message: "Webhook URL set successfully",
      webhook_url: result.data?.url || webhookUrl,
    });
  } catch (error: any) {
    console.error("Set webhook URL error:", error);
    if (error instanceof LalamoveError) {
      return jsonError(error.message, 400);
    }
    return jsonError(error.message || "Failed to set webhook URL", 500);
  }
}

