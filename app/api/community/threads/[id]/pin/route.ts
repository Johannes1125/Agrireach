import { NextRequest } from "next/server";
import { connectToDatabase } from "@/server/lib/mongodb";
import { Thread } from "@/server/models/Thread";
import { jsonOk, jsonError, requireMethod, getAuthToken } from "@/server/utils/api";
import { verifyToken } from "@/server/utils/auth";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const mm = requireMethod(req, ["POST"]);
  if (mm) return mm;
  const token = getAuthToken(req, "access");
  if (!token) return jsonError("Unauthorized", 401);
  let decoded: any; try { decoded = verifyToken<any>(token, "access"); } catch { return jsonError("Unauthorized", 401); }
  // Allow author or admin to pin/unpin
  await connectToDatabase();
  const thr = await Thread.findById(params.id);
  if (!thr) return jsonError("Not found", 404);
  if (String(thr.author_id) !== decoded.sub && decoded.role !== "admin") return jsonError("Forbidden", 403);
  const pinned = !thr.pinned;
  await Thread.findByIdAndUpdate(params.id, { $set: { pinned, last_activity: new Date() } });
  return jsonOk({ pinned });
}


