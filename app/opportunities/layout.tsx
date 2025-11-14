import type React from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { JobSearchProvider } from "@/contexts/job-search-context"

export default function OpportunitiesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <JobSearchProvider>
      <AppLayout>{children}</AppLayout>
    </JobSearchProvider>
  )
}