import { JobDetails } from "@/components/opportunities/job-details";
import { JobApplication } from "@/components/opportunities/job-application";
import { SimilarJobs } from "@/components/opportunities/similar-jobs";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { headers } from "next/headers";

interface JobPageProps {
  params: { id: string };
}

async function fetchJob(id: string) {
  const h = headers();
  const proto = h.get("x-forwarded-proto") || "http";
  const host = h.get("host") || "localhost:3000";
  const baseUrl = process.env.BASE_URL || `${proto}://${host}`;

  const res = await fetch(`${baseUrl}/api/opportunities/${id}`, {
    cache: "no-store",
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.message || "Failed to load job");

  // FIX: read from json.data.opportunity (jsonOk wrapper)
  const j = json?.data?.opportunity || {};

  return {
    id: String(j._id || id),
    title: j.title,
    company:
      j.company_name ||
      (j.recruiter_id?.full_name
        ? `${j.recruiter_id.full_name}'s Company`
        : "Company"),
    location: j.location,
    type: j.duration || j.pay_type,
    payRange: `₱${j.pay_rate}/${j.pay_type}`,
    description: j.description,
    companyLogo: j.company_logo || "",
    images: Array.isArray(j.images) ? j.images : [],
    poster: j.recruiter_id
      ? {
          id: String(j.recruiter_id._id || ""),
          name: j.recruiter_id.full_name,
          location: j.recruiter_id.location,
        }
      : undefined,
    requirements: Array.isArray(j.requirements) ? j.requirements : [],
    benefits: Array.isArray(j.benefits) ? j.benefits : [],
    postedDate: j.created_at,
    deadline: j.start_date || j.created_at,
    urgency: j.urgency,
    skills: Array.isArray(j.required_skills) ? j.required_skills : [],
    companyInfo: {
      name: j.company_name || "",
      size: j.contact_email || "",
      industry: j.company_name || "",
      rating: 0,
      description: "",
    },
  };
}

export default async function JobPage({ params }: JobPageProps) {
  const job = await fetchJob(params.id);

  return (
    <div className="min-h-screen bg-background">
      <div className="container px-4 py-8">
        {/* Back Navigation */}
        <div className="mb-6">
          <Link
            href="/opportunities"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Opportunities
          </Link>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Job Details */}
          <div className="lg:col-span-2">
            <JobDetails job={job} />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <JobApplication job={job} />
            <SimilarJobs currentJobId={job.id} />
          </div>
        </div>
      </div>
    </div>
  );
}
