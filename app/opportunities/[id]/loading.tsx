import { InlineLoader } from "@/components/ui/page-loader"

export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container px-4 py-8">
        <div className="flex items-center justify-center min-h-[600px]">
          <InlineLoader text="Loading job details..." variant="spinner" size="lg" />
        </div>
      </div>
    </div>
  )
}

