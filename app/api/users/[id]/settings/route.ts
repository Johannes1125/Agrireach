import { NextRequest } from "next/server";
import { connectToDatabase } from "@/server/lib/mongodb";
import { UserProfile } from "@/server/models/UserProfile";
import { jsonOk, jsonError, requireMethod, getAuthToken } from "@/server/utils/api";
import { verifyToken } from "@/server/utils/auth";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const mm = requireMethod(req, ["PUT"]);
  if (mm) return mm;
  const token = getAuthToken(req, "access");
  if (!token) return jsonError("Unauthorized", 401);
  let decoded: any;
  try {
    decoded = verifyToken<any>(token, "access");
  } catch {
    return jsonError("Unauthorized", 401);
  }
  if (decoded.sub !== params.id && decoded.role !== "admin") return jsonError("Forbidden", 403);
  const body = await req.json();
  await connectToDatabase();
  await UserProfile.findOneAndUpdate({ user_id: params.id }, { $set: { preferences: body?.preferences || body } }, { upsert: true });
  return jsonOk({});
}


