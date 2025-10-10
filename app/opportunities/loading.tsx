import { InlineLoader } from "@/components/ui/page-loader"

export default function Loading() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="container px-4">
        <div className="grid gap-6 lg:grid-cols-4">
          {/* Filters Sidebar - Empty space to maintain layout */}
          <div className="lg:col-span-1" />

          {/* Main Content - Loading */}
          <div className="lg:col-span-3 flex items-center justify-center min-h-[600px]">
            <InlineLoader text="Loading opportunities..." variant="spinner" size="lg" />
          </div>
        </div>
      </div>
    </div>
  )
}

