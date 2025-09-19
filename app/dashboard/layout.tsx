import type React from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { NotificationProvider } from "@/components/notifications/notification-provider"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <NotificationProvider>
      <AppLayout>{children}</AppLayout>
    </NotificationProvider>
  )
}
