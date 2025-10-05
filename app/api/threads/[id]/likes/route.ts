import { NextRequest } from "next/server";
import { connectToDatabase } from "@/server/lib/mongodb";
import { Thread, ThreadLike } from "@/server/models/Thread";
import { jsonOk, jsonError, requireMethod, getBearerToken } from "@/server/utils/api";
import { verifyToken } from "@/server/utils/auth";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const token = getBearerToken(req);
  if (!token) return jsonError("Unauthorized", 401);
  let decoded: any;
  try {
    decoded = verifyToken<any>(token, "access");
  } catch {
    return jsonError("Unauthorized", 401);
  }
  await connectToDatabase();
  const thread = await Thread.findById(params.id);
  if (!thread) return jsonError("Not found", 404);
  const res = await ThreadLike.updateOne({ threadId: thread._id, userId: decoded.sub }, { $set: { threadId: thread._id, userId: decoded.sub } }, { upsert: true });
  if (res.upsertedCount || res.modifiedCount) {
    thread.likeCount += 1;
    await thread.save();
  }
  return jsonOk({ liked: true });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const token = getBearerToken(req);
  if (!token) return jsonError("Unauthorized", 401);
  let decoded: any;
  try {
    decoded = verifyToken<any>(token, "access");
  } catch {
    return jsonError("Unauthorized", 401);
  }
  await connectToDatabase();
  const thread = await Thread.findById(params.id);
  if (!thread) return jsonError("Not found", 404);
  const res = await ThreadLike.deleteOne({ threadId: thread._id, userId: decoded.sub });
  if (res.deletedCount) {
    thread.likeCount = Math.max(0, thread.likeCount - 1);
    await thread.save();
  }
  return jsonOk({ liked: false });
}

