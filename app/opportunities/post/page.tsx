import { redirect } from "next/navigation";
import { requireRecruiter } from "@/lib/auth-server";
import { PostJobForm } from "@/components/opportunities/post-job-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { ArrowLeft, Briefcase } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PostJobPage() {
  const user = await requireRecruiter();

  if (!user) {
    redirect("/auth/login");
  }

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

        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Briefcase className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="font-heading text-3xl font-bold">Post a New Job</CardTitle>
              <CardDescription className="text-lg">
                Connect with skilled rural workers and find the right talent for your agricultural needs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PostJobForm />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
