import { NextRequest } from "next/server";
import { connectToDatabase } from "@/server/lib/mongodb";
import { Thread, ThreadLike } from "@/server/models/Thread";
import { jsonOk, jsonError, requireMethod, getAuthToken } from "@/server/utils/api";
import { verifyToken } from "@/server/utils/auth";
import { z } from "zod";

const Schema = z.object({ vote_type: z.enum(["like", "dislike"]) });

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const mm = requireMethod(req, ["POST"]);
  if (mm) return mm;
  const { id } = await params;
  const token = getAuthToken(req, "access");
  if (!token) return jsonError("Unauthorized", 401);
  let decoded: any; try { decoded = verifyToken<any>(token, "access"); } catch { return jsonError("Unauthorized", 401); }
  const body = await req.json().catch(() => ({}));
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid payload", 400);
  await connectToDatabase();
  const thr = await Thread.findById(id);
  if (!thr) return jsonError("Not found", 404);
  const existing = await ThreadLike.findOne({ threadId: id, userId: decoded.sub });
  if (parsed.data.vote_type === "like") {
    if (!existing) await ThreadLike.create({ threadId: id, userId: decoded.sub });
  } else {
    if (existing) await existing.deleteOne();
  }
  const likes = await ThreadLike.countDocuments({ threadId: id });
  await Thread.findByIdAndUpdate(id, { $set: { likes_count: likes } });
  return jsonOk({ likes_count: likes });
}


