import { OpportunityBoard } from "@/components/opportunities/opportunity-board"
import { OpportunityFilters } from "@/components/opportunities/opportunity-filters"
import { OpportunityHeader } from "@/components/opportunities/opportunity-header"
import { SimpleHeader } from "@/components/layout/simple-header"

export default function OpportunitiesPage() {
  return (
    <div className="min-h-screen bg-background">
      <SimpleHeader />
      <OpportunityHeader />

      <main className="container px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-4">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <OpportunityFilters />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <OpportunityBoard />
          </div>
        </div>
      </main>
    </div>
  )
}