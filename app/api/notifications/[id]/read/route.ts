import { NextRequest } from "next/server";
import { requireMethod, jsonError, jsonOk, getAuthToken } from "@/server/utils/api";
import { verifyToken } from "@/server/utils/auth";
import { connectToDatabase } from "@/server/lib/mongodb";
import { Notification } from "@/server/models/Notification";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const mm = requireMethod(req, ["PUT"]);
  if (mm) return mm;

  const token = getAuthToken(req, "access");
  if (!token) return jsonError("Unauthorized", 401);

  let decoded: any;
  try {
    decoded = verifyToken<any>(token, "access");
  } catch {
    return jsonError("Unauthorized", 401);
  }

  await connectToDatabase();
  
  const notification = await Notification.findById(params.id);
  if (!notification) return jsonError("Notification not found", 404);

  // Check if user owns this notification
  if (notification.user_id.toString() !== decoded.sub) {
    return jsonError("Forbidden", 403);
  }

  await Notification.findByIdAndUpdate(params.id, {
    $set: { read: true }
  });

  return jsonOk({ message: "Notification marked as read" });
}
