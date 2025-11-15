import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-server";
import { OpportunityBoard } from "@/components/opportunities/opportunity-board";

export const dynamic = "force-dynamic";

export default async function OpportunitiesPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/login");
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
        <OpportunityBoard />
      </div>
    </div>
  );
}
