import { NextRequest } from "next/server";
import { connectToDatabase } from "@/server/lib/mongodb";
import { Thread, ThreadPost } from "@/server/models/Thread";
import { jsonOk, jsonError, requireMethod } from "@/server/utils/api";

export async function GET(req: NextRequest) {
  const mm = requireMethod(req, ["GET"]);
  if (mm) return mm;
  
  await connectToDatabase();
  
  try {
    const url = new URL(req.url);
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "10"), 50);

    const activities: any[] = [];

    // Get recent thread creations
    const recentThreads = await Thread.find({ status: "active" })
      .populate('author_id', 'full_name avatar_url')
      .sort({ created_at: -1 })
      .limit(limit / 2)
      .lean();

    for (const thread of recentThreads) {
      activities.push({
        type: "thread_created",
        user: {
          full_name: (thread.author_id as any)?.full_name || "Anonymous",
          avatar_url: (thread.author_id as any)?.avatar_url
        },
        action: "started",
        topic: thread.title,
        time: formatTimeAgo(thread.created_at),
        thread_id: String(thread._id)
      });
    }

    // Get recent post replies
    const recentPosts = await ThreadPost.find({ status: "active" })
      .populate('author_id', 'full_name avatar_url')
      .populate('thread_id', 'title')
      .sort({ created_at: -1 })
      .limit(limit / 2)
      .lean();

    for (const post of recentPosts) {
      activities.push({
        type: "post_reply",
        user: {
          full_name: (post.author_id as any)?.full_name || "Anonymous",
          avatar_url: (post.author_id as any)?.avatar_url
        },
        action: "replied to",
        topic: (post.thread_id as any)?.title || "Discussion",
        time: formatTimeAgo(post.created_at),
        thread_id: (post.thread_id as any)?._id?.toString()
      });
    }

    // Sort all activities by timestamp and limit
    activities.sort((a, b) => {
      const timeA = parseTimeAgo(a.time);
      const timeB = parseTimeAgo(b.time);
      return timeA - timeB;
    });

    const limitedActivities = activities.slice(0, limit);

    return jsonOk({ activities: limitedActivities });
  } catch (error) {
    console.error("Recent activity error:", error);
    return jsonError("Internal server error", 500);
  }
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 60) {
    return `${diffMins} minutes ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hours ago`;
  } else {
    return `${diffDays} days ago`;
  }
}

function parseTimeAgo(timeStr: string): number {
  const match = timeStr.match(/(\d+)\s+(minutes?|hours?|days?)\s+ago/);
  if (!match) return 0;
  
  const value = parseInt(match[1]);
  const unit = match[2];
  
  if (unit.startsWith('minute')) return value;
  if (unit.startsWith('hour')) return value * 60;
  if (unit.startsWith('day')) return value * 60 * 24;
  
  return 0;
}
