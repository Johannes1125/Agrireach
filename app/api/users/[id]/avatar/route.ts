import { NextRequest } from "next/server";
import { connectToDatabase } from "@/server/lib/mongodb";
import { User } from "@/server/models/User";
import { jsonOk, jsonError, requireMethod, getAuthToken } from "@/server/utils/api";
import { verifyToken } from "@/server/utils/auth";
import cloudinary from "@/lib/cloudinary";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const mm = requireMethod(req, ["PUT"]);
  if (mm) return mm;
  const { id } = await params;
  const token = getAuthToken(req, "access");
  if (!token) return jsonError("Unauthorized", 401);
  let decoded: any;
  try {
    decoded = verifyToken<any>(token, "access");
  } catch {
    return jsonError("Unauthorized", 401);
  }
  if (decoded.sub !== id && decoded.role !== "admin") return jsonError("Forbidden", 403);

  await connectToDatabase();
  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file) return jsonError("Missing file", 400);
  const buffer = Buffer.from(await file.arrayBuffer());
  const upload = await cloudinary.uploader.upload_stream({ folder: "avatars" }, (err) => { if (err) console.error(err); });
  // Node stream approach is verbose; fallback to data URI for simplicity
  const base64 = `data:${file.type};base64,${buffer.toString("base64")}`;
  const result = await cloudinary.uploader.upload(base64, { folder: "avatars" });
  await User.findByIdAndUpdate(id, { $set: { avatar: result.secure_url } });
  return jsonOk({ avatar: result.secure_url });
}


