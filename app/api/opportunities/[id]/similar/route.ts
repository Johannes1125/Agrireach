import { NextRequest } from "next/server";
import { connectToDatabase } from "@/server/lib/mongodb";
import { Job } from "@/server/models/Job";
import { jsonOk, jsonError, requireMethod } from "@/server/utils/api";
import { normalizeSkillRequirements } from "@/lib/skills";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const mm = requireMethod(_req, ["GET"]);
  if (mm) return mm;
  const { id } = await params;
  await connectToDatabase();
  const job = await Job.findById(id).lean();
  if (!job) return jsonError("Not found", 404);
  const normalizedSkills = normalizeSkillRequirements(job.required_skills as any);
  const skillNames = normalizedSkills.map((skill) => skill.name);
  const filter: any = { _id: { $ne: job._id }, category: job.category };
  if (skillNames.length) filter["required_skills.name"] = { $in: skillNames };
  const items = await Job.find(filter).limit(10).lean();
  return jsonOk({
    items: items.map((item) => ({
      ...item,
      required_skills: normalizeSkillRequirements(item.required_skills as any),
    })),
  });
}


