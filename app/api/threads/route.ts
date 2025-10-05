import { NextRequest } from "next/server";
import { connectToDatabase } from "@/server/lib/mongodb";
import { Thread } from "@/server/models/Thread";
import { jsonOk, jsonError, requireMethod, getBearerToken } from "@/server/utils/api";
import { verifyToken } from "@/server/utils/auth";

function parseIntSafe(v?: string | null) {
  if (!v) return undefined;
  const n = parseInt(v, 10);
  return Number.isNaN(n) ? undefined : n;
}

export async function GET(req: NextRequest) {
  const mm = requireMethod(req, ["GET"]);
  if (mm) return mm;
  await connectToDatabase();
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");
  const category = searchParams.get("category");
  const page = parseIntSafe(searchParams.get("page")) || 1;
  const pageSize = Math.min(parseIntSafe(searchParams.get("pageSize")) || 20, 100);

  const filter: any = {};
  if (category) filter.category = category;
  if (q) filter.$text = { $search: q };

  const items = await Thread.find(filter)
    .sort({ created_at: -1 })
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .lean();
  const total = await Thread.countDocuments(filter);
  return jsonOk({ items, page, pageSize, total });
}

export async function POST(req: NextRequest) {
  const token = getBearerToken(req);
  if (!token) return jsonError("Unauthorized", 401);
  let decoded: any;
  try {
    decoded = verifyToken<any>(token, "access");
  } catch {
    return jsonError("Unauthorized", 401);
  }
  await connectToDatabase();
  const body = await req.json();
  const { title, content, category, tags } = body || {};
  if (!title || !content) return jsonError("Missing required fields", 400);
  const doc = await Thread.create({ title, content, category, tags: Array.isArray(tags) ? tags : [], author_id: decoded.sub });
  return jsonOk({ id: doc._id });
}
