import { NextRequest } from "next/server";
import { requireMethod, jsonError, jsonOk, getAuthToken } from "@/server/utils/api";
import { verifyToken } from "@/server/utils/auth";
import { connectToDatabase } from "@/server/lib/mongodb";
import { Notification } from "@/server/models/Notification";

export async function GET(req: NextRequest) {
  const mm = requireMethod(req, ["GET"]);
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

  const { searchParams } = new URL(req.url);
  const read = searchParams.get("read");
  const type = searchParams.get("type");
  const priority = searchParams.get("priority");
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 100);
  const skip = (page - 1) * limit;

  const filter: any = { user_id: decoded.sub };
  if (read !== null) filter.read = read === "true";
  if (type) filter.type = type;
  if (priority) filter.priority = priority;

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Notification.countDocuments(filter),
    Notification.countDocuments({ user_id: decoded.sub, read: false })
  ]);

  return jsonOk({ 
    notifications, 
    total, 
    unreadCount,
    page, 
    pages: Math.ceil(total / limit) 
  });
}
