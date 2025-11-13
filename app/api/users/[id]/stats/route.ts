import { NextRequest } from "next/server";
import { connectToDatabase } from "@/server/lib/mongodb";
import { Job, JobApplication } from "@/server/models/Job";
import { Thread } from "@/server/models/Thread";
import { Review } from "@/server/models/Review";
import { jsonOk, requireMethod } from "@/server/utils/api";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const mm = requireMethod(_req, ["GET"]);
  if (mm) return mm;
  const { id } = await params;
  await connectToDatabase();
  const [jobsPosted, applications, threads, reviews] = await Promise.all([
    Job.countDocuments({ recruiter_id: id }),
    JobApplication.countDocuments({ worker_id: id }),
    Thread.countDocuments({ author_id: id }),
    Review.countDocuments({ reviewee_id: id, reviewee_type: "user" }),
  ]);
  return jsonOk({ jobs_posted: jobsPosted, applications, threads, reviews });
}


