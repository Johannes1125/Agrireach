import { NextRequest } from "next/server";
import { connectToDatabase } from "@/server/lib/mongodb";
import { User } from "@/server/models/User";
import { Thread, ThreadPost } from "@/server/models/Thread";
import { jsonOk, jsonError, requireMethod } from "@/server/utils/api";

export async function GET(req: NextRequest) {
  const mm = requireMethod(req, ["GET"]);
  if (mm) return mm;
  
  await connectToDatabase();
  
  try {
    const [totalMembers, totalThreads, totalPosts, onlineNow] = await Promise.all([
      User.countDocuments({ status: "active" }),
      Thread.countDocuments({ status: "active" }),
      ThreadPost.countDocuments({ status: "active" }),
      // For online now, we'll use a simple approximation based on recent activity
      User.countDocuments({ 
        status: "active",
        last_login: { $gte: new Date(Date.now() - 15 * 60 * 1000) } // last 15 minutes
      })
    ]);

    const stats = {
      totalMembers,
      totalThreads,
      totalPosts,
      onlineNow
    };

    return jsonOk({ stats });
  } catch (error) {
    console.error("Community stats error:", error);
    return jsonError("Internal server error", 500);
  }
}
