import { NextRequest } from "next/server";
import { connectToDatabase } from "@/server/lib/mongodb";
import { Thread } from "@/server/models/Thread";
import { jsonOk, jsonError, requireMethod, getAuthToken } from "@/server/utils/api";
import { verifyToken } from "@/server/utils/auth";

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

  if (decoded.role !== "admin") {
    return jsonError("Forbidden", 403);
  }

  await connectToDatabase();

  try {
    const [
      totalPosts,
      activePosts,
      pendingPosts,
      flaggedPosts
    ] = await Promise.all([
      Thread.countDocuments({}),
      Thread.countDocuments({ status: "active" }),
      Thread.countDocuments({ status: "pending" }),
      Thread.countDocuments({ flagged: true })
    ]);

    const stats = {
      total: totalPosts,
      active: activePosts,
      pending: pendingPosts,
      flagged: flaggedPosts
    };

    return jsonOk(stats);
  } catch (error) {
    console.error("Admin community stats error:", error);
    return jsonError("Internal server error", 500);
  }
}
