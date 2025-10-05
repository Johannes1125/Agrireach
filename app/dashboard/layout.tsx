import type React from "react";
import { AccessibleAppLayout } from "@/components/layout/accessible-app-layout";
import { NotificationProvider } from "@/components/notifications/notification-provider";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <NotificationProvider>
      <AccessibleAppLayout>{children}</AccessibleAppLayout>
    </NotificationProvider>
  );
}
