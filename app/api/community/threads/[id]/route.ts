import { NextRequest } from "next/server";
import { connectToDatabase } from "@/server/lib/mongodb";
import { Thread } from "@/server/models/Thread";
import { jsonOk, jsonError, requireMethod, getAuthToken } from "@/server/utils/api";
import { verifyToken } from "@/server/utils/auth";
import { validateBody } from "@/server/middleware/validate";
import { UpdateThreadSchema } from "@/server/validators/threadSchemas";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const mm = requireMethod(_req, ["GET"]);
  if (mm) return mm;
  await connectToDatabase();

  const { id } = await params;

  const thr = await Thread.findById(id)
    .populate('author_id', 'full_name avatar_url role')
    .lean();
  if (!thr) return jsonError("Not found", 404);
  await Thread.findByIdAndUpdate(id, { $inc: { views: 1 }, $set: { last_activity: new Date() } });
  
  // Format thread to match frontend expectations
  const formattedThread = {
    ...thr,
    author: (thr as any).author_id ? {
      name: (thr as any).author_id.full_name || 'User',
      avatar: (thr as any).author_id.avatar_url || '',
      role: (thr as any).author_id.role || 'Member'
    } : {
      name: 'User',
      avatar: '',
      role: 'Member'
    }
  };
  
  return jsonOk(formattedThread);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const mm = requireMethod(req, ["PUT"]);
  if (mm) return mm;
  const token = getAuthToken(req, "access");
  if (!token) return jsonError("Unauthorized", 401);
  let decoded: any; try { decoded = verifyToken<any>(token, "access"); } catch { return jsonError("Unauthorized", 401); }
  await connectToDatabase();
  const thr = await Thread.findById(params.id);
  if (!thr) return jsonError("Not found", 404);
  if (String(thr.author_id) !== decoded.sub && decoded.role !== "admin") return jsonError("Forbidden", 403);
  const validate = validateBody(UpdateThreadSchema);
  const result = await validate(req);
  if (!result.ok) return result.res;
  await Thread.findByIdAndUpdate(params.id, { $set: { ...result.data, last_activity: new Date() } });
  return jsonOk({});
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const mm = requireMethod(req, ["DELETE"]);
  if (mm) return mm;
  const token = getAuthToken(req, "access");
  if (!token) return jsonError("Unauthorized", 401);
  let decoded: any; try { decoded = verifyToken<any>(token, "access"); } catch { return jsonError("Unauthorized", 401); }
  await connectToDatabase();
  const thr = await Thread.findById(params.id);
  if (!thr) return jsonError("Not found", 404);
  if (String(thr.author_id) !== decoded.sub && decoded.role !== "admin") return jsonError("Forbidden", 403);
  await Thread.findByIdAndDelete(params.id);
  return jsonOk({});
}


