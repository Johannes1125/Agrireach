import { NextRequest } from "next/server";
import { connectToDatabase } from "@/server/lib/mongodb";
import { JobApplication, Job } from "@/server/models/Job";
import { jsonOk, requireMethod } from "@/server/utils/api";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const mm = requireMethod(_req, ["GET"]);
  if (mm) return mm;
  await connectToDatabase();
  const apps = await JobApplication.find({ worker_id: params.id }).sort({ created_at: -1 }).lean();
  return jsonOk({ items: apps });
}


