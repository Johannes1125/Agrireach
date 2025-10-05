import { NextRequest } from "next/server";
import { requireMethod, jsonError, jsonOk, getAuthToken } from "@/server/utils/api";
import { verifyToken } from "@/server/utils/auth";
import { connectToDatabase } from "@/server/lib/mongodb";
import { Notification } from "@/server/models/Notification";

export async function PUT(req: NextRequest) {
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
  
  const result = await Notification.updateMany(
    { user_id: decoded.sub, read: false },
    { $set: { read: true } }
  );

  return jsonOk({ 
    message: "All notifications marked as read",
    modifiedCount: result.modifiedCount
  });
}
