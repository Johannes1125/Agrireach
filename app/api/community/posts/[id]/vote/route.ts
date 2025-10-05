import { NextRequest } from "next/server";
import { connectToDatabase } from "@/server/lib/mongodb";
import { ThreadReply, ThreadPostVote } from "@/server/models/Thread";
import { jsonOk, jsonError, requireMethod, getAuthToken } from "@/server/utils/api";
import { verifyToken } from "@/server/utils/auth";
import { validateBody } from "@/server/middleware/validate";
import { VotePostSchema } from "@/server/validators/threadSchemas";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const mm = requireMethod(req, ["POST"]);
  if (mm) return mm;
  const token = getAuthToken(req, "access");
  if (!token) return jsonError("Unauthorized", 401);
  let decoded: any; try { decoded = verifyToken<any>(token, "access"); } catch { return jsonError("Unauthorized", 401); }
  const validate = validateBody(VotePostSchema);
  const result = await validate(req);
  if (!result.ok) return result.res;
  await connectToDatabase();
  const post = await ThreadReply.findById(params.id);
  if (!post) return jsonError("Not found", 404);
  const existing = await ThreadPostVote.findOne({ post_id: params.id, user_id: decoded.sub });
  if (!existing) {
    await ThreadPostVote.create({ post_id: params.id, user_id: decoded.sub, vote_type: result.data.vote_type });
  } else {
    if (existing.vote_type === result.data.vote_type) {
      await existing.deleteOne();
    } else {
      existing.vote_type = result.data.vote_type;
      await existing.save();
    }
  }
  const likes = await ThreadPostVote.countDocuments({ post_id: params.id, vote_type: "like" });
  await ThreadReply.findByIdAndUpdate(params.id, { $set: { likes_count: likes } });
  return jsonOk({ likes_count: likes });
}


