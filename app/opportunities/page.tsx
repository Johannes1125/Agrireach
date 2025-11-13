import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-server";
import { PageTransition } from "@/components/ui/page-transition";
import { OpportunityBoard } from "@/components/opportunities/opportunity-board";

export const dynamic = "force-dynamic";

export default async function OpportunitiesPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/login");
  }

  return (
    <div className="min-h-screen bg-background">
      <PageTransition>
        <OpportunityBoard />
      </PageTransition>
    </div>
  );
}
