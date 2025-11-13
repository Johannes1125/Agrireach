import { NextRequest } from "next/server";
import { requireMethod, jsonError, jsonOk } from "@/server/utils/api";
import { connectToDatabase } from "@/server/lib/mongodb";
import { Farmer } from "@/server/models/Farmer";
import { User } from "@/server/models/User";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const mm = requireMethod(req, ["GET"]);
  if (mm) return mm;

  const { id } = await params;
  await connectToDatabase();
  
  const farmer = await Farmer.findById(id)
    .populate({
      path: 'user_id',
      select: 'full_name email location avatar_url bio verified status',
      match: { status: 'active' }
    })
    .lean();

  if (!farmer || !farmer.user_id) {
    return jsonError("Farmer not found", 404);
  }

  return jsonOk({ farmer });
}
