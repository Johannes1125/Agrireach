import { NextRequest } from "next/server";
import { connectToDatabase } from "@/server/lib/mongodb";
import { Thread } from "@/server/models/Thread";
import { jsonOk, jsonError, getBearerToken } from "@/server/utils/api";
import { verifyToken } from "@/server/utils/auth";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  await connectToDatabase();
  const doc = await Thread.findById(params.id).lean();
  if (!doc) return jsonError("Not found", 404);
  return jsonOk(doc);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const token = getBearerToken(req);
  if (!token) return jsonError("Unauthorized", 401);
  let decoded: any;
  try {
    decoded = verifyToken<any>(token, "access");
  } catch {
    return jsonError("Unauthorized", 401);
  }
  await connectToDatabase();
  const doc = await Thread.findById(params.id);
  if (!doc) return jsonError("Not found", 404);
  if (String(doc.author_id) !== decoded.sub && decoded.role !== "admin") {
    return jsonError("Forbidden", 403);
  }
  const body = await req.json();
  const updatable = ["title","content","category","tags"] as const;
  for (const key of updatable) {
    if (key in body) (doc as any)[key] = body[key];
  }
  await doc.save();
  return jsonOk({});
}
