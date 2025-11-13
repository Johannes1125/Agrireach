import { NextRequest } from "next/server";
import { connectToDatabase } from "@/server/lib/mongodb";
import { Thread, ThreadReply } from "@/server/models/Thread";
import { jsonOk, jsonError, getBearerToken } from "@/server/utils/api";
import { verifyToken } from "@/server/utils/auth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await connectToDatabase();
  const replies = await ThreadReply.find({ thread_id: id }).sort({ created_at: 1 }).lean();
  return jsonOk({ items: replies });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = getBearerToken(req);
  if (!token) return jsonError("Unauthorized", 401);
  let decoded: any;
  try {
    decoded = verifyToken<any>(token, "access");
  } catch {
    return jsonError("Unauthorized", 401);
  }
  await connectToDatabase();
  const thread = await Thread.findById(id);
  if (!thread) return jsonError("Not found", 404);
  const body = await req.json();
  const { content, parent_reply_id } = body || {};
  if (!content) return jsonError("Missing content", 400);
  await ThreadReply.create({ thread_id: thread._id, author_id: decoded.sub, content, parent_reply_id });
  thread.replies_count += 1;
  await thread.save();
  return jsonOk({});
}
