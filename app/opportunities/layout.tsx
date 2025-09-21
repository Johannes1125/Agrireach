import type React from "react"
import { AppLayout } from "@/components/layout/app-layout"

export default function OpportunitiesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AppLayout>{children}</AppLayout>
}