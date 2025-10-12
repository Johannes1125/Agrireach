import { NextRequest } from "next/server";
import { connectToDatabase } from "@/server/lib/mongodb";
import { Thread, ThreadReply } from "@/server/models/Thread";
import { jsonOk, jsonError, requireMethod, getAuthToken } from "@/server/utils/api";
import { verifyToken } from "@/server/utils/auth";
import { validateBody } from "@/server/middleware/validate";
import { CreatePostSchema } from "@/server/validators/threadSchemas";
import { validateUserRole } from "@/server/utils/role-validation";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const mm = requireMethod(_req, ["GET"]);
  if (mm) return mm;
  await connectToDatabase();

  const { id } = await params;

  const thr = await Thread.findById(id);
  if (!thr) return jsonError("Not found", 404);
  const posts = await ThreadReply.find({ thread_id: id, status: { $ne: "hidden" } })
    .populate('author_id', 'full_name avatar_url role')
    .sort({ created_at: 1 })
    .lean();
  
  // Format posts to match frontend expectations
  const formattedPosts = posts.map((post: any) => ({
    ...post,
    author: post.author_id ? {
      name: post.author_id.full_name || 'User',
      avatar: post.author_id.avatar_url || '',
      role: post.author_id.role || 'Member'
    } : {
      name: 'User',
      avatar: '',
      role: 'Member'
    }
  }));
  
  return jsonOk({ items: formattedPosts });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const mm = requireMethod(req, ["POST"]);
  if (mm) return mm;
  
  // Validate user is authenticated (any role can post replies)
  let userId: string;
  try {
    const { user, userId: validatedUserId } = await validateUserRole(req, ["worker", "recruiter", "buyer"]);
    userId = validatedUserId;
  } catch (error: any) {
    return jsonError(error.message, 403);
  }
  
  await connectToDatabase();

  const { id } = await params;

  const thr = await Thread.findById(id);
  if (!thr) return jsonError("Not found", 404);
  const validate = validateBody(CreatePostSchema);
  const result = await validate(req);
  if (!result.ok) return result.res;
  const post = await ThreadReply.create({ thread_id: thr._id, author_id: userId, content: result.data.content, parent_reply_id: result.data.parent_reply_id });
  await Thread.findByIdAndUpdate(thr._id, { $inc: { replies_count: 1 }, $set: { last_activity: new Date() } });
  return jsonOk({ id: post._id });
}


