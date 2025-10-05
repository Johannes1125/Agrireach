import { NextRequest } from "next/server";
import { requireMethod, jsonError, jsonOk, getAuthToken } from "@/server/utils/api";
import { verifyToken } from "@/server/utils/auth";
import { connectToDatabase } from "@/server/lib/mongodb";
import { User } from "@/server/models/User";
import { AdminActivityLog } from "@/server/models/Report";

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
  const role = searchParams.get("role");
  const status = searchParams.get("status");
  const verified = searchParams.get("verified");
  const search = searchParams.get("search");
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 100);
  const skip = (page - 1) * limit;

  const filter: any = {};
  if (role) filter.role = role;
  if (status) filter.status = status;
  if (verified !== null) filter.verified = verified === "true";
  if (search) {
    filter.$or = [
      { full_name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } }
    ];
  }

  const [users, total] = await Promise.all([
    User.find(filter)
      .select("-password_hash -two_fa_secret")
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments(filter)
  ]);

  return jsonOk({ 
    users, 
    total, 
    page, 
    pages: Math.ceil(total / limit) 
  });
}
