import { NextRequest } from "next/server";
import { requireMethod, jsonError, jsonOk, getAuthToken } from "@/server/utils/api";
import { verifyToken } from "@/server/utils/auth";
import { connectToDatabase } from "@/server/lib/mongodb";
import { User } from "@/server/models/User";
import { Report } from "@/server/models/Report";

async function requireAdmin(req: NextRequest) {
  const token = getAuthToken(req, "access");
  if (!token) return null;

  try {
    const decoded = verifyToken<any>(token, "access");
    await connectToDatabase();
    const user = await User.findById(decoded.sub);
    return user && user.role === "admin" ? decoded : null;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const mm = requireMethod(req, ["GET"]);
  if (mm) return mm;

  const admin = await requireAdmin(req);
  if (!admin) return jsonError("Forbidden - Admin access required", 403);

  await connectToDatabase();

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const type = searchParams.get("type");
  const priority = searchParams.get("priority");
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 100);
  const skip = (page - 1) * limit;

  const filter: any = {};
  if (status) filter.status = status;
  if (type) filter.type = type;
  if (priority) filter.priority = priority;

  const [reports, total] = await Promise.all([
    Report.find(filter)
      .populate('reporter_id', 'full_name email')
      .populate('reported_user_id', 'full_name email')
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Report.countDocuments(filter)
  ]);

  return jsonOk({ 
    reports, 
    total, 
    page, 
    pages: Math.ceil(total / limit) 
  });
}
