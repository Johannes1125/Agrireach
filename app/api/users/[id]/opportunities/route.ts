import { NextRequest } from "next/server";
import { connectToDatabase } from "@/server/lib/mongodb";
import { Job } from "@/server/models/Job";
import { jsonOk, requireMethod } from "@/server/utils/api";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const mm = requireMethod(_req, ["GET"]);
  if (mm) return mm;
  const { id } = await params;
  await connectToDatabase();
  const items = await Job.find({ recruiter_id: id }).sort({ created_at: -1 }).lean();
  return jsonOk({ items });
}


