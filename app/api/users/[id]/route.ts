import { NextRequest } from "next/server";
import { connectToDatabase } from "@/server/lib/mongodb";
import { User } from "@/server/models/User";
import { jsonOk, jsonError, requireMethod, getAuthToken } from "@/server/utils/api";
import { verifyToken } from "@/server/utils/auth";
import { validateBody } from "@/server/middleware/validate";
import { z } from "zod";

const UpdateUserSchema = z.object({
  full_name: z.string().optional(),
  phone: z.string().optional(),
  location: z.string().optional(),
  location_coordinates: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }).optional(),
  bio: z.string().optional(),
  skills: z.any().optional(),
  avatar_url: z.string().optional(),
});

function canModify(userId: string, req: NextRequest): string | null {
  const token = getAuthToken(req, "access");
  if (!token) return null;
  try {
    const decoded = verifyToken<any>(token, "access");
    return decoded.sub === userId || decoded.role === "admin" ? decoded.sub : null;
  } catch {
    return null;
  }
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const mm = requireMethod(_req, ["GET"]);
  if (mm) return mm;
  const { id } = await params;
  await connectToDatabase();
  const user = await User.findById(id).select("-password_hash -two_fa_secret").lean();
  if (!user) return jsonError("User not found", 404);
  return jsonOk({ user });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const mm = requireMethod(req, ["PUT"]);
  if (mm) return mm;
  const { id } = await params;
  const actor = canModify(id, req);
  if (!actor) return jsonError("Unauthorized", 401);

  const validate = validateBody(UpdateUserSchema);
  const result = await validate(req);
  if (!result.ok) return result.res;

  await connectToDatabase();
  
  // Handle location_coordinates properly
  const updateData: any = { ...result.data };
  if (result.data.location_coordinates) {
    updateData.location_coordinates = result.data.location_coordinates;
  }
  
  const user = await User.findByIdAndUpdate(
    id,
    { $set: updateData },
    { new: true }
  ).select("-password_hash -two_fa_secret");

  if (!user) return jsonError("User not found", 404);
  return jsonOk({ user });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const mm = requireMethod(req, ["DELETE"]);
  if (mm) return mm;
  const { id } = await params;
  const actor = canModify(id, req);
  if (!actor) return jsonError("Unauthorized", 401);
  await connectToDatabase();
  const user = await User.findByIdAndDelete(id);
  if (!user) return jsonError("User not found", 404);
  return jsonOk({ message: "Account deleted successfully" });
}


