import { NextRequest } from "next/server";
import { connectToDatabase } from "@/server/lib/mongodb";
import { Job } from "@/server/models/Job";
import { jsonOk, jsonError, requireMethod } from "@/server/utils/api";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const mm = requireMethod(_req, ["GET"]);
  if (mm) return mm;
  await connectToDatabase();
  const job = await Job.findById(params.id).lean();
  if (!job) return jsonError("Not found", 404);
  const skills = job.required_skills || [];
  const filter: any = { _id: { $ne: job._id }, category: job.category };
  if (skills.length) filter.required_skills = { $in: skills };
  const items = await Job.find(filter).limit(10).lean();
  return jsonOk({ items });
}


