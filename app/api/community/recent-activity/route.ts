import { NextRequest } from "next/server";
import { connectToDatabase } from "@/server/lib/mongodb";
import { Thread, ThreadPost } from "@/server/models/Thread";
import { jsonOk, jsonError, requireMethod } from "@/server/utils/api";

export async function GET(req: NextRequest) {
  const mm = requireMethod(req, ["GET"]);
  if (mm) return mm;
  
  try {
    await connectToDatabase();
    
    const url = new URL(req.url);
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "10"), 50);
    const halfLimit = Math.floor(limit / 2);

    const activities: any[] = [];

    // Get recent thread creations
    const recentThreads = await Thread.find({ status: "active" })
      .populate('author_id', 'full_name avatar_url')
      .sort({ created_at: -1 })
      .limit(halfLimit)
      .lean();

    for (const thread of recentThreads) {
      const author = thread.author_id as any;
      activities.push({
        type: "thread_created",
        user: {
          full_name: author?.full_name || "Anonymous",
          avatar_url: author?.avatar_url || null
        },
        action: "started",
        topic: thread.title || "Untitled",
        time: formatTimeAgo(thread.created_at),
        timestamp: new Date(thread.created_at).getTime(),
        thread_id: String(thread._id)
      });
    }

    // Get recent post replies
    const recentPosts = await ThreadPost.find({ status: "active" })
      .populate('author_id', 'full_name avatar_url')
      .populate('thread_id', 'title')
      .sort({ created_at: -1 })
      .limit(halfLimit)
      .lean();

    for (const post of recentPosts) {
      const author = post.author_id as any;
      const thread = post.thread_id as any;
      activities.push({
        type: "post_reply",
        user: {
          full_name: author?.full_name || "Anonymous",
          avatar_url: author?.avatar_url || null
        },
        action: "replied to",
        topic: thread?.title || "Discussion",
        time: formatTimeAgo(post.created_at),
        timestamp: new Date(post.created_at).getTime(),
        thread_id: thread?._id ? String(thread._id) : null
      });
    }

    // Sort all activities by timestamp (most recent first) and limit
    activities.sort((a, b) => {
      return (b.timestamp || 0) - (a.timestamp || 0);
    });

    const limitedActivities = activities.slice(0, limit);

    return jsonOk({ activities: limitedActivities });
  } catch (error: any) {
    console.error("Recent activity error:", error);
    return jsonError(error?.message || "Internal server error", 500);
  }
}

function formatTimeAgo(date: Date | string): string {
  if (!date) return "Unknown";
  
  const now = new Date();
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    return "Unknown";
  }
  
  const diffMs = now.getTime() - dateObj.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) {
    return "Just now";
  } else if (diffMins < 60) {
    return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
  } else {
    return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
  }
}
