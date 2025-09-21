import { JobDetails } from "@/components/opportunities/job-details"
import { JobApplication } from "@/components/opportunities/job-application"
import { SimilarJobs } from "@/components/opportunities/similar-jobs"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

interface JobPageProps {
  params: {
    id: string
  }
}

// Mock function to get job data - replace with actual data fetching
const getJobById = async (id: string) => {
  // Mock job data
  return {
    id,
    title: "Seasonal Harvest Coordinator",
    company: "Green Valley Farms",
    location: "Fresno, CA",
    type: "Seasonal",
    payRange: "$18-22/hour",
    description:
      "Lead a team of harvest workers during peak season. Ensure quality standards and safety protocols are maintained throughout the harvesting process.",
    requirements: [
      "3+ years of agricultural experience",
      "Leadership and team management skills",
      "Knowledge of harvest techniques and equipment",
      "Physical ability to work outdoors in various weather conditions",
      "Valid driver's license",
    ],
    benefits: [
      "Competitive hourly wage",
      "Performance bonuses",
      "Health insurance coverage",
      "Flexible scheduling",
      "Professional development opportunities",
    ],
    postedDate: "2024-02-15",
    deadline: "2024-03-15",
    urgency: "high",
    skills: ["Crop Harvesting", "Team Leadership", "Equipment Operation"],
    companyInfo: {
      name: "Green Valley Farms",
      size: "50-200 employees",
      industry: "Organic Agriculture",
      rating: 4.7,
      description:
        "Leading organic farm in Central California, committed to sustainable farming practices and fair worker treatment.",
    },
  }
}

export default async function JobPage({ params }: JobPageProps) {
  const job = await getJobById(params.id)

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
  )
}