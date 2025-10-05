import { NextRequest } from "next/server";
import { connectToDatabase } from "@/server/lib/mongodb";
import { ThreadReply } from "@/server/models/Thread";
import { jsonOk, jsonError, requireMethod, getAuthToken } from "@/server/utils/api";
import { verifyToken } from "@/server/utils/auth";
import { validateBody } from "@/server/middleware/validate";
import { UpdatePostSchema } from "@/server/validators/threadSchemas";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const mm = requireMethod(req, ["PUT"]);
  if (mm) return mm;
  const token = getAuthToken(req, "access");
  if (!token) return jsonError("Unauthorized", 401);
  let decoded: any; try { decoded = verifyToken<any>(token, "access"); } catch { return jsonError("Unauthorized", 401); }
  await connectToDatabase();
  const post = await ThreadReply.findById(params.id);
  if (!post) return jsonError("Not found", 404);
  if (String(post.author_id) !== decoded.sub && decoded.role !== "admin") return jsonError("Forbidden", 403);
  const validate = validateBody(UpdatePostSchema);
  const result = await validate(req);
  if (!result.ok) return result.res;
  await ThreadReply.findByIdAndUpdate(params.id, { $set: { content: result.data.content } });
  return jsonOk({});
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const mm = requireMethod(req, ["DELETE"]);
  if (mm) return mm;
  const token = getAuthToken(req, "access");
  if (!token) return jsonError("Unauthorized", 401);
  let decoded: any; try { decoded = verifyToken<any>(token, "access"); } catch { return jsonError("Unauthorized", 401); }
  await connectToDatabase();
  const post = await ThreadReply.findById(params.id);
  if (!post) return jsonError("Not found", 404);
  if (String(post.author_id) !== decoded.sub && decoded.role !== "admin") return jsonError("Forbidden", 403);
  await ThreadReply.findByIdAndDelete(params.id);
  return jsonOk({});
}


