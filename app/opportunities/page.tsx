import { redirect } from "next/navigation";
import { OpportunityBoard } from "@/components/opportunities/opportunity-board";
import { OpportunityFilters } from "@/components/opportunities/opportunity-filters";
import { OpportunityHeader } from "@/components/opportunities/opportunity-header";
import { getCurrentUser } from "@/lib/auth-server";
import { JobSearchProvider } from "@/contexts/job-search-context";

export default async function OpportunitiesPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/login");
  }

  return (
    <div className="min-h-screen bg-background">
      <JobSearchProvider>
        <OpportunityHeader />

        <main className="container px-2 sm:px-4 py-4 sm:py-8">
          <div className="grid gap-4 sm:gap-6 lg:grid-cols-4">
            {/* Filters Sidebar - Hidden on mobile, shown in drawer */}
            <div className="hidden lg:block lg:col-span-1">
              <OpportunityFilters />
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              <OpportunityBoard />
            </div>
          </div>
        </main>
      </JobSearchProvider>
    </div>
  );
}
