import { EditJobForm } from "@/components/opportunities/edit-job-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Briefcase } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"
import { getCurrentUser, requireRecruiter } from "@/lib/auth-server"
import { headers } from "next/headers"

interface EditJobPageProps {
  params: { id: string }
}

async function fetchJob(id: string) {
  const h = await headers()
  const protocol = h.get("x-forwarded-proto") || "http"
  const host = h.get("host")
  const baseUrl = `${protocol}://${host}`

  try {
    const res = await fetch(`${baseUrl}/api/opportunities/${id}`, {
      cache: "no-store",
      headers: {
        Cookie: h.get("cookie") || "",
      },
    })

    if (!res.ok) {
      throw new Error("Failed to fetch job")
    }

    const data = await res.json()
    return data.data.opportunity
  } catch (error) {
    console.error("Error fetching job:", error)
    return null
  }
}

export default async function EditJobPage({ params }: EditJobPageProps) {
  // Require recruiter role to edit jobs
  const user = await requireRecruiter()

  const job = await fetchJob(params.id)

  if (!job) {
    redirect("/opportunities")
  }

  // Check if user is the owner of the job or is an admin
  const isAdmin = user.roles?.includes("admin")
  if (job.recruiter_id._id !== user.id && !isAdmin) {
    redirect("/opportunities")
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container px-4 py-8">
        {/* Back Navigation */}
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>

        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Briefcase className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="font-heading text-3xl font-bold">Edit Job Posting</CardTitle>
              <CardDescription className="text-lg">
                Update your job details to attract the right talent
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EditJobForm job={job} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

