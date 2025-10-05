import { NextRequest } from "next/server";
import { connectToDatabase } from "@/server/lib/mongodb";
import { Thread } from "@/server/models/Thread";
import { jsonOk, jsonError, requireMethod } from "@/server/utils/api";

export async function GET(req: NextRequest) {
  const mm = requireMethod(req, ["GET"]);
  if (mm) return mm;
  
  await connectToDatabase();
  
  try {
    const url = new URL(req.url);
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "10"), 50);

    // Get trending topics based on recent activity and reply count
    const topics = await Thread.find({ 
      status: "active",
      created_at: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // last 7 days
    })
    .sort({
      replies_count: -1,
      views: -1,
      created_at: -1
    })
    .limit(limit)
    .select('title category replies_count views created_at')
    .lean();

    return jsonOk({ topics });
  } catch (error) {
    console.error("Trending topics error:", error);
    return jsonError("Internal server error", 500);
  }
}
