import { NextRequest } from "next/server";
import { connectToDatabase } from "@/server/lib/mongodb";
import { User } from "@/server/models/User";
import { jsonOk, jsonError, requireMethod, getAuthToken } from "@/server/utils/api";
import { verifyToken, verifyPassword, hashPassword } from "@/server/utils/auth";
import { z } from "zod";

const Schema = z.object({ current_password: z.string().min(1), new_password: z.string().min(8) });

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const mm = requireMethod(req, ["PUT"]);
  if (mm) return mm;
  const token = getAuthToken(req, "access");
  if (!token) return jsonError("Unauthorized", 401);
  let decoded: any;
  try { decoded = verifyToken<any>(token, "access"); } catch { return jsonError("Unauthorized", 401); }
  if (decoded.sub !== params.id && decoded.role !== "admin") return jsonError("Forbidden", 403);
  let body: any;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON", 400);
  }
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid payload", 400, parsed.error.flatten());
  await connectToDatabase();
  const user = await User.findById(params.id);
  if (!user) return jsonError("Not found", 404);
  if (decoded.role !== "admin") {
    const ok = await verifyPassword(parsed.data.current_password, user.password_hash);
    if (!ok) return jsonError("Incorrect current password", 400);
  }
  user.password_hash = await hashPassword(parsed.data.new_password);
  await user.save();
  return jsonOk({});
}


